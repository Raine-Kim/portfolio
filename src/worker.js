/* ==========================================================================
   Portfolio Worker
   - Everything outside /api/ is served from static assets.
   - /api/ is a small backend for the admin page. Projects and uploaded
     media are stored in Workers KV (binding: STORE).

   Public
     GET  /api/work.js            projects as a script (window.PORTFOLIO_PROJECTS = [...])
     GET  /api/work               projects as JSON
     GET  /api/media/<slug>/<file>  uploaded image / video (supports Range)
   Admin (Authorization: Bearer <session>)
     POST   /api/login            { password } -> { token }
     GET    /api/session          200 if the session is still valid
     PUT    /api/work             save the project list
     PUT    /api/media/<slug>/<file>   upload (max 25 MB, KV value limit)
     DELETE /api/media/<slug>/<file>
   ========================================================================== */

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_WORK_BYTES = 1024 * 1024;
const SESSION_DAYS = 30;
const MAX_FAILED_LOGINS_PER_HOUR = 10;
const WORK_KEY = "work";
const TYPES = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif", gif: "image/gif",
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", m4v: "video/mp4"
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    try {
      return await route(request, env, ctx, url);
    } catch (err) {
      return json({ error: err.message || "Server error" }, err.status || 500);
    }
  }
};

async function route(request, env, ctx, url) {
  const path = url.pathname.slice("/api".length);
  const method = request.method;

  if (path === "/login" && method === "POST") return login(request, env);
  if (path === "/session" && method === "GET") { await requireAuth(request, env); return json({ ok: true }); }

  if (path === "/work.js" && method === "GET") {
    const projects = await readWork(env, request);
    return new Response(`window.PORTFOLIO_PROJECTS = ${JSON.stringify(projects)};\n`, {
      headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-cache" }
    });
  }
  if (path === "/work" && method === "GET") return json({ projects: await readWork(env, request) });
  if (path === "/work" && method === "PUT") {
    await requireAuth(request, env);
    const text = await request.text();
    if (text.length > MAX_WORK_BYTES) throw httpError(413, "Project list is too large");
    const body = JSON.parse(text);
    if (!Array.isArray(body.projects)) throw httpError(400, "Expected { projects: [...] }");
    await env.STORE.put(WORK_KEY, JSON.stringify(body.projects));
    return json({ ok: true, count: body.projects.length });
  }

  if (path.startsWith("/media/")) {
    const key = mediaKey(path.slice("/media/".length));
    if (method === "GET" || method === "HEAD") return serveMedia(request, env, ctx, url, key);
    await requireAuth(request, env);
    if (method === "PUT") {
      const size = Number(request.headers.get("content-length") || 0);
      if (size > MAX_FILE_BYTES) throw httpError(413, "File is larger than 25 MB");
      const data = await request.arrayBuffer();
      if (data.byteLength > MAX_FILE_BYTES) throw httpError(413, "File is larger than 25 MB");
      if (!data.byteLength) throw httpError(400, "Empty file");
      await env.STORE.put("file:" + key, data, { metadata: { size: data.byteLength, uploaded: Date.now() } });
      ctx.waitUntil(caches.default.delete(cacheKey(url)));
      return json({ ok: true, path: "api/media/" + key, size: data.byteLength });
    }
    if (method === "DELETE") {
      await env.STORE.delete("file:" + key);
      ctx.waitUntil(caches.default.delete(cacheKey(url)));
      return json({ ok: true });
    }
  }
  throw httpError(404, "Not found");
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/* ---------- projects ---------- */
async function readWork(env, request) {
  const stored = await env.STORE.get(WORK_KEY, "json");
  if (Array.isArray(stored)) return stored;
  // nothing saved yet: fall back to the sample list that ships with the site
  try {
    const res = await env.ASSETS.fetch(new Request(new URL("/data/work.js", request.url)));
    if (!res.ok) return [];
    const text = await res.text();
    return JSON.parse(text.slice(text.indexOf("=") + 1).trim().replace(/;\s*$/, ""));
  } catch (e) {
    return [];
  }
}

/* ---------- media ---------- */
function mediaKey(raw) {
  let parts;
  try { parts = decodeURIComponent(raw).split("/"); } catch (e) { throw httpError(400, "Bad path"); }
  const ok = parts.length === 2 && parts.every(p => /^[a-z0-9][a-z0-9._-]{0,99}$/i.test(p) && !p.includes(".."));
  const ext = ok ? parts[1].split(".").pop().toLowerCase() : "";
  if (!ok || !TYPES[ext]) throw httpError(400, "Unsupported file path or type");
  return parts.join("/");
}
const cacheKey = url => new Request(url.origin + url.pathname);

async function serveMedia(request, env, ctx, url, key) {
  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) return cached;

  const data = await env.STORE.get("file:" + key, "arrayBuffer");
  if (!data) throw httpError(404, "File not found");
  const type = TYPES[key.split(".").pop().toLowerCase()];
  const headers = {
    "content-type": type,
    "accept-ranges": "bytes",
    "cache-control": "public, max-age=86400",
    "x-content-type-options": "nosniff"
  };
  const full = new Response(request.method === "HEAD" ? null : data, { headers: { ...headers, "content-length": String(data.byteLength) } });

  // video players (Safari especially) ask for byte ranges
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") || "");
  if (request.method === "GET") ctx.waitUntil(cache.put(cacheKey(url), new Response(data, { headers: { ...headers, "content-length": String(data.byteLength) } })));
  if (!range || request.method === "HEAD") return full;

  const total = data.byteLength;
  let start = range[1] === "" ? Math.max(total - Number(range[2]), 0) : Number(range[1]);
  let end = range[1] === "" || range[2] === "" ? total - 1 : Math.min(Number(range[2]), total - 1);
  if (start > end || start >= total) return new Response(null, { status: 416, headers: { "content-range": `bytes */${total}` } });
  return new Response(data.slice(start, end + 1), {
    status: 206,
    headers: { ...headers, "content-range": `bytes ${start}-${end}/${total}`, "content-length": String(end - start + 1) }
  });
}

/* ---------- auth ---------- */
const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}
// compare digests, not the raw strings, so timing doesn't leak how much matched
async function safeEqual(a, b) {
  const [x, y] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(a)), crypto.subtle.digest("SHA-256", enc.encode(b))]);
  const p = new Uint8Array(x), q = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < p.length; i++) diff |= p[i] ^ q[i];
  return diff === 0;
}
function configured(env) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) throw httpError(503, "Admin is not configured yet (missing secrets)");
}

async function login(request, env) {
  configured(env);
  // Short passwords are guessable, so wrong attempts are capped per hour for everyone.
  const bucket = "fails:" + Math.floor(Date.now() / 3600000);
  const fails = Number(await env.STORE.get(bucket)) || 0;
  if (fails >= MAX_FAILED_LOGINS_PER_HOUR) throw httpError(429, "Too many wrong attempts. Try again in an hour.");

  let password = "";
  try { password = String((await request.json()).password || ""); } catch (e) {}
  if (!(await safeEqual(password, env.ADMIN_PASSWORD))) {
    await env.STORE.put(bucket, String(fails + 1), { expirationTtl: 7200 });
    await new Promise(r => setTimeout(r, 800));
    throw httpError(401, "Wrong password");
  }
  const exp = Date.now() + SESSION_DAYS * 86400000;
  return json({ token: `${exp}.${await hmac(env.SESSION_SECRET, String(exp))}`, expires: exp });
}

async function requireAuth(request, env) {
  configured(env);
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now() || !(await safeEqual(sig, await hmac(env.SESSION_SECRET, exp)))) {
    throw httpError(401, "Please sign in again");
  }
}

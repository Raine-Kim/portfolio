(() => {
  "use strict";

  /* ------------------------------------------------------------------
     Selected work admin
     Talks to the Worker API in src/worker.js. Projects and uploaded media
     are stored in Cloudflare KV; a password unlocks the page.
     ------------------------------------------------------------------ */
  const MEDIA_ROOT = "api/media";
  const MAX_BYTES = 25 * 1024 * 1024; // Cloudflare KV per-value limit
  const TOKEN_KEY = "portfolio-admin-session";
  const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif)$/i;
  const VIDEO_RE = /\.(mp4|webm|mov|m4v)$/i;
  const SWATCHES = ["#A47864", "#FF5B2E", "#7C6CF2", "#2F4A3A", "#E8B4B8", "#D9A441", "#1A1714", "#3E6FB0"];
  const DEFAULT_SCOPE = [["Design", 100], ["HTML/CSS", 100], ["JavaScript", 50]];

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slugify = s => String(s).toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const baseCategories = (window.PORTFOLIO && window.PORTFOLIO.categories) || ["Restaurant", "Retail", "Corporate", "Event", "E-commerce"];

  const state = {
    projects: [],
    sel: -1,
    dirty: false,
    busy: false,
    pending: new Map(),        // media path -> File waiting to be uploaded
    previews: new Map(),       // media path -> object URL for files picked in this session
    deleted: new Set(),        // media paths to remove on publish
    token: ""
  };
  try { state.token = localStorage.getItem(TOKEN_KEY) || ""; } catch (e) {}

  /* ---------- UI helpers ---------- */
  const toastEl = $("[data-toast]");
  let toastTimer;
  function toast(msg, isError = false, ms = 3200) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("is-error", isError);
    toastEl.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-show"), isError ? 6000 : ms);
  }
  function setStatus(msg, kind = "") {
    const el = $("[data-status]");
    el.textContent = msg;
    el.className = "top__status" + (kind ? " is-" + kind : "");
  }
  function refreshTop() {
    const btn = $("[data-publish]");
    btn.disabled = state.busy || !state.dirty;
    btn.classList.toggle("is-dirty", state.dirty && !state.busy);
    if (state.busy) return;
    const n = state.pending.size;
    if (state.dirty) setStatus(`저장 안 된 변경 있음${n ? ` · 올릴 파일 ${n}개` : ""} — 게시하기를 눌러주세요`, "warn");
    else setStatus("모두 저장됨", "ok");
  }
  function markDirty() { state.dirty = true; refreshTop(); }

  /* ---------- data <-> internal form ---------- */
  function toInternal(p) {
    return {
      slug: p.slug || "", title: p.title || "", type: p.type || "", category: p.category || baseCategories[0],
      year: p.year || new Date().getFullYear(), color: p.color || SWATCHES[0], summary: p.summary || "",
      scopeRows: Object.entries(p.scope || {}).map(([k, v]) => [k, Number(v) || 0]),
      tools: (p.tools || []).join(", "), link: p.link || "", cover: p.cover || "", coverVideo: p.coverVideo || "",
      gallery: (p.gallery || []).filter(g => g && g.src).map(g => ({ type: g.type || "image", src: g.src, caption: g.caption || "" })),
      autoSlug: false
    };
  }
  function toPublic(p) {
    const scope = {};
    p.scopeRows.forEach(([k, v]) => { if (k.trim()) scope[k.trim()] = Math.max(0, Math.min(100, Number(v) || 0)); });
    return {
      slug: p.slug, title: p.title.trim(), type: p.type.trim(), category: p.category.trim(), year: Number(p.year) || p.year,
      color: p.color, summary: p.summary.trim(), scope,
      tools: p.tools.split(",").map(t => t.trim()).filter(Boolean),
      link: p.link.trim(), cover: p.cover, coverVideo: p.coverVideo,
      gallery: p.gallery.map(g => ({ type: g.type, src: g.src, ...(g.caption.trim() ? { caption: g.caption.trim() } : {}) }))
    };
  }

  /* ---------- media paths ---------- */
  function previewUrl(path) {
    if (!path) return "";
    if (state.previews.has(path)) return state.previews.get(path);
    return path; // admin.html sits at the site root, so repo paths resolve as-is
  }
  const allPaths = () => state.projects.flatMap(p => [p.cover, p.coverVideo, ...p.gallery.filter(g => g.type !== "embed").map(g => g.src)]).filter(Boolean);
  function dropPath(path) {
    if (!path) return;
    if (state.pending.has(path)) {
      state.pending.delete(path);
      URL.revokeObjectURL(state.previews.get(path));
      state.previews.delete(path);
    } else if (path.startsWith(MEDIA_ROOT + "/")) state.deleted.add(path);
  }
  function stageFile(p, file) {
    if (!p.slug) { toast("제목을 먼저 입력해 주세요 (폴더 이름으로 씁니다)", true); return null; }
    if (!IMAGE_RE.test(file.name) && !VIDEO_RE.test(file.name)) { toast(`${file.name}: 이미지나 영상 파일만 올릴 수 있습니다`, true); return null; }
    if (file.size > MAX_BYTES) { toast(`${file.name}: ${(file.size / 1048576).toFixed(1)}MB — 25MB를 넘습니다. YouTube/Vimeo에 올리고 "영상 링크 추가"를 쓰세요.`, true); return null; }
    const dot = file.name.lastIndexOf(".");
    const stem = slugify(file.name.slice(0, dot)) || "file", ext = file.name.slice(dot).toLowerCase();
    const used = new Set([...allPaths(), ...state.pending.keys()]);
    let path = `${MEDIA_ROOT}/${p.slug}/${stem}${ext}`, n = 2;
    while (used.has(path)) path = `${MEDIA_ROOT}/${p.slug}/${stem}-${n++}${ext}`;
    state.pending.set(path, file);
    state.previews.set(path, URL.createObjectURL(file));
    state.deleted.delete(path);
    return path;
  }

  /* ---------- list ---------- */
  function renderList() {
    $("[data-count]").textContent = `${state.projects.length} projects`;
    $("[data-list]").innerHTML = state.projects.map((p, i) => `
      <li class="item${i === state.sel ? " is-active" : ""}" data-i="${i}" tabindex="0">
        <span class="item__thumb" style="--p:${esc(p.color)};${p.cover ? `background-image:url('${esc(previewUrl(p.cover))}')` : ""}"></span>
        <span class="item__text">
          <div class="item__title">${esc(p.title || "(제목 없음)")}</div>
          <div class="item__meta">${esc(p.category)} · ${esc(p.year)}</div>
        </span>
        <span class="item__move">
          <button class="icon-btn" type="button" data-move="-1" aria-label="위로" ${i === 0 ? "disabled" : ""}>▲</button>
          <button class="icon-btn" type="button" data-move="1" aria-label="아래로" ${i === state.projects.length - 1 ? "disabled" : ""}>▼</button>
        </span>
      </li>`).join("");
  }

  /* ---------- editor ---------- */
  function mediaTag(path, controls = false) {
    if (!path) return "";
    const url = esc(previewUrl(path));
    return VIDEO_RE.test(path) ? `<video src="${url}" muted playsinline preload="metadata" ${controls ? "controls" : ""}></video>` : `<img src="${url}" alt="">`;
  }
  const pendingBadge = path => (state.pending.has(path) ? ` <span class="badge">게시 전</span>` : "");

  function slotMarkup(p, field, title, accept, emptyText) {
    const path = p[field];
    return `
      <div class="slot" data-slot="${field}">
        <div class="slot__title">${title}</div>
        <div class="slot__preview">${path ? mediaTag(path, true) : emptyText}</div>
        ${path ? `<div class="slot__path">${esc(path)}${pendingBadge(path)}</div>` : ""}
        <div class="slot__btns">
          <label class="btn btn--small">${path ? "바꾸기" : "파일 선택"}<input type="file" accept="${accept}" data-file="${field}" hidden></label>
          ${path ? `<button class="btn btn--small btn--danger" type="button" data-act="clear-${field}">지우기</button>` : ""}
        </div>
      </div>`;
  }

  function galleryMarkup(p) {
    if (!p.gallery.length) return "";
    return p.gallery.map((g, i) => `
      <div class="g-item">
        <div class="g-item__thumb">${g.type === "embed" ? "영상 링크" : mediaTag(g.src)}</div>
        <div class="g-item__body">
          <input type="text" value="${esc(g.caption)}" placeholder="설명 (예: Home — desktop)" data-caption="${i}" aria-label="설명">
          <div class="slot__path">${esc(g.src)}${pendingBadge(g.src)}</div>
        </div>
        <div class="g-item__btns">
          <button class="icon-btn" type="button" data-g-move="${i},-1" aria-label="위로" ${i === 0 ? "disabled" : ""}>▲</button>
          <button class="icon-btn" type="button" data-g-move="${i},1" aria-label="아래로" ${i === p.gallery.length - 1 ? "disabled" : ""}>▼</button>
          <button class="icon-btn" type="button" data-g-del="${i}" aria-label="삭제">✕</button>
        </div>
      </div>`).join("");
  }

  function scopeMarkup(p) {
    return p.scopeRows.map(([k, v], i) => `
      <div class="scope-row">
        <input type="text" value="${esc(k)}" data-scope-label="${i}" aria-label="항목 이름" placeholder="항목">
        <input type="range" min="0" max="100" step="5" value="${v}" data-scope-val="${i}" aria-label="${esc(k)} 비율">
        <output>${v}%</output>
        <button class="icon-btn" type="button" data-scope-del="${i}" aria-label="항목 삭제">✕</button>
      </div>`).join("");
  }

  function renderEditor() {
    const el = $("[data-editor]");
    const p = state.projects[state.sel];
    if (!p) { el.innerHTML = `<div class="empty">왼쪽에서 프로젝트를 고르거나 <b>+ 새 프로젝트</b>를 누르세요.</div>`; return; }
    const cats = [...new Set([...baseCategories, ...state.projects.map(x => x.category).filter(Boolean)])];
    el.innerHTML = `
      <div class="editor__head">
        <h2 data-heading>${esc(p.title || "새 프로젝트")}</h2>
        <div>
          <button class="btn btn--small" type="button" data-act="duplicate">복제</button>
          <button class="btn btn--small btn--danger" type="button" data-act="delete">프로젝트 삭제</button>
        </div>
      </div>

      <div class="group">
        <h3>기본 정보</h3>
        <div class="grid">
          <label>제목<input type="text" data-f="title" value="${esc(p.title)}" placeholder="Harbour Noodle Bar"></label>
          <label>한 줄 설명<input type="text" data-f="type" value="${esc(p.type)}" placeholder="New store launch site"></label>
        </div>
        <div class="grid grid--3" style="margin-top:14px">
          <label>카테고리
            <input type="text" data-f="category" value="${esc(p.category)}" list="cats" placeholder="Restaurant">
            <datalist id="cats">${cats.map(c => `<option value="${esc(c)}">`).join("")}</datalist>
          </label>
          <label>연도<input type="number" data-f="year" value="${esc(p.year)}" min="2000" max="2100"></label>
          <label>폴더 이름 (slug)<input type="text" data-f="slug" value="${esc(p.slug)}" placeholder="harbour-noodle"></label>
        </div>
        <div class="grid" style="margin-top:14px">
          <label class="wide">소개글<textarea data-f="summary" placeholder="어떤 프로젝트였는지, 무엇을 만들었는지">${esc(p.summary)}</textarea></label>
          <label>사용한 툴 (쉼표로 구분)<input type="text" data-f="tools" value="${esc(p.tools)}" placeholder="Figma, HTML, CSS, JavaScript"></label>
          <label>실제 사이트 주소 (선택)<input type="url" data-f="link" value="${esc(p.link)}" placeholder="https://"></label>
          <div>
            <label>카드 컬러
              <span class="color"><input type="color" data-f="color" value="${esc(p.color)}"><input type="text" data-f="color" value="${esc(p.color)}" maxlength="7" aria-label="색상 코드"></span>
            </label>
            <div class="swatches">${SWATCHES.map(c => `<button class="swatch" type="button" style="background:${c}" data-swatch="${c}" aria-label="${c}"></button>`).join("")}</div>
          </div>
        </div>
      </div>

      <div class="group">
        <h3>담당 범위 (%)</h3>
        <div data-scope>${scopeMarkup(p)}</div>
        <button class="btn btn--small" type="button" data-act="add-scope">+ 항목 추가</button>
      </div>

      <div class="group">
        <h3>카드 썸네일</h3>
        <div class="media-grid">
          ${slotMarkup(p, "cover", "커버 이미지", "image/*", "이미지를 끌어다 놓거나 선택하세요<br>(없으면 컬러 카드로 표시)")}
          ${slotMarkup(p, "coverVideo", "호버 영상 (선택)", "video/mp4,video/webm", "마우스를 올리면 재생되는 짧은 영상")}
        </div>
      </div>

      <div class="group">
        <h3>상세 갤러리 — 사진 · 영상</h3>
        <div class="drop" data-drop>
          사진과 영상을 여기로 끌어다 놓으세요 (파일당 25MB까지)
          <div class="drop__btns">
            <label class="btn btn--small">파일 선택<input type="file" accept="image/*,video/mp4,video/webm" multiple data-file="gallery" hidden></label>
            <button class="btn btn--small" type="button" data-act="add-embed">영상 링크 추가 (YouTube/Vimeo)</button>
          </div>
        </div>
        <div class="gallery" data-gallery>${galleryMarkup(p)}</div>
      </div>`;
  }

  function select(i) { state.sel = i; renderList(); renderEditor(); }

  /* ---------- editor events ---------- */
  const editor = $("[data-editor]");
  const cur = () => state.projects[state.sel];

  editor.addEventListener("input", e => {
    const p = cur(), t = e.target;
    if (!p) return;
    if (t.dataset.f) {
      const f = t.dataset.f;
      if (f === "color") {
        if (!/^#[0-9a-f]{6}$/i.test(t.value)) return;
        p.color = t.value;
        $$('[data-f="color"]', editor).forEach(inp => { if (inp !== t) inp.value = t.value; });
      } else if (f === "slug") {
        p.slug = slugify(t.value); p.autoSlug = false;
      } else p[f] = t.value;
      if (f === "title") {
        $("[data-heading]", editor).textContent = t.value || "새 프로젝트";
        if (p.autoSlug) { p.slug = slugify(t.value); $('[data-f="slug"]', editor).value = p.slug; }
      }
      if (["title", "category", "year", "color"].includes(f)) renderList();
    } else if (t.dataset.scopeLabel !== undefined) p.scopeRows[+t.dataset.scopeLabel][0] = t.value;
    else if (t.dataset.scopeVal !== undefined) { p.scopeRows[+t.dataset.scopeVal][1] = +t.value; t.nextElementSibling.textContent = t.value + "%"; }
    else if (t.dataset.caption !== undefined) p.gallery[+t.dataset.caption].caption = t.value;
    else return;
    markDirty();
  });

  editor.addEventListener("change", e => {
    const t = e.target, p = cur();
    if (t.type === "file" && p) { addFiles(p, t.dataset.file, [...t.files]); t.value = ""; }
    if (t.dataset.f === "slug" && p) t.value = p.slug;
  });

  function addFiles(p, field, files) {
    if (!files.length) return;
    if (field === "gallery") {
      files.forEach(f => { const path = stageFile(p, f); if (path) p.gallery.push({ type: VIDEO_RE.test(path) ? "video" : "image", src: path, caption: "" }); });
    } else {
      const f = files[0];
      const wantVideo = field === "coverVideo";
      if (wantVideo !== VIDEO_RE.test(f.name)) { toast(wantVideo ? "호버 영상 칸에는 영상 파일을 올려주세요" : "커버 칸에는 이미지 파일을 올려주세요", true); return; }
      const path = stageFile(p, f);
      if (!path) return;
      dropPath(p[field]);
      p[field] = path;
    }
    p.autoSlug = false; // folder name is now in use
    markDirty(); renderList(); renderEditor();
  }

  editor.addEventListener("click", e => {
    const p = cur();
    if (!p) return;
    const t = e.target.closest("button");
    if (!t) return;
    const d = t.dataset;
    if (d.swatch) { p.color = d.swatch; }
    else if (d.act === "add-scope") p.scopeRows.push(["", 50]);
    else if (d.scopeDel !== undefined) p.scopeRows.splice(+d.scopeDel, 1);
    else if (d.act === "clear-cover") { dropPath(p.cover); p.cover = ""; }
    else if (d.act === "clear-coverVideo") { dropPath(p.coverVideo); p.coverVideo = ""; }
    else if (d.gDel !== undefined) { const [g] = p.gallery.splice(+d.gDel, 1); if (g.type !== "embed") dropPath(g.src); }
    else if (d.gMove) { const [i, dir] = d.gMove.split(",").map(Number); const j = i + dir; [p.gallery[i], p.gallery[j]] = [p.gallery[j], p.gallery[i]]; }
    else if (d.act === "add-embed") {
      const url = toEmbed(prompt("YouTube 또는 Vimeo 영상 주소를 붙여넣으세요") || "");
      if (!url) { toast("YouTube/Vimeo 주소를 확인해 주세요", true); return; }
      p.gallery.push({ type: "embed", src: url, caption: "" });
    }
    else if (d.act === "duplicate") {
      const copy = JSON.parse(JSON.stringify(p));
      copy.title += " (copy)"; copy.slug = uniqueSlug(slugify(copy.title)); copy.autoSlug = true;
      copy.cover = ""; copy.coverVideo = ""; copy.gallery = copy.gallery.filter(g => g.type === "embed");
      state.projects.splice(state.sel + 1, 0, copy); state.sel += 1;
    }
    else if (d.act === "delete") {
      if (!confirm(`"${p.title || "이 프로젝트"}" 를 삭제할까요?\n올린 사진·영상도 함께 지워집니다. (게시하기를 눌러야 실제로 반영됩니다)`)) return;
      [p.cover, p.coverVideo, ...p.gallery.filter(g => g.type !== "embed").map(g => g.src)].forEach(dropPath);
      state.projects.splice(state.sel, 1);
      state.sel = Math.min(state.sel, state.projects.length - 1);
    }
    else return;
    markDirty(); renderList(); renderEditor();
  });

  function toEmbed(url) {
    url = url.trim();
    let m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return `https://player.vimeo.com/video/${m[1]}`;
    return "";
  }

  // drag & drop onto cover slots and the gallery drop zone
  ["dragenter", "dragover"].forEach(ev => editor.addEventListener(ev, e => {
    const zone = e.target.closest("[data-drop], [data-slot]");
    if (!zone) return;
    e.preventDefault(); zone.classList.add("is-over");
  }));
  ["dragleave", "drop"].forEach(ev => editor.addEventListener(ev, e => {
    const zone = e.target.closest("[data-drop], [data-slot]");
    if (zone) zone.classList.remove("is-over");
  }));
  editor.addEventListener("drop", e => {
    const zone = e.target.closest("[data-drop], [data-slot]");
    if (!zone || !cur()) return;
    e.preventDefault();
    addFiles(cur(), zone.dataset.slot || "gallery", [...e.dataTransfer.files]);
  });
  // a file dropped outside a zone should not navigate away from the page
  ["dragover", "drop"].forEach(ev => window.addEventListener(ev, e => e.preventDefault()));

  /* ---------- list events ---------- */
  function uniqueSlug(base) {
    base = base || "project";
    const taken = new Set(state.projects.map(p => p.slug));
    let s = base, n = 2;
    while (taken.has(s)) s = `${base}-${n++}`;
    return s;
  }
  $("[data-list]").addEventListener("click", e => {
    const li = e.target.closest(".item");
    if (!li) return;
    const i = +li.dataset.i, mv = e.target.closest("[data-move]");
    if (mv) {
      const j = i + +mv.dataset.move;
      [state.projects[i], state.projects[j]] = [state.projects[j], state.projects[i]];
      if (state.sel === i) state.sel = j; else if (state.sel === j) state.sel = i;
      markDirty(); renderList();
    } else select(i);
  });
  $("[data-list]").addEventListener("keydown", e => {
    const li = e.target.closest(".item");
    if (li && e.target === li && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); select(+li.dataset.i); }
  });
  $("[data-add]").addEventListener("click", () => {
    const p = toInternal({ scope: Object.fromEntries(DEFAULT_SCOPE), color: SWATCHES[state.projects.length % SWATCHES.length] });
    p.autoSlug = true;
    state.projects.unshift(p);
    markDirty(); select(0);
    $('[data-f="title"]', editor).focus();
  });

  /* ---------- API ---------- */
  async function api(path, opts = {}) {
    const res = await fetch("api" + path, {
      ...opts,
      headers: { ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}), ...(opts.headers || {}) }
    });
    let data = null;
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) {
      const err = new Error((data && data.error) || `요청 실패 (${res.status})`);
      err.status = res.status;
      if (res.status === 401 && path !== "/login") lock("로그인이 만료됐습니다. 다시 들어와 주세요.");
      throw err;
    }
    return data;
  }

  function load(projects) {
    state.projects = (projects || []).map(toInternal);
    state.sel = state.projects.length ? Math.min(Math.max(state.sel, 0), state.projects.length - 1) : -1;
    renderList(); renderEditor();
  }

  function validate() {
    const seen = new Set();
    for (const [i, p] of state.projects.entries()) {
      const fail = msg => { select(i); toast(msg, true); return false; };
      if (!p.title.trim()) return fail("제목이 비어 있는 프로젝트가 있습니다");
      if (!p.slug) return fail(`"${p.title}" 의 폴더 이름(slug)을 입력해 주세요`);
      if (seen.has(p.slug)) return fail(`폴더 이름 "${p.slug}" 이 겹칩니다. 다르게 바꿔주세요`);
      seen.add(p.slug);
    }
    return true;
  }

  async function publish() {
    if (state.busy || !state.dirty || !validate()) return;
    state.busy = true; refreshTop();
    try {
      // 1) upload new files  2) save the list  3) remove files nothing points at any more
      const used = new Set(allPaths());
      const uploads = [...state.pending].filter(([path]) => used.has(path));
      let done = 0;
      for (const [path, file] of uploads) {
        setStatus(`파일 올리는 중 ${++done}/${uploads.length} — ${file.name}`, "warn");
        await api(path.slice("api".length), { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
        state.pending.delete(path);
      }
      setStatus("저장하는 중…", "warn");
      await api("/work", { method: "PUT", body: JSON.stringify({ projects: state.projects.map(toPublic) }), headers: { "Content-Type": "application/json" } });
      for (const path of [...state.deleted].filter(p => !used.has(p))) {
        try { await api(path.slice("api".length), { method: "DELETE" }); } catch (e) { if (e.status === 401) throw e; }
      }
      state.pending.clear();
      state.deleted.clear();
      state.dirty = false;
      state.busy = false;
      renderList(); renderEditor(); refreshTop();
      toast("게시했습니다. 사이트에 바로 반영됩니다.", false, 5000);
    } catch (err) {
      state.busy = false; refreshTop();
      toast(err.message, true);
    }
  }

  /* ---------- lock screen ---------- */
  const lockEl = $("[data-lock]"), loginForm = $("[data-login]"), loginError = $("[data-login-error]");
  function lock(message = "") {
    state.token = "";
    try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
    lockEl.hidden = false;
    document.body.classList.add("is-locked");
    loginError.textContent = message;
    $("[data-password]").value = "";
    $("[data-password]").focus();
  }
  async function unlock() {
    lockEl.hidden = true;
    document.body.classList.remove("is-locked");
    if (!state.dirty) {
      try { load((await api("/work")).projects); if (state.projects.length) select(0); }
      catch (err) { toast("프로젝트를 불러오지 못했습니다: " + err.message, true); }
    }
    refreshTop();
  }
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = $("button", loginForm);
    btn.disabled = true; loginError.textContent = "";
    try {
      const { token } = await api("/login", { method: "POST", body: JSON.stringify({ password: $("[data-password]").value }), headers: { "Content-Type": "application/json" } });
      state.token = token;
      try { localStorage.setItem(TOKEN_KEY, token); } catch (err) {}
      await unlock();
    } catch (err) {
      loginError.textContent = err.status === 401 ? "비밀번호가 맞지 않습니다."
        : err.status === 429 ? "틀린 시도가 너무 많습니다. 1시간 뒤에 다시 해주세요."
        : err.message;
      $("[data-password]").select();
    }
    btn.disabled = false;
  });
  $("[data-logout]").addEventListener("click", () => {
    if (state.dirty && !confirm("저장 안 된 변경이 있습니다. 그래도 잠글까요?")) return;
    state.dirty = false;
    lock();
  });
  $("[data-publish]").addEventListener("click", publish);
  window.addEventListener("beforeunload", e => { if (state.dirty) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- boot ---------- */
  (async () => {
    renderList(); renderEditor();
    document.body.classList.add("is-locked");
    if (!state.token) return;
    try { await api("/session"); await unlock(); }
    catch (err) { if (err.status !== 401) lock(err.message); }
  })();
})();

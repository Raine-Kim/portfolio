(() => {
  "use strict";

  const DATA = window.PORTFOLIO || { profile: {}, projects: [], categories: [], services: [], process: [], skills: [] };
  const P = DATA.profile || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const isVideo = src => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src || "");

  /* ------------------------------------------------------------------
     1. Render content from data/projects.js
     ------------------------------------------------------------------ */
  function renderProfile() {
    if (P.name) {
      $$("[data-name]").forEach(el => (el.textContent = P.name));
      document.title = `${P.name} — ${P.role || "Portfolio"}`;
      const initials = P.name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
      $("[data-initials]").textContent = initials;
      $(".nav__mark").textContent = initials[0];
    }
    if (P.role) $("[data-role]").textContent = P.role;
    if (P.location) $("[data-location]").textContent = P.location;
    if (P.availability) $("[data-availability]").textContent = P.availability;
    if (P.intro) $("[data-intro]").textContent = P.intro;
    if (P.email) $("[data-email]").textContent = P.email;
    $("[data-year]").textContent = new Date().getFullYear();

    if (P.resume) { const r = $("[data-resume]"); r.href = P.resume; r.hidden = false; }

    if (P.portrait) {
      const fig = $("[data-portrait]");
      const img = new Image();
      img.src = P.portrait; img.alt = `Portrait of ${P.name || "the designer"}`; img.loading = "lazy";
      img.onload = () => { fig.innerHTML = ""; fig.appendChild(img); };
    }

    if (P.showreel) {
      const reel = $("[data-reel]");
      reel.hidden = false;
      const v = $("video", reel);
      v.src = P.showreel;
      reel.addEventListener("click", () => (v.paused ? v.play() : v.pause()));
      new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: .25 }).observe(v);
    }

    const alias = $("[data-alias]");
    if (P.alias) alias.textContent = `${P.name || ""} — goes by ${P.alias}`;
    else alias.hidden = true;

    $("[data-socials]").innerHTML = (P.socials || []).filter(s => s.url).map(s =>
      `<li><a href="${esc(s.url)}" target="_blank" rel="noopener" data-hover>${esc(s.label)} ↗</a></li>`).join("");
  }

  function renderMarquee() {
    const star = `<svg class="marquee__star" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 0c.6 6.6 5.4 11.4 12 12-6.6.6-11.4 5.4-12 12-.6-6.6-5.4-11.4-12-12C6.6 11.4 11.4 6.6 12 0Z"/></svg>`;
    const items = (DATA.skills || []).map(s => `<span class="marquee__item">${esc(s)}${star}</span>`).join("");
    // two copies for a seamless loop
    $("[data-marquee]").innerHTML = `<div style="display:flex">${items}</div><div style="display:flex" aria-hidden="true">${items}</div>`;
  }

  function mediaMarkup(p) {
    if (p.cover || p.coverVideo) {
      const img = p.cover ? `<img src="${esc(p.cover)}" alt="${esc(p.title)} preview" loading="lazy">` : "";
      const vid = p.coverVideo ? `<video src="${esc(p.coverVideo)}" muted loop playsinline preload="none" ${p.cover ? "" : 'style="opacity:1"'}></video>` : "";
      return img + vid;
    }
    return `<div class="project__art" aria-hidden="true">
      <div class="project__art-meta"><span>${esc(p.category)}</span><span>${esc(p.year)}</span></div>
      <div class="project__art-title">${esc(p.title)}</div>
    </div>`;
  }

  function scopeMarkup(scope = {}) {
    return Object.entries(scope).map(([k, v]) =>
      `<span class="scope__item"><span class="scope__fill" style="--v:${Math.min(100, v) / 100}"></span>${esc(k)} <b>${esc(v)}%</b></span>`).join("");
  }

  function renderWork() {
    const projects = DATA.projects || [];
    $("[data-work-grid]").innerHTML = projects.map((p, i) => `
      <article class="project" data-cat="${esc(p.category)}" data-index="${i}" style="--p-color:${esc(p.color || "#A47864")}"
        tabindex="0" role="button" aria-label="Open case study: ${esc(p.title)}" data-cursor="View">
        <div class="project__media">
          <span class="project__badge">${esc(p.category)}</span>
          ${mediaMarkup(p)}
        </div>
        <div class="project__info">
          <div>
            <h3 class="project__title">${esc(p.title)}</h3>
            <p class="project__type">${esc(p.type || "")}</p>
          </div>
          <span class="mono project__year">${esc(p.year || "")}</span>
        </div>
        <div class="scope">${scopeMarkup(p.scope)}</div>
      </article>`).join("");

    $("[data-work-count]").textContent = `${String(projects.length).padStart(2, "0")} projects`;

    const cats = ["All", ...(DATA.categories || [])].filter(c => c === "All" || projects.some(p => p.category === c));
    $("[data-filters]").innerHTML = cats.map((c, i) => {
      const n = c === "All" ? projects.length : projects.filter(p => p.category === c).length;
      return `<button class="filter" role="tab" aria-selected="${i === 0}" data-filter="${esc(c)}" data-magnetic>${esc(c)}<sup>${n}</sup></button>`;
    }).join("");

    $$(".filter").forEach(btn => btn.addEventListener("click", () => {
      $$(".filter").forEach(b => b.setAttribute("aria-selected", b === btn));
      const f = btn.dataset.filter;
      const cards = $$(".project");
      const apply = () => {
        cards.forEach(c => c.classList.toggle("is-hidden", f !== "All" && c.dataset.cat !== f));
        window.ScrollTrigger && ScrollTrigger.refresh();
      };
      if (window.gsap && !reduced) {
        gsap.to(cards, { opacity: 0, y: 30, duration: .25, stagger: .02, onComplete: () => {
          apply();
          gsap.fromTo(cards.filter(c => !c.classList.contains("is-hidden")), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .7, stagger: .06, ease: "expo.out" });
        } });
      } else apply();
    }));

    $$(".project").forEach(card => {
      const v = $("video", card);
      if (v && $("img", card)) {
        card.addEventListener("mouseenter", () => { v.preload = "auto"; v.play().catch(() => {}); });
        card.addEventListener("mouseleave", () => v.pause());
      } else if (v) {
        new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause())).observe(card);
      }
      card.addEventListener("click", () => openCase(+card.dataset.index));
      card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCase(+card.dataset.index); } });
    });

    // scope bars fill when visible
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    }), { threshold: .3 });
    $$(".project").forEach(c => io.observe(c));
  }

  function renderServices() {
    $("[data-services]").innerHTML = (DATA.services || []).map((s, i) => `
      <li class="service" data-cursor="${i % 2 ? "Hello" : "Yes!"}">
        <span class="mono service__num">(${String(i + 1).padStart(2, "0")})</span>
        <h3 class="service__title">${esc(s.title)}</h3>
        <p class="service__desc">${esc(s.desc)}</p>
        <div class="service__tags">${(s.tags || []).map(t => `<span>${esc(t)}</span>`).join("")}</div>
      </li>`).join("");
  }

  function renderProcess() {
    $("[data-process]").innerHTML = (DATA.process || []).map(s => `
      <div class="step">
        <span class="step__num">${esc(s.step)}</span>
        <div><h3 class="step__title">${esc(s.title)}</h3><p class="step__desc">${esc(s.desc)}</p></div>
      </div>`).join("");
  }

  /* ------------------------------------------------------------------
     2. Case study overlay
     ------------------------------------------------------------------ */
  const caseEl = $(".case");
  let lastFocus = null;

  function galleryItem(g) {
    const cap = g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : "";
    if (g.type === "embed") return `<figure><iframe src="${esc(g.src)}" title="${esc(g.caption || "Embedded video")}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>${cap}</figure>`;
    if (g.type === "video" || isVideo(g.src)) return `<figure><video src="${esc(g.src)}" controls muted loop playsinline preload="metadata"></video>${cap}</figure>`;
    return `<figure><img src="${esc(g.src)}" alt="${esc(g.caption || "Project image")}" loading="lazy">${cap}</figure>`;
  }

  function openCase(i) {
    const p = (DATA.projects || [])[i];
    if (!p) return;
    lastFocus = document.activeElement;
    const gallery = (p.gallery || []).filter(g => g && g.src);
    $("[data-case]").innerHTML = `
      <header class="case__hero" style="--p-color:${esc(p.color || "#A47864")}">
        <span class="mono case__cat">${esc(p.category)} — ${esc(p.year)}</span>
        <h2 class="case__title" id="case-title">${esc(p.title)}</h2>
        <p class="case__type">${esc(p.type || "")}</p>
        <p class="case__summary">${esc(p.summary || "")}</p>
        <div class="case__meta">
          <div><h3>My role / scope</h3><div class="bars">${Object.entries(p.scope || {}).map(([k, v]) => `
            <div class="bar"><span>${esc(k)}</span><span class="bar__track"><span class="bar__fill" style="--v:${Math.min(100, v)}%"></span></span><span class="bar__val">${esc(v)}%</span></div>`).join("")}</div></div>
          <div><h3>Tools</h3><div class="chips">${(p.tools || []).map(t => `<span>${esc(t)}</span>`).join("")}</div></div>
          <div><h3>Category</h3><p>${esc(p.category)}</p></div>
        </div>
        ${p.link ? `<a class="btn btn--dark case__link" href="${esc(p.link)}" target="_blank" rel="noopener">Visit live site <span aria-hidden="true">↗</span></a>` : ""}
      </header>
      <div class="case__gallery">
        ${(p.cover && !gallery.length) ? galleryItem({ src: p.cover }) : ""}
        ${gallery.length ? gallery.map(galleryItem).join("") : (!p.cover ? `<div class="case__empty">Images & videos coming soon.<br><br><span class="mono">Add them in <code>data/projects.js</code> → gallery</span></div>` : "")}
      </div>`;
    caseEl.hidden = false;
    $(".case__panel").scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => caseEl.classList.add("is-open")));
    lenis && lenis.stop();
    document.body.style.overflow = "hidden";
    setTimeout(() => $(".case__close").focus(), 50);
  }

  function closeCase() {
    if (caseEl.hidden) return;
    caseEl.classList.remove("is-open");
    $$("video", caseEl).forEach(v => v.pause());
    setTimeout(() => { caseEl.hidden = true; }, 700);
    lenis && lenis.start();
    document.body.style.overflow = "";
    lastFocus && lastFocus.focus();
  }

  $$("[data-close]", caseEl).forEach(el => el.addEventListener("click", closeCase));
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeCase(); });

  /* ------------------------------------------------------------------
     3. UI bits: theme, menu, email copy, clock, nav
     ------------------------------------------------------------------ */
  function initUI() {
    $(".theme-toggle").addEventListener("click", () => {
      const root = document.documentElement;
      const current = root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = current === "dark" ? "light" : "dark";
      const swap = () => { root.dataset.theme = next; try { localStorage.setItem("theme", next); } catch (e) {} };
      document.startViewTransition && !reduced ? document.startViewTransition(swap) : swap();
    });

    const menuBtn = $(".menu-btn"), menu = $(".mobile-menu");
    const toggleMenu = open => {
      menuBtn.setAttribute("aria-expanded", open);
      menu.classList.toggle("is-open", open);
      menu.setAttribute("aria-hidden", !open);
    };
    menuBtn.addEventListener("click", () => toggleMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
    $$("a", menu).forEach(a => a.addEventListener("click", () => toggleMenu(false)));

    const toast = $(".toast");
    const showToast = msg => { toast.textContent = msg; toast.classList.add("is-show"); setTimeout(() => toast.classList.remove("is-show"), 2200); };
    $("[data-copy-email]").addEventListener("click", async () => {
      const email = P.email || $("[data-email]").textContent;
      try { await navigator.clipboard.writeText(email); showToast("Email copied — talk soon ✦"); }
      catch (e) { location.href = `mailto:${email}`; }
    });

    const clock = $("[data-clock]");
    const tick = () => {
      try { clock.textContent = new Date().toLocaleTimeString("en-CA", { timeZone: P.timezone || "America/Toronto", hour: "2-digit", minute: "2-digit" }); } catch (e) {}
    };
    tick(); setInterval(tick, 30000);

    // nav: hide on scroll down, show on scroll up
    const nav = $(".nav");
    let lastY = 0;
    const onScroll = y => {
      nav.classList.toggle("is-scrolled", y > 40);
      nav.classList.toggle("is-hidden", y > lastY && y > 400 && !menu.classList.contains("is-open"));
      lastY = y;
    };
    window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });

    // anchor links go through Lenis when available
    $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
      const target = a.getAttribute("href");
      if (target.length < 2 && target !== "#") return;
      const el = target === "#top" || target === "#" ? document.body : $(target);
      if (!el) return;
      e.preventDefault();
      lenis ? lenis.scrollTo(target === "#top" ? 0 : el, { offset: -20, duration: 1.4 }) : el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    }));
  }

  /* ------------------------------------------------------------------
     4. Cursor + magnetic
     ------------------------------------------------------------------ */
  function initCursor() {
    if (!finePointer || reduced) return;
    const cursor = $(".cursor"), label = $(".cursor__label");
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener("mousemove", e => { x = e.clientX; y = e.clientY; }, { passive: true });
    (function loop() {
      cx += (x - cx) * .2; cy += (y - cy) * .2;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener("mouseover", e => {
      const t = e.target.closest("[data-cursor], a, button, [data-hover]");
      cursor.classList.remove("is-hover", "is-label");
      if (!t) return;
      if (t.dataset.cursor) { label.textContent = t.dataset.cursor; cursor.classList.add("is-label"); }
      else cursor.classList.add("is-hover");
    });

    // hero blobs follow the pointer a little
    const blobs = $(".hero__blobs");
    addEventListener("mousemove", e => {
      const dx = (e.clientX / innerWidth - .5) * 60, dy = (e.clientY / innerHeight - .5) * 60;
      blobs.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    }, { passive: true });
    blobs.style.transition = "transform 1.2s cubic-bezier(.22,1,.36,1)";

    $$("[data-magnetic]").forEach(el => {
      const strength = el.classList.contains("filter") ? .25 : .4;
      el.addEventListener("mousemove", e => {
        const r = el.getBoundingClientRect();
        const mx = (e.clientX - r.left - r.width / 2) * strength, my = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = `translate(${mx}px, ${my}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transition = "transform .6s cubic-bezier(.22,1,.36,1)";
        el.style.transform = "";
        setTimeout(() => (el.style.transition = ""), 600);
      });
    });
  }

  /* ------------------------------------------------------------------
     5. Text splitting
     ------------------------------------------------------------------ */
  function splitChars(el) {
    if (el.dataset.splitDone) return;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span"); w.className = "word";
            [...part].forEach(ch => { const c = document.createElement("span"); c.className = "char"; c.textContent = ch; w.appendChild(c); });
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    el.dataset.splitDone = "1";
  }

  function splitWords(el) {
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(" "));
          else { const w = document.createElement("span"); w.className = "word"; w.textContent = part; frag.appendChild(w); }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el);
  }

  /* ------------------------------------------------------------------
     6. Motion (GSAP + ScrollTrigger + Lenis)
     ------------------------------------------------------------------ */
  let lenis = null;

  function counters() {
    $$("[data-counter]").forEach(el => {
      const end = +el.dataset.counter;
      if (!window.gsap || reduced) { el.textContent = end; return; }
      const o = { v: 0 };
      gsap.to(o, { v: end, duration: 2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" },
        onUpdate: () => (el.textContent = Math.round(o.v)) });
    });
  }

  function marqueeMotion() {
    const track = $("[data-marquee]");
    if (reduced) return;
    let x = 0, dir = -1, speed = 0.6, boost = 0;
    let half = track.scrollWidth / 2;
    addEventListener("resize", () => (half = track.scrollWidth / 2));
    if (lenis) lenis.on("scroll", e => { dir = e.direction === 1 ? -1 : 1; boost = Math.min(Math.abs(e.velocity) * .6, 12); });
    (function loop() {
      x += dir * (speed + boost);
      boost *= .92;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.transform = `translate3d(${x}px,0,0)`;
      requestAnimationFrame(loop);
    })();
  }

  function motion() {
    const hasGsap = window.gsap && window.ScrollTrigger;
    if (!hasGsap || reduced) {
      $$(".reveal-up").forEach(el => { el.style.opacity = 1; el.style.transform = "none"; });
      $$("[data-counter]").forEach(el => (el.textContent = el.dataset.counter));
      marqueeMotion();
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    if (window.Lenis) {
      lenis = new Lenis({ lerp: .1, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    // split every heading
    $$(".split").forEach(splitChars);

    // hero intro
    const heroChars = $$(".hero__title .char");
    const tl = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
    tl.from(heroChars, { yPercent: 115, rotate: 8, duration: 1.4, stagger: .025 })
      .from(".hero__pill", { scale: 0, rotate: -30, duration: 1.2, ease: "back.out(1.8)" }, "-=1")
      .to(".hero .reveal-up", { opacity: 1, y: 0, duration: 1.2, stagger: .1 }, "-=1.1")
      .from(".circle-btn", { scale: 0, rotate: -180, duration: 1.4 }, "-=1.1")
      .from(".nav", { yPercent: -100, opacity: 0, duration: 1 }, "-=1.2");

    // preloader
    const loader = $(".loader"), countEl = $("[data-count]"), bar = $(".loader__bar span");
    const o = { v: 0 };
    gsap.timeline()
      .to(o, { v: 100, duration: 1.6, ease: "power2.inOut", onUpdate: () => { countEl.textContent = Math.round(o.v); bar.style.width = o.v + "%"; } })
      .to(".loader__inner", { yPercent: -30, opacity: 0, duration: .5, ease: "power2.in" })
      .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 1, ease: "expo.inOut" }, "-=.2")
      .add(() => tl.play(), "-=.7")
      .set(loader, { display: "none" });

    // hero parallax out
    gsap.to(".hero__title", { yPercent: -18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    // section headings: chars rise in
    $$(".section-title, .contact__title").forEach(t => {
      gsap.from($$(".char", t), { yPercent: 110, opacity: 0, rotate: 6, duration: 1.1, stagger: .02, ease: "expo.out",
        scrollTrigger: { trigger: t, start: "top 85%" } });
    });

    // showreel scale-up
    if (!$("[data-reel]").hidden) {
      gsap.fromTo(".reel__frame", { scale: .82, borderRadius: 60 }, { scale: 1, borderRadius: 22, ease: "none",
        scrollTrigger: { trigger: ".reel", start: "top bottom", end: "top 20%", scrub: true } });
    }

    // project cards: clip-path reveal + inner parallax
    $$(".project").forEach(card => {
      const media = $(".project__media", card);
      gsap.fromTo(media, { clipPath: "inset(18% 12% 18% 12% round 22px)" }, { clipPath: "inset(0% 0% 0% 0% round 22px)", duration: 1.4, ease: "expo.out",
        scrollTrigger: { trigger: card, start: "top 88%" } });
      gsap.from([$(".project__info", card), $(".scope", card)], { y: 30, opacity: 0, duration: 1, stagger: .1, ease: "expo.out",
        scrollTrigger: { trigger: card, start: "top 80%" } });
      const inner = $$("img, video", media);
      if (inner.length) gsap.fromTo(inner, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: "none",
        scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // about: word-by-word highlight on scroll
    const statement = $("[data-scrub-text]");
    splitWords(statement);
    gsap.fromTo($$(".word", statement), { opacity: .15 }, { opacity: 1, stagger: .1, ease: "none",
      scrollTrigger: { trigger: statement, start: "top 80%", end: "bottom 45%", scrub: true } });

    const portrait = $("[data-portrait]");
    gsap.from(portrait, { clipPath: "inset(100% 0 0 0 round 22px)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: portrait, start: "top 85%" } });

    // services slide in
    gsap.utils.toArray(".service").forEach((s, i) => gsap.from(s, { x: i % 2 ? 60 : -60, opacity: 0, duration: 1.1, ease: "expo.out",
      scrollTrigger: { trigger: s, start: "top 90%" } }));

    // process: pinned horizontal scroll (desktop)
    ScrollTrigger.matchMedia({
      "(min-width: 861px)": () => {
        const track = $("[data-process]");
        const dist = () => track.scrollWidth - innerWidth;
        const tween = gsap.to(track, { x: () => -dist(), ease: "none",
          scrollTrigger: { trigger: ".process", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true } });
        $$(".step", track).forEach(step => gsap.from(step, { rotate: 6, y: 80, opacity: .3, ease: "none",
          scrollTrigger: { trigger: step, containerAnimation: tween, start: "left right", end: "left 55%", scrub: true } }));
      }
    });

    // contact blob parallax
    gsap.to(".contact__blob", { yPercent: -30, ease: "none", scrollTrigger: { trigger: ".contact", start: "top bottom", end: "bottom top", scrub: true } });

    counters();
    marqueeMotion();
    addEventListener("load", () => ScrollTrigger.refresh());
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  renderProfile();
  renderMarquee();
  renderWork();
  renderServices();
  renderProcess();
  initUI();
  initCursor();
  try { motion(); } catch (err) { console.error(err); }

  // Fail-safe: never leave the loader up if something above broke or CDNs are blocked
  setTimeout(() => {
    const loader = $(".loader");
    if (loader && getComputedStyle(loader).display !== "none" && !(window.gsap && !reduced)) loader.style.display = "none";
  }, 200);
  setTimeout(() => {
    const loader = $(".loader");
    if (loader && getComputedStyle(loader).display !== "none") loader.style.display = "none";
    $$(".reveal-up").forEach(el => { if (getComputedStyle(el).opacity === "0") { el.style.opacity = 1; el.style.transform = "none"; } });
  }, 5000);
})();

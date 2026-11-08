/* Beecome Through Play: shared behaviour for both designs */
(function () {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  /* Her line-art bee, used by bee.js and the questionnaire */
  window.BEE_SVG = `<g class="bee" stroke-width="1.8" stroke-linecap="round">
    <ellipse class="wing" cx="-3" cy="-10" rx="5" ry="6.5"/><ellipse class="wing" cx="4" cy="-9" rx="4" ry="5.5"/>
    <ellipse class="body" cx="0" cy="0" rx="10" ry="7"/><path d="M-3 -6.4v12.8M2.6 -6.8v13.6" fill="none"/>
    <path d="M9 -3c2-4 4-5 5-6M7 -6c0-4 1-6 2-7" fill="none" stroke-width="1.3"/></g>`;

  /* ── Phone menu: modal dialog (focus moves in, Escape + Close work, focus returns) ── */
  const menu = document.getElementById("site-menu");
  const menuBtn = document.querySelector("[data-menu-btn]");
  if (menu && menuBtn) {
    let scrollY = 0;
    menuBtn.addEventListener("click", () => {
      scrollY = window.scrollY;
      menu.showModal();
      menuBtn.setAttribute("aria-expanded", "true");
      root.classList.add("menu-open");
      (menu.querySelector('[aria-current="page"]') || menu.querySelector("a")).focus();
    });
    menu.querySelector("[data-menu-close]").addEventListener("click", () => menu.close());
    menu.addEventListener("click", (e) => { if (e.target === menu) menu.close(); }); // backdrop
    menu.addEventListener("close", () => {
      menuBtn.setAttribute("aria-expanded", "false");
      root.classList.remove("menu-open");
      window.scrollTo(0, scrollY);
      menuBtn.focus();
    });
  }

  /* ── Display settings panel (disclosure) ── */
  const dBtn = document.querySelector("[data-display-btn]");
  const dPanel = document.getElementById("display-panel");
  if (dBtn && dPanel) {
    const setOpen = (open, focusBtn) => {
      dPanel.hidden = !open;
      dBtn.setAttribute("aria-expanded", String(open));
      if (!open && focusBtn) dBtn.focus();
    };
    dBtn.addEventListener("click", () => setOpen(dPanel.hidden));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !dPanel.hidden) setOpen(false, true); });
    document.addEventListener("click", (e) => { if (!dPanel.hidden && !e.target.closest(".display-menu")) setOpen(false); });
  }

  /* ── Colours: Light / Dark / Device (System) ── */
  const dark = matchMedia("(prefers-color-scheme: dark)");
  const groups = document.querySelectorAll("[data-theme-choice]");
  const applyTheme = (choice) => {
    if (choice === "light" || choice === "dark") root.dataset.theme = choice;
    else delete root.dataset.theme;
    groups.forEach((g) => {
      g.querySelectorAll("input").forEach((i) => (i.checked = i.value === choice));
      const sys = g.querySelector('input[value="system"] + svg + span');
      if (sys) sys.textContent = choice === "system" ? `Device (${dark.matches ? "dark" : "light"})` : "Device";
    });
  };
  let themeChoice = store.get("beecome-theme") || "system";
  applyTheme(themeChoice);
  groups.forEach((g) => g.addEventListener("change", (e) => {
    themeChoice = e.target.value;
    store.set("beecome-theme", themeChoice);
    applyTheme(themeChoice);
  }));
  dark.addEventListener("change", () => applyTheme(themeChoice));

  /* ── Text size: 100% to 200% ── */
  const STEPS = [1, 1.25, 1.5, 1.75, 2];
  const NAMES = { 1: "Normal", 1.25: "Large", 1.5: "Larger", 1.75: "Very large", 2: "Largest" };
  let ti = Math.max(0, STEPS.indexOf(parseFloat(store.get("beecome-text")) || 1));
  const applySize = () => {
    const v = STEPS[ti];
    root.style.setProperty("--text-scale", v);
    document.querySelectorAll("[data-text-size]").forEach((g) => {
      g.querySelector("[data-ts-value]").textContent = `${NAMES[v]}, ${Math.round(v * 100)}%`;
      const s = g.querySelector('[data-ts="-1"]'), l = g.querySelector('[data-ts="1"]'), r = g.querySelector('[data-ts="0"]');
      s.disabled = ti === 0; l.disabled = ti === STEPS.length - 1; r.disabled = ti === 0;
      l.title = l.disabled ? "Largest size" : "";
    });
  };
  applySize();
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-ts]");
    if (!b) return;
    const d = +b.dataset.ts;
    ti = d === 0 ? 0 : Math.min(STEPS.length - 1, Math.max(0, ti + d));
    store.set("beecome-text", STEPS[ti]);
    applySize();
  });

  /* ── Footer groups: open columns on wide screens, tap-to-open on phones ── */
  const wide = matchMedia("(min-width: 760px)");
  const cols = document.querySelectorAll("[data-foot-col]");
  const syncCols = () => cols.forEach((d) => (d.open = wide.matches));
  syncCols();
  wide.addEventListener("change", syncCols);
  cols.forEach((d) => d.querySelector("summary").addEventListener("click", (e) => { if (wide.matches) e.preventDefault(); }));

  /* ── Blog topic filters ── */
  const filters = document.querySelector("[data-filters]");
  if (filters) {
    const cards = [...document.querySelectorAll("[data-post-grid] .post-card")];
    const status = document.querySelector("[data-filter-status]");
    filters.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      filters.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const t = b.dataset.filter;
      let n = 0;
      cards.forEach((c) => { const show = !t || c.dataset.tags.split(" ").includes(t); c.hidden = !show; if (show) n++; });
      status.textContent = `Showing ${n} post${n === 1 ? "" : "s"}${t ? " about " + b.textContent : ""}.`;
    });
  }

  /* ── Questionnaire link to the original form ── */
  document.querySelectorAll("[data-q-original]").forEach((a) => { if (window.QUESTIONNAIRE) a.href = window.QUESTIONNAIRE.original; });

  /* ── Hero scene: blocks / cells shift slightly with the mouse (fine pointers only) ── */
  if (!reduce && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll("[data-parallax]").forEach((scene) => {
      const parts = scene.querySelectorAll("[data-depth]");
      scene.parentElement.addEventListener("pointermove", (e) => {
        const r = scene.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        parts.forEach((p) => (p.style.translate = `${x * p.dataset.depth}px ${y * p.dataset.depth}px`));
      });
    });
  }

  /* ── Reveal once on scroll (small rise, off with reduced motion) ── */
  const items = document.querySelectorAll("[data-reveal]");
  if (!reduce && "IntersectionObserver" in window) {
    root.classList.add("js-reveal");
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    }), { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
    items.forEach((el) => io.observe(el));
  }
})();

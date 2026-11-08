// Builds both full sites from src/ into dist/<theme>/, plus dist/index.html (the "choose a design" page).
//   node scripts/build.mjs
// Each page in src/pages starts with   <!--meta {"title": "...", "description": "...", "nav": "home"} -->
// and may use these placeholders:
//   {{HERO_HOME}}          the theme's home-page hero (src/themes/<theme>/hero-home.html)
//   {{PAGE_ART:icon}}      the theme's small inner-page illustration, with a sprite icon name
//   {{LATEST_POSTS}}       the 3 newest blog cards
//   {{ALL_POSTS}}          every blog card (blog page)
//   {{TAG_FILTERS}}        topic filter buttons (blog page)
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, rmSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");
const THEMES = {
  playroom: { label: "Playroom", color: "#3F6B69" },
  honeycomb: { label: "Honeycomb", color: "#3F6B69" },
};

const read = (p) => readFileSync(p, "utf8");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const SITE = (() => { const w = {}; new Function("window", read(join(SRC, "content/site.js")))(w); return w.SITE; })();
const sprite = read(join(SRC, "img/icons.svg")).replace(/<!--[\s\S]*?-->/g, "").replace(/\n\s*\n/g, "\n").trim();
const ic = (name, cls = "ic") => `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#${name}"/></svg>`;

/* ── Brand marks (filled, kept separate from the line-icon family) ── */
const BRAND = {
  whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
  facebook: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
  instagram: "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077",
};
const brand = (n) => `<svg class="ic brand" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${BRAND[n]}"/></svg>`;

/* ── Blog posts ── */
function parseFrontMatter(text) {
  const m = text.replace(/^﻿/, "").match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":"); if (i < 1) continue;
    const k = line.slice(0, i).trim().toLowerCase();
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    meta[k] = k === "tags" ? v.replace(/[[\]]/g, "").split(",").map((t) => t.trim()).filter(Boolean) : v;
  }
  return { meta, body: m[2] };
}
// Post image paths → built site paths
const postImg = (p) => {
  if (!p) return "";
  if (/^(https?:)?\/\//.test(p)) return p;
  if (p.startsWith("../assets/img/")) return "img/" + p.slice("../assets/img/".length);
  return "img/posts/" + p.replace(/^(\.\/)?(posts\/)?(images\/)?/, "");
};
const slugTag = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const posts = readdirSync(join(SRC, "posts")).filter((f) => f.endsWith(".md")).map((f) => {
  const { meta, body } = parseFrontMatter(read(join(SRC, "posts", f)));
  if (String(meta.draft).toLowerCase() === "true") return null;
  let html = marked.parse(body);
  html = html.replace(/<img src="([^"]+)"/g, (m, s) => `<img loading="lazy" src="${postImg(s)}"`)
             .replace(/<a href="(https?:[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener"')
             .replace(/<a href="questionnaire\.html"/g, '<a href="questionnaire.html"');
  const words = body.split(/\s+/).filter(Boolean).length;
  return { slug: f.replace(/\.md$/, ""), title: meta.title || f, date: meta.date || "", summary: meta.summary || "",
           image: postImg(meta.image), tags: meta.tags || [], html, minutes: Math.max(1, Math.round(words / 200)) };
}).filter(Boolean).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

const fmtDate = (d) => { const dt = new Date(d + "T12:00:00"); return isNaN(dt) ? "" : dt.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }); };
const postCard = (p, h = "h3") => `
      <article class="post-card" data-tags="${esc(p.tags.map(slugTag).join(" "))}">
        <div class="post-thumb">${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy">` : `<img class="thumb-logo" src="img/logo.png" alt="" loading="lazy">`}</div>
        <div class="post-body">
          <p class="post-meta"><time datetime="${p.date}">${fmtDate(p.date)}</time> · ${p.minutes} min read</p>
          <${h} class="post-title"><a href="post-${p.slug}.html">${esc(p.title)}</a></${h}>
          <p>${esc(p.summary)}</p>
          <ul class="tag-list" aria-label="Topics">${p.tags.map((t) => `<li class="tag">${esc(t)}</li>`).join("")}</ul>
        </div>
      </article>`;
const allTags = [...new Set(posts.flatMap((p) => p.tags))].sort();

/* ── Shared chrome ── */
const NAV = [["home", "index.html", "Home"], ["therapy", "play-therapy.html", "Play therapy"], ["about", "about.html", "About me"],
  ["workshops", "workshops.html", "Workshops"], ["blog", "blog.html", "Blog"], ["contact", "contact.html", "Contact"]];
const navList = (cur, cls) => `<ul class="${cls}">${NAV.map(([id, href, label]) =>
  `<li><a href="${href}"${id === cur ? ' aria-current="page"' : ""}>${label}</a></li>`).join("")}</ul>`;

const displaySettings = (idp) => `
  <fieldset class="seg theme-choice" data-theme-choice>
    <legend>Colours</legend>
    <label><input type="radio" name="theme-${idp}" value="light">${ic("sun")}<span>Light</span></label>
    <label><input type="radio" name="theme-${idp}" value="dark">${ic("moon")}<span>Dark</span></label>
    <label><input type="radio" name="theme-${idp}" value="system">${ic("monitor")}<span>Device</span></label>
  </fieldset>
  <div class="text-size" role="group" aria-label="Text size" data-text-size>
    <p class="ts-label">Text size: <output aria-live="polite" data-ts-value>100%</output></p>
    <div class="ts-buttons">
      <button type="button" class="ts-btn smaller" data-ts="-1" aria-label="Smaller text">A−</button>
      <button type="button" class="ts-btn reset" data-ts="0" aria-label="Reset text size">A</button>
      <button type="button" class="ts-btn larger" data-ts="1" aria-label="Larger text">A+</button>
    </div>
  </div>`;

const header = (cur, theme) => `
<header class="site-header">
  <div class="wrap header-row">
    <a class="brand" href="index.html"><span class="brand-frame"><img src="img/logo.png" alt="Beecome Through Play, home" width="500" height="500"></span></a>
    <nav class="main-nav" aria-label="Main">${navList(cur, "nav-list")}</nav>
    <div class="header-tools">
      <div class="display-menu">
        <button type="button" class="tool-btn" aria-expanded="false" aria-controls="display-panel" data-display-btn>${ic("display")}<span>Display</span></button>
        <div class="display-panel" id="display-panel" hidden>${displaySettings("h")}</div>
      </div>
      <button type="button" class="tool-btn menu-btn" aria-expanded="false" aria-controls="site-menu" data-menu-btn>${ic("menu")}<span>Menu</span></button>
    </div>
  </div>
</header>`;

const drawer = (cur) => `
<dialog class="drawer" id="site-menu" aria-label="Menu">
  <div class="drawer-head">
    <img src="img/logo.png" alt="" width="64" height="64">
    <button type="button" class="tool-btn" data-menu-close>${ic("close")}<span>Close</span></button>
  </div>
  <nav aria-label="Menu">${navList(cur, "drawer-list")}</nav>
  <a class="btn btn-main drawer-cta" href="questionnaire.html">Is therapy right for my child?</a>
  <div class="drawer-settings">${displaySettings("d")}</div>
  <ul class="drawer-social">
    <li><a href="${SITE.whatsapp}" target="_blank" rel="noopener">${brand("whatsapp")}WhatsApp</a></li>
    <li><a href="mailto:${SITE.email}">${ic("mail")}Email</a></li>
    <li><a href="${SITE.facebook}" target="_blank" rel="noopener">${brand("facebook")}Facebook</a></li>
    <li><a href="${SITE.instagram}" target="_blank" rel="noopener">${brand("instagram")}Instagram</a></li>
  </ul>
</dialog>`;

const footerCol = (id, title, items) => `
      <details class="foot-col" open data-foot-col>
        <summary><h2 class="foot-title" id="f-${id}">${title}</h2></summary>
        <ul aria-labelledby="f-${id}">${items}</ul>
      </details>`;
const footer = (theme) => `
<footer class="site-footer">
  <div class="footer-art" aria-hidden="true">${read(join(SRC, "themes", theme, "footer-art.html"))}</div>
  <div class="wrap footer-grid">
    <div class="foot-brand">
      <img src="img/logo.png" alt="" width="140" height="140">
      <p>Helping children become who they are meant to be, through play.</p>
      <p class="foot-hand">Lots of love x0x0</p>
    </div>
    ${footerCol("explore", "Explore", NAV.map(([, h, l]) => `<li><a href="${h}">${l}</a></li>`).join("") + `<li><a href="questionnaire.html">Questionnaire</a></li>`)}
    ${footerCol("services", "Services", `<li><a href="play-therapy.html">Play therapy</a></li><li><a href="contact.html">School readiness (OPTIMA)</a></li><li><a href="workshops.html">Children's workshops</a></li><li><a href="workshops.html#talks">Parent talks</a></li><li><a href="${SITE.growbright}" target="_blank" rel="noopener">Growbright study methods</a></li>`)}
    ${footerCol("contact", "Say hello", `<li><a href="${SITE.whatsapp}" target="_blank" rel="noopener">${brand("whatsapp")}WhatsApp</a></li><li><a href="mailto:${SITE.email}">${ic("mail")}Email me</a></li><li><a href="${SITE.facebook}" target="_blank" rel="noopener">${brand("facebook")}Facebook</a></li><li><a href="${SITE.instagram}" target="_blank" rel="noopener">${brand("instagram")}Instagram</a></li>`)}
    ${footerCol("reg", "Registered with", SITE.memberships.map((m) => `<li class="member-line"><img src="img/${m.logo.split("/").pop()}" alt="${m.name} logo" loading="lazy"><span class="m-name">${m.name}</span><span>Membership nr ${m.number}</span></li>`).join(""))}
  </div>
  <div class="wrap legal">
    <small>© ${new Date().getFullYear()} ${SITE.name}. All rights reserved.</small>
    <small>${SITE.locations.join(" · ")}</small>
  </div>
</footer>`;

const layout = ({ theme, meta, main }) => `<!doctype html>
<html lang="en-ZA" data-site="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.title)}${meta.title === SITE.name ? "" : " | " + SITE.name}</title>
<meta name="description" content="${esc(meta.description || "")}">
<meta name="theme-color" content="${THEMES[theme].color}">
<link rel="icon" href="img/icon-32.png"><link rel="apple-touch-icon" href="img/icon-180.png">
<script>/* apply saved colours + text size before first paint (no flash) */
try{var d=document.documentElement,t=localStorage.getItem("beecome-theme");if(t==="light"||t==="dark")d.dataset.theme=t;var s=parseFloat(localStorage.getItem("beecome-text"));if(s>=1&&s<=2)d.style.setProperty("--text-scale",s)}catch(e){}</script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Comfortaa:wght@600;700&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/theme.css">
<link rel="stylesheet" href="css/bee.css">
</head>
<body data-page="${meta.nav || ""}">
<a class="skip-link" href="#main">Skip to content</a>
<div hidden aria-hidden="true">${sprite}</div>
${header(meta.nav, theme)}
<main id="main">
${main}
</main>
${footer(theme)}
${drawer(meta.nav)}
<script src="content/site.js"></script>
<script src="js/site.js"></script>
${(meta.scripts || []).map((s) => `<script src="${s}"></script>`).join("\n")}
<script src="js/bee.js"></script>
</body>
</html>
`;

/* ── Build ── */
const copyDir = (from, to) => {
  mkdirSync(to, { recursive: true });
  for (const f of readdirSync(from)) {
    const a = join(from, f), b = join(to, f);
    statSync(a).isDirectory() ? copyDir(a, b) : copyFileSync(a, b);
  }
};
if (existsSync(DIST)) rmSync(DIST, { recursive: true, force: true });

const pageFiles = readdirSync(join(SRC, "pages")).filter((f) => f.endsWith(".html"));
for (const theme of Object.keys(THEMES)) {
  const out = join(DIST, theme);
  const tdir = join(SRC, "themes", theme);
  copyDir(join(SRC, "img"), join(out, "img"));
  copyDir(join(SRC, "posts", "images"), join(out, "img", "posts"));
  copyDir(join(SRC, "js"), join(out, "js"));
  copyDir(join(SRC, "content"), join(out, "content"));
  mkdirSync(join(out, "css"), { recursive: true });
  copyFileSync(join(SRC, "css", "base.css"), join(out, "css", "base.css"));
  copyFileSync(join(SRC, "css", "bee.css"), join(out, "css", "bee.css"));
  copyFileSync(join(tdir, "theme.css"), join(out, "css", "theme.css"));
  const heroHome = read(join(tdir, "hero-home.html"));
  const pageArt = read(join(tdir, "page-art.html"));

  const fill = (html) => html
    .replace("{{HERO_HOME}}", heroHome)
    .replace(/\{\{PAGE_ART:([a-z-]+)\}\}/g, (m, icon) => pageArt.replaceAll("{{ICON}}", icon))
    .replace("{{LATEST_POSTS}}", posts.slice(0, 3).map((p) => postCard(p)).join(""))
    .replace("{{ALL_POSTS}}", posts.map((p) => postCard(p, "h2")).join(""))
    .replace("{{TAG_FILTERS}}", ["", ...allTags].map((t) => `<button type="button" aria-pressed="${t === ""}" data-filter="${t ? slugTag(t) : ""}">${t || "All posts"}</button>`).join(""))
    .replace(/\{\{SITE\.([a-z]+)\}\}/g, (m, k) => esc(SITE[k]))
    .replace(/\{\{IC:([a-z-]+)\}\}/g, (m, n) => ic(n))
    .replace(/\{\{BRAND:([a-z]+)\}\}/g, (m, n) => brand(n));

  for (const f of pageFiles) {
    const raw = read(join(SRC, "pages", f));
    const mm = raw.match(/^<!--meta\s+(\{[\s\S]*?\})\s*-->\s*/);
    if (!mm) throw new Error(`${f}: missing <!--meta {...} --> header`);
    const meta = JSON.parse(mm[1]);
    if (f === "post.html") {
      posts.forEach((p, i) => {
        const older = posts[i + 1], newer = posts[i - 1];
        const main = fill(raw.slice(mm[0].length))
          .replaceAll("{{POST_TITLE}}", esc(p.title))
          .replace("{{POST_DATE}}", `<time datetime="${p.date}">${fmtDate(p.date)}</time>`)
          .replace("{{POST_MINUTES}}", String(p.minutes))
          .replace("{{POST_TAGS}}", p.tags.map((t) => `<li class="tag">${esc(t)}</li>`).join(""))
          .replace("{{POST_SUMMARY}}", esc(p.summary))
          .replace("{{POST_COVER}}", p.image ? `<figure class="post-cover wide"><img src="${esc(p.image)}" alt=""></figure>` : "")
          .replace("{{POST_HTML}}", p.html)
          .replaceAll("{{POST_SHARE_TEXT}}", encodeURIComponent(p.title))
          .replace("{{POST_PREV}}", older ? `<a class="pn prev" href="post-${older.slug}.html"><span class="pn-label">${ic("arrow-left")}Older post</span><span class="pn-title">${esc(older.title)}</span></a>` : "<span></span>")
          .replace("{{POST_NEXT}}", newer ? `<a class="pn next" href="post-${newer.slug}.html"><span class="pn-label">Newer post${ic("arrow")}</span><span class="pn-title">${esc(newer.title)}</span></a>` : "");
        writeFileSync(join(out, `post-${p.slug}.html`), layout({ theme, meta: { ...meta, title: p.title, description: p.summary }, main }));
      });
      continue;
    }
    writeFileSync(join(out, f), layout({ theme, meta, main: fill(raw.slice(mm[0].length)) }));
  }
  console.log(`dist/${theme}: ${pageFiles.length - 1} pages + ${posts.length} posts`);
}

// The "choose a design" page
const chooser = read(join(SRC, "chooser.html"));
mkdirSync(join(DIST, "img"), { recursive: true });
for (const f of ["logo.png", "icon-32.png"]) copyFileSync(join(SRC, "img", f), join(DIST, "img", f));
if (existsSync(join(SRC, "chooser-img"))) copyDir(join(SRC, "chooser-img"), join(DIST, "img"));
writeFileSync(join(DIST, "index.html"), chooser);
console.log("dist/index.html: chooser");

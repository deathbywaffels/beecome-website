/* Blog post helper: write, preview, then open GitHub with the post file filled in.
   The draft is kept in localStorage on her own device until she starts a new post. */
(function () {
  const S = window.SITE;
  const form = document.querySelector("[data-write]");
  if (!form || !S) return;
  const $ = (id) => document.getElementById(id);
  const KEY = "beecome-post-draft";
  const fields = ["w-title", "w-summary", "w-tags", "w-image", "w-body"];
  const status = form.querySelector("[data-w-status]");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const oneLine = (s) => s.replace(/[\r\n]+/g, " ").trim();
  const slugify = (s) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "new-post";

  // Restore the draft
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "null");
    if (d && fields.some((f) => d[f])) {
      fields.forEach((f) => d[f] && ($(f).value = d[f]));
      form.querySelector("[data-write-saved]").hidden = false;
    }
  } catch (e) {}

  const imagePath = () => {
    const v = $("w-image").value.trim();
    if (!v) return "";
    return /^https?:\/\//.test(v) ? v : "images/" + v.replace(/^.*[\\/]/, "");
  };
  const today = () => new Date().toISOString().slice(0, 10);
  const markdown = () => {
    const lines = ["---", `title: ${oneLine($("w-title").value) || "Untitled"}`, `date: ${today()}`];
    if ($("w-summary").value.trim()) lines.push(`summary: ${oneLine($("w-summary").value)}`);
    if (imagePath()) lines.push(`image: ${imagePath()}`);
    if ($("w-tags").value.trim()) lines.push(`tags: ${oneLine($("w-tags").value)}`);
    lines.push("---", "", $("w-body").value.trim(), "");
    return lines.join("\n");
  };

  const pvTitle = document.querySelector("[data-pv-title]");
  const pvBody = document.querySelector("[data-pv-body]");
  const pvCover = document.querySelector("[data-pv-cover]");
  function render() {
    pvTitle.textContent = $("w-title").value.trim() || "Your title";
    const body = $("w-body").value.trim();
    pvBody.innerHTML = body && window.marked ? marked.parse(body) : `<p class="hint">Your post will appear here as you type.</p>`;
    const img = imagePath();
    pvCover.innerHTML = img ? `<p class="hint">Cover picture: ${esc(img.replace(/^images\//, ""))} (it shows once it's uploaded to GitHub)</p>` : "";
    try { localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(fields.map((f) => [f, $(f).value])))); } catch (e) {}
  }
  fields.forEach((f) => $(f).addEventListener("input", render));
  render();

  // Formatting buttons
  const ta = $("w-body");
  form.querySelector(".write-toolbar").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const s = ta.selectionStart, en = ta.selectionEnd, sel = ta.value.slice(s, en);
    let ins;
    if (b.dataset.wrap) ins = b.dataset.wrap + (sel || "text") + b.dataset.wrap;
    else if (b.dataset.line) ins = (sel || "text").split("\n").map((l) => b.dataset.line + l).join("\n");
    else {
      const url = prompt("Paste the web address (starting with https://)");
      if (!url) return;
      ins = `[${sel || "link text"}](${url.trim()})`;
    }
    ta.setRangeText(ins, s, en, "end");
    ta.focus();
    render();
  });

  // Check title + text before publishing (error summary pattern)
  const summary = form.querySelector(".error-summary");
  function validate() {
    const errs = [];
    form.querySelectorAll("[data-wreq]").forEach((f) => {
      const input = f.querySelector("input, textarea");
      const msg = input.value.trim() ? "" : f.dataset.msg;
      f.classList.toggle("invalid", !!msg);
      f.querySelector(".field-error").textContent = msg;
      input.toggleAttribute("aria-invalid", !!msg);
      if (msg) errs.push({ msg, id: input.id });
    });
    if (!errs.length) { summary.hidden = true; return true; }
    summary.hidden = false;
    summary.querySelector("[data-w-err-title]").textContent = errs.length === 1 ? "1 thing to fix" : `${errs.length} things to fix`;
    summary.querySelector("[data-w-err-list]").innerHTML = errs.map((e) => `<li><a href="#${e.id}">${esc(e.msg)}</a></li>`).join("");
    summary.focus();
    return false;
  }
  summary.addEventListener("click", (e) => {
    const a = e.target.closest("a"); if (!a) return;
    e.preventDefault();
    const el = $(a.hash.slice(1));
    el.closest(".field").querySelector("label").scrollIntoView({ block: "center" });
    el.focus({ preventScroll: true });
  });

  const newFileUrl = (withText) => {
    const file = `${S.postsFolder}/${slugify($("w-title").value)}.md`;
    let url = `https://github.com/${S.githubRepo}/new/${S.githubBranch}?filename=${encodeURIComponent(file)}`;
    if (withText) url += `&value=${encodeURIComponent(markdown())}`;
    return url;
  };

  form.querySelector("[data-publish]").addEventListener("click", async () => {
    if (!validate()) return;
    const full = newFileUrl(true);
    if (full.length <= 7500) {
      window.open(full, "_blank", "noopener");
      status.textContent = "GitHub opened in a new tab. Press the green Commit changes button there.";
    } else {
      // Very long posts don't fit in a link: copy the text instead
      try { await navigator.clipboard.writeText(markdown()); } catch (e) {}
      window.open(newFileUrl(false), "_blank", "noopener");
      status.textContent = "Your post is long, so it was copied instead. On GitHub, click in the big box, paste (Ctrl+V), then press Commit changes.";
    }
  });
  form.querySelector("[data-copy]").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(markdown()); status.textContent = "Copied!"; }
    catch (e) { status.textContent = "Copying didn't work in this browser."; }
  });
  form.querySelector("[data-clear]").addEventListener("click", () => {
    if (!confirm("Start a new post? This clears what's written here.")) return;
    fields.forEach((f) => ($(f).value = ""));
    try { localStorage.removeItem(KEY); } catch (e) {}
    form.querySelector("[data-write-saved]").hidden = true;
    summary.hidden = true;
    render();
    status.textContent = "Ready for a new post.";
    $("w-title").focus();
  });
})();

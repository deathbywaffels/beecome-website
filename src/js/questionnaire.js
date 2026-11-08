/* Beecome questionnaire: a 5-step wizard that posts into the existing Google Form.
   Skills: ui-multi-step-form-wizard, ui-likert-scale, ui-form-error-summary, ui-date-picker, ui-select-dropdown.
   Answers are kept in sessionStorage (this tab only) so a refresh doesn't lose them; cleared after sending. */
(function () {
  const Q = window.QUESTIONNAIRE;
  const host = document.querySelector("[data-wizard]");
  if (!Q || !host) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const ic = (n) => `<svg class="ic" aria-hidden="true" focusable="false"><use href="#${n}"/></svg>`;
  const KEY = "beecome-q-draft";
  const baseTitle = document.title;

  const fmtMonth = new Intl.DateTimeFormat("en-ZA", { month: "long" });
  const MONTHS = Array.from({ length: 12 }, (_, i) => fmtMonth.format(new Date(2020, i, 15)));
  const S = Q.statements; // [entry, text]
  const GROUPS = [[0, 9], [9, 17], [17, 25]];
  const STEPS = ["Your child", "Statements 1–9", "Statements 10–17", "Statements 18–25", "Review and send"];

  /* ── Markup ── */
  const likert = ([entry, text], i) => {
    const id = "s" + (i + 1);
    return `
    <fieldset class="likert" id="${id}" data-req="radio" data-msg="Choose an answer for statement ${i + 1}" aria-describedby="${id}-err">
      <legend><span class="lk-no" aria-hidden="true">${i + 1}</span><span class="lk-text"><span class="sr-only">Statement ${i + 1}: </span>${esc(text)}</span></legend>
      <p class="field-error" id="${id}-err"></p>
      <div class="lk-opts">
        ${Q.scale.map((v, k) => `
        <label class="lk-opt"><input type="radio" name="${entry}" value="${esc(v)}"><span class="lk-face">${ic("check")}<span>${esc(Q.scaleLabels[k])}</span></span></label>`).join("")}
      </div>
    </fieldset>`;
  };

  host.innerHTML = `
    <p class="draft-note" data-draft-note hidden>${ic("clock")} We kept your answers from earlier in this visit.</p>
    <nav class="steps-nav" aria-label="Questionnaire steps">
      <ol class="steps">${STEPS.map((s, i) => `<li data-step-item="${i}"><span class="st-mark"><span class="st-in">${i + 1}</span></span><span class="st-name">${s}</span></li>`).join("")}</ol>
      <div class="steps-track" aria-hidden="true"><svg class="steps-bee" viewBox="-22 -22 44 44">${window.BEE_SVG}</svg></div>
    </nav>

    <form class="q-form" method="POST" action="${esc(Q.action)}" target="q-sink" novalidate>
      <div class="error-summary" tabindex="-1" aria-labelledby="err-h" hidden>
        <h2 id="err-h">${ic("alert")}<span data-err-title></span></h2>
        <ul data-err-list></ul>
      </div>

      <section class="q-step" data-step="0" aria-labelledby="h-0">
        <h2 id="h-0" tabindex="-1">About your child</h2>
        <div class="field" data-req="text" data-msg="Enter your child's name">
          <label for="q-child">${esc(Q.childName.label)} <span class="req-word">(required)</span></label>
          <p class="field-error" id="q-child-err"></p>
          <input id="q-child" type="text" name="${Q.childName.entry}" autocomplete="off" aria-describedby="q-child-err">
        </div>
        <fieldset class="field choice" id="q-gender" data-req="radio" data-msg="Choose whether your child is a boy or a girl" aria-describedby="q-gender-err">
          <legend>Is your child a… <span class="req-word">(required)</span></legend>
          <p class="field-error" id="q-gender-err"></p>
          <div class="choice-row">
            ${Q.gender.options.map((o) => `<label class="lk-opt"><input type="radio" name="${Q.gender.entry}" value="${esc(o)}"><span class="lk-face">${ic("check")}<span>${o === "Male" ? "Boy" : "Girl"}</span></span></label>`).join("")}
          </div>
        </fieldset>
        <fieldset class="field dob" id="q-dob" data-req="dob" aria-describedby="dob-hint q-dob-err">
          <legend>${esc(Q.birthDate.label)} <span class="req-word">(required)</span></legend>
          <p class="hint" id="dob-hint">For example: 7 March 2018</p>
          <p class="field-error" id="q-dob-err"></p>
          <div class="dob-row">
            <div class="dob-part dob-day"><label for="q-dob-day">Day</label><input id="q-dob-day" type="text" inputmode="numeric" autocomplete="bday-day" maxlength="2"></div>
            <div class="dob-part dob-month"><label for="q-dob-month">Month</label>
              <select id="q-dob-month" class="sel" autocomplete="bday-month"><option value="">Choose…</option>${MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join("")}</select></div>
            <div class="dob-part dob-year"><label for="q-dob-year">Year</label><input id="q-dob-year" type="text" inputmode="numeric" autocomplete="bday-year" maxlength="4" placeholder="YYYY"></div>
          </div>
          <input type="hidden" name="${Q.birthDate.entry}_year"><input type="hidden" name="${Q.birthDate.entry}_month"><input type="hidden" name="${Q.birthDate.entry}_day">
        </fieldset>
        <div class="field">
          <label for="q-phone">${esc(Q.parentPhone.label)} <span class="opt-word">(optional)</span></label>
          <p class="hint" id="q-phone-hint">So I can get back to you quickly.</p>
          <input id="q-phone" type="tel" name="${Q.parentPhone.entry}" autocomplete="tel" inputmode="tel" aria-describedby="q-phone-hint">
        </div>
      </section>

      ${GROUPS.map(([a, b], gi) => `
      <section class="q-step" data-step="${gi + 1}" aria-labelledby="h-${gi + 1}" hidden>
        <h2 id="h-${gi + 1}" tabindex="-1">How things have been <span class="h-sub">(statements ${a + 1} to ${b})</span></h2>
        <p class="hint">Think about the last six months or this school year, and pick the answer that fits best.</p>
        ${S.slice(a, b).map((s, k) => likert(s, a + k)).join("")}
      </section>`).join("")}

      <section class="q-step" data-step="4" aria-labelledby="h-4" hidden>
        <h2 id="h-4" tabindex="-1">Review and send</h2>
        <div class="field" data-req="text" data-msg="Write any comments or concerns, or simply write No">
          <label for="q-comments">${esc(Q.comments.label)} <span class="req-word">(required)</span></label>
          <p class="hint" id="q-comments-hint">Anything you'd like me to know. If there's nothing, simply write "No".</p>
          <p class="field-error" id="q-comments-err"></p>
          <textarea id="q-comments" name="${Q.comments.entry}" rows="5" aria-describedby="q-comments-hint q-comments-err"></textarea>
        </div>
        <div class="review" data-review></div>
      </section>

      <input type="hidden" name="fvv" value="1"><input type="hidden" name="pageHistory" value="0">
      <div class="q-nav">
        <button type="button" class="btn btn-quiet" data-back>${ic("arrow-left")} Back</button>
        <button type="button" class="btn btn-main" data-next>Next ${ic("arrow")}</button>
        <button type="submit" class="btn btn-main" data-submit>Send my answers ${ic("arrow")}</button>
      </div>
    </form>
    <iframe name="q-sink" title="Form submission" hidden></iframe>

    <section class="thanks" hidden tabindex="-1" aria-labelledby="thanks-h">
      <svg class="thanks-flight" viewBox="0 0 300 120" aria-hidden="true"><path class="trail" d="M10 100C50 20 110 20 120 60s-40 50-50 10 60-60 110-40 60 40 110 0"/></svg>
      <h2 id="thanks-h">${esc(Q.thanks.title)}</h2>
      <p class="lead">${esc(Q.thanks.body)}</p>
      <p class="hand-note">${esc(Q.thanks.signoff)}</p>
      <div class="actions"><a class="btn btn-main" href="blog.html">Read tips on the blog</a><a class="btn btn-quiet" href="index.html">Back to home</a></div>
    </section>`;

  const form = host.querySelector("form");
  const steps = [...host.querySelectorAll(".q-step")];
  const items = [...host.querySelectorAll("[data-step-item]")];
  const back = host.querySelector("[data-back]"), next = host.querySelector("[data-next]"), submit = host.querySelector("[data-submit]");
  const summary = host.querySelector(".error-summary");
  const bee = host.querySelector(".steps-bee");
  let current = 0, sent = false;

  /* ── Draft (this tab only) ── */
  const fields = () => [...form.querySelectorAll("input:not([type=hidden]), select, textarea")];
  const saveDraft = () => {
    const data = {};
    fields().forEach((f) => { if (f.type === "radio") { if (f.checked) data[f.name] = f.value; } else data[f.id] = f.value; });
    data._step = current;
    try { sessionStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  };
  const loadDraft = () => {
    let data; try { data = JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (e) {}
    if (!data) return 0;
    let any = false;
    fields().forEach((f) => {
      if (f.type === "radio") { if (data[f.name] === f.value) { f.checked = true; any = true; } }
      else if (data[f.id]) { f.value = data[f.id]; any = true; }
    });
    if (any) host.querySelector("[data-draft-note]").hidden = false;
    return Math.min(+data._step || 0, steps.length - 1);
  };

  /* ── Validation ── */
  function dobProblem() {
    const d = form.querySelector("#q-dob-day").value.trim(), m = form.querySelector("#q-dob-month").value, y = form.querySelector("#q-dob-year").value.trim();
    if (!d && !m && !y) return "Enter your child's date of birth";
    if (!/^\d{1,2}$/.test(d) || +d < 1 || +d > 31) return "Type the day of birth as a number from 1 to 31";
    if (!m) return "Choose the month of birth";
    if (!/^\d{4}$/.test(y)) return "Type the year of birth with 4 digits, for example 2018";
    const date = new Date(+y, +m - 1, +d);
    if (date.getMonth() !== +m - 1) return `${MONTHS[+m - 1]} doesn't have ${+d} days: check the day of birth`;
    if (date > new Date()) return "The date of birth is in the future: check the year";
    if (new Date().getFullYear() - +y > 25) return "Check the year of birth: it looks too long ago";
    return "";
  }
  function check(field) {
    const kind = field.dataset.req;
    let msg = "";
    if (kind === "dob") msg = dobProblem();
    else if (kind === "radio") msg = [...field.querySelectorAll("input")].some((r) => r.checked) ? "" : field.dataset.msg;
    else msg = field.querySelector("input, textarea").value.trim() ? "" : field.dataset.msg;
    field.classList.toggle("invalid", !!msg);
    field.querySelector(".field-error").textContent = msg;
    const target = kind === "radio" ? field.querySelector("input") : field.querySelector("input, textarea, select");
    field.querySelectorAll("input:not([type=hidden]), textarea, select").forEach((el) => el.toggleAttribute("aria-invalid", !!msg));
    return msg ? { msg, id: target.id || (target.id = field.id + "-first") } : null;
  }
  function validate(step) {
    const errs = [...step.querySelectorAll("[data-req]")].map(check).filter(Boolean);
    if (!errs.length) { summary.hidden = true; document.title = baseTitle; return true; }
    summary.hidden = false;
    summary.querySelector("[data-err-title]").textContent = errs.length === 1 ? "1 thing to fix" : `${errs.length} things to fix`;
    summary.querySelector("[data-err-list]").innerHTML = errs.map((e) => `<li><a href="#${e.id}">${esc(e.msg)}</a></li>`).join("");
    document.title = "Error: " + baseTitle;
    summary.focus();
    return false;
  }
  summary.addEventListener("click", (e) => {
    const a = e.target.closest("a"); if (!a) return;
    e.preventDefault();
    const el = document.getElementById(a.hash.slice(1));
    const wrap = el.closest("fieldset, .field");
    (wrap.querySelector("legend, label") || el).scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    el.focus({ preventScroll: true });
  });
  // Errors are re-checked only when Next is pressed (wizard rule). Clearing them on blur
  // made the page jump up mid-click, so the parent's next click missed its target.
  form.addEventListener("change", saveDraft);
  form.addEventListener("input", saveDraft);

  /* ── Steps ── */
  function show(n, { push = true, focus = true } = {}) {
    const dir = n >= current ? "fwd" : "bwd";
    current = n;
    steps.forEach((s, i) => { s.hidden = i !== n; s.classList.remove("fwd", "bwd"); if (i === n && !reduce) s.classList.add(dir); });
    items.forEach((li, i) => {
      li.classList.toggle("done", i < n);
      li.toggleAttribute("aria-current", false);
      if (i === n) li.setAttribute("aria-current", "step");
      li.querySelector(".st-in").innerHTML = i < n ? ic("check") + `<span class="sr-only">Done: </span>` : String(i + 1);
    });
    back.hidden = n === 0;
    next.hidden = n === steps.length - 1;
    submit.hidden = n !== steps.length - 1;
    // bee flies to the current step marker
    const mark = items[n].querySelector(".st-mark");
    const track = host.querySelector(".steps-track");
    const x = mark.getBoundingClientRect().left + mark.offsetWidth / 2 - track.getBoundingClientRect().left;
    bee.querySelector(".bee").classList.add("flying");
    bee.style.left = `${x}px`;
    setTimeout(() => bee.querySelector(".bee").classList.remove("flying"), reduce ? 0 : 750);
    summary.hidden = true;
    document.title = `${STEPS[n]} (step ${n + 1} of ${STEPS.length}) | ${baseTitle}`;
    if (n === steps.length - 1) buildReview();
    if (push) history.pushState({ qstep: n }, "", `#step-${n + 1}`);
    saveDraft();
    if (focus) {
      host.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
      steps[n].querySelector("h2").focus({ preventScroll: true });
    }
  }
  next.addEventListener("click", () => { if (validate(steps[current])) show(current + 1); });
  back.addEventListener("click", () => show(current - 1));
  window.addEventListener("popstate", (e) => {
    const n = e.state && typeof e.state.qstep === "number" ? e.state.qstep : 0;
    if (!sent) show(n, { push: false });
  });

  /* ── Review with Edit links ── */
  function buildReview() {
    const val = (id) => form.querySelector("#" + id).value.trim();
    const g = form.querySelector(`input[name="${Q.gender.entry}"]:checked`);
    const m = val("q-dob-month");
    const groupAnswers = (a, b) => S.slice(a, b).map(([entry, text], k) => {
      const r = form.querySelector(`input[name="${entry}"]:checked`);
      return `<li><span class="rv-q">${a + k + 1}. ${esc(text)}</span><span class="rv-a">${r ? esc(Q.scaleLabels[Q.scale.indexOf(r.value)]) : "Not answered"}</span></li>`;
    }).join("");
    host.querySelector("[data-review]").innerHTML = `
      <h3>Check your answers</h3>
      <div class="rv-block"><div class="rv-head"><h4>Your child</h4><button type="button" class="edit-link" data-edit="0">${ic("edit")}Edit <span class="sr-only">your child's details</span></button></div>
        <dl class="rv-list">
          <div><dt>Name</dt><dd>${esc(val("q-child")) || "Not given"}</dd></div>
          <div><dt>Boy or girl</dt><dd>${g ? (g.value === "Male" ? "Boy" : "Girl") : "Not given"}</dd></div>
          <div><dt>Date of birth</dt><dd>${val("q-dob-day")} ${m ? MONTHS[+m - 1] : ""} ${val("q-dob-year")}</dd></div>
          <div><dt>Cellphone</dt><dd>${esc(val("q-phone")) || "Not given"}</dd></div>
        </dl></div>
      ${GROUPS.map(([a, b], gi) => `
      <details class="rv-block"><summary class="rv-head"><h4>Statements ${a + 1} to ${b}</h4></summary>
        <ul class="rv-answers">${groupAnswers(a, b)}</ul>
        <button type="button" class="edit-link" data-edit="${gi + 1}">${ic("edit")}Edit <span class="sr-only">statements ${a + 1} to ${b}</span></button></details>`).join("")}`;
  }
  host.addEventListener("click", (e) => { const b = e.target.closest("[data-edit]"); if (b) show(+b.dataset.edit); });

  /* ── Send into the Google Form ── */
  form.addEventListener("submit", (e) => {
    for (let i = 0; i < steps.length; i++) {
      steps[i].hidden = false;
      const ok = [...steps[i].querySelectorAll("[data-req]")].map(check).every((x) => !x);
      steps[i].hidden = i !== current;
      if (!ok) { e.preventDefault(); show(i, { focus: false }); validate(steps[i]); return; }
    }
    const v = (id) => String(+form.querySelector("#" + id).value);
    form.querySelector(`[name="${Q.birthDate.entry}_year"]`).value = v("q-dob-year");
    form.querySelector(`[name="${Q.birthDate.entry}_month"]`).value = v("q-dob-month");
    form.querySelector(`[name="${Q.birthDate.entry}_day"]`).value = v("q-dob-day");
    submit.disabled = true;
    submit.innerHTML = `<span class="spinner" aria-hidden="true"></span> Sending…`;
    sent = true;
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      try { sessionStorage.removeItem(KEY); } catch (err) {}
      form.hidden = true;
      host.querySelector(".steps-nav").hidden = true;
      host.querySelector("[data-draft-note]").hidden = true;
      const t = host.querySelector(".thanks");
      t.hidden = false;
      document.title = "Thank you | " + baseTitle;
      t.focus();
      host.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
      if (window.BeeFly) window.BeeFly(t.querySelector(".thanks-flight"), { duration: 3600 });
    };
    host.querySelector("iframe").addEventListener("load", finish, { once: true });
    setTimeout(finish, 6000);
  });

  const start = loadDraft();
  const fromHash = /^#step-(\d)$/.test(location.hash) ? Math.min(+location.hash.slice(6) - 1, start) : start;
  history.replaceState({ qstep: fromHash }, "", fromHash ? `#step-${fromHash + 1}` : location.pathname + location.search);
  show(fromHash, { push: false, focus: false });
})();

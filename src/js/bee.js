/* Beecome bee animations: her black line-art bee with the dashed teal trail.
   Motion rules: the hero bee flies once (~4s) then rests, so no pause button is needed;
   it flies again on hover or tap; with reduced motion everything is still. */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const NS = "http://www.w3.org/2000/svg";

  /* Fly a bee along a path once; returns a promise. Exposed for the questionnaire. */
  function flyAlong(svg, { duration = 4200, from = 0, to = 1 } = {}) {
    const trail = svg.querySelector(".trail");
    let bee = svg.querySelector(".bee");
    if (!bee) { svg.insertAdjacentHTML("beforeend", window.BEE_SVG); bee = svg.querySelector(".bee"); }
    const len = trail.getTotalLength();
    let m = svg.querySelector("mask path");
    if (!m) {
      const id = "m" + Math.random().toString(36).slice(2, 8);
      const mask = document.createElementNS(NS, "mask");
      mask.id = id; mask.setAttribute("maskUnits", "userSpaceOnUse");
      m = trail.cloneNode(); m.removeAttribute("class");
      m.setAttribute("stroke", "#fff"); m.setAttribute("stroke-width", "10"); m.setAttribute("fill", "none");
      m.style.strokeDasharray = len; m.style.strokeDashoffset = len;
      mask.appendChild(m); svg.prepend(mask);
      trail.setAttribute("mask", `url(#${id})`);
    }
    const place = (d) => {
      const p = trail.getPointAtLength(d);
      const a1 = trail.getPointAtLength(Math.max(0, d - 1)), a2 = trail.getPointAtLength(Math.min(len, d + 1));
      const ang = (Math.atan2(a2.y - a1.y, a2.x - a1.x) * 180) / Math.PI;
      bee.setAttribute("transform", `translate(${p.x} ${p.y}) rotate(${ang})`);
      m.style.strokeDashoffset = len - d;
    };
    if (reduce) { place(to * len); return Promise.resolve(); }
    return new Promise((done) => {
      bee.classList.add("flying");
      const t0 = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0) / duration);
        place((from + (to - from) * ease(t)) * len);
        bee.style.translate = `0 ${Math.sin(t * Math.PI * 8) * 1.5}px`;
        if (t < 1) requestAnimationFrame(step);
        else { bee.classList.remove("flying"); bee.style.translate = ""; done(); }
      };
      requestAnimationFrame(step);
    });
  }
  window.BeeFly = flyAlong;

  /* 1. Hero flight */
  document.querySelectorAll("svg[data-bee-flight]").forEach((svg) => {
    let busy = false;
    const go = () => { if (busy || reduce) return; busy = true; flyAlong(svg).then(() => (busy = false)); };
    flyAlong(svg, { duration: 1, to: reduce ? 1 : 0 });
    if (!reduce) setTimeout(go, 500);
    const scene = svg.closest("[data-bee-scene]") || svg.parentElement;
    scene.addEventListener("pointerenter", go);
    scene.addEventListener("click", go);
  });

  /* 2. Tiny bee flies in after section headings, once */
  const mini = `<svg class="mini-bee" viewBox="-60 -20 80 34" aria-hidden="true" focusable="false">
      <path class="mini-trail" d="M-58 10c12-2 14-14 24-12s4 12-4 10 0-14 14-10 12 4 20 0"/>${window.BEE_SVG}</svg>`;
  const heads = document.querySelectorAll("[data-bee-heading]");
  heads.forEach((h) => h.insertAdjacentHTML("beforeend", mini));
  if (reduce || !("IntersectionObserver" in window)) heads.forEach((h) => h.classList.add("bee-in", "bee-done"));
  else {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("bee-in");
      setTimeout(() => e.target.classList.add("bee-done"), 1300);
      io.unobserve(e.target);
    }), { threshold: .6 });
    heads.forEach((h) => io.observe(h));
  }
})();

/* Beecome bee animations (her black line-art bee + dashed teal trail).
   Motion rules (ui skills): fly once (~4s), then rest — no endless loop, so no pause button needed;
   fly again on hover / tap / keyboard focus; everything static with reduced motion. */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // easeInOutCubic

  /* ── 1. Hero flight: any <svg data-bee-flight> holding path.trail + g.bee ── */
  document.querySelectorAll("svg[data-bee-flight]").forEach((svg) => {
    const trail = svg.querySelector(".trail");
    const bee = svg.querySelector(".bee");
    const len = trail.getTotalLength();
    const NS = "http://www.w3.org/2000/svg";

    // Mask that "draws" the dashed trail in behind the bee
    const id = "m" + Math.random().toString(36).slice(2, 8);
    const mask = document.createElementNS(NS, "mask");
    mask.id = id;
    mask.setAttribute("maskUnits", "userSpaceOnUse");
    const m = trail.cloneNode();
    m.removeAttribute("class");
    m.setAttribute("stroke", "#fff");
    m.setAttribute("stroke-width", "8");
    m.setAttribute("fill", "none");
    m.style.strokeDasharray = len;
    mask.appendChild(m);
    svg.prepend(mask);
    trail.setAttribute("mask", `url(#${id})`);

    const place = (d) => {
      const p = trail.getPointAtLength(d);
      const q = trail.getPointAtLength(Math.min(len, d + 1));
      const prev = trail.getPointAtLength(Math.max(0, d - 1));
      const a = (Math.atan2(q.y - prev.y, q.x - prev.x) * 180) / Math.PI;
      bee.setAttribute("transform", `translate(${p.x} ${p.y}) rotate(${a})`);
      m.style.strokeDashoffset = len - d;
    };

    let flying = false;
    const fly = () => {
      if (flying || reduce) return;
      flying = true;
      bee.classList.add("flying");
      const dur = 4200, t0 = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        // a little bob up and down while flying
        place(ease(t) * len);
        bee.style.translate = `0 ${Math.sin(t * Math.PI * 8) * 1.5}px`;
        if (t < 1) requestAnimationFrame(step);
        else { bee.classList.remove("flying"); bee.style.translate = ""; flying = false; }
      };
      requestAnimationFrame(step);
    };

    place(reduce ? len : 0);
    if (!reduce) setTimeout(fly, 600);

    // Fly again when someone plays with the scene
    const scene = svg.closest("[data-bee-scene]") || svg.parentElement;
    scene.addEventListener("pointerenter", fly);
    scene.addEventListener("click", fly);
    scene.addEventListener("focusin", fly);
  });

  /* ── 2. Tiny bees fly in beside section headings, once ── */
  const mini = `<svg class="mini-bee" viewBox="-60 -20 80 34" aria-hidden="true">
      <path class="mini-trail" d="M-58 10c12-2 14-14 24-12s4 12-4 10 0-14 14-10 12 4 20 0"/>
      <g class="bee" stroke-width="1.8" stroke-linecap="round">
        <ellipse class="wing" cx="-3" cy="-10" rx="5" ry="6.5"/><ellipse class="wing" cx="4" cy="-9" rx="4" ry="5.5"/>
        <ellipse class="body" cx="0" cy="0" rx="10" ry="7"/><path d="M-3 -6.4v12.8M2.6 -6.8v13.6" fill="none"/>
        <path d="M9 -3c2-4 4-5 5-6M7 -6c0-4 1-6 2-7" fill="none" stroke-width="1.3"/>
      </g></svg>`;
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

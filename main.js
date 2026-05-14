/* ==========================================================
   Di Barret — Premium Interaction Layer
   Modules: Loader · Cursor · ScrollProgress · LineReveal ·
            Parallax · Magnetic · CardTilt · PlanetOrbit ·
            FAQ · Form · Lenis+GSAP integration
   ========================================================== */

(function () {
  "use strict";

  gsap.registerPlugin(ScrollTrigger);

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isHover       = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ──────────────────────────────────────────────────────────
     1. PAGE LOADER  — fake progress then peel away
  ────────────────────────────────────────────────────────── */
  const Loader = (() => {
    const el     = document.getElementById("loader");
    const fill   = document.getElementById("loader-fill");
    const count  = document.getElementById("loader-count");
    if (!el) return { dismiss: () => {} };

    let progress = 0;
    const tick = () => {
      progress = Math.min(progress + (1 - progress) * 0.045 + 0.005, 1);
      if (fill)  fill.style.inset = `0 ${(1 - progress) * 100}% 0 0`;
      if (count) count.textContent = Math.round(progress * 100);
      if (progress < 0.995) requestAnimationFrame(tick);
    };

    return {
      run: () => requestAnimationFrame(tick),
      dismiss: () => new Promise((res) => {
        // ensure progress fills
        if (fill)  fill.style.inset = "0 0% 0 0";
        if (count) count.textContent = "100";
        setTimeout(() => {
          el.classList.add("is-dismissing");
          document.body.classList.add("is-loaded");
          setTimeout(() => { el.classList.add("is-hidden"); el.style.opacity = "0"; res(); }, 1100);
        }, 350);
      }),
    };
  })();

  /* ──────────────────────────────────────────────────────────
     2. CUSTOM CURSOR  — dot + ring, magnetic on interactive
  ────────────────────────────────────────────────────────── */
  const Cursor = (() => {
    if (!isHover || prefersReduced) return;
    const dot  = document.getElementById("cursor");
    const ring = document.getElementById("cursor-ring");
    if (!dot || !ring) return;
    document.documentElement.classList.add("has-cursor");

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let dx = mx, dy = my;          /* ring follows */
    let ex = mx, ey = my;          /* dot follows almost-instant */

    window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });

    const interactive = "a, button, .faq-item__btn, input, textarea, select, .demo-card, .service, .system-card, .stat";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(interactive)) {
        dot.classList.add("is-hover");
        ring.classList.add("is-hover");
      }
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(interactive)) {
        dot.classList.remove("is-hover");
        ring.classList.remove("is-hover");
      }
    });

    (function loop() {
      /* Dot: almost no lag */
      ex += (mx - ex) * 0.55;
      ey += (my - ey) * 0.55;
      /* Ring: smooth chase */
      dx += (mx - dx) * 0.16;
      dy += (my - dy) * 0.16;
      dot.style.transform  = `translate3d(${ex - 3}px, ${ey - 3}px, 0)`;
      ring.style.transform = `translate3d(${dx - 18}px, ${dy - 18}px, 0)`;
      requestAnimationFrame(loop);
    })();
  })();

  /* ──────────────────────────────────────────────────────────
     3. LENIS  + GSAP ticker integration  (lerp-based, snappy)
  ────────────────────────────────────────────────────────── */
  let lenis = null;
  if (!prefersReduced && window.Lenis) {
    lenis = new window.Lenis({
      lerp: 0.12,            /* snappy smoothing — no buffered jumps */
      wheelMultiplier: 1.0,  /* native-like scroll distance per tick */
      smoothWheel: true,
      syncTouch: false,      /* native touch scrolling on mobile */
      touchMultiplier: 1.5,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -20, duration: 0.9 });
    });
  }

  /* ──────────────────────────────────────────────────────────
     4. LINE-MASK REVEAL for headings  — auto-splits <br>
  ────────────────────────────────────────────────────────── */
  function splitLines(el) {
    if (el.dataset.split === "1") return;
    el.dataset.split = "1";
    /* Replace <br> with newlines, parse children */
    const html = el.innerHTML.replace(/<br\s*\/?>/gi, "\n");
    /* If element already has <span class="line"> children (hero) use them */
    const existingLines = el.querySelectorAll(":scope > .line");
    let segments;
    if (existingLines.length) {
      segments = [...existingLines].map((n) => n.innerHTML);
    } else {
      segments = html.split("\n").map((s) => s.trim()).filter(Boolean);
    }
    el.innerHTML = segments
      .map((s) => `<span class="line-wrap"><span class="line-inner">${s}</span></span>`)
      .join("");
  }

  /* ──────────────────────────────────────────────────────────
     5. SCROLL-DRIVEN ANIMATIONS
  ────────────────────────────────────────────────────────── */
  function setupAnimations() {
    /* — Line reveals on every heading — */
    const heads = document.querySelectorAll(".hero__title, .h2, .final-cta__h");
    heads.forEach((h) => splitLines(h));

    if (prefersReduced) {
      gsap.set(".line-inner", { y: 0 });
      gsap.set(".reveal", { opacity: 1, y: 0 });
      return;
    }

    /* Sync GSAP tracking with CSS initial state for line-inner */
    gsap.set(".line-inner", { yPercent: 110 });

    /* Headlines — line mask reveal */
    heads.forEach((h) => {
      const lines = h.querySelectorAll(".line-inner");
      if (!lines.length) return;
      if (h.classList.contains("hero__title")) return; /* hero played by entrance */
      gsap.to(lines, {
        yPercent: 0,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.12,
        scrollTrigger: { trigger: h, start: "top 85%", once: true },
      });
    });

    /* Generic .reveal elements — fade up with stagger via batch */
    ScrollTrigger.batch(".reveal", {
      start: "top 88%",
      onEnter: (els) =>
        gsap.fromTo(els,
          { opacity: 0, y: 34 },
          { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, overwrite: true }
        ),
    });

    /* Parallax — data-speed attributes */
    gsap.utils.toArray("[data-speed]").forEach((el) => {
      const speed = parseFloat(el.dataset.speed);
      gsap.to(el, {
        yPercent: speed * -10,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    });

    /* Marquee skew on scroll velocity */
    const track = document.querySelector(".marquee__track");
    if (track) {
      ScrollTrigger.create({
        trigger: ".marquee",
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const v = Math.max(-1, Math.min(1, self.getVelocity() / 2500));
          gsap.to(track, { skewX: v * -6, duration: 0.5, overwrite: true });
        },
      });
    }

    /* Hero corner grids — counter-parallax */
    gsap.to(".hero__corner--tl", {
      y: -80, opacity: 0,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".hero__corner--br", {
      y: 80, opacity: 0,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });

    /* Hero content fades out slightly faster than bg */
    gsap.to(".hero__content", {
      yPercent: -30, opacity: 0.2,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 },
    });

    /* Intro highlight pill — slow drift */
    gsap.to(".intro__highlight", {
      y: -30,
      ease: "none",
      scrollTrigger: {
        trigger: ".intro__highlight",
        start: "top bottom",
        end: "bottom top",
        scrub: 1.2,
      },
    });

    /* Dark sections — subtle bg shift */
    gsap.utils.toArray(".dark").forEach((sec) => {
      gsap.fromTo(sec,
        { backgroundPosition: "50% 0%" },
        {
          backgroundPosition: "50% 30%",
          ease: "none",
          scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: 1.5 },
        }
      );
    });

    /* Final CTA — scale + grid bg parallax */
    gsap.to(".final-cta__grid-bg", {
      scale: 1.4,
      opacity: 0.4,
      ease: "none",
      scrollTrigger: { trigger: ".final-cta", start: "top bottom", end: "bottom top", scrub: 1 },
    });
  }

  /* ──────────────────────────────────────────────────────────
     6. SCROLL PROGRESS BAR
  ────────────────────────────────────────────────────────── */
  function setupScrollProgress() {
    const bar = document.querySelector(".scroll-progress::after");
    const progressEl = document.querySelector(".scroll-progress");
    if (!progressEl) return;
    /* Use a child for the fill so we can transform */
    const fill = document.createElement("div");
    Object.assign(fill.style, {
      position: "absolute",
      inset: "0",
      transformOrigin: "left",
      transform: "scaleX(0)",
      background: "linear-gradient(90deg, var(--amber), #ffd75e)",
      boxShadow: "0 0 10px rgba(255,171,0,0.6)",
    });
    progressEl.appendChild(fill);

    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate: (self) => {
        fill.style.transform = `scaleX(${self.progress})`;
      },
    });
  }

  /* ──────────────────────────────────────────────────────────
     7. MAGNETIC BUTTONS
  ────────────────────────────────────────────────────────── */
  function setupMagneticButtons() {
    if (!isHover || prefersReduced) return;
    document.querySelectorAll(".btn, .nav__cta, .footer__cta").forEach((btn) => {
      const strength = 0.32;
      const arrow = btn.querySelector(".arrow");
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * strength;
        const y = (e.clientY - rect.top - rect.height / 2) * strength;
        gsap.to(btn, { x, y, duration: 0.4, ease: "power2.out" });
        if (arrow) gsap.to(arrow, { x: x * 0.5, y: y * 0.5, duration: 0.4, ease: "power2.out" });
      });
      btn.addEventListener("mouseleave", () => {
        gsap.to(btn,   { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
        if (arrow) gsap.to(arrow, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  /* ──────────────────────────────────────────────────────────
     8. 3D CARD TILT
  ────────────────────────────────────────────────────────── */
  function setupCardTilt() {
    if (!isHover || prefersReduced) return;
    const cards = document.querySelectorAll(".service, .system-card, .demo-card, .stat");
    cards.forEach((card) => {
      const maxTilt = 5;
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width  - 0.5;
        const y = (e.clientY - rect.top)  / rect.height - 0.5;
        gsap.to(card, {
          rotationY: x * maxTilt,
          rotationX: -y * maxTilt,
          transformPerspective: 900,
          transformOrigin: "center",
          duration: 0.5,
          ease: "power2.out",
        });
      });
      card.addEventListener("mouseleave", () => {
        gsap.to(card, {
          rotationY: 0,
          rotationX: 0,
          duration: 0.8,
          ease: "power3.out",
        });
      });
    });
  }

  /* ──────────────────────────────────────────────────────────
     9. HERO ENTRANCE  — orchestrated after loader
  ────────────────────────────────────────────────────────── */
  function playHeroEntrance() {
    const hero = document.querySelector(".hero");
    if (!hero) return;
    /* Removing .hero--pre fires CSS transitions on .hero__anim children
       (label, title parent fade, sub, ctas, micro, scrollhint) */
    hero.classList.remove("hero--pre");

    /* GSAP handles only the title's line-mask reveal (CSS can't) */
    if (prefersReduced) {
      gsap.set(".hero__title .line-inner", { yPercent: 0 });
      return;
    }
    gsap.to(".hero__title .line-inner", {
      yPercent: 0,
      duration: 1.3,
      ease: "expo.out",
      stagger: 0.13,
      delay: 0.45,
    });
  }

  /* ──────────────────────────────────────────────────────────
     10. FAQ accordion
  ────────────────────────────────────────────────────────── */
  function setupFAQ() {
    const items = document.querySelectorAll(".faq-item");
    items.forEach((item) => {
      const btn = item.querySelector(".faq-item__btn");
      if (!btn) return;
      btn.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");
        items.forEach((it) => {
          it.classList.remove("open");
          it.querySelector(".faq-item__btn")?.setAttribute("aria-expanded", "false");
        });
        if (!isOpen) {
          item.classList.add("open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });
    if (items.length > 0) {
      items[0].classList.add("open");
      items[0].querySelector(".faq-item__btn")?.setAttribute("aria-expanded", "true");
    }
  }

  /* ──────────────────────────────────────────────────────────
     11. LEAD FORM
  ────────────────────────────────────────────────────────── */
  function setupForm() {
    const form = document.getElementById("lead-form");
    const card = document.querySelector(".form-card");
    if (!form || !card) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      gsap.to(form, {
        opacity: 0, y: -8, duration: 0.4, ease: "power2.in",
        onComplete: () => {
          card.innerHTML = `
            <div class="form-success">
              <div class="check">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6.5L4.5 9L10 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>Tak. Vi har modtaget din forespørgsel og vender tilbage med næste skridt.</div>
              <p style="margin-top:14px;font-size:13px;font-weight:400;color:var(--text-dim);font-family:var(--body)">
                Du hører fra os inden for 2 hverdage.
              </p>
            </div>`;
          gsap.from(card.querySelector(".form-success"), {
            opacity: 0, y: 20, duration: 0.7, ease: "expo.out",
          });
        },
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     12. PLANET ORBIT  (canvas — Saturn-crystal)
  ══════════════════════════════════════════════════════════ */
  class PlanetOrbit {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.progress = 0;
      this._resize = this._resize.bind(this);
      this._resize();
      window.addEventListener("resize", this._resize);
      requestAnimationFrame((ts) => this._tick(ts));
    }
    _resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const el  = this.canvas;
      const w = el.offsetWidth  || window.innerWidth;
      const h = el.offsetHeight || window.innerHeight;
      el.width  = w * dpr; el.height = h * dpr;
      this.ctx.setTransform(1,0,0,1,0,0);
      this.ctx.scale(dpr, dpr);
      this.W=w; this.H=h; this.CX=w/2; this.CY=h/2;
      this.R = Math.min(w, h) * 0.37;
    }
    _pt(r, angle, tilt, rotZ) {
      const x3 =  r * Math.cos(angle);
      const y3 = -r * Math.sin(angle) * Math.sin(tilt);
      const z3 =  r * Math.sin(angle) * Math.cos(tilt);
      const px = x3 * Math.cos(rotZ) - y3 * Math.sin(rotZ);
      const py = x3 * Math.sin(rotZ) + y3 * Math.cos(rotZ);
      return [this.CX + px, this.CY + py, z3];
    }
    _ring({ r, sides, tilt, rotZ, lineAlpha, lineColor, lw, nodeR, nodeColor }) {
      const ctx = this.ctx;
      const pts = [];
      for (let i = 0; i <= sides; i++) pts.push(this._pt(r, (i / sides) * Math.PI * 2, tilt, rotZ));
      ctx.save();
      ctx.beginPath();
      pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
      ctx.closePath();
      ctx.globalAlpha = lineAlpha;
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lw;
      ctx.stroke();
      ctx.restore();

      const nodes = pts.slice(0, sides).sort((a, b) => a[2] - b[2]);
      nodes.forEach(([x, y, z]) => {
        const depth = (z / r + 1) * 0.5;
        const nr = Math.max(0.8, nodeR * (0.35 + depth * 0.75));
        const na = lineAlpha * (0.25 + depth * 0.75);
        const g = ctx.createRadialGradient(x - nr * 0.3, y - nr * 0.3, 0, x, y, nr);
        const isAmber = nodeColor === "#FFAB00";
        g.addColorStop(0,   isAmber ? "rgba(255,220,80,0.95)" : "rgba(255,255,255,0.95)");
        g.addColorStop(0.5, isAmber ? "rgba(255,171,0,0.85)"  : "rgba(200,210,220,0.8)");
        g.addColorStop(1,   isAmber ? "rgba(180,100,0,0.6)"   : "rgba(80,90,100,0.5)");
        ctx.save();
        ctx.globalAlpha = Math.max(0.05, na);
        ctx.beginPath();
        ctx.arc(x, y, nr, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();
      });
    }
    _spokes(r, sides, tilt, rotZ, alpha) {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < sides; i++) {
        const [x, y] = this._pt(r, (i / sides) * Math.PI * 2, tilt, rotZ);
        ctx.beginPath();
        ctx.moveTo(this.CX, this.CY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      ctx.restore();
    }
    _sphere() {
      const { ctx, CX, CY, R } = this;
      const r = R * 0.19;
      const halo = ctx.createRadialGradient(CX, CY, 0, CX, CY, r * 2.8);
      halo.addColorStop(0, "rgba(190,205,215,0.13)");
      halo.addColorStop(0.5, "rgba(190,205,215,0.05)");
      halo.addColorStop(1, "transparent");
      ctx.save(); ctx.beginPath(); ctx.arc(CX, CY, r * 2.8, 0, Math.PI*2); ctx.fillStyle = halo; ctx.fill(); ctx.restore();

      const body = ctx.createRadialGradient(CX-r*0.28, CY-r*0.28, r*0.04, CX, CY, r);
      body.addColorStop(0, "#fafafa");
      body.addColorStop(0.28, "#d8dee2");
      body.addColorStop(0.62, "#5e6468");
      body.addColorStop(1, "#181a1c");
      ctx.save(); ctx.globalAlpha = 0.93; ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI*2); ctx.fillStyle = body; ctx.fill(); ctx.restore();

      const rim = ctx.createRadialGradient(CX+r*0.42, CY+r*0.32, 0, CX+r*0.42, CY+r*0.32, r*0.85);
      rim.addColorStop(0, "rgba(255,171,0,0.55)"); rim.addColorStop(1, "transparent");
      ctx.save(); ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI*2); ctx.fillStyle = rim; ctx.fill(); ctx.restore();

      const spec = ctx.createRadialGradient(CX-r*0.3, CY-r*0.3, 0, CX-r*0.3, CY-r*0.3, r*0.45);
      spec.addColorStop(0, "rgba(255,255,255,0.6)"); spec.addColorStop(1, "transparent");
      ctx.save(); ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI*2); ctx.fillStyle = spec; ctx.fill(); ctx.restore();
    }
    _tick(ts) {
      const t = ts * 0.001;
      const sp = this.progress;
      const { W, H, R } = this;
      this.ctx.clearRect(0, 0, W, H);

      const tilt1 = 0.38 + sp * 1.05;
      const tilt2 = 0.46 + sp * 0.88;
      const tilt3 = 0.30 + sp * 1.22;
      const tiltH = 0.42 + sp * 0.92;
      const idle  = t * 0.10;
      const rot1  =  idle        + sp * Math.PI * 0.55;
      const rot2  = -idle * 0.68 + sp * Math.PI * 0.38;
      const rot3  =  idle * 0.44 + sp * Math.PI * 0.62;
      const rotH  = -idle * 0.28 + sp * Math.PI * 0.22;

      this._ring({ r: R*0.92, sides: 30, tilt: tilt3, rotZ: rot3, lineAlpha:0.13, lineColor:"rgba(255,255,255,0.55)", lw:0.55, nodeR:2.2, nodeColor:"#ffffff" });
      this._ring({ r: R*0.74, sides: 12, tilt: tilt2*0.88, rotZ: -rotH*0.65, lineAlpha:0.10, lineColor:"rgba(255,171,0,0.45)", lw:0.5, nodeR:2.6, nodeColor:"#FFAB00" });
      this._ring({ r: R*0.67, sides: 24, tilt: tilt2, rotZ: rot2, lineAlpha:0.22, lineColor:"rgba(255,255,255,0.65)", lw:0.85, nodeR:3.0, nodeColor:"#FFAB00" });
      this._spokes(R*0.42, 12, tilt1*0.9, rot1*0.5, 0.09);
      this._ring({ r: R*0.40, sides: 6,  tilt: tiltH, rotZ: rotH, lineAlpha:0.22, lineColor:"rgba(255,171,0,0.5)", lw:0.7, nodeR:3.5, nodeColor:"rgba(255,255,255,0.9)" });
      this._ring({ r: R*0.47, sides: 18, tilt: tilt1, rotZ: rot1, lineAlpha:0.34, lineColor:"rgba(255,255,255,0.80)", lw:0.95, nodeR:3.8, nodeColor:"#FFAB00" });
      this._sphere();

      requestAnimationFrame((ts) => this._tick(ts));
    }
  }

  /* ──────────────────────────────────────────────────────────
     BOOT  — run loader, then animations
  ────────────────────────────────────────────────────────── */
  Loader.run && Loader.run();

  /* Set up animations immediately so ScrollTrigger picks up layout */
  setupAnimations();
  setupScrollProgress();
  setupMagneticButtons();
  setupCardTilt();
  setupFAQ();
  setupForm();

  /* Init planet now */
  const orbitCanvas = document.getElementById("hero-orbit");
  if (orbitCanvas && !prefersReduced) {
    const planet = new PlanetOrbit(orbitCanvas);
    ScrollTrigger.create({
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: 1.8,
      onUpdate: (self) => { planet.progress = self.progress; },
    });
  }

  /* Dismiss loader on full window load, then play hero & refresh ScrollTrigger */
  function boot() {
    Loader.dismiss().then(() => {
      playHeroEntrance();
      ScrollTrigger.refresh();
    });
  }
  if (document.readyState === "complete") {
    setTimeout(boot, 600);
  } else {
    window.addEventListener("load", () => setTimeout(boot, 350));
    /* fallback safety */
    setTimeout(() => { if (!document.body.classList.contains("is-loaded")) boot(); }, 4500);
  }

})();

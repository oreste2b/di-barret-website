/* ==========================================================
   Di Barret — main.js
   GSAP ScrollTrigger + Lenis + PlanetOrbit canvas
   ========================================================== */

(function () {
  "use strict";

  /* ──────────────────────────────────────────────────────────
     GSAP + ScrollTrigger registration
  ────────────────────────────────────────────────────────── */
  gsap.registerPlugin(ScrollTrigger);

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ──────────────────────────────────────────────────────────
     Lenis smooth scroll  (tied to GSAP ticker, not manual RAF)
  ────────────────────────────────────────────────────────── */
  let lenis = null;
  if (!prefersReduced && window.Lenis) {
    lenis = new window.Lenis({
      duration: 1.15,
      smoothWheel: true,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    /* Keep ScrollTrigger in sync with Lenis */
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    /* Hijack anchor links */
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -20, duration: 1.4 });
    });
  }

  /* ──────────────────────────────────────────────────────────
     Hero entrance (remove hero--pre → triggers CSS transitions)
  ────────────────────────────────────────────────────────── */
  requestAnimationFrame(() => {
    const hero = document.querySelector(".hero");
    if (hero) hero.classList.remove("hero--pre");
  });

  /* ──────────────────────────────────────────────────────────
     Hero bg parallax (only on non-reduced-motion)
  ────────────────────────────────────────────────────────── */
  if (!prefersReduced) {
    const heroBg = document.querySelector(".hero__bg");
    let scrollY = 0;
    window.addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });
    (function loop() {
      if (heroBg) heroBg.style.transform = `translate3d(0,${scrollY * 0.35}px,0) scale(1.04)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ──────────────────────────────────────────────────────────
     Reveal on scroll  (IntersectionObserver)
  ────────────────────────────────────────────────────────── */
  const reveals = document.querySelectorAll(".reveal");
  if (prefersReduced) {
    reveals.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add("is-visible");
      } else {
        io.observe(el);
        setTimeout(() => { el.classList.add("is-visible"); io.unobserve(el); }, 2500);
      }
    });
  }

  /* ──────────────────────────────────────────────────────────
     FAQ accordion
  ────────────────────────────────────────────────────────── */
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const btn = item.querySelector(".faq-item__btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      faqItems.forEach((it) => {
        it.classList.remove("open");
        it.querySelector(".faq-item__btn")?.setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
  if (faqItems.length > 0) {
    faqItems[0].classList.add("open");
    faqItems[0].querySelector(".faq-item__btn")?.setAttribute("aria-expanded", "true");
  }

  /* ──────────────────────────────────────────────────────────
     Lead form submission
  ────────────────────────────────────────────────────────── */
  const leadForm = document.getElementById("lead-form");
  const formCard = document.querySelector(".form-card");
  if (leadForm && formCard) {
    leadForm.addEventListener("submit", (e) => {
      e.preventDefault();
      formCard.innerHTML = `
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
    });
  }

  /* ══════════════════════════════════════════════════════════
     PLANET ORBIT  — procedural canvas Saturn-crystal
     Polygonal rings (n-gons tilted in 3D) with sphere nodes
     at every vertex, driven by GSAP ScrollTrigger scrub.
  ══════════════════════════════════════════════════════════ */

  class PlanetOrbit {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.progress = 0;   // 0→1, owned by ScrollTrigger
      this._resize = this._resize.bind(this);
      this._resize();
      window.addEventListener("resize", this._resize);
      requestAnimationFrame((ts) => this._tick(ts));
    }

    _resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const el  = this.canvas;
      /* canvas fills the hero section absolutely */
      const w = el.offsetWidth  || window.innerWidth;
      const h = el.offsetHeight || window.innerHeight;
      el.width  = w * dpr;
      el.height = h * dpr;
      this.ctx.scale(dpr, dpr);
      this.W  = w;
      this.H  = h;
      this.CX = w / 2;
      this.CY = h / 2;
      /* base radius — slightly offset upward so planet sits behind headline */
      this.R  = Math.min(w, h) * 0.37;
    }

    /* Project a point on a tilted n-gon ring into 2D.
       Ring lies in the XZ plane, tilted around X-axis by `tilt`,
       then the whole ring rotated around Z-axis by `rotZ`.       */
    _pt(r, angle, tilt, rotZ) {
      /* 3-D position (XZ ring, tilted around X) */
      const x3 =  r * Math.cos(angle);
      const y3 = -r * Math.sin(angle) * Math.sin(tilt);
      const z3 =  r * Math.sin(angle) * Math.cos(tilt);  /* depth */

      /* 2-D rotation around Z */
      const px = x3 * Math.cos(rotZ) - y3 * Math.sin(rotZ);
      const py = x3 * Math.sin(rotZ) + y3 * Math.cos(rotZ);
      return [this.CX + px, this.CY + py, z3];
    }

    /* Draw one polygonal ring + sphere nodes at every vertex */
    _ring({ r, sides, tilt, rotZ, lineAlpha, lineColor, lw, nodeR, nodeColor }) {
      const ctx = this.ctx;
      const pts = [];
      for (let i = 0; i <= sides; i++) {
        pts.push(this._pt(r, (i / sides) * Math.PI * 2, tilt, rotZ));
      }

      /* Polygon outline */
      ctx.save();
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.closePath();
      ctx.globalAlpha = lineAlpha;
      ctx.strokeStyle = lineColor;
      ctx.lineWidth   = lw;
      ctx.stroke();
      ctx.restore();

      /* Sphere nodes — sorted back-to-front so front ones overdraw back ones */
      const nodes = pts.slice(0, sides).sort((a, b) => a[2] - b[2]);
      nodes.forEach(([x, y, z]) => {
        const depth = (z / r + 1) * 0.5;            /* 0 back → 1 front */
        const nr    = Math.max(0.8, nodeR * (0.35 + depth * 0.75));
        const na    = lineAlpha * (0.25 + depth * 0.75);

        /* Tiny radial gradient for the sphere illusion */
        const g = ctx.createRadialGradient(x - nr * 0.3, y - nr * 0.3, 0, x, y, nr);
        g.addColorStop(0,   nodeColor === "#FFAB00" ? "rgba(255,220,80,0.95)"  : "rgba(255,255,255,0.95)");
        g.addColorStop(0.5, nodeColor === "#FFAB00" ? "rgba(255,171,0,0.85)"   : "rgba(200,210,220,0.8)");
        g.addColorStop(1,   nodeColor === "#FFAB00" ? "rgba(180,100,0,0.6)"    : "rgba(80,90,100,0.5)");

        ctx.save();
        ctx.globalAlpha = Math.max(0.05, na);
        ctx.beginPath();
        ctx.arc(x, y, nr, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();
      });
    }

    /* Spokes from center to ring vertices */
    _spokes(r, sides, tilt, rotZ, alpha) {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth   = 0.5;
      for (let i = 0; i < sides; i++) {
        const [x, y] = this._pt(r, (i / sides) * Math.PI * 2, tilt, rotZ);
        ctx.beginPath();
        ctx.moveTo(this.CX, this.CY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    /* Central planet sphere with marble gradient + amber rim light */
    _sphere() {
      const { ctx, CX, CY, R } = this;
      const r = R * 0.19;

      /* Soft glow halo */
      const halo = ctx.createRadialGradient(CX, CY, 0, CX, CY, r * 2.8);
      halo.addColorStop(0,   "rgba(190,205,215,0.13)");
      halo.addColorStop(0.5, "rgba(190,205,215,0.05)");
      halo.addColorStop(1,   "transparent");
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(CX, CY, r * 2.8, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();
      ctx.restore();

      /* Marble body */
      const body = ctx.createRadialGradient(
        CX - r * 0.28, CY - r * 0.28, r * 0.04,
        CX,            CY,            r
      );
      body.addColorStop(0,    "#fafafa");
      body.addColorStop(0.28, "#d8dee2");
      body.addColorStop(0.62, "#5e6468");
      body.addColorStop(1,    "#181a1c");
      ctx.save();
      ctx.globalAlpha = 0.93;
      ctx.beginPath();
      ctx.arc(CX, CY, r, 0, Math.PI * 2);
      ctx.fillStyle = body;
      ctx.fill();
      ctx.restore();

      /* Amber rim accent (lower-right) */
      const rim = ctx.createRadialGradient(
        CX + r * 0.42, CY + r * 0.32, 0,
        CX + r * 0.42, CY + r * 0.32, r * 0.85
      );
      rim.addColorStop(0, "rgba(255,171,0,0.55)");
      rim.addColorStop(1, "transparent");
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(CX, CY, r, 0, Math.PI * 2);
      ctx.fillStyle = rim;
      ctx.fill();
      ctx.restore();

      /* Specular highlight (upper-left) */
      const spec = ctx.createRadialGradient(
        CX - r * 0.3, CY - r * 0.3, 0,
        CX - r * 0.3, CY - r * 0.3, r * 0.45
      );
      spec.addColorStop(0, "rgba(255,255,255,0.6)");
      spec.addColorStop(1, "transparent");
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(CX, CY, r, 0, Math.PI * 2);
      ctx.fillStyle = spec;
      ctx.fill();
      ctx.restore();
    }

    _tick(ts) {
      const t  = ts * 0.001;             /* seconds */
      const sp = this.progress;          /* 0–1 scroll progress */
      const { W, H, R } = this;
      const ctx = this.ctx;

      ctx.clearRect(0, 0, W, H);

      /* ── Tilt angles (scroll drives tilt from shallow → Saturn-deep) ── */
      const tilt1 = 0.38 + sp * 1.05;   /* inner ring */
      const tilt2 = 0.46 + sp * 0.88;   /* middle ring */
      const tilt3 = 0.30 + sp * 1.22;   /* outer ring */
      const tiltH = 0.42 + sp * 0.92;   /* hex frame */

      /* ── Slow idle rotation + scroll acceleration ── */
      const idle  = t * 0.10;
      const rot1  =  idle        + sp * Math.PI * 0.55;
      const rot2  = -idle * 0.68 + sp * Math.PI * 0.38;
      const rot3  =  idle * 0.44 + sp * Math.PI * 0.62;
      const rotH  = -idle * 0.28 + sp * Math.PI * 0.22;

      /* ── Layer order: outer → inner → sphere (painter's) ── */

      /* 1 · Outermost ring — 30-gon, gossamer */
      this._ring({
        r: R * 0.92, sides: 30,
        tilt: tilt3, rotZ: rot3,
        lineAlpha: 0.13, lineColor: "rgba(255,255,255,0.55)", lw: 0.55,
        nodeR: 2.2, nodeColor: "#ffffff",
      });

      /* 2 · Amber connector polygon — 12-gon linking outer→middle */
      this._ring({
        r: R * 0.74, sides: 12,
        tilt: tilt2 * 0.88, rotZ: -rotH * 0.65,
        lineAlpha: 0.10, lineColor: "rgba(255,171,0,0.45)", lw: 0.5,
        nodeR: 2.6, nodeColor: "#FFAB00",
      });

      /* 3 · Middle ring — 24-gon */
      this._ring({
        r: R * 0.67, sides: 24,
        tilt: tilt2, rotZ: rot2,
        lineAlpha: 0.22, lineColor: "rgba(255,255,255,0.65)", lw: 0.85,
        nodeR: 3.0, nodeColor: "#FFAB00",
      });

      /* 4 · Spokes: inner ring → center */
      this._spokes(R * 0.42, 12, tilt1 * 0.9, rot1 * 0.5, 0.09);

      /* 5 · Hexagonal inner frame (6-gon, amber tint) */
      this._ring({
        r: R * 0.40, sides: 6,
        tilt: tiltH, rotZ: rotH,
        lineAlpha: 0.22, lineColor: "rgba(255,171,0,0.5)", lw: 0.7,
        nodeR: 3.5, nodeColor: "rgba(255,255,255,0.9)",
      });

      /* 6 · Inner ring — 18-gon, brightest */
      this._ring({
        r: R * 0.47, sides: 18,
        tilt: tilt1, rotZ: rot1,
        lineAlpha: 0.34, lineColor: "rgba(255,255,255,0.80)", lw: 0.95,
        nodeR: 3.8, nodeColor: "#FFAB00",
      });

      /* 7 · Central sphere — always painted on top */
      this._sphere();

      requestAnimationFrame((ts) => this._tick(ts));
    }

    destroy() {
      window.removeEventListener("resize", this._resize);
    }
  }

  /* ── Init planet + wire up ScrollTrigger ── */
  const orbitCanvas = document.getElementById("hero-orbit");
  if (orbitCanvas && !prefersReduced) {
    const planet = new PlanetOrbit(orbitCanvas);

    ScrollTrigger.create({
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: 1.8,
      onUpdate: (self) => {
        planet.progress = self.progress;
      },
    });
  }

})();

/* ==========================================================
   Di Barret — main.js  (no parallax, no scroll animations)
   Modules: Loader · Cursor · FAQ · Form · Magnetic · Card tilt
   ========================================================== */

(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isHover       = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ──────────────────────────────────────────────────────────
     1. PAGE LOADER
  ────────────────────────────────────────────────────────── */
  const Loader = (() => {
    const el    = document.getElementById("loader");
    const fill  = document.getElementById("loader-fill");
    const count = document.getElementById("loader-count");
    if (!el) return { run: () => {}, dismiss: () => Promise.resolve() };

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
        if (fill)  fill.style.inset = "0 0% 0 0";
        if (count) count.textContent = "100";
        setTimeout(() => {
          el.classList.add("is-dismissing");
          document.body.classList.add("is-loaded");
          setTimeout(() => {
            el.classList.add("is-hidden");
            el.style.opacity = "0";
            res();
          }, 900);
        }, 250);
      }),
    };
  })();

  /* ──────────────────────────────────────────────────────────
     2. CUSTOM CURSOR
  ────────────────────────────────────────────────────────── */
  (() => {
    if (!isHover || prefersReduced) return;
    const dot  = document.getElementById("cursor");
    const ring = document.getElementById("cursor-ring");
    if (!dot || !ring) return;
    document.documentElement.classList.add("has-cursor");

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let dx = mx, dy = my, ex = mx, ey = my;

    window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });

    const interactive = "a, button, .faq-item__btn, input, textarea, select, .demo-card, .service, .system-card, .stat, .testimonial, .team-card, .why__card";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(interactive)) {
        dot.classList.add("is-hover");
        ring.classList.add("is-hover");
      }
    }, { passive: true });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(interactive)) {
        dot.classList.remove("is-hover");
        ring.classList.remove("is-hover");
      }
    }, { passive: true });

    (function loop() {
      ex += (mx - ex) * 0.55;
      ey += (my - ey) * 0.55;
      dx += (mx - dx) * 0.16;
      dy += (my - dy) * 0.16;
      dot.style.transform  = `translate3d(${ex - 3}px, ${ey - 3}px, 0)`;
      ring.style.transform = `translate3d(${dx - 16}px, ${dy - 16}px, 0)`;
      requestAnimationFrame(loop);
    })();
  })();

  /* ──────────────────────────────────────────────────────────
     3. ANCHOR LINK SMOOTH SCROLL  (only on click, not on wheel)
  ────────────────────────────────────────────────────────── */
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 20;
    window.scrollTo({ top, behavior: "smooth" });
  });

  /* ──────────────────────────────────────────────────────────
     4. FAQ accordion
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
     5. LEAD FORM
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
          <p style="margin-top:14px;font-size:13px;font-weight:400;color:var(--ink-soft);font-family:var(--body)">
            Du hører fra os inden for 2 hverdage.
          </p>
        </div>`;
    });
  }

  /* ──────────────────────────────────────────────────────────
     6. MAGNETIC BUTTONS  (mouse only — no scroll dependency)
  ────────────────────────────────────────────────────────── */
  if (isHover && !prefersReduced && window.gsap) {
    document.querySelectorAll(".btn, .nav__cta, .footer__cta").forEach((btn) => {
      const strength = 0.28;
      const arrow = btn.querySelector(".arrow");
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * strength;
        const y = (e.clientY - rect.top - rect.height / 2) * strength;
        gsap.to(btn,   { x, y, duration: 0.35, ease: "power2.out" });
        if (arrow) gsap.to(arrow, { x: x * 0.4, y: y * 0.4, duration: 0.35, ease: "power2.out" });
      });
      btn.addEventListener("mouseleave", () => {
        gsap.to(btn,   { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.45)" });
        if (arrow) gsap.to(arrow, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.45)" });
      });
    });
  }

  /* ──────────────────────────────────────────────────────────
     7. 3D CARD TILT  (mouse only — no scroll dependency)
  ────────────────────────────────────────────────────────── */
  if (isHover && !prefersReduced && window.gsap) {
    const cards = document.querySelectorAll(".service, .system-card, .demo-card, .stat, .why__card, .team-card");
    cards.forEach((card) => {
      const maxTilt = 4;
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width  - 0.5;
        const y = (e.clientY - rect.top)  / rect.height - 0.5;
        gsap.to(card, {
          rotationY: x * maxTilt,
          rotationX: -y * maxTilt,
          transformPerspective: 900,
          transformOrigin: "center",
          duration: 0.4,
          ease: "power2.out",
        });
      });
      card.addEventListener("mouseleave", () => {
        gsap.to(card, { rotationY: 0, rotationX: 0, duration: 0.6, ease: "power3.out" });
      });
    });
  }

  /* ──────────────────────────────────────────────────────────
     8. BOOT  — dismiss loader, fire hero entrance (CSS)
  ────────────────────────────────────────────────────────── */
  function boot() {
    Loader.dismiss().then(() => {
      document.querySelector(".hero")?.classList.remove("hero--pre");
    });
  }
  Loader.run();
  if (document.readyState === "complete") {
    setTimeout(boot, 400);
  } else {
    window.addEventListener("load", () => setTimeout(boot, 250));
    setTimeout(() => {
      if (!document.body.classList.contains("is-loaded")) boot();
    }, 3500);
  }

})();

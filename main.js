/* ==========================================================
   Di Barret — main.js  (minimal — no scroll effects)
   ========================================================== */
(function () {
  "use strict";

  /* Lead form: show success state on submit */
  const form = document.getElementById("lead-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const wrapper = form.parentElement;
      form.remove();
      const success = document.createElement("div");
      success.className = "lead__success";
      success.innerHTML = `
        <div class="lead__success-icon" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7.5L6 10L11 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="lead__success-text">Tak. Vi har modtaget din forespørgsel og vender tilbage med næste skridt.</div>
        <div class="lead__success-sub">Svar inden for 2 hverdage</div>
      `;
      wrapper.appendChild(success);
    });
  }

  /* Smooth scroll on anchor click only (not on wheel) */
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
})();

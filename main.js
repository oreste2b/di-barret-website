/* ==========================================================
   Di Barret — main.js
   - Lead form: POSTs to /api/lead (Vercel Function → Resend)
   - Smooth anchor scrolling with a 20px top offset
   ========================================================== */
(function () {
  "use strict";

  /* ---------- Lead form ---------- */
  const form = document.getElementById("lead-form");
  if (form) {
    const status = document.getElementById("lead-status");
    const button = form.querySelector(".lead__submit");
    const buttonLabel = form.querySelector(".lead__submit-label");
    const defaultLabel = buttonLabel ? buttonLabel.textContent : "";
    const renderedAt = Date.now();

    const setStatus = (msg, kind) => {
      if (!status) return;
      status.textContent = msg || "";
      status.dataset.kind = kind || "";
    };

    const setLoading = (loading) => {
      if (!button) return;
      button.disabled = loading;
      button.classList.toggle("is-loading", loading);
      if (buttonLabel) {
        buttonLabel.textContent = loading ? "Sender…" : defaultLabel;
      }
    };

    const showSuccess = () => {
      const wrapper = form.parentElement;
      form.remove();
      const success = document.createElement("div");
      success.className = "lead__success";
      success.setAttribute("role", "status");
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
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setStatus("", "");

      const fd = new FormData(form);
      const payload = {
        name: (fd.get("name") || "").toString().trim(),
        email: (fd.get("email") || "").toString().trim(),
        site: (fd.get("site") || "").toString().trim(),
        improve: (fd.get("improve") || "").toString().trim(),
        budget: (fd.get("budget") || "").toString().trim(),
        when: (fd.get("when") || "").toString().trim(),
        company: (fd.get("company") || "").toString(), // honeypot
        t: renderedAt,
      };

      if (!payload.name || payload.name.length < 2) {
        setStatus("Indtast venligst dit navn.", "error");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email)) {
        setStatus("Indtast venligst en gyldig email.", "error");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showSuccess();
          return;
        }

        let code = "";
        try {
          const data = await res.json();
          code = data && data.error;
        } catch {}

        const messages = {
          rate_limited: "For mange forsøg. Prøv igen om lidt.",
          email_invalid: "Indtast venligst en gyldig email.",
          name_required: "Indtast venligst dit navn.",
          server_misconfigured:
            "Tjenesten er midlertidigt nede. Skriv direkte til kontakte@dibarret.dk.",
          send_failed:
            "Vi kunne ikke sende lige nu. Prøv igen, eller skriv til kontakte@dibarret.dk.",
        };
        setStatus(
          messages[code] ||
            "Noget gik galt. Prøv igen, eller skriv til kontakte@dibarret.dk.",
          "error"
        );
      } catch {
        setStatus(
          "Netværksfejl. Tjek din forbindelse og prøv igen.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    });
  }

  /* ---------- Smooth scroll on anchor click ---------- */
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

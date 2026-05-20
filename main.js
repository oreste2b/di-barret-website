/* ==========================================================
   Di Barret — main.js
   - Lead form: POSTs to /api/lead, accessible loading/error states
   - Smooth anchor scrolling with focus management + reduced-motion aware
   ========================================================== */
(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------- Lead form ---------- */
  const form = document.getElementById("lead-form");
  if (form) {
    const status = document.getElementById("lead-status");
    const success = document.getElementById("lead-success");
    const button = form.querySelector(".lead__submit");
    const buttonLabel = form.querySelector(".lead__submit-label");
    const defaultLabel = buttonLabel ? buttonLabel.textContent : "";
    const nameField = form.querySelector("#lead-name");
    const emailField = form.querySelector("#lead-email");
    const renderedAt = Date.now();

    const setStatus = (msg, kind) => {
      if (!status) return;
      status.textContent = msg || "";
      status.dataset.kind = kind || "";
    };

    const setFieldInvalid = (field, invalid) => {
      if (!field) return;
      if (invalid) field.setAttribute("aria-invalid", "true");
      else field.removeAttribute("aria-invalid");
    };

    const setLoading = (loading) => {
      if (button) {
        button.disabled = loading;
        button.classList.toggle("is-loading", loading);
        if (buttonLabel) {
          buttonLabel.textContent = loading ? "Sender…" : defaultLabel;
        }
      }
      if (loading) form.setAttribute("aria-busy", "true");
      else form.removeAttribute("aria-busy");
    };

    const showSuccess = () => {
      // Remove every form descendant EXCEPT the pre-rendered success block,
      // then reveal it. Keeps the live region in the DOM at parse time so
      // screen readers reliably announce its content.
      Array.from(form.children).forEach((child) => {
        if (child !== success) child.remove();
      });
      success.hidden = false;
      success.setAttribute("tabindex", "-1");
      success.focus({ preventScroll: true });
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setStatus("", "");
      setFieldInvalid(nameField, false);
      setFieldInvalid(emailField, false);

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
        setFieldInvalid(nameField, true);
        nameField && nameField.focus();
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email)) {
        setStatus("Indtast venligst en gyldig email.", "error");
        setFieldInvalid(emailField, true);
        emailField && emailField.focus();
        return;
      }

      setLoading(true);
      setStatus("Sender forespørgsel…", "info");

      try {
        const res = await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        // 200 = real send. 204 = silently dropped (honeypot/time-trap) —
        // surface as success too so bots can't differentiate from outside.
        if (res.ok) {
          setStatus("", "");
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

  /* ---------- Smooth scroll + focus on anchor click ---------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 20;
    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
    // Move focus to the target section so SR/keyboard users land there.
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });
})();

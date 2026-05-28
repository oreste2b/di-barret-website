// ============================================================
// /clients/dubbu/chat.js
// Extracted from inline <script> to comply with CSP script-src 'self'.
// Two IIFEs: language toggle + live chatbot.
// ============================================================

(function () {
  "use strict";
  // ---- Language toggle (DA / ES) ----
  const KEY = "dibarret_lang";
  const supported = ["da", "es"];
  const body = document.body;
  const buttons = document.querySelectorAll("[data-set-lang]");
  const initial = (() => {
    const saved = localStorage.getItem(KEY);
    if (supported.includes(saved)) return saved;
    const browser = (navigator.language || "da").slice(0, 2).toLowerCase();
    return supported.includes(browser) ? browser : "da";
  })();
  function setLang(lang) {
    if (!supported.includes(lang)) return;
    body.dataset.activeLang = lang;
    document.documentElement.lang = lang === "es" ? "es" : "da";
    buttons.forEach((b) => {
      b.setAttribute("aria-pressed", b.dataset.setLang === lang ? "true" : "false");
    });
    localStorage.setItem(KEY, lang);
  }
  buttons.forEach((b) => b.addEventListener("click", () => setLang(b.dataset.setLang)));
  setLang(initial);
})();

(function () {
  "use strict";
  // ---- Real chatbot: POST /api/chat with conversation history ----
  const container = document.getElementById("chat-messages");
  const form = document.getElementById("chat-form");
  const field = document.getElementById("chat-field");
  const sendBtn = document.getElementById("chat-send");
  if (!container || !form || !field) return;

  const SESSION_KEY = "dubbu_chat_session";
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = "s_" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  const history = [];

  const welcome = {
    da: "Hej 👋 Jeg er Dubbu's K-beauty agent. Spørg om Beauty of Joseon Glow Serum, BoJ Relief Sun SPF, COSRX Snail 96, Anua Heartleaf Toner eller Some by Mi AHA-BHA-PHA Toner.",
    es: "Hola 👋 Soy el agente K-beauty de Dubbu. Pregúntame sobre Beauty of Joseon Glow Serum, BoJ Relief Sun SPF, COSRX Snail 96, Anua Heartleaf Toner o Some by Mi AHA-BHA-PHA Toner."
  };

  function currentLang() {
    return document.body.dataset.activeLang || "da";
  }

  function addBubble(role, text) {
    const div = document.createElement("div");
    div.className = "chat-bubble chat-bubble--" + (role === "user" ? "user" : "bot");
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function addTyping() {
    const div = document.createElement("div");
    div.className = "chat-typing";
    // CSP-safe: build dots via createElement instead of innerHTML
    for (let i = 0; i < 3; i++) div.appendChild(document.createElement("span"));
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function addError(msg) {
    const div = document.createElement("div");
    div.className = "chat-error";
    div.textContent = msg;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function showWelcome() {
    addBubble("assistant", welcome[currentLang()] || welcome.da);
  }

  function showEmailCapture(lastUserQuestion) {
    const lang = currentLang();
    const labels = {
      da: { label: "Efterlad email — vi vender tilbage samme dag", placeholder: "din@email.dk", btn: "Send", ok: "✓ Tak — vi vender tilbage på din email." },
      es: { label: "Deja tu email — respondemos el mismo día",      placeholder: "tu@email.com", btn: "Enviar", ok: "✓ Gracias — te respondemos por email." }
    };
    const L = labels[lang] || labels.da;

    // Build DOM via createElement (CSP-safe; no innerHTML with templates)
    const wrap = document.createElement("div");
    wrap.className = "chat-email";

    const labelEl = document.createElement("span");
    labelEl.className = "chat-email__label";
    labelEl.textContent = L.label;
    wrap.appendChild(labelEl);

    const row = document.createElement("div");
    row.className = "chat-email__row";

    const input = document.createElement("input");
    input.type = "email";
    input.className = "chat-email__input";
    input.placeholder = L.placeholder;
    input.required = true;
    row.appendChild(input);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chat-email__btn";
    btn.textContent = L.btn;
    row.appendChild(btn);

    wrap.appendChild(row);
    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;

    btn.addEventListener("click", async () => {
      const email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        input.style.borderColor = "var(--accent-red)";
        input.focus();
        return;
      }
      btn.disabled = true;
      input.disabled = true;
      try {
        await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "submit_email",
            sessionId: sessionId,
            email: email,
            question: lastUserQuestion,
            conversation: history.slice(-10)
          })
        });
      } catch (e) {
        // swallow — show success to user anyway
      }
      row.remove();
      const ok = document.createElement("div");
      ok.className = "chat-email__success";
      ok.textContent = L.ok;
      wrap.appendChild(ok);
    });
  }

  async function sendMessage(userText) {
    addBubble("user", userText);
    history.push({ role: "user", content: userText });
    field.value = "";
    field.disabled = true;
    sendBtn.disabled = true;

    const typing = addTyping();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId, messages: history.slice(-12) })
      });
      typing.remove();

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        addError(data.message || "Slow down — vent et øjeblik.");
      } else if (res.status === 503) {
        const data = await res.json().catch(() => ({}));
        addBubble("assistant", data.reply || "Demoen er ikke aktiv lige nu — skriv på WhatsApp.");
      } else if (!res.ok) {
        addBubble("assistant", "Noget gik galt — prøv igen, eller skriv på WhatsApp.");
      } else {
        const data = await res.json();
        const reply = (data.reply || "").trim();
        if (reply) {
          addBubble("assistant", reply);
          history.push({ role: "assistant", content: reply });
        }
        if (data.needsEmail) {
          showEmailCapture(userText);
        }
      }
    } catch (err) {
      typing.remove();
      addBubble("assistant", "Ingen forbindelse — prøv igen om lidt, eller WhatsApp +45 28 89 83 73.");
    } finally {
      field.disabled = false;
      sendBtn.disabled = false;
      field.focus();
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const text = field.value.trim();
    if (!text || text.length < 2) return;
    if (text.length > 400) return;
    sendMessage(text);
  });

  // Update input placeholder when language toggles
  const observer = new MutationObserver(function () {
    const lang = currentLang();
    const placeholder = field.dataset["placeholder" + (lang === "es" ? "Es" : "Da")];
    if (placeholder) field.placeholder = placeholder;
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ["data-active-lang"] });

  // Initial welcome + correct placeholder for starting language
  showWelcome();
  const initialLang = currentLang();
  const initPlaceholder = field.dataset["placeholder" + (initialLang === "es" ? "Es" : "Da")];
  if (initPlaceholder) field.placeholder = initPlaceholder;
})();

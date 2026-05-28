// Dubbu chatbot admin dashboard logic.
// Password gate + list view + detail view.
// CSP-safe: pure DOM API, no eval/innerHTML with templates.

(function () {
  "use strict";

  const KEY_STORE = "dubbu_admin_key";

  const gate = document.getElementById("gate");
  const gateForm = document.getElementById("gate-form");
  const gateInput = document.getElementById("gate-input");
  const gateError = document.getElementById("gate-error");

  const dash = document.getElementById("dashboard");
  const logoutBtn = document.getElementById("logout-btn");

  const elTotal = document.getElementById("stat-total");
  const elMessages = document.getElementById("stat-messages");
  const elEscalated = document.getElementById("stat-escalated");
  const elAvg = document.getElementById("stat-avg");
  const elList = document.getElementById("convo-list");
  const elEmpty = document.getElementById("empty-state");

  const detail = document.getElementById("convo-detail");
  const detailMeta = document.getElementById("detail-meta");
  const detailTitle = document.getElementById("detail-title");
  const detailMessages = document.getElementById("detail-messages");
  const detailClose = document.getElementById("detail-close");

  function showGate() {
    gate.hidden = false;
    dash.hidden = true;
    gateInput.value = "";
    gateInput.focus();
    gateError.hidden = true;
  }
  function showDash() {
    gate.hidden = true;
    dash.hidden = false;
  }

  async function fetchDashboard(key) {
    const r = await fetch("/api/dashboard", {
      headers: { "x-dubbu-admin-key": key }
    });
    if (r.status === 401) return { unauthorized: true };
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return { error: err.error || r.status };
    }
    return await r.json();
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    const day = d.toLocaleDateString("da-DK", { day: "2-digit", month: "2-digit" });
    const time = d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
    return `${day} ${time}`;
  }

  function fmtDateLong(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("da-DK", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }

  function render(data) {
    if (!data.configured) {
      elTotal.textContent = "0";
      elMessages.textContent = "0";
      elEscalated.textContent = "0";
      elAvg.textContent = "0";
      elEmpty.hidden = false;
      elEmpty.textContent = data.message || "Blob storage ikke konfigureret.";
      elList.innerHTML = "";
      return;
    }

    elTotal.textContent = data.stats.total;
    elMessages.textContent = data.stats.messages;
    elEscalated.textContent = data.stats.escalated;
    elAvg.textContent = data.stats.avgPerConv;

    elList.innerHTML = "";
    if (!data.conversations.length) {
      elEmpty.hidden = false;
      return;
    }
    elEmpty.hidden = true;

    data.conversations.forEach((c) => {
      const row = document.createElement("div");
      row.className = "admin-row";
      row.setAttribute("role", "button");
      row.tabIndex = 0;

      const time = document.createElement("span");
      time.className = "admin-row__time";
      time.textContent = fmtDate(c.updatedAt || c.createdAt);
      row.appendChild(time);

      const lang = document.createElement("span");
      lang.className = "admin-row__lang";
      lang.textContent = c.lang || "—";
      row.appendChild(lang);

      const count = document.createElement("span");
      count.className = "admin-row__count";
      count.textContent = c.messageCount + " msg";
      row.appendChild(count);

      const status = document.createElement("span");
      status.className = "admin-row__status " + (c.escalated ? "admin-row__status--esc" : "admin-row__status--ok");
      status.textContent = c.escalated
        ? (c.email ? "✉ " + c.email : "✉ escaleret")
        : "✓ ok";
      row.appendChild(status);

      const preview = document.createElement("span");
      preview.className = "admin-row__preview";
      preview.textContent = c.firstUserMessage || "(intet)";
      row.appendChild(preview);

      const open = () => loadDetail(c.sessionId);
      row.addEventListener("click", open);
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
      elList.appendChild(row);
    });
  }

  async function loadDetail(sessionId) {
    const key = sessionStorage.getItem(KEY_STORE);
    if (!key) return showGate();
    const r = await fetch("/api/dashboard?id=" + encodeURIComponent(sessionId), {
      headers: { "x-dubbu-admin-key": key }
    });
    if (!r.ok) {
      alert("Kunne ikke hente samtalen.");
      return;
    }
    const data = await r.json();
    renderDetail(data);
  }

  function renderDetail(c) {
    detailTitle.textContent = "Samtale · " + c.sessionId;
    const parts = [
      "Startet " + fmtDateLong(c.createdAt),
      "Sprog: " + (c.lang || "—"),
      (c.messages && c.messages.length) + " beskeder"
    ];
    if (c.escalated) parts.push("Eskaleret" + (c.email ? " → " + c.email : ""));
    detailMeta.textContent = parts.join(" · ");

    detailMessages.innerHTML = "";
    (c.messages || []).forEach((m) => {
      const wrap = document.createElement("div");
      wrap.className = "dm dm--" + (m.role === "user" ? "user" : "assistant");
      const text = document.createElement("div");
      text.textContent = m.content;
      wrap.appendChild(text);
      if (m.ts) {
        const ts = document.createElement("div");
        ts.className = "dm__time";
        ts.textContent = fmtDateLong(m.ts);
        wrap.appendChild(ts);
      }
      detailMessages.appendChild(wrap);
    });

    detail.hidden = false;
  }

  detailClose.addEventListener("click", () => { detail.hidden = true; });

  // ---- Auth flow ----
  gateForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const key = gateInput.value.trim();
    if (!key) return;
    const btn = gateForm.querySelector("button");
    btn.disabled = true;
    const res = await fetchDashboard(key);
    btn.disabled = false;
    if (res.unauthorized) {
      gateError.hidden = false;
      gateInput.select();
      return;
    }
    if (res.error) {
      gateError.hidden = false;
      gateError.textContent = "Fejl: " + res.error;
      return;
    }
    sessionStorage.setItem(KEY_STORE, key);
    showDash();
    render(res);
  });

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(KEY_STORE);
    showGate();
  });

  // Auto-login if key saved
  const savedKey = sessionStorage.getItem(KEY_STORE);
  if (savedKey) {
    fetchDashboard(savedKey).then((res) => {
      if (res.unauthorized) {
        sessionStorage.removeItem(KEY_STORE);
        showGate();
        return;
      }
      if (res.error) {
        gateError.hidden = false;
        gateError.textContent = "Fejl: " + res.error;
        showGate();
        return;
      }
      showDash();
      render(res);
    });
  } else {
    showGate();
  }
})();

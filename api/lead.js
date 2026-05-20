/* ==========================================================
   Di Barret — POST /api/lead
   Vercel Function (Node.js runtime). Zero npm dependencies.
   Sends two emails via Resend REST API:
     1. Notification → kontakte@dibarret.dk
     2. Auto-reply  → lead's email (Reply-To: kontakte@)
   ========================================================== */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

// Required env vars (set in Vercel project settings):
//   RESEND_API_KEY        Resend API key
//   LEAD_FROM             Verified sender, e.g. "Di Barret <kontakte@dibarret.dk>"
//   LEAD_NOTIFY_TO        Where notifications are delivered, e.g. "kontakte@dibarret.dk"
//   LEAD_REPLY_TO         Optional. Reply-To on the notification, e.g. "kontakte@dibarret.dk"

const MAX_FIELD = 2000;
const MAX_NAME = 120;
const MAX_EMAIL = 254;

// Per-instance in-memory rate limiter. Fluid Compute reuses instances,
// so this catches casual abuse without external state. For stronger guarantees
// switch to Vercel Runtime Cache or Upstash Redis later.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;
const hits = new Map();

function clientIp(req) {
  // x-real-ip is set by the Vercel edge from the trusted source IP and
  // cannot be spoofed by the client. x-forwarded-for IS client-controllable
  // and must not be used as a rate-limit key on its own.
  const real = req.headers["x-real-ip"];
  if (typeof real === "string" && real.length) return real.trim();
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) {
    // If we fall back to XFF, use the rightmost entry (closest to Vercel edge).
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return req.socket?.remoteAddress || "unknown";
}

function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (!v.length || now - v[v.length - 1] > RATE_WINDOW_MS) hits.delete(k);
    }
  }
  return arr.length > RATE_MAX;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === "object") return resolve(req.body);
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 32_000) {
        req.destroy();
        reject(new Error("payload too large"));
      }
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("invalid json"));
      }
    });
    req.on("error", reject);
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v, max) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
// Strip CRLF/tabs from values that flow into headers (Subject, etc.) so a
// crafted name can't break header rendering in receiving clients.
const singleLine = (s) => String(s).replace(/[\r\n\t]+/g, " ").trim();
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

function buildEmails(payload) {
  const name = clean(payload.name, MAX_NAME);
  const email = clean(payload.email, MAX_EMAIL);
  const site = clean(payload.site, MAX_FIELD);
  const improve = clean(payload.improve, MAX_FIELD);
  const budget = clean(payload.budget, 120);
  const when = clean(payload.when, 120);

  const rows = [
    ["Navn", name],
    ["Email", email],
    ["Website / Instagram", site || "—"],
    ["Hvad vil de forbedre", improve || "—"],
    ["Budget", budget || "—"],
    ["Hvornår", when || "—"],
  ];

  const text =
    "Ny henvendelse fra dibarret.dk\n\n" +
    rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  const html = `<!doctype html><html><body style="font:14px/1.55 -apple-system,BlinkMacSystemFont,Segoe UI,Inter,sans-serif;color:#0a0a0a;max-width:560px;margin:0 auto;padding:24px">
    <p style="margin:0 0 4px;font:12px/1 'Geist Mono',ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;color:#737373">Di Barret · Lead</p>
    <h2 style="margin:0 0 20px;font-weight:500;letter-spacing:-.02em">Ny gratis vurdering</h2>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #e5e5e5">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:10px 0;width:38%;color:#737373;border-bottom:1px solid #f0f0f0;vertical-align:top">${esc(
              k
            )}</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;white-space:pre-wrap">${esc(
              v
            )}</td></tr>`
        )
        .join("")}
    </table>
    <p style="margin:24px 0 0;font-size:12px;color:#a3a3a3">Sendt via /api/lead — dibarret.dk</p>
  </body></html>`;

  const autoReplyText = `Hej ${name.split(" ")[0] || "der"},

Tak for din henvendelse. Vi har modtaget din forespørgsel og vender tilbage med dine 3 konkrete idéer inden for 2 hverdage.

Ingen spam. Ingen hårdt salg.

— Di Barret
København`;

  const autoReplyHtml = `<!doctype html><html><body style="font:15px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Inter,sans-serif;color:#0a0a0a;max-width:560px;margin:0 auto;padding:32px">
    <p style="margin:0 0 20px">Hej ${esc(name.split(" ")[0] || "der")},</p>
    <p style="margin:0 0 16px">Tak for din henvendelse. Vi har modtaget din forespørgsel og vender tilbage med dine 3 konkrete idéer inden for <strong>2 hverdage</strong>.</p>
    <p style="margin:0 0 24px;color:#525252">Ingen spam. Ingen hårdt salg.</p>
    <p style="margin:0;color:#0a0a0a">— Di Barret<br><span style="color:#a3a3a3">København</span></p>
  </body></html>`;

  return { rows, name, email, html, text, autoReplyHtml, autoReplyText };
}

async function sendResend(apiKey, payload) {
  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`resend ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, error: "rate_limited" });
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    return res.status(400).json({ ok: false, error: "invalid_payload" });
  }

  // Honeypot + time-trap. Return 204 (no body) instead of the success-shaped
  // 200 JSON so bots can't easily distinguish a trap response from a real
  // submission and tune around it.
  const isHoneypotted =
    (typeof body.company === "string" && body.company.trim() !== "") ||
    (typeof body.t === "number" && Date.now() - body.t < 1500);
  if (isHoneypotted) {
    return res.status(204).end();
  }

  const name = clean(body.name, MAX_NAME);
  const email = clean(body.email, MAX_EMAIL);
  if (!name || name.length < 2) {
    return res.status(400).json({ ok: false, error: "name_required" });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: "email_invalid" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_FROM;
  const notifyTo = process.env.LEAD_NOTIFY_TO;
  const replyTo = process.env.LEAD_REPLY_TO || notifyTo;

  if (!apiKey || !from || !notifyTo) {
    console.error("lead: missing env vars", {
      hasKey: !!apiKey,
      hasFrom: !!from,
      hasNotify: !!notifyTo,
    });
    return res.status(500).json({ ok: false, error: "server_misconfigured" });
  }

  const built = buildEmails(body);
  const subjectName = singleLine(built.name).slice(0, MAX_NAME);

  try {
    await sendResend(apiKey, {
      from,
      to: [notifyTo],
      reply_to: email,
      subject: `Ny lead · ${subjectName}`,
      html: built.html,
      text: built.text,
    });

    // Auto-reply is best-effort AND gated: skip when the submission looks
    // like spam-via-our-form (no real "improve" content + no site). This
    // limits the auto-reply as an abuse vector for sending mail to arbitrary
    // third parties under our verified domain reputation.
    const hasIntent =
      clean(body.improve, MAX_FIELD).length >= 12 ||
      clean(body.site, MAX_FIELD).length >= 3;
    if (hasIntent) {
      sendResend(apiKey, {
        from,
        to: [email],
        reply_to: replyTo,
        subject: "Tak for din henvendelse — Di Barret",
        html: built.autoReplyHtml,
        text: built.autoReplyText,
      }).catch((err) => console.error("lead: auto-reply failed", err));
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("lead: send failed", err);
    return res.status(502).json({ ok: false, error: "send_failed" });
  }
};

// /api/chat.js · redeploy 2026-05-29 (forces fresh fn build)
//
// Routes:
//   POST /api/chat
//     body: { messages: [{role, content}], sessionId? }
//     → { reply, needsEmail }
//
//   POST /api/chat with body.action === "submit_email"
//     body: { action: "submit_email", email, conversation: [{role,content}], question }
//     → { ok: true }
//
// Rate limits:
//   - 15 messages per IP per 5 min (rolling)
//   - 30 messages per IP per day
//   - Min 800ms between messages from same session
//
// Required env:
//   ANTHROPIC_API_KEY · for Claude calls
//   RESEND_API_KEY · for email fallback (already set up for /api/lead)
//   LEAD_FROM · verified sender (already set)
//   LEAD_NOTIFY_TO · where to send fallback emails (already set)

// ---------- Config ----------
const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 300;
const MAX_HISTORY = 12; // last 12 messages (6 turns) sent for context

// ---------- Blob persistence (best-effort, never breaks chat) ----------
let blobMod = null;
async function getBlob() {
  if (blobMod) return blobMod;
  try {
    blobMod = require("@vercel/blob");
    return blobMod;
  } catch {
    blobMod = false;
    return false;
  }
}

async function fetchConvoFromBlob(sessionId) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const blob = await getBlob();
  if (!blob) return null;
  try {
    const { blobs } = await blob.list({
      prefix: `conversations/${sessionId}.json`,
      limit: 1
    });
    if (!blobs || !blobs.length) return null;
    const r = await fetch(blobs[0].url);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function writeConvoToBlob(sessionId, data) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn("[chat-persist] skipped · BLOB_READ_WRITE_TOKEN not set");
    return;
  }
  const blob = await getBlob();
  if (!blob) {
    console.warn("[chat-persist] skipped · @vercel/blob require failed");
    return;
  }
  try {
    const out = await blob.put(
      `conversations/${sessionId}.json`,
      JSON.stringify(data),
      {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json"
      }
    );
    console.log("[chat-persist] OK · pathname=" + (out && out.pathname));
  } catch (err) {
    console.error("[chat-persist] blob write failed:", err && err.message || err);
  }
}

async function persistTurn(sessionId, lang, userText, botText, needsEmail) {
  if (!sessionId) return;
  let convo = await fetchConvoFromBlob(sessionId);
  const now = new Date().toISOString();
  if (!convo) {
    convo = {
      sessionId,
      createdAt: now,
      lang: lang || "da",
      messages: [],
      escalated: false,
      email: null
    };
  }
  convo.messages.push({ role: "user", content: userText, ts: now });
  if (botText) convo.messages.push({ role: "assistant", content: botText, ts: now });
  convo.updatedAt = now;
  if (needsEmail) convo.escalated = true;
  if (lang && !convo.lang) convo.lang = lang;
  await writeConvoToBlob(sessionId, convo);
}

async function markEscalationEmail(sessionId, email) {
  if (!sessionId) return;
  let convo = await fetchConvoFromBlob(sessionId);
  if (!convo) return;
  convo.email = email;
  convo.escalatedAt = new Date().toISOString();
  convo.escalated = true;
  await writeConvoToBlob(sessionId, convo);
}

// ---------- In-memory rate limit ----------
const ipBuckets = new Map();      // ip → { times: [unix] }
const sessionLast = new Map();    // sessionId → last unix
const RL_WINDOW_MIN = 5 * 60 * 1000;
const RL_WINDOW_DAY = 24 * 60 * 60 * 1000;
const MAX_PER_5MIN = 15;
const MAX_PER_DAY = 30;
const MIN_SESSION_GAP = 800;

function getClientIp(req) {
  const xri = req.headers["x-real-ip"];
  const xff = req.headers["x-forwarded-for"];
  if (typeof xri === "string" && xri) return xri;
  if (typeof xff === "string" && xff) return xff.split(",")[0].trim();
  return "unknown";
}

// Defensive body reader — handles all Vercel runtime variations.
// Same pattern as /api/lead.js. Returns parsed JSON object or {}.
function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === "object") return resolve(req.body);
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 64_000) {
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

function checkRate(ip, sessionId) {
  const now = Date.now();
  const bucket = ipBuckets.get(ip) || { times: [] };
  // prune entries older than 1 day
  bucket.times = bucket.times.filter(t => now - t < RL_WINDOW_DAY);
  const last5min = bucket.times.filter(t => now - t < RL_WINDOW_MIN);
  if (last5min.length >= MAX_PER_5MIN) return { ok: false, reason: "5min" };
  if (bucket.times.length >= MAX_PER_DAY) return { ok: false, reason: "day" };
  if (sessionId) {
    const lastTs = sessionLast.get(sessionId) || 0;
    if (now - lastTs < MIN_SESSION_GAP) return { ok: false, reason: "fast" };
    sessionLast.set(sessionId, now);
  }
  bucket.times.push(now);
  ipBuckets.set(ip, bucket);
  return { ok: true };
}

// ---------- System prompt with 5 plausible Dubbu SKUs ----------
const SYSTEM_PROMPT = `Du er Dubbu's AI-assistent på dubbu.dk — Københavns første K-beauty butik. Du hjælper kunder med spørgsmål om disse 5 produkter:

1. **Beauty of Joseon Glow Serum** (30ml, 189 DKK)
   - Ingredienser: propolis extract 60%, niacinamid 2%, alpha-arbutin
   - Til: dehydreret hud, glansløs hud, alle hudtyper (undtagen aktiv akne)
   - Brug: morgen, efter toner, før SPF
   - Kompatibel med: de fleste aktive stoffer (undgå starke AHA samtidigt)

2. **Beauty of Joseon Relief Sun SPF50+ PA++++** (50ml, 149 DKK)
   - Ingredienser: ris-ekstrakt, probiotika, vitamin E
   - Til: alle hudtyper, sensitiv hud, daglig brug
   - Brug: sidste skridt om morgenen, gentag hver 2. time i sol
   - Kompatibel med: alt — ingen restriktioner

3. **COSRX Advanced Snail 96 Mucin Power Essence** (100ml, 219 DKK)
   - Ingredienser: 96% snegle-secretion filtrat, betain, allantoin
   - Til: skadet, irriteret, tør hud, healing efter aktiv akne
   - Brug: efter toner, 1-2 gange dagligt
   - Kompatibel med: de fleste — undgå med retinol i samme rutine-trin

4. **Anua Heartleaf 77% Soothing Toner** (250ml, 199 DKK)
   - Ingredienser: heartleaf-ekstrakt 77%, panthenol, allantoin
   - Til: irriteret, akne-tendens, sensitiv hud, rødme
   - Brug: efter rens, vatrund eller hand-pat, morgen og aften
   - Kompatibel med: alle rutiner — meget mild

5. **Some by Mi AHA-BHA-PHA 30 Days Miracle Toner** (150ml, 229 DKK)
   - Ingredienser: AHA (mælkesyre), BHA (salicylsyre), PHA, tea tree oil
   - Til: fedtet hud, akne-tendens, tilstoppede porer
   - Brug: 2-3 gange/uge KUN om aftenen, undgå solbrændt hud
   - IKKE kompatibel med: retinol eller vitamin C samme aften

**REGLER:**
1. Svar PÅ DET SPROG brugeren skriver. Hvis dansk → dansk. Spansk → spansk. Engelsk → engelsk.
2. MAX 3 SÆTNINGER per svar. Vær direkte og praktisk.
3. Hvis du ikke ved noget (lager, fragt, returnering, andre produkter end de 5, butiksåbningstider, priser ikke nævnt ovenfor, kampagner, eller noget specifikt for kunden) → svar venligt at du ikke ved det, og bed om email. Skriv altid markøren [REQUEST_EMAIL] til sidst i sådan et svar.
4. Eksempel out-of-scope svar (DA): "Det er jeg desværre ikke sikker på — vil du efterlade din email her, så vender vi tilbage samme dag med svaret? [REQUEST_EMAIL]"
5. Eksempel out-of-scope (ES): "No estoy seguro de eso — ¿quieres dejarme tu email y te respondo el mismo día? [REQUEST_EMAIL]"
6. Eksempel out-of-scope (EN): "I'm not sure about that — would you leave your email so we can get back to you the same day? [REQUEST_EMAIL]"
7. Find aldrig på produkt-detaljer, priser eller lager-status. Hvis ikke i listen → [REQUEST_EMAIL].
8. Hvis spurgt om andre Dubbu-produkter end de 5: "Jeg er trænet på disse 5 produkter i denne demo. Vil du have info om noget andet, så efterlad email. [REQUEST_EMAIL]"
9. Vær venlig, faglig, K-beauty-kyndig. Ingen overdrevne salgs-fraser.`;

// ---------- Email helpers (re-use Resend) ----------
function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function sendFallbackEmail({ email, question, conversation }) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const LEAD_FROM = process.env.LEAD_FROM || "Di Barret <kontakte@dibarret.dk>";
  const LEAD_NOTIFY_TO = process.env.LEAD_NOTIFY_TO || "orestes@dibarret.dk";
  if (!RESEND_API_KEY) return { ok: false, reason: "no_resend_key" };

  const convoHtml = (conversation || [])
    .map(m => `<p style="margin:6px 0;"><strong>${m.role === "user" ? "Bruger" : "Bot"}:</strong> ${escapeHtml(m.content)}</p>`)
    .join("");

  const html = `
    <h2>Chatbot demo · email-fallback</h2>
    <p><strong>Fra:</strong> ${escapeHtml(email)}</p>
    <p><strong>Spørgsmål:</strong> ${escapeHtml(question || "(ikke specificeret)")}</p>
    <hr>
    <h3>Samtale:</h3>
    ${convoHtml}
    <hr>
    <p style="color:#888;font-size:12px;">/clients/dubbu · ${new Date().toISOString()}</p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: LEAD_FROM,
      to: [LEAD_NOTIFY_TO],
      reply_to: email,
      subject: `Dubbu demo · spørgsmål fra ${email}`,
      html
    })
  });
  if (!res.ok) return { ok: false, reason: "resend_err", status: res.status };
  return { ok: true };
}

// ---------- Main handler ----------
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const ip = getClientIp(req);
  let body;
  try {
    body = await readBody(req);
  } catch (err) {
    return res.status(400).json({ error: "bad_body", message: String(err && err.message || err) });
  }
  if (!body || typeof body !== "object") body = {};
  const sessionId = (body.sessionId || "").slice(0, 64);

  // ---------- Branch: submit email fallback ----------
  if (body.action === "submit_email") {
    const email = String(body.email || "").trim();
    const question = String(body.question || "").slice(0, 500);
    const conversation = Array.isArray(body.conversation) ? body.conversation.slice(-10) : [];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "invalid_email" });
    }
    // light rate check on email submits too
    const rl = checkRate(ip, sessionId);
    if (!rl.ok) return res.status(429).json({ error: "rate_limit", reason: rl.reason });

    const out = await sendFallbackEmail({ email, question, conversation });
    if (!out.ok) {
      // We still tell the user "ok" so they don't feel stuck; we log silently.
      console.error("[chat] email submit failed:", out);
    }
    // Mark conversation as escalated + record the email (best-effort)
    await markEscalationEmail(sessionId, email);
    return res.status(200).json({ ok: true });
  }

  // ---------- Branch: chat ----------
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length) return res.status(400).json({ error: "no_messages" });

  // Basic sanitation
  const cleaned = messages
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }))
    .slice(-MAX_HISTORY);

  if (!cleaned.length || cleaned[cleaned.length - 1].role !== "user") {
    return res.status(400).json({ error: "last_must_be_user" });
  }

  const rl = checkRate(ip, sessionId);
  if (!rl.ok) {
    const msg = rl.reason === "fast"
      ? "Slow down — vent et øjeblik."
      : "Mange demo-samtaler lige nu — prøv om lidt eller skriv direkte på WhatsApp.";
    return res.status(429).json({ error: "rate_limit", reason: rl.reason, message: msg });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: "not_configured",
      reply: "Demoen er ikke aktiv lige nu — skriv direkte på WhatsApp +45 28 89 83 73, så svarer jeg personligt.",
      needsEmail: false
    });
  }

  try {
    const anth = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: cleaned
      })
    });

    if (!anth.ok) {
      const errBody = await anth.text();
      console.error("[chat] anthropic error", anth.status, errBody);
      return res.status(502).json({
        error: "upstream",
        reply: "Demoen er kortvarigt utilgængelig — skriv direkte på WhatsApp +45 28 89 83 73."
      });
    }

    const data = await anth.json();
    const replyText = (data.content || [])
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("\n")
      .trim();

    const needsEmail = /\[REQUEST_EMAIL\]/.test(replyText);
    const cleanReply = replyText.replace(/\[REQUEST_EMAIL\]/g, "").trim();

    // Persist BEFORE responding · Vercel kills the function as soon as
    // the response is sent, so fire-and-forget loses writes.
    // Cost: +200-500ms latency. Worth it for reliable logging.
    const lastUser = cleaned[cleaned.length - 1].content;
    const lang = body.lang || "da";
    try {
      await persistTurn(sessionId, lang, lastUser, cleanReply, needsEmail);
    } catch (err) {
      console.error("[chat] persist threw:", err && err.message || err);
    }

    return res.status(200).json({
      reply: cleanReply || "Hmm, lad mig tjekke det — vil du efterlade din email, så vender vi tilbage?",
      needsEmail
    });
  } catch (err) {
    console.error("[chat] exception", err);
    return res.status(500).json({
      error: "internal",
      reply: "Noget gik galt — skriv direkte på WhatsApp."
    });
  }
};

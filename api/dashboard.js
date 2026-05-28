// /api/dashboard.js — Dubbu chatbot admin
//
// GET /api/dashboard       → list all conversations + stats (auth required)
// GET /api/dashboard?id=X  → fetch full conversation X (auth required)
//
// Auth: header `x-dubbu-admin-key` OR query `?key=...` must match
//       process.env.DUBBU_ADMIN_PASSWORD.
//
// Required env:
//   DUBBU_ADMIN_PASSWORD    shared secret
//   BLOB_READ_WRITE_TOKEN   for reading conversations

let blobMod = null;
async function getBlob() {
  if (blobMod !== null) return blobMod;
  try {
    blobMod = require("@vercel/blob");
    return blobMod;
  } catch {
    blobMod = false;
    return false;
  }
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

  // ---- Auth ----
  const adminKey = process.env.DUBBU_ADMIN_PASSWORD;
  const provided =
    req.headers["x-dubbu-admin-key"] ||
    (req.query && req.query.key) ||
    "";
  if (!adminKey) {
    return res.status(503).json({
      error: "not_configured",
      message: "DUBBU_ADMIN_PASSWORD not set in environment."
    });
  }
  if (provided !== adminKey) {
    return res.status(401).json({ error: "unauthorized" });
  }

  // ---- Blob check ----
  // ---- Debug mode: ?debug=1 returns diagnostic state ----
  if (req.query && req.query.debug === "1") {
    const blob = await getBlob();
    const diag = {
      env: {
        BLOB_READ_WRITE_TOKEN_set: !!process.env.BLOB_READ_WRITE_TOKEN,
        BLOB_READ_WRITE_TOKEN_prefix: (process.env.BLOB_READ_WRITE_TOKEN || "").slice(0, 25) + "...",
        DUBBU_ADMIN_PASSWORD_set: !!process.env.DUBBU_ADMIN_PASSWORD,
        ANTHROPIC_API_KEY_set: !!process.env.ANTHROPIC_API_KEY,
      },
      sdk: {
        loaded: !!blob,
        type: blob ? typeof blob.list : "n/a",
        version: (() => { try { return require("@vercel/blob/package.json").version; } catch { return "unknown"; } })()
      }
    };
    if (blob) {
      try {
        const all = await blob.list({ limit: 20 });
        diag.allBlobs = (all.blobs || []).map(b => ({ pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt }));
      } catch (err) {
        diag.allBlobsError = String(err && err.message || err);
      }
      try {
        const filtered = await blob.list({ prefix: "conversations/", limit: 20 });
        diag.conversationsList = (filtered.blobs || []).map(b => b.pathname);
      } catch (err) {
        diag.conversationsListError = String(err && err.message || err);
      }

      // Try a real write with the SAME options chat.js uses
      try {
        const out = await blob.put(
          "diag/test-" + Date.now() + ".json",
          JSON.stringify({ test: true, ts: new Date().toISOString() }),
          {
            access: "public",
            addRandomSuffix: false,
            allowOverwrite: true,
            contentType: "application/json"
          }
        );
        diag.writeTest = { ok: true, pathname: out.pathname, url: out.url };
      } catch (err) {
        diag.writeTest = { ok: false, error: String(err && err.message || err), stack: (err && err.stack || "").slice(0, 400) };
      }
    }
    return res.status(200).json(diag);
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(200).json({
      configured: false,
      message: "Blob storage ikke konfigureret endnu — ingen samtaler at vise.",
      stats: { total: 0, messages: 0, escalated: 0, avgPerConv: 0 },
      conversations: []
    });
  }
  const blob = await getBlob();
  if (!blob) {
    return res.status(503).json({ error: "blob_module_unavailable" });
  }

  // ---- Branch: single conversation ----
  const id = req.query && req.query.id;
  if (id) {
    try {
      const { blobs } = await blob.list({
        prefix: `conversations/${id}.json`,
        limit: 1
      });
      if (!blobs || !blobs.length) {
        return res.status(404).json({ error: "not_found" });
      }
      const r = await fetch(blobs[0].url);
      if (!r.ok) return res.status(404).json({ error: "blob_fetch_failed" });
      const data = await r.json();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: "internal", message: String(err && err.message || err) });
    }
  }

  // ---- Branch: list all ----
  try {
    const { blobs } = await blob.list({ prefix: "conversations/", limit: 500 });
    const fetched = await Promise.all(
      (blobs || []).map(async (b) => {
        try {
          const r = await fetch(b.url);
          if (!r.ok) return null;
          return await r.json();
        } catch {
          return null;
        }
      })
    );
    const conversations = fetched.filter(Boolean);
    conversations.sort((a, b) => {
      const ta = new Date(b.updatedAt || b.createdAt || 0).getTime();
      const tb = new Date(a.updatedAt || a.createdAt || 0).getTime();
      return ta - tb;
    });

    const totalMessages = conversations.reduce(
      (sum, c) => sum + ((c.messages && c.messages.length) || 0),
      0
    );
    const escalatedCount = conversations.filter((c) => c.escalated).length;

    // Summarize each (don't ship full messages on list)
    const summaries = conversations.map((c) => ({
      sessionId: c.sessionId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      lang: c.lang || "da",
      messageCount: (c.messages && c.messages.length) || 0,
      escalated: !!c.escalated,
      email: c.email || null,
      firstUserMessage:
        (c.messages && c.messages.find((m) => m.role === "user")?.content) || ""
    }));

    return res.status(200).json({
      configured: true,
      stats: {
        total: conversations.length,
        messages: totalMessages,
        escalated: escalatedCount,
        avgPerConv: conversations.length
          ? Math.round((totalMessages / conversations.length) * 10) / 10
          : 0
      },
      conversations: summaries
    });
  } catch (err) {
    return res.status(500).json({ error: "internal", message: String(err && err.message || err) });
  }
};

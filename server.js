/* ============================================================
   FKA ATELIER — Local Proxy Server
   - Keeps GROQ_API_KEY out of browser code
   - Serves the entire site as static files
   - Exposes POST /api/chat → Groq API

   Setup:
     1.  npm install
     2.  Add your key to .env  (GROQ_API_KEY=gsk_...)
     3.  node server.js
     4.  Open http://localhost:3000
   ============================================================ */

require("dotenv").config();
const express = require("express");
const path    = require("path");
const cors    = require("cors");

const app  = express();
const PORT = process.env.PORT || 3000;

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL   = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

/* ── Middleware ────────────────────────────────────── */
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "1mb" }));

/* ── Serve all static site files from project root ── */
app.use(express.static(path.join(__dirname)));

/* ── Health check ──────────────────────────────────── */
app.get("/api/health", (_req, res) => {
  res.json({
    ok:     true,
    model:  GROQ_MODEL,
    keySet: !!process.env.GROQ_API_KEY
  });
});

/* ── Chat endpoint ─────────────────────────────────── */
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({
      error: "GROQ_API_KEY is not configured. Add it to your .env file and restart the server."
    });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required." });
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        messages,
        max_tokens:  500,
        temperature: 0.7,
        stream:      false
      })
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ error: { message: response.statusText } }));
      console.error("[Groq error]", response.status, errBody);
      return res.status(response.status).json({
        error: errBody?.error?.message || `Groq API error ${response.status}`
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error("[Server error]", err.message);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

/* ── Catch-all → serve index.html (SPA fallback) ──── */
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* ── Start ─────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log(`║  FKA Atelier  →  http://localhost:${PORT}    ║`);
  console.log("╚══════════════════════════════════════════╝");
  console.log(`  Model : ${GROQ_MODEL}`);
  console.log(`  Key   : ${process.env.GROQ_API_KEY ? "✓ configured" : "✗ MISSING — add to .env"}`);
  console.log("");
});

/* ============================================================
   FKA ATELIER — Ask FKA AI Chat Engine
   Direct Groq API integration (browser-side)

   To activate:
     1. Get a free key at https://console.groq.com
     2. Replace "YOUR_GROQ_API_KEY_HERE" below with your key
   ============================================================ */

"use strict";

/* ── Configuration ───────────────────────────────────── */
const FKA_AI_CONFIG = {
  // API key is kept in .env on the server — NOT here.
  // The browser calls /api/chat on the local proxy (server.js)
  // which forwards to Groq with the key server-side.
  apiUrl:      "/api/chat",   // local proxy endpoint — change to full URL if deployed
  maxHistory:  12             // keep last 12 messages in context window
};

/* ── Brand knowledge base — injected as system prompt ─── */
const FKA_SYSTEM_PROMPT = `You are Ask FKA, the AI fashion concierge for FKA Atelier — a premium Nigerian modest-fashion brand.

BRAND OVERVIEW:
- FKA Atelier creates elegant, feminine, sophisticated and timeless clothing for women who value modesty, comfort, quality and individuality.
- Tagline: "Timeless. Modest. Elegant."
- Based in Ogun State, Nigeria. Ships nationwide across Nigeria.
- Contact: WhatsApp +2347019243312 | Email: omotolaazeemah7@gmail.com

PRODUCT CATALOGUE:
Abayas:
  - Noir Flow Abaya — ₦65,000 | Flowing full-length abaya in deep noir crepe with subtle side slits. Sizes XS–XXL. Colours: Noir, Midnight Navy, Deep Forest.
  - Pearl Drape Abaya — ₦72,000 | Pearl-toned open-front satin-touch chiffon. Sizes XS–XXL. Colours: Pearl, Blush, Stone.

Dresses:
  - Linen Grace Dress — ₦58,000 | Lightweight natural linen. Effortlessly modest. Sizes XS–XXL. Colours: Sand, Ivory, Sage.
  - Sage Pleat Dress — ₦57,000 | Delicate waist pleating. Woven polyester with cotton lining. Sizes XS–XXL.
  - Velvet Evening Dress — ₦84,000 | Rich velvet column silhouette, high neck, long sleeves. Sizes XS–XXL.
  - Ivory Maxi Dress — ₦62,000 | Flowing ivory cotton blend maxi. Sizes XS–XXL.

Co-ord Sets:
  - Dusk Co-ord Set — ₦62,000 | Wide-leg trousers + longline top in structured crepe. Sizes XS–XXL.
  - Latte Linen Co-ord — ₦68,000 | 100% linen boxy top + wide trousers. Wear together or as separates. Sizes XS–XXL.

Skirts:
  - Fluid Maxi Skirt — ₦38,000 | Viscose crepe, elasticated waist. Sizes XS–XXL. Colours: Ivory, Sand, Black.
  - Pleated Midi Skirt — ₦42,000 | Fine pleated chiffon with satin lining. Sizes XS–XXL.

Tops:
  - Drape Shoulder Top — ₦32,000 | Satin-touch georgette with draped shoulders. Sizes XS–XXL.
  - Longline Linen Top — ₦28,000 | Natural linen, curved hem. Sizes XS–XXL.

Accessories:
  - Silk Head Wrap — ₦18,000 | 100% pure silk, tonal print. One size.
  - Woven Tote Bag — ₦35,000 | Natural straw weave, suede interior, gold hardware. One size.

SIZE GUIDE (measurements in cm):
XS: Bust 81–84, Waist 63–66, Hips 88–91
S:  Bust 85–88, Waist 67–70, Hips 92–95
M:  Bust 89–93, Waist 71–75, Hips 96–100
L:  Bust 94–99, Waist 76–81, Hips 101–106
XL: Bust 100–106, Waist 82–88, Hips 107–113
XXL:Bust 107–114, Waist 89–96, Hips 114–121
Between sizes? Size up or request custom measurements.

CUSTOM MEASUREMENTS:
- FKA Atelier accepts custom measurements on ALL orders.
- How it works: (1) Take measurements (bust, waist, hips, shoulder, sleeve, full length). (2) Place your order. (3) Send measurements to us via WhatsApp or email. (4) We create your piece.
- Custom orders require additional production time. Timeline confirmed after measurements received.

DELIVERY:
- Free delivery on orders over ₦85,00.
- Lagos Island: ₦2,500 | 1–2 business days
- Lagos Mainland: ₦3,000 | 1–2 business days
- Lagos Outskirts (Ajah, Ikorodu, etc): ₦4,000 | 2–3 business days
- Abuja (FCT): ₦5,500 | 3–5 business days
- Port Harcourt: ₦6,000 | 3–5 business days
- Ibadan/South West: ₦5,000–5,500 | 3–6 business days
- South East/South South: ₦6,500 | 4–7 business days
- Northern Nigeria: ₦7,500 | 5–8 business days

RETURNS:
- Standard-size orders: may be returned within the return window if unworn, unwashed, tags attached.
- Custom measurement orders: NOT eligible for return/exchange (made specifically for you) unless there is a production fault.

PAYMENTS:
- Bank transfer (confirmed via WhatsApp or email).
- No online payment gateway yet.

HOW TO ORDER:
1. Browse the shop, add items to bag.
2. Proceed to checkout (account required).
3. We confirm your order and send bank details via WhatsApp/email.
4. Payment confirms your order.

YOUR ROLE:
- Help customers find the right pieces based on their style, occasion, size and budget.
- Guide customers through sizing decisions.
- Explain custom measurements clearly and warmly.
- Provide delivery information.
- Be warm, feminine, elegant and knowledgeable — like a luxury personal stylist.
- Keep responses concise (2–4 sentences unless a detailed question requires more).
- Use ₦ for prices (Nigerian Naira).
- If asked to "talk to a human", provide WhatsApp number +2347019243312 or email omotolaazeemah7@gmail.com.
- Never make up products, prices, or policies not listed above.
- If you are unsure, direct the customer to WhatsApp or email.

IMPORTANT: You are a helpful, warm fashion concierge. You are NOT a general-purpose assistant. Only answer questions relevant to FKA Atelier, fashion, sizing, styling, orders, and delivery.`;

/* ── Conversation state ──────────────────────────────── */
let fkaMessages     = [];   // [{role, content}] — running conversation
let fkaIsStreaming  = false;
let fkaIsReady      = false; // set true once panel is mounted

/* ── DOM references (populated on init) ─────────────── */
let _thread, _input, _sendBtn, _typingEl;

/* ── Public init — called by DOMContentLoaded ────────── */
let _fkaInitDone = false;
function initAskFkaAI() {
  if (_fkaInitDone) return;
  _fkaInitDone = true;

  _thread  = document.getElementById("fka-chat-thread");
  _input   = document.getElementById("ask-fka-input");
  _sendBtn = document.getElementById("ask-fka-send");

  const panel    = document.getElementById("ask-fka-panel");
  const fabBtn   = document.getElementById("ask-fka-fab-btn");
  const closeBtn = document.getElementById("ask-fka-close");
  const navBtns  = document.querySelectorAll(".ask-fka-nav-btn");

  if (!panel) return; // panel not on this page

  fkaIsReady = true;

  /* ── Open / Close helpers ── */
  const openPanel = () => {
    panel.classList.add("open");
    if (fabBtn) fabBtn.setAttribute("aria-expanded", "true");
    setTimeout(() => { if (_input) _input.focus(); }, 150);
  };
  const closePanel = () => {
    panel.classList.remove("open");
    if (fabBtn) fabBtn.setAttribute("aria-expanded", "false");
  };

  /* ── FAB button ── */
  if (fabBtn) {
    fabBtn.addEventListener("click", e => {
      e.stopPropagation();
      panel.classList.contains("open") ? closePanel() : openPanel();
    });
  }

  /* ── Desktop nav Ask FKA button ── */
  navBtns.forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      panel.classList.contains("open") ? closePanel() : openPanel();
    });
  });

  /* ── Close button ── */
  if (closeBtn) closeBtn.addEventListener("click", closePanel);

  /* ── Click outside to close ── */
  document.addEventListener("click", e => {
    if (!panel.classList.contains("open")) return;
    const fab = document.getElementById("ask-fka-fab");
    if (fab && !fab.contains(e.target)) closePanel();
  });

  /* ── ESC to close ── */
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && panel.classList.contains("open")) closePanel();
  });

  /* ── Send button ── */
  if (_sendBtn) _sendBtn.addEventListener("click", fkaSendMessage);

  /* ── Enter key ── */
  if (_input) {
    _input.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); fkaSendMessage(); }
    });
  }

  /* ── Suggestion chips ── */
  document.querySelectorAll(".ask-fka-suggestion-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const text = btn.textContent.trim().replace(/^[\s\S]{1,3}(?=\w)/, "").trim();
      openPanel();
      fkaSendMessageText(text);
      const suggestionsEl = document.querySelector(".ask-fka-suggestions");
      if (suggestionsEl) suggestionsEl.style.display = "none";
    });
  });

  /* ── API availability check ── */
  // Check if the proxy server is running
  fetch("/api/health").then(r => r.json()).then(data => {
    if (!data.keySet) {
      fkaAppendMessage("bot",
        "⚠️ The Groq API key is not configured on the server. " +
        "Open <code>.env</code> and set <code>GROQ_API_KEY=your_key</code>, then restart the server. " +
        "Get a free key at <a href='https://console.groq.com' target='_blank' rel='noopener'>console.groq.com</a>.");
    }
  }).catch(() => {
    // Server not running — show a helpful message
    if (_thread) fkaAppendMessage("bot-error",
      "⚠️ The local server is not running. " +
      "Open a terminal in the project folder and run: <code>npm install</code> then <code>node server.js</code>. " +
      "Then open <a href='http://localhost:3000' target='_blank'>http://localhost:3000</a>. " +
      "<br><br>In the meantime, <a href='https://wa.me/2347019243312' target='_blank'>chat with us on WhatsApp</a>.");
  });
}

/* ── Send a message ─────────────────────────────────── */
function fkaSendMessage() {
  const text = _input ? _input.value.trim() : "";
  if (!text || fkaIsStreaming) return;
  if (_input) _input.value = "";
  fkaSendMessageText(text);
}

async function fkaSendMessageText(text) {
  if (!fkaIsReady || fkaIsStreaming || !text) return;

  // Hide greeting + suggestions after first message
  const greeting     = document.querySelector(".ask-fka-greeting");
  const suggestions  = document.querySelector(".ask-fka-suggestions");
  if (greeting)    greeting.style.display    = "none";
  if (suggestions) suggestions.style.display = "none";

  // Append user message to UI
  fkaAppendMessage("user", escapeHtml(text));

  // Add to conversation history
  fkaMessages.push({ role: "user", content: text });

  // Trim history to prevent token overflow
  if (fkaMessages.length > FKA_AI_CONFIG.maxHistory) {
    fkaMessages = fkaMessages.slice(-FKA_AI_CONFIG.maxHistory);
  }

  // Show typing indicator
  const typingId = fkaShowTyping();
  fkaIsStreaming  = true;
  fkaSetSendState(true);

  try {
    const botText = await fkaCallGroq(fkaMessages);

    fkaHideTyping(typingId);
    fkaIsStreaming = false;
    fkaSetSendState(false);

    // Append bot response
    fkaAppendMessage("bot", formatBotText(botText));

    // Save to history
    fkaMessages.push({ role: "assistant", content: botText });

  } catch (err) {
    fkaHideTyping(typingId);
    fkaIsStreaming = false;
    fkaSetSendState(false);

    let errorMsg;
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      errorMsg = "Can't reach the server. Make sure <code>node server.js</code> is running, then refresh. " +
        "Or <a href='https://wa.me/2347019243312' target='_blank'>chat with us on WhatsApp</a>.";
    } else if (err.message.includes("429")) {
      errorMsg = "Too many requests — please wait a moment and try again.";
    } else if (err.message.includes("key") || err.message.includes("401")) {
      errorMsg = "API key issue on the server. Check your <code>.env</code> file.";
    } else {
      errorMsg = `Something went wrong: ${err.message}. ` +
        `<a href="https://wa.me/2347019243312" target="_blank">Chat with us on WhatsApp</a> instead.`;
    }
    fkaAppendMessage("bot-error", errorMsg);
    console.error("[Ask FKA error]", err);
  }
}

/* ── Proxy API call ─────────────────────────────────── */
async function fkaCallGroq(messages) {
  // Send conversation to the local proxy (/api/chat).
  // The proxy prepends the system prompt and attaches the API key.
  // The system prompt is also sent from here so it works even without a server
  // (the server strips any duplicate system messages).
  const response = await fetch(FKA_AI_CONFIG.apiUrl, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: FKA_SYSTEM_PROMPT },
        ...messages
      ]
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(
      `${response.status} — ${errData?.error?.message || errData?.error || response.statusText}`
    );
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content
    || "I'm not sure how to answer that. Please [chat with us on WhatsApp](https://wa.me/2347019243312).";
}

/* ── UI helpers ─────────────────────────────────────── */

function fkaAppendMessage(role, html) {
  if (!_thread) return;

  const wrap = document.createElement("div");
  wrap.className = `fka-msg fka-msg-${role}`;

  if (role === "user") {
    wrap.innerHTML = `<div class="fka-msg-bubble fka-msg-user-bubble">${html}</div>`;
  } else if (role === "bot-error") {
    wrap.innerHTML = `
      <div class="fka-msg-avatar">F</div>
      <div class="fka-msg-bubble fka-msg-error-bubble">${html}</div>`;
  } else {
    wrap.innerHTML = `
      <div class="fka-msg-avatar">F</div>
      <div class="fka-msg-bubble fka-msg-bot-bubble">${html}</div>`;
  }

  _thread.appendChild(wrap);
  _thread.scrollTop = _thread.scrollHeight;
}

function fkaShowTyping() {
  if (!_thread) return null;
  const id  = "fka-typing-" + Date.now();
  const div = document.createElement("div");
  div.id        = id;
  div.className = "fka-msg fka-msg-bot";
  div.innerHTML = `
    <div class="fka-msg-avatar">F</div>
    <div class="fka-msg-bubble fka-msg-bot-bubble fka-typing-bubble">
      <span class="fka-dot"></span><span class="fka-dot"></span><span class="fka-dot"></span>
    </div>`;
  _thread.appendChild(div);
  _thread.scrollTop = _thread.scrollHeight;
  return id;
}

function fkaHideTyping(id) {
  if (!id) return;
  const el = document.getElementById(id);
  if (el) el.remove();
}

function fkaSetSendState(disabled) {
  if (_sendBtn) {
    _sendBtn.disabled = disabled;
    const icon = _sendBtn.querySelector("i");
    if (icon) {
      icon.className = disabled
        ? "fa-regular fa-spinner fa-spin"
        : "fa-regular fa-paper-plane-top";
    }
  }
  if (_input) _input.disabled = disabled;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatBotText(text) {
  // Convert markdown-lite to HTML for nicer rendering
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")  // escape first
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")                    // **bold**
    .replace(/\*(.+?)\*/g,     "<em>$1</em>")                            // *italic*
    .replace(/`(.+?)`/g,       "<code>$1</code>")                        // `code`
    .replace(/₦([\d,]+)/g,     "<strong>₦$1</strong>")                  // ₦prices bold
    .replace(/\n\n/g,           "</p><p>")                               // double newline → paragraphs
    .replace(/\n/g,             "<br>")                                   // single newline → br
    .replace(/^/, "<p>").replace(/$/, "</p>");                            // wrap in <p>
}

/* ── Auto-init on DOMContentLoaded ─────────────────── */
document.addEventListener("DOMContentLoaded", initAskFkaAI);

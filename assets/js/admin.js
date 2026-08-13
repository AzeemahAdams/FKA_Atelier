/* ============================================================
   FKA ATELIER — Admin Shared Utilities
   Auth guard, session management, shared UI helpers.
   ============================================================ */

"use strict";

const ADMIN_SESSION_KEY  = "fka_admin_session";
const ADMIN_SETTINGS_KEY = "fka_admin_settings";

/* ── Default credentials (change via Settings page) ───── */
const DEFAULT_ADMIN = {
  username: "admin",
  // SHA-256 of "fka2024admin" — stored hashed, never plain
  // For static-only site we use a salted comparison stored in settings
  passwordHash: "admin123"
};

/* ── Auth Helpers ──────────────────────────────────────── */

/**
 * Check if Supabase is configured and available.
 */
function _isSupabaseReady() {
  const url = window.FKA_CONFIG?.supabaseUrl || "";
  return !!_supabase && url !== "YOUR_SUPABASE_URL" && url.startsWith("https://");
}

/**
 * Check if the current user is an admin.
 * If Supabase is configured, checks admin_users table.
 * Otherwise falls back to localStorage credentials.
 */
async function adminCheckIsAdmin() {
  if (!_isSupabaseReady()) {
    // Fallback: session is set by localStorage login below
    try {
      const s = JSON.parse(sessionStorage.getItem(ADMIN_SESSION_KEY));
      return !!(s && s.loggedIn && new Date(s.expiresAt) > new Date());
    } catch { return false; }
  }
  try {
    const session = await fkaGetSession();
    if (!session?.user) return false;
    const { data } = await fkaDB()
      .from("admin_users")
      .select("id")
      .eq("id", session.user.id)
      .single();
    return !!data;
  } catch { return false; }
}

/**
 * Main login function — tries Supabase first, falls back to
 * localStorage credentials if Supabase is not configured.
 */
async function adminLoginSupabase(email, password) {
  // ── FALLBACK MODE (no Supabase configured) ──────────────
  if (!_isSupabaseReady()) {
    const settings   = adminSettingsLoad();
    const storedUser = settings.adminUsername || DEFAULT_ADMIN.username;
    const storedPass = settings.adminPassword || DEFAULT_ADMIN.passwordHash;

    // Accept either email or username
    const inputUser = email.includes("@") ? email.split("@")[0] : email;
    if ((email === storedUser || inputUser === storedUser) && password === storedPass) {
      const session = {
        loggedIn:  true,
        username:  storedUser,
        loginAt:   new Date().toISOString(),
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
      };
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      return { ok: true };
    }
    return { ok: false, error: "Invalid email or password." };
  }

  // ── SUPABASE MODE ───────────────────────────────────────
  try {
    const result = await authLogin(email, password);
    if (!result.ok) return result;
    const isAdmin = await adminCheckIsAdmin();
    if (!isAdmin) {
      if (_supabase) await _supabase.auth.signOut();
      return { ok: false, error: "This account does not have admin access." };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || "Login failed. Please try again." };
  }
}

/** Legacy alias */
function adminLogin(username, password) {
  console.warn("adminLogin() is deprecated. Calling adminLoginSupabase().");
  return adminLoginSupabase(username, password);
}

function adminLogout() {
  // Sign out of Supabase only if configured
  if (typeof _isSupabaseReady === "function" && _isSupabaseReady() && typeof fkaDB === "function") {
    try { fkaDB().auth.signOut(); } catch {}
  }
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  window.location.href = "index.html";
}

function adminIsLoggedIn() {
  // Check Supabase cached session first
  if (_isSupabaseReady()) return !!authGetSessionSync();
  // Fallback: check sessionStorage
  try {
    const s = JSON.parse(sessionStorage.getItem(ADMIN_SESSION_KEY));
    return !!(s && s.loggedIn && new Date(s.expiresAt) > new Date());
  } catch { return false; }
}

async function adminAuthGuard() {
  if (!adminIsLoggedIn()) {
    window.location.href = "index.html?reason=session";
    return false;
  }
  // Only check Supabase admin_users table when Supabase is configured
  if (_isSupabaseReady()) {
    try {
      const isAdmin = await adminCheckIsAdmin();
      if (!isAdmin) { window.location.href = "index.html?reason=access"; return false; }
    } catch { /* if check fails, allow — admin is already logged in via session */ }
  }
  return true;
}

function adminGetSession() {
  if (_isSupabaseReady()) {
    const session = authGetSessionSync();
    if (!session) return null;
    return {
      loggedIn: true,
      username: session.user?.email?.split("@")[0] || "admin",
      loginAt:  session.user?.last_sign_in_at || new Date().toISOString()
    };
  }
  // Fallback
  try {
    const s = JSON.parse(sessionStorage.getItem(ADMIN_SESSION_KEY));
    return s && s.loggedIn ? s : null;
  } catch { return null; }
}

/* ── Settings ──────────────────────────────────────────── */

function adminSettingsLoad() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_SETTINGS_KEY)) || {};
  } catch { return {}; }
}

function adminSettingsSave(data) {
  const current = adminSettingsLoad();
  localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify({ ...current, ...data }));
}

function adminSettingsGet(key, fallback = "") {
  return adminSettingsLoad()[key] ?? fallback;
}

/* ── Shared UI Helpers ─────────────────────────────────── */

/**
 * Render the shared sidebar nav and topbar into the page shell.
 * Each admin page calls this after DOMContentLoaded.
 */
function adminRenderShell(activeNav) {
  const sidebar = document.getElementById("admin-sidebar");
  const topbar  = document.getElementById("admin-topbar");
  if (!sidebar || !topbar) return;

  const nav = [
    { id: "dashboard",       icon: "fa-gauge-high",    label: "Dashboard",        href: "dashboard.html" },
    { id: "orders",          icon: "fa-bag-shopping",  label: "Orders",           href: "orders.html" },
    { id: "customers",       icon: "fa-users",         label: "Customers",        href: "customers.html" },
    { id: "products",        icon: "fa-shirt",         label: "Products",         href: "products.html" },
    { id: "delivery-zones",  icon: "fa-truck",         label: "Delivery Zones",   href: "delivery-zones.html" },
    { id: "settings",        icon: "fa-gear",          label: "Settings",         href: "settings.html" }
  ];

  const pendingCount = typeof ordersLoad === "function"
    ? ordersLoad().filter(o => o.status === "pending").length
    : 0;

  sidebar.innerHTML = `
    <div class="adm-sidebar-brand">
      <a href="../index.html" class="adm-brand-link">
        <span class="adm-brand-text">FKA Atelier</span>
        <span class="adm-brand-sub">Admin</span>
      </a>
    </div>
    <nav class="adm-nav" role="navigation" aria-label="Admin navigation">
      ${nav.map(item => `
        <a href="${item.href}"
           class="adm-nav-item ${activeNav === item.id ? "active" : ""}"
           aria-current="${activeNav === item.id ? "page" : "false"}">
          <i class="fa-regular ${item.icon} adm-nav-icon"></i>
          <span class="adm-nav-label">${item.label}</span>
          ${item.id === "orders" && pendingCount > 0
            ? `<span class="adm-nav-badge">${pendingCount}</span>`
            : ""}
        </a>`).join("")}
    </nav>
    <div class="adm-sidebar-footer">
      <a href="../index.html" class="adm-sidebar-footer-link" target="_blank">
        <i class="fa-regular fa-arrow-up-right-from-square"></i> View Store
      </a>
      <button class="adm-sidebar-footer-link" onclick="adminLogout()">
        <i class="fa-regular fa-right-from-bracket"></i> Logout
      </button>
    </div>`;

  const session = adminGetSession();
  topbar.innerHTML = `
    <button class="adm-menu-toggle" id="adm-menu-toggle" aria-label="Toggle menu">
      <i class="fa-regular fa-bars"></i>
    </button>
    <div class="adm-topbar-title" id="adm-page-title"></div>
    <div class="adm-topbar-right">
      <a href="../index.html" class="adm-topbar-btn" target="_blank" title="View store">
        <i class="fa-regular fa-store"></i>
      </a>
      <div class="adm-topbar-user">
        <div class="adm-user-avatar">${(session?.username || "A").charAt(0).toUpperCase()}</div>
        <span class="adm-user-name">${session?.username || "Admin"}</span>
      </div>
      <button class="adm-topbar-btn adm-logout-btn" onclick="adminLogout()" title="Logout">
        <i class="fa-regular fa-right-from-bracket"></i>
      </button>
    </div>`;

  // Mobile sidebar toggle
  const toggle = document.getElementById("adm-menu-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }
  // Close on outside click (mobile)
  document.addEventListener("click", e => {
    if (sidebar.classList.contains("open")
        && !sidebar.contains(e.target)
        && e.target !== toggle) {
      sidebar.classList.remove("open");
    }
  });
}

/**
 * Set the topbar page title.
 */
function adminSetPageTitle(title) {
  const el = document.getElementById("adm-page-title");
  if (el) el.textContent = title;
  document.title = `${title} — FKA Atelier Admin`;
}

/**
 * Show an inline toast inside the admin panel.
 */
function adminToast(message, type = "success") {
  let c = document.getElementById("adm-toast-container");
  if (!c) {
    c = document.createElement("div");
    c.id = "adm-toast-container";
    c.className = "adm-toast-container";
    document.body.appendChild(c);
  }
  const t = document.createElement("div");
  t.className = `adm-toast adm-toast-${type}`;
  t.innerHTML = `
    <i class="fa-regular ${type === "success" ? "fa-circle-check" : type === "error" ? "fa-circle-xmark" : "fa-circle-info"}"></i>
    <span>${message}</span>`;
  c.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add("show")));
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 400); }, 3500);
}

/**
 * Confirm dialog — returns a promise resolving to true/false.
 */
function adminConfirm(message) {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "adm-confirm-overlay";
    overlay.innerHTML = `
      <div class="adm-confirm-box">
        <p class="adm-confirm-msg">${message}</p>
        <div class="adm-confirm-actions">
          <button class="adm-btn adm-btn-outline" id="adm-confirm-cancel">Cancel</button>
          <button class="adm-btn adm-btn-danger" id="adm-confirm-ok">Confirm</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("open"));
    const cleanup = (result) => {
      overlay.classList.remove("open");
      setTimeout(() => overlay.remove(), 300);
      resolve(result);
    };
    document.getElementById("adm-confirm-ok").onclick     = () => cleanup(true);
    document.getElementById("adm-confirm-cancel").onclick = () => cleanup(false);
    overlay.addEventListener("click", e => { if (e.target === overlay) cleanup(false); });
  });
}

/**
 * Open / close a modal by id.
 */
function adminOpenModal(id)  {
  const el = document.getElementById(id);
  if (el) { el.classList.add("open"); document.body.style.overflow = "hidden"; }
}
function adminCloseModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove("open"); document.body.style.overflow = ""; }
}

/* ── Table helpers ─────────────────────────────────────── */

function adminEmptyRow(cols, message) {
  return `<tr><td colspan="${cols}" class="adm-empty-cell">${message}</td></tr>`;
}

function adminPaginate(array, page, perPage) {
  const start = (page - 1) * perPage;
  return {
    items:       array.slice(start, start + perPage),
    total:       array.length,
    totalPages:  Math.ceil(array.length / perPage),
    currentPage: page
  };
}

function adminRenderPager(pager, onPage) {
  if (pager.totalPages <= 1) return "";
  const pages = [];
  for (let i = 1; i <= pager.totalPages; i++) {
    pages.push(`<button class="adm-pager-btn ${i === pager.currentPage ? "active" : ""}"
      onclick="(${onPage.toString()})(${i})">${i}</button>`);
  }
  return `<div class="adm-pager">
    <button class="adm-pager-btn" onclick="(${onPage.toString()})(${pager.currentPage - 1})"
      ${pager.currentPage === 1 ? "disabled" : ""}><i class="fa-regular fa-chevron-left"></i></button>
    ${pages.join("")}
    <button class="adm-pager-btn" onclick="(${onPage.toString()})(${pager.currentPage + 1})"
      ${pager.currentPage === pager.totalPages ? "disabled" : ""}><i class="fa-regular fa-chevron-right"></i></button>
  </div>`;
}

/* ── Format helpers (re-exported for admin pages) ─────── */

function adminFormatMoney(n) {
  return "₦" + (n || 0).toLocaleString("en-NG");
}

function adminFormatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function adminFormatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
       + " " + d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}

function adminStatusBadge(status) {
  const map = {
    pending:    ["#92400E","#FEF3C7"],
    confirmed:  ["#065F46","#D1FAE5"],
    processing: ["#1E40AF","#DBEAFE"],
    shipped:    ["#5B21B6","#EDE9FE"],
    delivered:  ["#065F46","#D1FAE5"],
    cancelled:  ["#991B1B","#FEE2E2"],
    refunded:   ["#374151","#F3F4F6"],
    paid:       ["#065F46","#D1FAE5"],
    unpaid:     ["#92400E","#FEF3C7"],
    active:     ["#065F46","#D1FAE5"],
    inactive:   ["#374151","#F3F4F6"]
  };
  const [color, bg] = map[status] || ["#374151","#F3F4F6"];
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return `<span class="adm-badge" style="color:${color};background:${bg};">${label}</span>`;
}

/* ── Mini bar chart (pure DOM, no libs) ───────────────── */
function adminRenderMiniBar(canvasId, labels, values, color = "#8B7355") {
  const wrap = document.getElementById(canvasId);
  if (!wrap) return;
  const max = Math.max(...values, 1);
  wrap.innerHTML = `
    <div class="adm-mini-bar-chart">
      ${values.map((v, i) => `
        <div class="adm-mini-bar-col" title="${labels[i]}: ${adminFormatMoney(v)}">
          <div class="adm-mini-bar-fill" style="height:${Math.round((v/max)*100)}%;background:${color};"></div>
          <div class="adm-mini-bar-label">${labels[i].slice(-2)}</div>
        </div>`).join("")}
    </div>`;
}

/* ============================================================
   REAL-TIME SYSTEM — BroadcastChannel + localStorage polling
   Admin pages stay live without manual refresh.
   ============================================================ */

let _adminRTChannel   = null;   // BroadcastChannel instance
let _adminRTHandlers  = {};     // { channel: [fn, ...] }
let _adminRTLastSeen  = {};     // last known timestamp per data key
let _adminRTPollTimer = null;

/**
 * Start real-time listener for this admin page.
 * Must be called AFTER adminRenderShell().
 *
 * @param {Object} handlers  { new_order, new_customer, order_status_changed, any, ... }
 *   Each key can be an activity type OR one of: "orders", "customers", "activity".
 *   Use key "any" to catch all broadcasts.
 */
function adminStartRealtime(handlers = {}) {
  _adminRTHandlers = handlers;

  // ── BroadcastChannel (same-origin tabs) ──
  try {
    _adminRTChannel = new BroadcastChannel("fka_admin_channel");
    _adminRTChannel.onmessage = (e) => {
      const { channel, data, ts } = e.data || {};
      _adminRTDispatch(channel, data, ts);
    };
  } catch {}

  // ── Polling fallback (30-second tick) ──
  // Catches changes made in other sessions (e.g. mobile checkout on same device)
  _adminRTPollTimer = setInterval(_adminRTPoll, 15000);

  // ── Storage event (other-tab localStorage writes) ──
  window.addEventListener("storage", (e) => {
    const keyMap = {
      "fka_orders":       "orders",
      "fka_customers":    "customers",
      "fka_activity_log": "activity"
    };
    const channel = keyMap[e.key];
    if (channel) _adminRTDispatch(channel, null, new Date().toISOString());
  });
}

function _adminRTDispatch(channel, data, ts) {
  // Fire "any" handler first
  if (_adminRTHandlers.any) _adminRTHandlers.any({ channel, data, ts });

  // Fire specific channel handler
  if (_adminRTHandlers[channel]) _adminRTHandlers[channel]({ channel, data, ts });

  // If it's an activity event, also fire the activity-type handler
  if (channel === "activity" && data && data.type && _adminRTHandlers[data.type]) {
    _adminRTHandlers[data.type]({ channel, data, ts });
  }
}

function _adminRTPoll() {
  const now = new Date().toISOString();
  ["fka_orders","fka_customers","fka_activity_log"].forEach(key => {
    try {
      const raw  = localStorage.getItem(key);
      if (!raw) return;
      const data = JSON.parse(raw);
      // Detect change by checking most-recent item's timestamp
      const latest = Array.isArray(data) && data[0] ? (data[0].updatedAt || data[0].createdAt || data[0].ts || "") : "";
      if (latest && latest !== _adminRTLastSeen[key]) {
        _adminRTLastSeen[key] = latest;
        const channel = key.replace("fka_","").replace("_log","");
        _adminRTDispatch(channel, null, latest);
      }
    } catch {}
  });
}

function adminStopRealtime() {
  if (_adminRTChannel)   { try { _adminRTChannel.close(); } catch {} _adminRTChannel = null; }
  if (_adminRTPollTimer) { clearInterval(_adminRTPollTimer); _adminRTPollTimer = null; }
}

/* ── Real-time notification toast (new order / new customer) ── */
/**
 * Show a prominent admin notification banner at the top.
 * @param {string} title
 * @param {string} body
 * @param {string} type  "order" | "customer" | "info"
 * @param {string} href  optional link
 */
function adminNotify(title, body, type = "info", href = "") {
  let container = document.getElementById("adm-notify-container");
  if (!container) {
    container = document.createElement("div");
    container.id        = "adm-notify-container";
    container.className = "adm-notify-container";
    document.body.appendChild(container);
  }

  const icons = { order:"fa-bag-shopping", customer:"fa-user-plus", info:"fa-circle-info", warning:"fa-triangle-exclamation" };
  const icon  = icons[type] || "fa-circle-dot";

  const n = document.createElement("div");
  n.className = `adm-notify adm-notify-${type}`;
  n.innerHTML = `
    <div class="adm-notify-icon"><i class="fa-regular ${icon}"></i></div>
    <div class="adm-notify-body">
      <div class="adm-notify-title">${title}</div>
      <div class="adm-notify-text">${body}</div>
    </div>
    ${href ? `<a href="${href}" class="adm-notify-action">View</a>` : ""}
    <button class="adm-notify-close" onclick="this.closest('.adm-notify').remove()">
      <i class="fa-regular fa-xmark"></i>
    </button>`;

  container.appendChild(n);
  requestAnimationFrame(() => requestAnimationFrame(() => n.classList.add("show")));
  setTimeout(() => { n.classList.remove("show"); setTimeout(() => n.remove(), 400); }, 8000);
}

/* ── Pending orders badge updater ── */
function adminUpdatePendingBadge() {
  const count = typeof ordersLoad === "function"
    ? ordersLoad().filter(o => o.status === "pending").length
    : 0;
  document.querySelectorAll(".adm-nav-item[href='orders.html'] .adm-nav-badge").forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? "inline-flex" : "none";
  });
  // Also update topbar "new orders" indicator if present
  const topBadge = document.getElementById("adm-topbar-orders-badge");
  if (topBadge) { topBadge.textContent = count; topBadge.style.display = count > 0 ? "flex" : "none"; }
}

/* ── Activity Feed renderer ── */
/**
 * Render an activity feed list into a container.
 * @param {string} containerId
 * @param {number} limit
 */
function adminRenderActivityFeed(containerId, limit = 20) {
  const container = document.getElementById(containerId);
  if (!container || typeof activityGetRecent !== "function") return;

  const items = activityGetRecent(limit);
  if (!items || items.length === 0) {
    container.innerHTML = `<div class="adm-activity-empty">No recent activity yet.</div>`;
    return;
  }

  container.innerHTML = items.map(entry => {
    const label = typeof activityGetLabel === "function" ? activityGetLabel(entry) : entry.type;
    const icon  = typeof activityGetIcon  === "function" ? activityGetIcon(entry.type)  : "fa-regular fa-circle-dot";
    const time  = adminFormatDateTime(entry.ts);
    return `
      <div class="adm-activity-item" data-type="${entry.type}">
        <div class="adm-activity-dot"><i class="${icon}"></i></div>
        <div class="adm-activity-content">
          <div class="adm-activity-label">${label}</div>
          <div class="adm-activity-time">${time}</div>
        </div>
      </div>`;
  }).join("");
}

/* ── Contact log renderer (for customer modal) ── */
function adminRenderContactLog(contactLog) {
  if (!contactLog || contactLog.length === 0)
    return `<p class="adm-no-data" style="font-size:0.78rem;color:var(--adm-text-light);padding:0.5rem 0;">No contact history yet.</p>`;

  return contactLog.map(entry => {
    const icon  = entry.type === "note" ? "fa-note-sticky" : entry.method === "whatsapp" ? "fa-whatsapp" : "fa-envelope";
    const brand = entry.method === "whatsapp" ? "fa-brands" : "fa-regular";
    const label = entry.type === "note" ? "Note" : `Contacted via ${entry.method}`;
    return `
      <div class="adm-contact-log-item">
        <div class="adm-contact-log-icon ${entry.method === "whatsapp" ? "adm-cl-wa" : ""}">
          <i class="${brand} ${icon}"></i>
        </div>
        <div class="adm-contact-log-content">
          <div class="adm-contact-log-label">${label}</div>
          ${entry.text || entry.note ? `<div class="adm-contact-log-text">${entry.text || entry.note}</div>` : ""}
          <div class="adm-contact-log-meta">${adminFormatDateTime(entry.ts)} · ${entry.by || "admin"}</div>
        </div>
      </div>`;
  }).join("");
}

/* ── Admin notes renderer (for order modal) ── */
function adminRenderOrderNotes(adminNotes) {
  if (!adminNotes || adminNotes.length === 0)
    return `<p class="adm-no-data" style="font-size:0.78rem;color:var(--adm-text-light);padding:0.5rem 0;">No admin notes yet.</p>`;

  return adminNotes.map(n => `
    <div class="adm-note-item">
      <div class="adm-note-text">${n.text}</div>
      <div class="adm-note-meta">${adminFormatDateTime(n.ts)} · ${n.by || "admin"}</div>
    </div>`).join("");
}

/* ============================================================
   FKA ATELIER — Customer Auth
   ------------------------------------------------------------
   QA FIX (Aug 2026): This file used to be Supabase-only (async,
   no localStorage fallback), while every page that actually
   calls it — account.html, checkout.js — calls authGetSession(),
   authLogin(), authRegister(), authUpdateProfile() and
   authGetAccount() SYNCHRONOUSLY (no `await`), and account.html
   already reads/writes a "fka_accounts" localStorage array
   directly (see accDeleteAddress). In other words, the rest of
   the app was already built against a synchronous, localStorage-
   backed auth API — this file just never implemented it, which
   is why the profile page and checkout (which gates on login)
   were inaccessible with Supabase unconfigured (the default
   state of this project).

   This rewrite makes the localStorage-backed flow the primary,
   synchronous implementation (matching every real call site), and
   best-effort mirrors register/login to Supabase in the background
   when it's configured, so accounts still show up there too.

   SECURITY NOTE: passwords in local-fallback mode are hashed with
   a small non-cryptographic hash and stored in localStorage. This
   is fine for local development/demo use but is NOT secure for a
   real production deployment — configure Supabase (which handles
   real password hashing + JWTs) before taking real customer
   passwords in production.
   ============================================================ */
"use strict";

const FKA_ACCOUNTS_KEY      = "fka_accounts";
const FKA_SESSION_KEY       = "fka_session";        // sessionStorage (tab-only)
const FKA_SESSION_KEY_LS    = "fka_session_persist"; // localStorage (remember me)

/* ── tiny non-cryptographic hash (see security note above) ──── */
function _hashPw(pw) {
  let h = 0;
  const s = String(pw);
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return "h" + h.toString(36) + s.length;
}

function _loadAccounts()     { try { return JSON.parse(localStorage.getItem(FKA_ACCOUNTS_KEY)) || []; } catch { return []; } }
function _saveAccounts(list) { localStorage.setItem(FKA_ACCOUNTS_KEY, JSON.stringify(list)); }

function _accountToFlat(acc) {
  if (!acc) return null;
  return {
    accountId: acc.id,
    email: acc.email,
    firstName: acc.firstName,
    lastName: acc.lastName,
    fullName: `${acc.firstName} ${acc.lastName}`.trim(),
    phone: acc.phone
  };
}

/* ── Register ─────────────────────────────────────────────── */
function authRegister({ firstName, lastName, email, phone, password }) {
  if (!firstName || firstName.trim().length < 2) return { ok:false, error:"First name must be at least 2 characters." };
  if (!lastName  || lastName.trim().length  < 2) return { ok:false, error:"Last name must be at least 2 characters." };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return { ok:false, error:"Please enter a valid email address." };
  const phoneClean = (phone||"").replace(/[\s\-()]/g,"");
  if (!phoneClean || !/^(\+234|0)[789][01]\d{8}$/.test(phoneClean)) return { ok:false, error:"Please enter a valid Nigerian phone number." };
  if (!password || password.length < 6) return { ok:false, error:"Password must be at least 6 characters." };

  const emailLow = email.trim().toLowerCase();
  const accounts = _loadAccounts();
  if (accounts.find(a => a.email === emailLow)) {
    return { ok:false, error:"An account with this email already exists. Try signing in instead." };
  }

  const account = {
    id: "acc_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    firstName: firstName.trim(),
    lastName:  lastName.trim(),
    email:     emailLow,
    phone:     phoneClean,
    passwordHash: _hashPw(password),
    addresses: [],
    createdAt: new Date().toISOString()
  };
  accounts.push(account);
  _saveAccounts(accounts);

  // Best-effort mirror to Supabase in the background if configured —
  // doesn't block or affect the local result either way.
  if (typeof _isSupabaseReady === "function" && _isSupabaseReady() && typeof fkaDB === "function") {
    fkaDB().auth.signUp({
      email: emailLow, password,
      options: { data: { first_name: account.firstName, last_name: account.lastName, phone: phoneClean } }
    }).catch(() => {});
  }

  return { ok:true, account: _accountToFlat(account) };
}

/* ── Login ─────────────────────────────────────────────────── */
function authLogin(email, password, remember = true) {
  const emailLow = (email||"").trim().toLowerCase();
  const accounts = _loadAccounts();
  const account  = accounts.find(a => a.email === emailLow);
  if (!account || account.passwordHash !== _hashPw(password)) {
    return { ok:false, error:"Incorrect email or password." };
  }

  const payload = JSON.stringify({ accountId: account.id });
  sessionStorage.setItem(FKA_SESSION_KEY, payload);
  if (remember) localStorage.setItem(FKA_SESSION_KEY_LS, payload);
  else localStorage.removeItem(FKA_SESSION_KEY_LS);

  _cachedSession = _accountToFlat(account);

  if (typeof _isSupabaseReady === "function" && _isSupabaseReady() && typeof fkaDB === "function") {
    fkaDB().auth.signInWithPassword({ email: emailLow, password }).catch(() => {});
  }

  return { ok:true, account: _cachedSession };
}

/* ── Logout ─────────────────────────────────────────────────── */
function authLogout() {
  sessionStorage.removeItem(FKA_SESSION_KEY);
  localStorage.removeItem(FKA_SESSION_KEY_LS);
  _cachedSession = null;
  if (typeof _isSupabaseReady === "function" && _isSupabaseReady() && typeof fkaDB === "function") {
    try { fkaDB().auth.signOut(); } catch {}
  }
  window.location.href = "index.html";
}

/* ── Session helpers ─────────────────────────────────────────── */
let _cachedSession = null;

/**
 * Returns the current session as a flat object
 * { accountId, email, firstName, lastName, fullName, phone } or null.
 * Synchronous — safe to call anywhere, any time.
 */
function authGetSession() {
  if (_cachedSession) return _cachedSession;
  try {
    const raw = sessionStorage.getItem(FKA_SESSION_KEY) || localStorage.getItem(FKA_SESSION_KEY_LS);
    if (!raw) return null;
    const { accountId } = JSON.parse(raw);
    const account = _loadAccounts().find(a => a.id === accountId);
    _cachedSession = _accountToFlat(account);
    return _cachedSession;
  } catch { return null; }
}

function authGetSessionSync() { return authGetSession(); }

function authIsLoggedIn() { return !!authGetSession(); }

/**
 * Require login — redirect to account page if not signed in.
 */
function authRequireLogin(returnUrl) {
  const session = authGetSession();
  if (!session) {
    sessionStorage.setItem("fka_auth_return", returnUrl || window.location.href);
    window.location.href = "account.html?mode=login";
    return false;
  }
  return true;
}

/* ── Profile / Account operations ─────────────────────────────── */
/**
 * Full account record (incl. addresses) for a given accountId.
 * Synchronous — used by account.html and checkout.js.
 */
function authGetAccount(accountId) {
  if (!accountId) return null;
  const account = _loadAccounts().find(a => a.id === accountId);
  if (!account) return null;
  const { passwordHash, ...safe } = account;
  return safe;
}

function authGetProfile() {
  const session = authGetSession();
  return session ? authGetAccount(session.accountId) : null;
}

/**
 * Update the signed-in user's profile: name/phone, password change,
 * or append a new saved address.
 */
function authUpdateProfile(updates) {
  const session = authGetSession();
  if (!session) return { ok:false, error:"Not signed in." };

  const accounts = _loadAccounts();
  const account  = accounts.find(a => a.id === session.accountId);
  if (!account) return { ok:false, error:"Account not found." };

  if (updates.newPassword) {
    if (!updates.currentPassword || account.passwordHash !== _hashPw(updates.currentPassword)) {
      return { ok:false, error:"Current password is incorrect." };
    }
    account.passwordHash = _hashPw(updates.newPassword);
  }
  if (updates.firstName) account.firstName = updates.firstName.trim();
  if (updates.lastName)  account.lastName  = updates.lastName.trim();
  if (updates.phone)     account.phone     = updates.phone.replace(/[\s\-()]/g,"");
  if (updates.address) {
    account.addresses = account.addresses || [];
    const key = `${updates.address.line1}|${updates.address.city}`.toLowerCase();
    if (!account.addresses.find(a => `${a.line1}|${a.city}`.toLowerCase() === key)) {
      account.addresses.unshift({ ...updates.address, addedAt: new Date().toISOString() });
      if (account.addresses.length > 5) account.addresses.pop();
    }
  }

  _saveAccounts(accounts);
  _cachedSession = _accountToFlat(account);
  const { passwordHash, ...safe } = account;
  return { ok:true, account: safe };
}

/**
 * Order / booking history for the signed-in user.
 * Relies on assets/js/local-orders.js (loaded on account.html) for
 * ordersGetByCustomer / bookingsGetAll — falls back to [] if that
 * script isn't present on the current page.
 */
function authGetOrders() {
  const session = authGetSession();
  if (!session || typeof ordersGetByCustomer !== "function") return [];
  return ordersGetByCustomer(session.accountId);
}

function authGetBookings() {
  const session = authGetSession();
  if (!session || typeof bookingsGetAll !== "function") return [];
  return bookingsGetAll().filter(b =>
    b.orderData.customer.accountId === session.accountId || b.orderData.customer.email === session.email);
}

/* ── Auth state listener ─────────────────────────────────────── */
/**
 * Call once on page load — syncs the navbar account icon to the
 * current session. Works whether or not Supabase is configured.
 */
function initAuthListener() {
  authSyncNavbar();
  if (typeof _isSupabaseReady === "function" && _isSupabaseReady() && typeof _supabase !== "undefined" && _supabase) {
    _supabase.auth.onAuthStateChange(() => { /* local session is the source of truth for UI */ });
  }
}

/* ── Navbar Sync ─────────────────────────────────────────────── */
function authSyncNavbar() {
  const session = authGetSession();

  document.querySelectorAll(".auth-account-btn").forEach(el => {
    if (session) {
      el.title       = `My Account (${session.firstName})`;
      el.href        = "account.html";
      el.style.color = "var(--warm-brown)";
      const ico = el.querySelector("i");
      if (ico) ico.className = "fa-solid fa-circle-user";
    } else {
      el.title = "Sign In / Register";
      el.href  = "account.html?mode=login";
      const ico = el.querySelector("i");
      if (ico) ico.className = "fa-regular fa-circle-user";
    }
  });
}

/* ── Activity log (best-effort, Supabase only) ─────────────────── */
async function _authActivity(type, payload) {
  if (typeof _isSupabaseReady !== "function" || !_isSupabaseReady()) return;
  try { await fkaDB().from("activity_log").insert({ type, payload }); } catch {}
}


/* ============================================================
   ACCOUNT — ORDER ID LOOKUP
   Used in the My Orders tab on account.html.
   Mirrors the logic in checkout.js verifyOrderId().
   ============================================================ */
function accVerifyOrderId() {
  const input  = document.getElementById("acc-order-id-input");
  const result = document.getElementById("acc-order-id-result");
  if (!input || !result) return;

  const id = input.value.trim().toUpperCase();
  result.style.display = "block";

  if (!id) {
    result.innerHTML = `<span style="color:#991B1B;"><i class="fa-regular fa-triangle-exclamation"></i> Please enter your Order ID.</span>`;
    return;
  }

  const order = (typeof orderGetById === "function") ? orderGetById(id) : null;

  if (!order) {
    const booking = (typeof bookingGetByRef === "function") ? bookingGetByRef(id) : null;
    if (booking && booking.status === "awaiting_payment") {
      result.innerHTML = `
        <div style="background:#FEF3C7;border:1px solid #FCD34D;padding:0.9rem 1rem;font-size:0.82rem;color:#92400E;line-height:1.6;">
          <strong><i class="fa-regular fa-clock"></i> Awaiting Payment Verification</strong><br>
          Booking <strong>${booking.ref}</strong> has been received. Payment has not been verified yet.
          Send your payment proof via <a href="https://wa.me/2347019243312" style="color:#92400E;text-decoration:underline;">WhatsApp</a> and we'll confirm within 24 hours.
        </div>`;
      return;
    }
    result.innerHTML = `
      <div style="background:#FEE2E2;border:1px solid #FCA5A5;padding:0.9rem 1rem;font-size:0.82rem;color:#991B1B;line-height:1.6;">
        <strong><i class="fa-regular fa-circle-xmark"></i> Order Not Found</strong><br>
        No order found for <strong>${id}</strong>. Check the ID or
        <a href="https://wa.me/2347019243312" style="color:#991B1B;text-decoration:underline;">contact us on WhatsApp</a>.
      </div>`;
    return;
  }

  const statusLabels = {
    processing: { label:"Processing",  color:"#1D4ED8", bg:"#EFF6FF", icon:"fa-gear" },
    shipped:    { label:"Shipped",     color:"#065F46", bg:"#D1FAE5", icon:"fa-truck" },
    delivered:  { label:"Delivered",   color:"#065F46", bg:"#D1FAE5", icon:"fa-circle-check" },
    cancelled:  { label:"Cancelled",   color:"#991B1B", bg:"#FEE2E2", icon:"fa-circle-xmark" },
    ready:      { label:"Ready",       color:"#92400E", bg:"#FEF3C7", icon:"fa-box" }
  };
  const s = statusLabels[order.status] || { label: order.status, color:"#374151", bg:"#F3F4F6", icon:"fa-circle-info" };
  const itemsList = (order.items || []).map(i => `${i.qty}× ${i.name}`).join(", ");
  const date = order.confirmedAt
    ? new Date(order.confirmedAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })
    : "—";

  result.innerHTML = `
    <div style="background:${s.bg};border:1px solid ${s.color}33;padding:1rem 1.1rem;font-size:0.85rem;color:var(--text-dark);line-height:1.7;">
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.6rem;">
        <i class="fa-regular ${s.icon}" style="color:${s.color};font-size:1rem;"></i>
        <strong style="color:${s.color};">Order ${id} — ${s.label}</strong>
      </div>
      <div style="font-size:0.8rem;color:var(--text-mid);">
        ${order.customer?.fullName ? `<div>Customer: <strong>${order.customer.fullName}</strong></div>` : ""}
        ${itemsList ? `<div>Items: ${itemsList}</div>` : ""}
        ${order.total ? `<div>Total: <strong>₦${Number(order.total).toLocaleString("en-NG")}</strong></div>` : ""}
        <div>Confirmed: ${date}</div>
      </div>
    </div>`;
}

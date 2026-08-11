/* ============================================================
   FKA ATELIER — Customer Auth System
   Register / Login / Logout / Session
   Keys:
     "fka_accounts"        → array of registered accounts
     "fka_user_session"    → sessionStorage: active session
     "fka_user_session_p"  → localStorage: remembered session
   ============================================================ */
"use strict";

const AUTH_ACCOUNTS_KEY  = "fka_accounts";
const AUTH_SESSION_KEY   = "fka_user_session";
const AUTH_PERSIST_KEY   = "fka_user_session_p"; // "remember me"
const AUTH_ACTIVITY_KEY  = "fka_activity_log";

/* ── Helpers ─────────────────────────────────────────────── */
function _accountsLoad() {
  try { return JSON.parse(localStorage.getItem(AUTH_ACCOUNTS_KEY)) || []; }
  catch { return []; }
}
function _accountsSave(list) {
  localStorage.setItem(AUTH_ACCOUNTS_KEY, JSON.stringify(list));
}
/* Simple hash — NOT cryptographic. Static-only site constraint. */
function _hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return (h >>> 0).toString(36);
}

/* ── Activity Log (admin reads this) ──────────────────────── */
function authEmitActivity(type, payload) {
  try {
    const log = JSON.parse(localStorage.getItem(AUTH_ACTIVITY_KEY)) || [];
    log.unshift({ type, payload, ts: new Date().toISOString(), id: Date.now() + Math.random() });
    if (log.length > 200) log.splice(200);
    localStorage.setItem(AUTH_ACTIVITY_KEY, JSON.stringify(log));
  } catch {}
  // Broadcast to other tabs (admin dashboard)
  try {
    const bc = new BroadcastChannel("fka_admin_channel");
    bc.postMessage({ type, payload, ts: new Date().toISOString() });
    bc.close();
  } catch {}
}

/* ── Register ─────────────────────────────────────────────── */
/**
 * Register a new customer account.
 * @param {Object} data  { firstName, lastName, email, phone, password }
 * @returns {{ ok:boolean, error?:string, account?:Object }}
 */
function authRegister(data) {
  const { firstName, lastName, email, phone, password } = data;

  // Validate
  if (!firstName || firstName.trim().length < 2) return { ok:false, error:"First name must be at least 2 characters." };
  if (!lastName  || lastName.trim().length  < 2) return { ok:false, error:"Last name must be at least 2 characters." };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return { ok:false, error:"Please enter a valid email address." };

  const phoneClean = (phone || "").replace(/[\s\-()]/g, "");
  if (!phoneClean || !/^(\+234|0)[789][01]\d{8}$/.test(phoneClean))
    return { ok:false, error:"Please enter a valid Nigerian phone number (e.g. 08012345678)." };

  if (!password || password.length < 6) return { ok:false, error:"Password must be at least 6 characters." };

  const accounts = _accountsLoad();
  const emailLow = email.trim().toLowerCase();

  if (accounts.find(a => a.email === emailLow))
    return { ok:false, error:"An account with this email already exists. Please sign in." };

  const account = {
    id:          "ACC-" + Date.now().toString(36).toUpperCase(),
    firstName:   firstName.trim(),
    lastName:    lastName.trim(),
    fullName:    `${firstName.trim()} ${lastName.trim()}`,
    email:       emailLow,
    phone:       phoneClean,
    passwordHash: _hash(password),
    createdAt:   new Date().toISOString(),
    lastLoginAt: null,
    addresses:   [],
    preferences: {}
  };

  accounts.push(account);
  _accountsSave(accounts);

  // Upsert into customer records so admin can see them
  if (typeof customerUpsert === "function") {
    customerUpsert({
      firstName: account.firstName,
      lastName:  account.lastName,
      fullName:  account.fullName,
      email:     account.email,
      phone:     account.phone
    });
  }

  authEmitActivity("new_account", {
    id: account.id, fullName: account.fullName,
    email: account.email, phone: account.phone
  });

  return { ok:true, account };
}

/* ── Login ─────────────────────────────────────────────────── */
/**
 * @param {string} email
 * @param {string} password
 * @param {boolean} remember  persist across browser closes
 * @returns {{ ok:boolean, error?:string, account?:Object }}
 */
function authLogin(email, password, remember = false) {
  const accounts = _accountsLoad();
  const emailLow = (email || "").trim().toLowerCase();
  const account  = accounts.find(a => a.email === emailLow);

  if (!account) return { ok:false, error:"No account found with that email address." };
  if (account.passwordHash !== _hash(password))
    return { ok:false, error:"Incorrect password. Please try again." };

  // Update lastLoginAt
  account.lastLoginAt = new Date().toISOString();
  _accountsSave(accounts);

  const session = {
    accountId: account.id,
    email:     account.email,
    fullName:  account.fullName,
    firstName: account.firstName,
    phone:     account.phone,
    loginAt:   new Date().toISOString(),
    expiresAt: new Date(Date.now() + (remember ? 30 : 1) * 24 * 60 * 60 * 1000).toISOString()
  };

  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  if (remember) localStorage.setItem(AUTH_PERSIST_KEY, JSON.stringify(session));

  authEmitActivity("login", { id: account.id, fullName: account.fullName, email: account.email });
  return { ok:true, account };
}

/* ── Logout ─────────────────────────────────────────────────── */
function authLogout() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(AUTH_PERSIST_KEY);
  window.location.href = "index.html";
}

/* ── Session ─────────────────────────────────────────────────── */
/**
 * Returns active session object or null.
 */
function authGetSession() {
  // Try sessionStorage first, then persisted localStorage session
  const sources = [
    () => JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY)),
    () => JSON.parse(localStorage.getItem(AUTH_PERSIST_KEY))
  ];
  for (const src of sources) {
    try {
      const s = src();
      if (!s || !s.accountId) continue;
      if (new Date(s.expiresAt) < new Date()) {
        sessionStorage.removeItem(AUTH_SESSION_KEY);
        localStorage.removeItem(AUTH_PERSIST_KEY);
        continue;
      }
      // Restore to sessionStorage if loaded from persistent store
      if (!sessionStorage.getItem(AUTH_SESSION_KEY))
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(s));
      return s;
    } catch {}
  }
  return null;
}

function authIsLoggedIn() { return !!authGetSession(); }

/**
 * Require login — if not signed in, redirect to account page,
 * saving intended destination in sessionStorage.
 * @param {string} returnUrl  page to return to after login
 */
function authRequireLogin(returnUrl) {
  if (!authIsLoggedIn()) {
    sessionStorage.setItem("fka_auth_return", returnUrl || window.location.pathname);
    window.location.href = "account.html?mode=login";
    return false;
  }
  return true;
}

/* ── Account CRUD ─────────────────────────────────────────────── */
function authGetAccount(accountId) {
  return _accountsLoad().find(a => a.id === accountId) || null;
}

function authGetAccountByEmail(email) {
  return _accountsLoad().find(a => a.email === (email||"").toLowerCase()) || null;
}

/**
 * Update the signed-in user's profile.
 * @param {Object} updates  { firstName, lastName, phone, password? }
 */
function authUpdateProfile(updates) {
  const session = authGetSession();
  if (!session) return { ok:false, error:"Not signed in." };

  const accounts = _accountsLoad();
  const account  = accounts.find(a => a.id === session.accountId);
  if (!account) return { ok:false, error:"Account not found." };

  if (updates.firstName) account.firstName = updates.firstName.trim();
  if (updates.lastName)  account.lastName  = updates.lastName.trim();
  if (updates.phone)     account.phone     = updates.phone.replace(/[\s\-()]/g,"");
  account.fullName = `${account.firstName} ${account.lastName}`;

  if (updates.currentPassword && updates.newPassword) {
    if (account.passwordHash !== _hash(updates.currentPassword))
      return { ok:false, error:"Current password is incorrect." };
    if (updates.newPassword.length < 6)
      return { ok:false, error:"New password must be at least 6 characters." };
    account.passwordHash = _hash(updates.newPassword);
  }

  if (updates.address && updates.address.line1) {
    const key = `${updates.address.line1}|${updates.address.city}`.toLowerCase();
    if (!account.addresses.find(a => `${a.line1}|${a.city}`.toLowerCase() === key)) {
      account.addresses.unshift({ ...updates.address, addedAt: new Date().toISOString() });
      if (account.addresses.length > 5) account.addresses.pop();
    }
  }

  _accountsSave(accounts);

  // Refresh session
  const newSession = { ...session, fullName: account.fullName, firstName: account.firstName, phone: account.phone };
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(newSession));
  if (localStorage.getItem(AUTH_PERSIST_KEY)) localStorage.setItem(AUTH_PERSIST_KEY, JSON.stringify(newSession));

  // Sync customer record
  if (typeof customerUpsert === "function") {
    customerUpsert({ firstName: account.firstName, lastName: account.lastName, fullName: account.fullName, email: account.email, phone: account.phone });
  }

  return { ok:true, account };
}

/* ── Navbar Sync ─────────────────────────────────────────────── */
/**
 * Call on every storefront page to update account icon state.
 */
function authSyncNavbar() {
  const session = authGetSession();
  document.querySelectorAll(".auth-account-btn").forEach(el => {
    if (session) {
      el.title       = `My Account (${session.firstName})`;
      el.href        = "account.html";
      el.style.color = "var(--warm-brown)";
      const ico = el.querySelector("i");
      if (ico) { ico.className = "fa-solid fa-circle-user"; }
    } else {
      el.title = "Sign In / Register";
      el.href  = "account.html?mode=login";
    }
  });
}

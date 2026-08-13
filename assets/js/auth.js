/* ============================================================
   FKA ATELIER — Customer Auth (Supabase)
   Replaces localStorage account management with Supabase Auth.
   Supabase handles passwords, JWTs and session persistence.
   ============================================================ */
"use strict";

/* ── Register ─────────────────────────────────────────────── */
async function authRegister({ firstName, lastName, email, phone, password }) {
  // Validate client-side first for fast feedback
  if (!firstName || firstName.trim().length < 2) return { ok:false, error:"First name must be at least 2 characters." };
  if (!lastName  || lastName.trim().length  < 2) return { ok:false, error:"Last name must be at least 2 characters." };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return { ok:false, error:"Please enter a valid email address." };
  const phoneClean = (phone||"").replace(/[\s\-()]/g,"");
  if (!phoneClean || !/^(\+234|0)[789][01]\d{8}$/.test(phoneClean)) return { ok:false, error:"Please enter a valid Nigerian phone number." };
  if (!password || password.length < 6) return { ok:false, error:"Password must be at least 6 characters." };

  try {
    const db = fkaDB();
    const emailLow = email.trim().toLowerCase();

    const { data, error } = await db.auth.signUp({
      email:    emailLow,
      password,
      options:  {
        data: {
          first_name: firstName.trim(),
          last_name:  lastName.trim(),
          phone:      phoneClean
        }
      }
    });

    if (error) return { ok:false, error: fkaErrorMsg(error) };

    // Log activity
    await _authActivity("new_account", {
      id:       data.user?.id,
      fullName: `${firstName.trim()} ${lastName.trim()}`,
      email:    emailLow,
      phone:    phoneClean
    });

    return { ok:true, user: data.user };
  } catch (err) {
    return { ok:false, error: err.message };
  }
}

/* ── Login ─────────────────────────────────────────────────── */
async function authLogin(email, password) {
  // Guard: Supabase not configured — caller handles fallback
  if (!_isSupabaseReady()) {
    return { ok:false, error:"Supabase not configured." };
  }
  try {
    const db = fkaDB();
    const { data, error } = await db.auth.signInWithPassword({
      email:    (email||"").trim().toLowerCase(),
      password
    });
    if (error) {
      const msg = error.message?.includes("Invalid login") ? "Incorrect email or password." : fkaErrorMsg(error);
      return { ok:false, error: msg };
    }
    await _authActivity("login", { email: data.user?.email });
    return { ok:true, user: data.user, session: data.session };
  } catch (err) {
    return { ok:false, error: err.message };
  }
}

/* ── Logout ─────────────────────────────────────────────────── */
async function authLogout() {
  try {
    const db = fkaDB();
    await db.auth.signOut();
  } catch {}
  window.location.href = "index.html";
}

/* ── Session helpers ─────────────────────────────────────────── */
/**
 * Returns the Supabase session (includes user) or null.
 * Cached synchronously once loaded via initAuthListener.
 */
let _cachedSession = null;
let _sessionLoaded = false;

async function _loadSession() {
  if (_sessionLoaded) return _cachedSession;
  try {
    const db = fkaDB();
    const { data } = await db.auth.getSession();
    _cachedSession  = data?.session || null;
    _sessionLoaded  = true;
  } catch { _cachedSession = null; _sessionLoaded = true; }
  return _cachedSession;
}

/**
 * Returns active session object or null.
 * Use `await authGetSession()` — async because first call loads from Supabase.
 */
async function authGetSession() {
  return _loadSession();
}

/**
 * Synchronous version — only safe after page has fully initialised.
 * Use authGetSession() in async contexts.
 */
function authGetSessionSync() {
  return _cachedSession;
}

function authIsLoggedIn() {
  return !!_cachedSession;
}

/**
 * Require login — redirect to account page if not signed in.
 */
async function authRequireLogin(returnUrl) {
  const session = await authGetSession();
  if (!session) {
    sessionStorage.setItem("fka_auth_return", returnUrl || window.location.href);
    window.location.href = "account.html?mode=login";
    return false;
  }
  return true;
}

/* ── Profile operations ─────────────────────────────────────── */
/**
 * Get profile for the currently signed-in user.
 */
async function authGetProfile() {
  const session = await authGetSession();
  if (!session) return null;
  try {
    const { data, error } = await fkaDB()
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    if (error) return null;
    return data;
  } catch { return null; }
}

/**
 * Update the signed-in user's profile.
 */
async function authUpdateProfile(updates) {
  const session = await authGetSession();
  if (!session) return { ok:false, error:"Not signed in." };
  try {
    const db = fkaDB();
    // Update Supabase auth metadata
    if (updates.firstName || updates.lastName) {
      await db.auth.updateUser({ data: {
        first_name: updates.firstName,
        last_name:  updates.lastName,
        phone:      updates.phone
      }});
    }
    // Update password if provided
    if (updates.newPassword) {
      const { error: pwErr } = await db.auth.updateUser({ password: updates.newPassword });
      if (pwErr) return { ok:false, error: fkaErrorMsg(pwErr) };
    }
    // Update profiles table
    const profileUpdate = {};
    if (updates.firstName)  profileUpdate.first_name = updates.firstName.trim();
    if (updates.lastName)   profileUpdate.last_name  = updates.lastName.trim();
    if (updates.phone)      profileUpdate.phone      = updates.phone.replace(/[\s\-()]/g,"");
    if (updates.address) {
      // Append address to jsonb array
      const { data: prof } = await db.from("profiles").select("addresses").eq("id", session.user.id).single();
      const addrs   = prof?.addresses || [];
      const key     = `${updates.address.line1}|${updates.address.city}`.toLowerCase();
      if (!addrs.find(a => `${a.line1}|${a.city}`.toLowerCase() === key)) {
        addrs.unshift({ ...updates.address, addedAt: new Date().toISOString() });
        if (addrs.length > 5) addrs.pop();
        profileUpdate.addresses = addrs;
      }
    }
    if (Object.keys(profileUpdate).length > 0) {
      const { error: profErr } = await db.from("profiles").update(profileUpdate).eq("id", session.user.id);
      if (profErr) return { ok:false, error: fkaErrorMsg(profErr) };
    }
    return { ok:true };
  } catch (err) {
    return { ok:false, error: err.message };
  }
}

/**
 * Get order history for signed-in user.
 */
async function authGetOrders() {
  const session = await authGetSession();
  if (!session) return [];
  try {
    const { data } = await fkaDB()
      .from("orders")
      .select("*")
      .eq("account_id", session.user.id)
      .order("created_at", { ascending: false });
    return data || [];
  } catch { return []; }
}

/**
 * Get bookings (pre-payment) for signed-in user.
 */
async function authGetBookings() {
  const session = await authGetSession();
  if (!session) return [];
  try {
    const { data } = await fkaDB()
      .from("bookings")
      .select("*")
      .eq("account_id", session.user.id)
      .order("created_at", { ascending: false });
    return data || [];
  } catch { return []; }
}

/* ── Auth state listener ─────────────────────────────────────── */
/**
 * Set up auth state change listener.
 * Call once on page load — updates cached session and syncs navbar.
 */
function initAuthListener() {
  if (!_supabase) return;
  // Load initial session
  _loadSession().then(() => {
    authSyncNavbar();
  });
  // Listen for changes (login, logout, token refresh)
  _supabase.auth.onAuthStateChange(async (event, session) => {
    _cachedSession = session;
    _sessionLoaded = true;
    authSyncNavbar();
    if (event === "SIGNED_IN") {
      // If there's a pending redirect (e.g. from checkout auth gate)
      const ret = sessionStorage.getItem("fka_auth_return");
      if (ret && window.location.href.includes("account.html")) {
        sessionStorage.removeItem("fka_auth_return");
        window.location.href = ret;
      }
    }
  });
}

/* ── Navbar Sync ─────────────────────────────────────────────── */
function authSyncNavbar() {
  const session = authGetSessionSync();
  const user    = session?.user;
  const meta    = user?.user_metadata || {};
  const name    = meta.first_name || user?.email?.split("@")[0] || "";

  document.querySelectorAll(".auth-account-btn").forEach(el => {
    if (user) {
      el.title       = `My Account (${name})`;
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

/* ── Activity log ─────────────────────────────────────────────── */
async function _authActivity(type, payload) {
  try {
    await fkaDB().from("activity_log").insert({ type, payload });
  } catch {}
}

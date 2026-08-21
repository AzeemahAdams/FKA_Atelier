/* ============================================================
   FKA ATELIER — Supabase Client
   Gracefully degrades to localStorage-only mode when
   Supabase is not configured or CDN fails to load.
   ============================================================ */

"use strict";

const SUPABASE_URL      = window.FKA_CONFIG?.supabaseUrl     || "";
const SUPABASE_ANON_KEY = window.FKA_CONFIG?.supabaseAnonKey || "";

/* ── Resolve createClient from UMD bundle ─────────────── */
// The @supabase/supabase-js v2 UMD bundle exposes:
//   window.supabase = { createClient, ... }
// Some older versions expose createClient directly as window.supabase.
// Handle both.
function _resolveCreateClient() {
  const sb = window.supabase;
  if (!sb) return null;
  if (typeof sb.createClient === "function") return sb.createClient; // v2 UMD
  if (typeof sb             === "function")  return sb;              // legacy
  return null;
}

const createClient = _resolveCreateClient();

/* ── Initialise client (only when URL is real) ────────── */
const _isSupabaseConfigured =
  !!createClient &&
  SUPABASE_URL !== "" &&
  SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
  SUPABASE_URL.startsWith("https://");

const _supabase = _isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession:     true,
        autoRefreshToken:   true,
        detectSessionInUrl: true
      }
    })
  : null;

if (!createClient) {
  console.warn("[FKA] Supabase CDN not loaded — running in localStorage-only mode.");
} else if (!_isSupabaseConfigured) {
  console.info("[FKA] Supabase URL not configured — running in localStorage-only mode.");
}

/* ── Public helpers ────────────────────────────────────── */

/**
 * Returns the Supabase client, or a no-op proxy if not initialised.
 * Use _isSupabaseReady() to check before calling in critical paths.
 */
function fkaDB() {
  if (!_supabase) {
    // Return a no-op proxy so callers that forgot to check _isSupabaseReady()
    // don't crash the whole page — they just get null data back
    const noop = () => noop;
    const proxy = new Proxy({}, {
      get: () => (...args) => {
        console.warn("[FKA] fkaDB() called but Supabase is not configured — returning null.");
        return Promise.resolve({ data: null, error: { message: "Supabase not configured" } });
      }
    });
    return proxy;
  }
  return _supabase;
}

/**
 * True when Supabase is configured AND the CDN loaded successfully.
 */
function _isSupabaseReady() {
  return !!_supabase;
}

/**
 * Get current auth session, or null if Supabase not configured.
 */
async function fkaGetSession() {
  if (!_supabase) return null;
  try {
    const { data } = await _supabase.auth.getSession();
    return data?.session || null;
  } catch { return null; }
}

async function fkaGetUser() {
  const s = await fkaGetSession();
  return s?.user || null;
}

function fkaCheck({ data, error }, label = "") {
  if (error) {
    console.error(`[FKA Supabase error] ${label}:`, error.message);
    throw new Error(error.message);
  }
  return data;
}

function fkaErrorMsg(error) {
  if (!error) return null;
  const msg = error.message || String(error);
  if (msg.includes("duplicate key") || msg.includes("already exists")) return "This record already exists.";
  if (msg.includes("foreign key"))   return "Related record not found.";
  if (msg.includes("JWT"))           return "Your session has expired. Please sign in again.";
  if (msg.includes("not found"))     return "Record not found.";
  return msg;
}

/* ============================================================
   FKA ATELIER — Supabase Client
   Single shared instance used by auth, orders, products etc.

   Setup:
     1. Create a free project at https://supabase.com
     2. Go to Project Settings → API
     3. Copy your Project URL and anon public key below
     4. Run the SQL schema in supabase-schema.sql in the
        Supabase SQL Editor to create all tables
   ============================================================ */

// Load from window.FKA_CONFIG (set in a <script> tag on each page)
// so these values can be changed without editing this file.
// Falls back to the values below if no config block is present.

const SUPABASE_URL     = window.FKA_CONFIG?.supabaseUrl     || "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY= window.FKA_CONFIG?.supabaseAnonKey || "YOUR_SUPABASE_ANON_KEY";

// Import Supabase via CDN (loaded in HTML before this script)
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
const { createClient } = window.supabase || {};

if (!createClient) {
  console.error("[FKA] Supabase JS not loaded. Add the CDN script tag before supabase.js.");
}

const _supabase = createClient ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession:   true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}) : null;

/**
 * Get the Supabase client.
 * Usage: const db = fkaDB(); then db.from('orders').select()...
 */
function fkaDB() {
  if (!_supabase) throw new Error("Supabase client not initialised. Check SUPABASE_URL and SUPABASE_ANON_KEY.");
  return _supabase;
}

/**
 * Get current Supabase auth session.
 * Returns { user, session } or null.
 */
async function fkaGetSession() {
  if (!_supabase) return null;
  const { data } = await _supabase.auth.getSession();
  return data?.session || null;
}

/**
 * Get currently signed-in user.
 */
async function fkaGetUser() {
  const session = await fkaGetSession();
  return session?.user || null;
}

/**
 * Helper: handle Supabase response, throw on error.
 */
function fkaCheck({ data, error }, label = "") {
  if (error) {
    console.error(`[FKA Supabase error] ${label}:`, error.message);
    throw new Error(error.message);
  }
  return data;
}

/**
 * Helper: format any Supabase Postgrest error into a user-friendly string.
 */
function fkaErrorMsg(error) {
  if (!error) return null;
  const msg = error.message || String(error);
  if (msg.includes("duplicate key") || msg.includes("already exists")) return "This record already exists.";
  if (msg.includes("foreign key"))   return "Related record not found.";
  if (msg.includes("JWT"))           return "Your session has expired. Please sign in again.";
  if (msg.includes("not found"))     return "Record not found.";
  return msg;
}

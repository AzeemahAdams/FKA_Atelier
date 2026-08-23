/* FKA orders.js v3 - Supabase */

/* ── CUSTOMERS ──────────────────────────────────────────────
   customersGetAll / customerGetById / customersSearch removed
   (Aug 2026 QA fix) — duplicated assets/js/local-orders.js's
   versions, which derive customers from confirmed local orders
   instead of a Supabase-only "profiles" query. customerAddNote /
   customerLogContact removed too — assets/js/local-orders.js's
   versions store to the same per-customer log that
   admin/customers.html actually renders (c.contactLog). */

/* ── DELIVERY ZONES ────────────────────────────────────────── */
/*
   QA FIX (Aug 2026): This file used to redeclare deliveryZonesLoad,
   deliveryZonesGetActive, detectZoneFromAddress, calculateDeliveryFee,
   deliveryZoneSave, deliveryZoneDelete and deliveryZoneToggle — all
   async, Supabase-only, and chaining `.from().select().order()` on
   fkaDB()'s no-op fallback, which only supports one level of chaining
   before it resolves to a Promise. The moment Supabase isn't
   configured (the default state), `.select is not a function` was
   thrown.

   Because orders.js loads AFTER delivery.js on every page that uses
   both (admin/delivery-zones.html, checkout.html, cart.html), these
   duplicates silently overwrote delivery.js's correct, synchronous,
   localStorage-backed versions — crashing the admin Delivery Zones
   page on load, and breaking delivery-fee calculation at checkout.
   Removed; delivery.js's versions are the only implementation now.
*/

/* ── PRODUCTS ──────────────────────────────────────────────── */
/*
   NOTE (QA fix, Aug 2026): This file used to redeclare getAllProducts,
   getProductById, getNewArrivals, getProductsByCategory,
   getProductsByCollection, searchProducts, filterByPrice, sortProducts,
   _normaliseProduct, formatPrice, adminSaveProduct and adminDeleteProduct.

   Because orders.js is loaded AFTER products.js on almost every page
   (see the <script> order in index.html / pages/html/*.html /
   admin/*.html), those duplicate declarations silently OVERWROTE the
   real implementations in assets/js/products.js — which are the only
   ones that know how to fall back to the localStorage admin-override
   store when Supabase isn't configured.

   That was the root cause of three separate bugs:
     1. Admin "Save" button failures — this file's adminSaveProduct()
        called Supabase directly and THREW when Supabase wasn't
        configured, instead of falling back to localStorage like
        products.js's version does.
     2. "Product Not Found" on the product detail page — this file's
        getProductById() only checked Supabase, then the static
        FKA_PRODUCTS array, and never looked at localStorage overrides
        — so any product added/edited in the admin never resolved.
     3. Home/Shop/Collection pages out of sync — index.html doesn't
        load orders.js, so Home always used the correct products.js
        functions, while Shop/Collections/Product/Cart/Checkout all
        load orders.js and got the broken, override-blind versions.

   Fix: removed the duplicates. All product reads/writes now go
   through the single, override-aware implementation in products.js.
*/

/* ── Admin products CRUD ────────────────────────────────────── */
/* adminSaveProduct / adminDeleteProduct also removed — see note above.
   products.js's versions (Supabase-first, localStorage fallback) are
   the single source of truth admin pages should call. */

/* ── Realtime subscription ─────────────────────────────────── */

/**
 * Subscribe to live admin updates via Supabase Realtime.
 * Replaces BroadcastChannel for cross-device updates.
 * @param {Object} handlers  { orders, bookings, products, activity, any }
 */
function adminStartRealtime(handlers = {}) {
  if (!_supabase) return;
  const tables = ["orders","bookings","products","activity_log"];
  tables.forEach(table => {
    _supabase.channel(`rt_${table}`)
      .on("postgres_changes", { event:"*", schema:"public", table }, payload => {
        const channel = table === "activity_log" ? "activity" : table;
        if (handlers[channel]) handlers[channel](payload);
        if (handlers.any)      handlers.any({ channel, ...payload });
        if (table === "activity_log" && payload.new?.type && handlers[payload.new.type]) {
          handlers[payload.new.type]({ data: payload.new });
        }
      })
      .subscribe();
  });
}

/* ── Dashboard Stats ──────────────────────────────────────────── */
/* getDashboardStats() removed from this file (Aug 2026 QA fix) — see
   assets/js/local-orders.js for why (it was async + Supabase-only +
   referenced an undefined ORDER_STATUSES constant, and crashed the
   entire admin dashboard on load). The real, synchronous,
   local-data-backed implementation now lives there. */

/* ── Formatting helpers ─────────────────────────────────────── */
function adminFormatMoney(n)   { return "₦"+(n||0).toLocaleString("en-NG"); }
function formatPrice(n)        { return "₦"+(n||0).toLocaleString("en-NG"); }
function adminFormatDate(iso)  { if(!iso)return"—"; return new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}); }
function adminFormatDateTime(iso) { if(!iso)return"—"; const d=new Date(iso); return adminFormatDate(iso)+" "+d.toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"}); }
function adminStatusBadge(status) {
  const map={pending:["#92400E","#FEF3C7"],confirmed:["#065F46","#D1FAE5"],processing:["#1E40AF","#DBEAFE"],shipped:["#5B21B6","#EDE9FE"],delivered:["#065F46","#D1FAE5"],cancelled:["#991B1B","#FEE2E2"],refunded:["#374151","#F3F4F6"],paid:["#065F46","#D1FAE5"],unpaid:["#92400E","#FEF3C7"],active:["#065F46","#D1FAE5"],inactive:["#374151","#F3F4F6"]};
  const [color,bg]=map[status]||["#374151","#F3F4F6"];
  return `<span class="adm-badge" style="color:${color};background:${bg};">${status.charAt(0).toUpperCase()+status.slice(1)}</span>`;
}
/* bookingStatusBadge removed (Aug 2026 QA fix) — duplicated
   assets/js/local-orders.js's version. */
function activityGetLabel(entry) {
  const p=entry.payload||{};
  switch(entry.type){
    case "new_booking":          return `New booking <strong>${p.bookingRef}</strong> from ${p.customer?.fullName||""} — ₦${(p.total||0).toLocaleString("en-NG")}`;
    case "payment_confirmed":    return `Payment confirmed for <strong>${p.orderId}</strong> from ${p.customer?.fullName||""}`;
    case "new_customer":         return `New customer: <strong>${p.fullName||p.email}</strong>`;
    case "new_account":          return `New account: <strong>${p.fullName||p.email}</strong>`;
    case "order_status_changed": return `Order <strong>${p.orderId}</strong> → <em>${p.newStatus}</em>`;
    case "customer_note":        return `Note added for customer`;
    case "customer_contacted":   return `Customer contacted via ${p.method}`;
    case "order_deleted":        return `Order <strong>${p.orderId}</strong> deleted`;
    default: return entry.type.replace(/_/g," ");
  }
}
function activityGetIcon(type) {
  const map={new_booking:"fa-clock",payment_confirmed:"fa-circle-check",new_customer:"fa-user-plus",new_account:"fa-user-plus",order_status_changed:"fa-rotate",customer_note:"fa-note-sticky",customer_contacted:"fa-comment",order_deleted:"fa-trash"};
  return "fa-regular "+(map[type]||"fa-circle-dot");
}
/* activityGetRecent() removed from here (Aug 2026 QA fix) — used to be
   a stub always returning []. The real implementation, built from
   local booking/order/contact events, now lives in local-orders.js. */

/* ── Backward compat stubs removed (Aug 2026 QA fix) ──────────────
   ordersLoad/customersLoad used to be dead-end stubs that always
   returned []. The real implementations now live in
   assets/js/local-orders.js (ordersLoad/ordersGetAll and
   customersGetAll), which is loaded on every page that needs order
   or customer data — see the payment-workflow fix notes there. */

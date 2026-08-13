/* FKA orders.js v3 - Supabase */

/* ── CUSTOMERS ─────────────────────────────────────────────── */

async function customersGetAll() {
  const { data } = await fkaDB().from("profiles").select("*").order("created_at",{ascending:false});
  return data || [];
}
async function customerGetById(id) {
  const { data } = await fkaDB().from("profiles").select("*").eq("id",id).single();
  return data;
}
async function customersSearch(query) {
  if (!query) return customersGetAll();
  const q = query.toLowerCase();
  const all = await customersGetAll();
  return all.filter(c =>
    ((c.first_name||"")+" "+(c.last_name||"")).toLowerCase().includes(q) ||
    (c.phone||"").includes(q) || (c.id||"").toLowerCase().includes(q)
  );
}
async function customerAddNote(customerId, note, adminUser="admin") {
  const { data:prof } = await fkaDB().from("profiles").select("addresses").eq("id",customerId).single();
  // We store notes in activity_log and a text field on profiles
  await _emitActivity("customer_note", { customerId, note });
  return prof;
}
async function customerLogContact(customerId, method, note="", adminUser="admin") {
  await _emitActivity("customer_contacted", { customerId, method, note });
}

/* ── DELIVERY ZONES ────────────────────────────────────────── */

async function deliveryZonesLoad() {
  const { data } = await fkaDB().from("delivery_zones").select("*").order("fee");
  return data || DEFAULT_DELIVERY_ZONES;
}
async function deliveryZonesGetActive() {
  const { data } = await fkaDB().from("delivery_zones").select("*").eq("active",true).order("fee");
  return data || [];
}
async function detectZoneFromAddress(address) {
  if (!address?.trim()) return null;
  const zones = await deliveryZonesGetActive();
  const q     = address.toLowerCase();
  let best=null, bestScore=-1;
  for (const z of zones) {
    if (z.is_default) continue;
    const kws = Array.isArray(z.keywords) ? z.keywords : (JSON.parse(z.keywords||"[]"));
    let score = 0;
    for (const kw of kws) if (q.includes(kw)) score += kw.length;
    if (score > bestScore) { bestScore=score; best=z; }
  }
  if (bestScore <= 0) return zones.find(z=>z.is_default) || zones[zones.length-1];
  return best;
}
async function calculateDeliveryFee(address, subtotal) {
  const zone = await detectZoneFromAddress(address);
  if (!zone) return { zone:null, fee:0, isFree:false, message:"Enter your address to see delivery fee." };
  const isFree = subtotal >= (zone.free_threshold||zone.freeThreshold||70000);
  const fee    = isFree ? 0 : (zone.fee || 4500);
  const rem    = (zone.free_threshold||zone.freeThreshold||70000) - subtotal;
  const message = isFree
    ? `✓ Free delivery to ${zone.name}`
    : `Delivery to ${zone.name}: ₦${fee.toLocaleString("en-NG")}. Add ₦${rem.toLocaleString("en-NG")} more for free delivery.`;
  return { zone, fee, isFree, message, estimatedDays: zone.estimated_days||zone.estimatedDays };
}
async function deliveryZoneSave(zone) {
  const { fee, free_threshold, freeThreshold, estimated_days, estimatedDays, ...rest } = zone;
  const row = { ...rest, fee, free_threshold: free_threshold||freeThreshold, estimated_days: estimated_days||estimatedDays };
  const { error } = await fkaDB().from("delivery_zones").upsert(row);
  if (error) throw new Error(fkaErrorMsg(error));
}
async function deliveryZoneDelete(id) {
  await fkaDB().from("delivery_zones").delete().eq("id",id);
}
async function deliveryZoneToggle(id) {
  const { data:z } = await fkaDB().from("delivery_zones").select("active").eq("id",id).single();
  if (!z) return null;
  await fkaDB().from("delivery_zones").update({ active:!z.active }).eq("id",id);
  return !z.active;
}

/* ── PRODUCTS ──────────────────────────────────────────────── */

async function getAllProducts() {
  const { data } = await fkaDB().from("products").select("*").eq("available",true).order("sort_order").order("created_at",{ascending:false});
  if (data && data.length) return data.map(_normaliseProduct);
  return FKA_PRODUCTS; // fallback to static if DB empty
}
async function getProductById(id) {
  const { data } = await fkaDB().from("products").select("*").eq("id",id).single();
  if (data) return _normaliseProduct(data);
  return FKA_PRODUCTS.find(p=>p.id===id);
}
async function getNewArrivals(limit=4) {
  const { data } = await fkaDB().from("products").select("*").eq("available",true).eq("is_new",true).order("created_at",{ascending:false}).limit(limit);
  if (data && data.length) return data.map(_normaliseProduct);
  return FKA_PRODUCTS.filter(p=>p.isNew).slice(0,limit);
}
async function getProductsByCategory(category) {
  if (!category||category==="all") return getAllProducts();
  const { data } = await fkaDB().from("products").select("*").eq("available",true).eq("category",category).order("sort_order");
  if (data) return data.map(_normaliseProduct);
  return FKA_PRODUCTS.filter(p=>p.category===category);
}
async function getProductsByCollection(collection) {
  const { data } = await fkaDB().from("products").select("*").eq("available",true).contains("collections",[collection]).order("sort_order");
  if (data) return data.map(_normaliseProduct);
  return FKA_PRODUCTS.filter(p=>p.collections?.includes(collection));
}
async function searchProducts(query) {
  if (!query?.trim()) return [];
  const q = query.toLowerCase();
  // Supabase full text search or client filter
  const all = await getAllProducts();
  return all.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.description||"").toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    (p.colours||[]).some(c=>c.name.toLowerCase().includes(q)) ||
    (p.fabric||"").toLowerCase().includes(q)
  );
}
async function filterByPrice(products, maxPrice) {
  return products.filter(p => p.price <= maxPrice);
}
async function sortProducts(products, sortBy) {
  const arr = [...products];
  switch(sortBy) {
    case "price-asc":  return arr.sort((a,b)=>a.price-b.price);
    case "price-desc": return arr.sort((a,b)=>b.price-a.price);
    case "name-asc":   return arr.sort((a,b)=>a.name.localeCompare(b.name));
    default:           return arr.sort((a,b)=>(b.is_new||b.isNew?1:0)-(a.is_new||a.isNew?1:0));
  }
}

// Normalise DB row to match the shape the UI expects
function _normaliseProduct(p) {
  return {
    ...p,
    isNew:          p.is_new,
    isBestseller:   p.is_bestseller,
    categoryLabel:  p.category_label || (p.category.charAt(0).toUpperCase()+p.category.slice(1)),
    priceFormatted: p.price_formatted || "₦"+Number(p.price).toLocaleString("en-NG"),
    images:         Array.isArray(p.images) ? p.images : (JSON.parse(p.images||"[]")),
    colours:        Array.isArray(p.colours) ? p.colours : (JSON.parse(p.colours||"[]")),
    sizes:          Array.isArray(p.sizes)   ? p.sizes   : (JSON.parse(p.sizes  ||"[]")),
    collections:    Array.isArray(p.collections) ? p.collections : (JSON.parse(p.collections||"[]"))
  };
}

/* ── Admin products CRUD ────────────────────────────────────── */

async function adminSaveProduct(product) {
  const row = {
    id:             product.id,
    name:           product.name,
    category:       product.category,
    category_label: product.categoryLabel || product.category_label,
    price:          product.price,
    price_formatted:"₦"+Number(product.price).toLocaleString("en-NG"),
    images:         product.images || [],
    description:    product.description,
    fabric:         product.fabric || "",
    colours:        product.colours || [],
    sizes:          product.sizes || ["XS","S","M","L","XL","XXL"],
    care:           product.care || "",
    available:      product.available !== false,
    is_new:         !!product.isNew || !!product.is_new,
    is_bestseller:  !!product.isBestseller || !!product.is_bestseller,
    collections:    product.collections || []
  };
  const { error } = await fkaDB().from("products").upsert(row);
  if (error) throw new Error(fkaErrorMsg(error));
}

async function adminDeleteProduct(id) {
  await fkaDB().from("products").delete().eq("id",id);
}

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
async function getDashboardStats() {
  const [orders, customers, activity, bookingsPending] = await Promise.all([
    fkaDB().from("orders").select("id,total,status,created_at,customer_info").order("created_at",{ascending:false}).limit(200),
    fkaDB().from("profiles").select("id,created_at").limit(1000),
    fkaDB().from("activity_log").select("*").order("created_at",{ascending:false}).limit(25),
    fkaDB().from("bookings").select("ref,status,total,created_at,customer_info").eq("status","awaiting_payment").limit(100)
  ]);
  const ords = orders.data || [];
  const custs= customers.data || [];
  const acts = activity.data || [];

  const totalRevenue   = ords.reduce((s,o)=>s+(Number(o.total)||0),0);
  const totalOrders    = ords.length;
  const totalCustomers = custs.length;
  const thirtyDaysAgo  = new Date(Date.now()-30*24*60*60*1000).toISOString();
  const recentOrders   = ords.filter(o=>o.created_at>=thirtyDaysAgo);
  const recentRevenue  = recentOrders.reduce((s,o)=>s+(Number(o.total)||0),0);

  const byStatus = {};
  Object.keys(ORDER_STATUSES).forEach(s=>byStatus[s]=0);
  ords.forEach(o=>{ if(byStatus[o.status]!==undefined) byStatus[o.status]++; });

  const revenueByDay = [];
  for(let i=6;i>=0;i--) {
    const d=new Date(); d.setDate(d.getDate()-i);
    const dateStr=d.toISOString().split("T")[0];
    const rev=ords.filter(o=>o.created_at?.startsWith(dateStr)).reduce((s,o)=>s+(Number(o.total)||0),0);
    revenueByDay.push({date:dateStr,revenue:rev});
  }

  return {
    totalRevenue, totalOrders, totalCustomers, recentRevenue,
    recentOrders: recentOrders.length, byStatus,
    latestOrders: ords.slice(0,5), recentActivity: acts,
    revenueByDay, avgOrderValue: totalOrders>0?Math.round(totalRevenue/totalOrders):0,
    pendingCount: byStatus.pending||0,
    pendingBookings: (bookingsPending.data||[]).length
  };
}

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
function bookingStatusBadge(status) {
  const map={awaiting_payment:["#92400E","#FEF3C7","Awaiting Payment"],converted:["#065F46","#D1FAE5","Payment Confirmed"],cancelled:["#991B1B","#FEE2E2","Cancelled"]};
  const [color,bg,label]=map[status]||["#374151","#F3F4F6",status];
  return `<span class="adm-badge" style="color:${color};background:${bg};">${label}</span>`;
}
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
function activityGetRecent(n=20) { return []; } // handled async in getDashboardStats

/* ── Backward compat stubs ────────────────────────────────────── */
// These kept so any remaining sync code doesn't throw errors
function ordersLoad()    { return []; }
function customersLoad() { return []; }

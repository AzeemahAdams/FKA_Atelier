/* ============================================================
   FKA ATELIER — Local Booking / Order / Customer Data Layer
   ------------------------------------------------------------
   Implements the manual bank-transfer verification workflow:

     1. Customer checks out  -> a BOOKING is created
        (status "awaiting_payment"). No Order ID yet.
     2. Admin verifies the bank transfer manually and clicks
        "Confirm Payment" in the dashboard.
     3. Only then: a unique Order ID is generated, the booking
        is converted into an ORDER, and the customer is notified.

   This file is the concrete implementation of the API that
   admin/orders.html, admin/dashboard.html, admin/customers.html
   and checkout.js already call (bookingsGetAll, ordersGetAll,
   orderConfirmPayment, orderPlace, etc.) — those pages were
   built against this API but it didn't exist yet.

   Storage: localStorage (same pattern as products.js / delivery.js
   / admin.js — this whole app runs "serverless" until Supabase is
   configured). No real email/SMS provider exists in this project
   (server.js only proxies the Groq chat API), so "sending" a
   notification here means: logging it to fka_notifications_log so
   the admin can see it happened, and pre-filling a WhatsApp/email
   link the admin can actually send with one click. Wire in a real
   email/SMS provider (e.g. via a small serverless function) to
   make notifications fully automatic.
   ============================================================ */
"use strict";

const FKA_BOOKINGS_KEY      = "fka_bookings";
const FKA_ORDERS_KEY        = "fka_orders";
const FKA_CONTACT_LOG_KEY   = "fka_customer_contacts";
const FKA_NOTIFY_LOG_KEY    = "fka_notifications_log";

/* ── low-level storage ─────────────────────────────────── */
function _loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function _saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  try { new BroadcastChannel("fka_orders_channel").postMessage({ key }); } catch {}
}

function _loadBookings()      { return _loadJSON(FKA_BOOKINGS_KEY, []); }
function _saveBookings(list)  { _saveJSON(FKA_BOOKINGS_KEY, list); }
function _loadOrders()        { return _loadJSON(FKA_ORDERS_KEY, []); }
function _saveOrders(list)    { _saveJSON(FKA_ORDERS_KEY, list); }

/* ── ID generators ──────────────────────────────────────── */
function _genBookingRef() {
  return "BK-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}
function _genOrderId() {
  const year = new Date().getFullYear();
  const seq  = (_loadOrders().length + 1).toString().padStart(4, "0");
  return `FKA-${year}-${seq}`;
}

/* ── Store bank details (Admin → Settings) ─────────────── */
/**
 * Reads the bank account details an admin has entered in
 * Admin → Settings, without needing to load all of admin.js.
 * Used by checkout.js to show real bank details at Step 1.
 */
function getStoreBankDetails() {
  const s = _loadJSON("fka_admin_settings", {});
  return {
    bankName:      s.bankName      || "",
    accountName:   s.accountName   || "",
    accountNumber: s.accountNumber || ""
  };
}

/* ── Contact helpers ────────────────────────────────────── */
function buildWhatsAppLink(phone, message) {
  const clean = (phone || "").replace(/[\s\-()]/g, "").replace(/^0/, "234").replace(/^\+/, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message || "")}`;
}
function buildEmailLink(email, subject, body) {
  return `mailto:${email || ""}?subject=${encodeURIComponent(subject || "")}${body ? "&body=" + encodeURIComponent(body) : ""}`;
}
function buildOrderWhatsAppLink(order) {
  return buildWhatsAppLink(order.customer?.phone,
    `Hi ${order.customer?.fullName?.split(" ")[0] || ""}! This is FKA Atelier, following up on Order ${order.id}.`);
}
function buildOrderEmailLink(order) {
  return buildEmailLink(order.customer?.email, `Order ${order.id} — FKA Atelier`,
    `Hi ${order.customer?.fullName || ""},\n\nFollowing up on Order ${order.id}.\n\nFKA Atelier Team`);
}

/* ── Simulated notification log ────────────────────────── */
/**
 * "Sends" the Order ID to the customer. There is no real email/SMS
 * backend wired up in this project, so this logs the notification
 * (visible to admins) and returns a ready-to-send WhatsApp link —
 * the admin dashboard opens that link automatically after a
 * payment is confirmed so the message can be sent with one tap.
 */
function _notifyCustomerOrderConfirmed(order) {
  const log = _loadJSON(FKA_NOTIFY_LOG_KEY, []);
  log.unshift({
    ts: new Date().toISOString(),
    channel: "whatsapp+email (simulated — no email/SMS provider connected)",
    to: order.customer?.email,
    orderId: order.id,
    message: `Your Order ID is ${order.id}. Payment confirmed, processing has begun.`
  });
  _saveJSON(FKA_NOTIFY_LOG_KEY, log.slice(0, 200));
}

/* ============================================================
   BOOKINGS  (Step 1–2: pending payment)
   ============================================================ */

function bookingsLoad()     { return _loadBookings(); }
function bookingsSave(list) { _saveBookings(list); }
function bookingsGetAll()   { return _loadBookings().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); }

function bookingsSearch(q) {
  const query = (q || "").toLowerCase();
  return bookingsGetAll().filter(b => {
    const d = b.orderData;
    return b.ref.toLowerCase().includes(query)
      || d.customer.fullName.toLowerCase().includes(query)
      || d.customer.email.toLowerCase().includes(query)
      || (d.customer.phone || "").includes(query);
  });
}

function bookingGetByRef(ref) {
  return _loadBookings().find(b => b.ref === ref) || null;
}

function bookingStatusBadge(status) {
  const map = {
    awaiting_payment: ["#92400E", "#FEF3C7", "Awaiting Payment"],
    converted:        ["#065F46", "#D1FAE5", "Confirmed"],
    cancelled:        ["#991B1B", "#FEE2E2", "Cancelled"]
  };
  const [color, bg, label] = map[status] || ["#374151", "#F3F4F6", status];
  return `<span class="adm-badge" style="color:${color};background:${bg};">${label}</span>`;
}

/**
 * Step 1: Customer places an order at checkout.
 * Creates a booking (NOT an order — no Order ID yet) with
 * status "awaiting_payment" and returns everything the checkout
 * success screen needs to display.
 */
function orderPlace(formData, cartItems, deliveryInfo) {
  if (!cartItems || cartItems.length === 0) throw new Error("Your bag is empty.");
  if (!formData.email || !formData.phone) throw new Error("Missing customer details.");

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = deliveryInfo?.fee || 0;
  const total = subtotal + deliveryFee;

  const fullText = [formData.shippingLine1, formData.shippingLine2, formData.shippingCity, formData.shippingState, "Nigeria"]
    .filter(Boolean).join(", ");
  const shippingAddress = {
    line1: formData.shippingLine1 || "", line2: formData.shippingLine2 || "",
    city: formData.shippingCity || "", state: formData.shippingState || "",
    fullText
  };
  const billingAddress = formData.billingSameAsShipping === false
    ? {
        line1: formData.billingLine1 || "", line2: formData.billingLine2 || "",
        city: formData.billingCity || "", state: formData.billingState || "",
        fullText: [formData.billingLine1, formData.billingLine2, formData.billingCity, formData.billingState, "Nigeria"].filter(Boolean).join(", ")
      }
    : { ...shippingAddress };

  const customer = {
    accountId: formData.accountId || null,
    fullName: `${formData.firstName} ${formData.lastName}`.trim(),
    email: formData.email,
    phone: formData.phone
  };

  const items = cartItems.map(i => ({
    id: i.productId, name: i.name, size: i.size, colour: i.colour,
    qty: i.qty, price: i.price, image: i.image, lineTotal: i.price * i.qty
  }));

  const ref = _genBookingRef();
  const booking = {
    ref,
    status: "awaiting_payment",
    orderId: null,
    createdAt: new Date().toISOString(),
    orderData: {
      customer, items, subtotal, deliveryFee, total,
      shippingAddress, billingAddress,
      deliveryZone: deliveryInfo?.zone ? { id: deliveryInfo.zone.id, name: deliveryInfo.zone.name } : null,
      notes: formData.notes || ""
    },
    adminNotes: [],
    statusHistory: [{ status: "awaiting_payment", timestamp: new Date().toISOString(), note: "Booking submitted by customer.", by: "customer" }]
  };

  const bookings = _loadBookings();
  bookings.unshift(booking);
  _saveBookings(bookings);

  if (typeof cartClear === "function") cartClear();

  return { bookingRef: ref, booking, total, customer, shippingAddress };
}

async function cancelBookingByRef(ref) {
  const bookings = _loadBookings();
  const b = bookings.find(x => x.ref === ref);
  if (b) { b.status = "cancelled"; b.statusHistory.push({ status: "cancelled", timestamp: new Date().toISOString(), by: "admin" }); }
  _saveBookings(bookings);
  return b;
}

/**
 * Step 3: Admin confirms the bank transfer was received.
 *   a) generates a unique Order ID
 *   b) "sends" it to the customer (see _notifyCustomerOrderConfirmed)
 *   c) order processing officially begins (status -> "processing")
 *
 * NOTE on inventory: the current product schema (see products.js)
 * has no stock-quantity field, so there is nothing to decrement
 * numerically here. If you need real stock tracking, add a
 * `stock` field to products and decrement it in this function.
 */
function orderConfirmPayment(ref, note, by = "admin") {
  const bookings = _loadBookings();
  const booking = bookings.find(b => b.ref === ref);
  if (!booking) throw new Error("Booking not found.");
  if (booking.status === "converted") throw new Error(`Already confirmed as ${booking.orderId}.`);
  if (booking.status === "cancelled") throw new Error("This booking was cancelled.");

  const id = _genOrderId();
  const now = new Date().toISOString();
  const d = booking.orderData;

  const order = {
    id,
    bookingRef: ref,
    customer: d.customer,
    items: d.items,
    subtotal: d.subtotal,
    deliveryFee: d.deliveryFee,
    total: d.total,
    deliveryZone: d.deliveryZone,
    shippingAddress: d.shippingAddress,
    billingAddress: d.billingAddress,
    paymentMethod: "bank_transfer",
    paymentStatus: "paid",
    status: "processing",
    createdAt: now,
    confirmedAt: now,
    adminNotes: [{ text: `Payment verified: ${note}`, ts: now, by }],
    statusHistory: [
      ...booking.statusHistory,
      { status: "processing", timestamp: now, note: `Payment confirmed by ${by}: ${note}`, by }
    ]
  };

  const orders = _loadOrders();
  orders.unshift(order);
  _saveOrders(orders);

  booking.status  = "converted";
  booking.orderId = id;
  booking.statusHistory.push({ status: "converted", timestamp: now, note: `Converted to order ${id}.`, by });
  _saveBookings(bookings);

  _notifyCustomerOrderConfirmed(order);

  return order;
}

/* ============================================================
   ORDERS  (Step 3 onward: confirmed)
   ============================================================ */

function ordersGetAll()  { return _loadOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); }
function ordersLoad()    { return ordersGetAll(); } // backward-compat name used elsewhere

function ordersSearch(q) {
  const query = (q || "").toLowerCase();
  return ordersGetAll().filter(o =>
    o.id.toLowerCase().includes(query)
    || o.customer.fullName.toLowerCase().includes(query)
    || o.customer.email.toLowerCase().includes(query)
    || (o.customer.phone || "").includes(query));
}

function orderGetById(id) { return _loadOrders().find(o => o.id === id) || null; }

function ordersGetByCustomer(customerId) {
  return ordersGetAll().filter(o => o.customer.email === customerId || o.customer.accountId === customerId);
}

function orderUpdateStatus(id, status, note, by = "admin") {
  const orders = _loadOrders();
  const order = orders.find(o => o.id === id);
  if (!order) return null;
  order.status = status;
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({ status, timestamp: new Date().toISOString(), note, by });
  _saveOrders(orders);
  return order;
}

function orderAddAdminNote(id, text, by = "admin") {
  const orders = _loadOrders();
  const order = orders.find(o => o.id === id);
  if (!order) return null;
  order.adminNotes = order.adminNotes || [];
  order.adminNotes.unshift({ text, ts: new Date().toISOString(), by });
  _saveOrders(orders);
  return order;
}

function orderDelete(id) {
  _saveOrders(_loadOrders().filter(o => o.id !== id));
}

/* ============================================================
   CUSTOMERS  (derived from confirmed orders)
   ============================================================ */

function customersGetAll() {
  const byEmail = {};
  ordersGetAll().forEach(o => {
    const key = o.customer.email;
    if (!byEmail[key]) {
      byEmail[key] = {
        id: key,
        fullName: o.customer.fullName,
        firstName: (o.customer.fullName || "").split(" ")[0],
        email: o.customer.email,
        phone: o.customer.phone,
        orderCount: 0,
        totalSpend: 0,
        lastOrderAt: o.createdAt,
        createdAt: o.createdAt
      };
    }
    const c = byEmail[key];
    c.orderCount += 1;
    c.totalSpend += o.total;
    if (new Date(o.createdAt) > new Date(c.lastOrderAt)) c.lastOrderAt = o.createdAt;
    if (new Date(o.createdAt) < new Date(c.createdAt))   c.createdAt   = o.createdAt;
  });
  return Object.values(byEmail);
}

function customersSearch(q) {
  const query = (q || "").toLowerCase();
  return customersGetAll().filter(c =>
    c.fullName.toLowerCase().includes(query)
    || c.email.toLowerCase().includes(query)
    || (c.phone || "").includes(query));
}

function customerGetById(id) {
  const c = customersGetAll().find(c => c.id === id) || null;
  if (c) c.contactLog = _getCustomerContactLog(id);
  return c;
}

/**
 * Unified per-customer log: both contact events (WhatsApp/email) and
 * admin notes live in the same log so admin/customers.html can render
 * them together via adminRenderContactLog().
 */
function _getCustomerContactLog(customerId) {
  return _loadJSON(FKA_CONTACT_LOG_KEY, [])
    .filter(e => e.customerId === customerId)
    .sort((a, b) => new Date(b.ts) - new Date(a.ts));
}

function logContact(customerId, channel) {
  customerLogContact(customerId, channel);
}

function customerLogContact(customerId, method, note = "", by = "admin") {
  const log = _loadJSON(FKA_CONTACT_LOG_KEY, []);
  log.unshift({ customerId, method, note, ts: new Date().toISOString(), by });
  _saveJSON(FKA_CONTACT_LOG_KEY, log.slice(0, 500));
}

function customerAddNote(customerId, text, by = "admin") {
  const log = _loadJSON(FKA_CONTACT_LOG_KEY, []);
  log.unshift({ customerId, type: "note", text, ts: new Date().toISOString(), by });
  _saveJSON(FKA_CONTACT_LOG_KEY, log.slice(0, 500));
}

/* ── Realtime: BroadcastChannel + storage event → re-render admin pages ── */
(function () {
  try {
    const bc = new BroadcastChannel("fka_orders_channel");
    bc.onmessage = () => {
      if (typeof renderBookings === "function") renderBookings();
      if (typeof renderOrders   === "function") renderOrders();
      if (typeof renderCustomers === "function") renderCustomers();
      if (typeof adminUpdatePendingBadge === "function") adminUpdatePendingBadge();
    };
  } catch {}
})();

/* ============================================================
   DASHBOARD STATS + ACTIVITY FEED
   ------------------------------------------------------------
   QA FIX (Aug 2026): admin/dashboard.html calls `getDashboardStats()`
   SYNCHRONOUSLY (`const S = getDashboardStats();`, no await) and
   `ORDER_STATUSES` was referenced but never defined anywhere. The old
   implementation in orders.js was async, Supabase-only, and chained
   `.from().select().order().limit()` on fkaDB()'s no-op fallback
   object — which only supports ONE level of chaining before it
   resolves to a Promise, so `.select is not a function` was thrown
   the moment Supabase wasn't configured (the default state). That
   crashed the entire dashboard page on load.

   This rewrite computes the exact same stats shape synchronously
   from the local order/booking/customer store, consistent with the
   rest of this file.
   ============================================================ */

const ORDER_STATUSES = {
  confirmed:  "Confirmed",
  processing: "Processing",
  shipped:    "Shipped",
  delivered:  "Delivered",
  cancelled:  "Cancelled",
  refunded:   "Refunded"
};

function getDashboardStats() {
  const ords  = ordersGetAll();
  const custs = customersGetAll();
  const bookingsPending = bookingsGetAll().filter(b => b.status === "awaiting_payment");

  const totalRevenue   = ords.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const totalOrders    = ords.length;
  const totalCustomers = custs.length;
  const thirtyDaysAgo  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const recentOrders   = ords.filter(o => o.createdAt >= thirtyDaysAgo);
  const recentRevenue  = recentOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);

  const byStatus = {};
  Object.keys(ORDER_STATUSES).forEach(s => byStatus[s] = 0);
  ords.forEach(o => { if (byStatus[o.status] !== undefined) byStatus[o.status]++; });

  const revenueByDay = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const rev = ords.filter(o => o.createdAt?.startsWith(dateStr)).reduce((s, o) => s + (Number(o.total) || 0), 0);
    revenueByDay.push({ date: dateStr, revenue: rev });
  }

  const productTally = {};
  ords.forEach(o => (o.items || []).forEach(i => {
    productTally[i.name] = (productTally[i.name] || 0) + (i.qty || 1);
  }));
  const topProducts = Object.entries(productTally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, qty }));

  return {
    totalRevenue, totalOrders, totalCustomers, recentRevenue,
    recentOrders: recentOrders.length, byStatus,
    latestOrders: ords.slice(0, 5), recentActivity: activityGetRecent(25),
    revenueByDay, avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    pendingCount: byStatus.confirmed || 0,
    pendingBookings: bookingsPending.length,
    topProducts
  };
}

/**
 * Real activity feed built from booking/order/customer events —
 * replaces the old activityGetRecent() stub in orders.js that
 * always returned [].
 */
function activityGetRecent(n = 20) {
  const events = [];

  bookingsGetAll().forEach(b => {
    events.push({ type: "new_booking", ts: b.createdAt, payload: { bookingRef: b.ref, customer: b.orderData.customer, total: b.orderData.total } });
  });
  ordersGetAll().forEach(o => {
    events.push({ type: "payment_confirmed", ts: o.confirmedAt || o.createdAt, payload: { orderId: o.id, customer: o.customer } });
    (o.statusHistory || []).forEach(h => {
      if (h.status !== "processing") {
        events.push({ type: "order_status_changed", ts: h.timestamp, payload: { orderId: o.id, newStatus: h.status } });
      }
    });
  });
  _loadJSON(FKA_CONTACT_LOG_KEY, []).forEach(e => {
    events.push(e.type === "note"
      ? { type: "customer_note", ts: e.ts, payload: { customerId: e.customerId } }
      : { type: "customer_contacted", ts: e.ts, payload: { method: e.method } });
  });

  return events.sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, n);
}

/**
 * Seeds a couple of sample bookings/orders so the dashboard has
 * something to show on a fresh install. Wired to the "Seed Demo
 * Data" button on admin/dashboard.html, which referenced this
 * function without it ever being defined.
 */
function seedDemoOrders() {
  if (ordersGetAll().length > 0 || bookingsGetAll().length > 0) return;

  const sampleItems = [
    [{ id: "fka-001", name: "Noir Flow Abaya", size: "M", colour: "Black", qty: 1, price: 65000, lineTotal: 65000 }],
    [{ id: "fka-003", name: "Ivory Co-ord Set", size: "S", colour: "Ivory", qty: 1, price: 48000, lineTotal: 48000 }]
  ];
  const names = ["Amaka Okoro", "Chidinma Eze"];
  const emails = ["amaka.demo@example.com", "chidinma.demo@example.com"];

  sampleItems.forEach((items, i) => {
    const subtotal = items.reduce((s, x) => s + x.lineTotal, 0);
    const formData = {
      firstName: names[i].split(" ")[0], lastName: names[i].split(" ")[1],
      email: emails[i], phone: "0803000000" + i,
      shippingLine1: "1 Demo Street", shippingCity: "Ijebu Ode", shippingState: "Ogun State",
      billingSameAsShipping: true
    };
    const cartLikeItems = items.map(x => ({ productId: x.id, name: x.name, price: x.price, qty: x.qty, size: x.size, colour: x.colour, image: "" }));
    const { bookingRef } = orderPlace(formData, cartLikeItems, { fee: 3500, zone: { id: "zone-ogun", name: "Ogun State" }, estimatedDays: "1–3 business days" });
    if (i === 0) orderConfirmPayment(bookingRef, "Demo seed data — bank alert received.", "admin");
  });
}

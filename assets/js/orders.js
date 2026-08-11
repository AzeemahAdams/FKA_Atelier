/* ============================================================
   FKA ATELIER — Order & Customer Data Model v2
   Stores: fka_orders, fka_customers, fka_activity_log,
           fka_bookings (pre-payment booking references)
   ============================================================ */
"use strict";

const ORDERS_KEY    = "fka_orders";
const CUSTOMERS_KEY = "fka_customers";
const ACTIVITY_KEY  = "fka_activity_log";
const BOOKINGS_KEY  = "fka_bookings";   // pending payment references
/* ── Order Status Definitions ──────────────────────────── */
const ORDER_STATUSES = {
  pending:    { label: "Pending",     color: "#C4A030" },
  confirmed:  { label: "Confirmed",   color: "#2C7A4B" },
  processing: { label: "Processing",  color: "#2563EB" },
  shipped:    { label: "Shipped",     color: "#7C3AED" },
  delivered:  { label: "Delivered",   color: "#059669" },
  cancelled:  { label: "Cancelled",   color: "#DC2626" },
  refunded:   { label: "Refunded",    color: "#6B7280" }
};

/* ── ID Generators ─────────────────────────────────────── */
function generateOrderId() {
  const now  = Date.now();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `FKA-${now.toString(36).toUpperCase().slice(-5)}${rand}`;
}
function generateCustomerId() {
  return `CUST-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
}

/**
 * Booking reference — shown to customer at checkout.
 * Not an Order ID. Converts to a real Order ID after payment verified.
 */
function generateBookingRef() {
  const rand = Math.floor(Math.random() * 900000) + 100000;
  return `REF-${rand}`;
}

/* ── Booking (pre-payment) storage ─────────────────────── */
function bookingsLoad() {
  try { return JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || []; }
  catch { return []; }
}
function bookingsSave(list) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
}
function bookingGetByRef(ref) {
  return bookingsLoad().find(b => b.ref === ref) || null;
}
function bookingsGetAll() {
  return bookingsLoad().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
function bookingGetByCustomer(customerId) {
  return bookingsLoad().filter(b => b.customerId === customerId);
}

/**
 * Admin: confirm payment for a booking → creates a real order with an Order ID.
 * @param {string} ref  — booking reference e.g. "REF-123456"
 * @param {string} paymentNote — e.g. "Bank transfer confirmed — Amina Hassan"
 * @returns {Object} the newly created order
 */
function orderConfirmPayment(ref, paymentNote = "", adminUser = "admin") {
  const bookings = bookingsLoad();
  const booking  = bookings.find(b => b.ref === ref);
  if (!booking) throw new Error(`Booking ${ref} not found.`);
  if (booking.status === "converted") throw new Error(`Booking ${ref} already converted to an order.`);

  // Generate the real Order ID now
  const orderId = generateOrderId();

  // Build the confirmed order from the booking data
  const order = {
    ...booking.orderData,
    id:           orderId,
    bookingRef:   ref,
    status:       "confirmed",
    paymentStatus:"paid",
    statusHistory: [
      { status: "pending",   timestamp: booking.createdAt,         note: "Order submitted by customer." },
      { status: "confirmed", timestamp: new Date().toISOString(),  note: paymentNote || `Payment verified by ${adminUser}. Order confirmed.`, by: adminUser }
    ],
    adminNotes: [{ text: paymentNote || "Payment verified.", by: adminUser, ts: new Date().toISOString() }],
    confirmedAt: new Date().toISOString(),
    updatedAt:   new Date().toISOString()
  };

  // Save to orders
  const orders = ordersLoad();
  orders.unshift(order);
  ordersSave(orders);

  // Mark booking as converted
  const idx = bookings.findIndex(b => b.ref === ref);
  if (idx >= 0) { bookings[idx].status = "converted"; bookings[idx].orderId = orderId; }
  bookingsSave(bookings);

  // Update customer stats
  const allCustomers = customersLoad();
  const cust = allCustomers.find(c => c.id === order.customerId);
  if (cust) {
    cust.orderCount  = (cust.orderCount  || 0) + 1;
    cust.totalSpend  = (cust.totalSpend  || 0) + order.total;
    cust.lastOrderAt = order.confirmedAt;
  }
  customersSave(allCustomers);

  _emitActivity("payment_confirmed", {
    orderId,
    bookingRef: ref,
    customer:  order.customer,
    total:     order.total
  });

  return order;
}

/* ── Storage Helpers ───────────────────────────────────── */
function ordersLoad()            { try { return JSON.parse(localStorage.getItem(ORDERS_KEY))    || []; } catch { return []; } }
function ordersSave(orders)      { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); _broadcastChange("orders"); }
function customersLoad()         { try { return JSON.parse(localStorage.getItem(CUSTOMERS_KEY)) || []; } catch { return []; } }
function customersSave(list)     { localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(list)); _broadcastChange("customers"); }
function activityLoad()          { try { return JSON.parse(localStorage.getItem(ACTIVITY_KEY))  || []; } catch { return []; } }

/* ── Activity Log + Broadcast ──────────────────────────── */
function _emitActivity(type, payload) {
  try {
    const log = activityLoad();
    const entry = { id: `act-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, type, payload, ts: new Date().toISOString() };
    log.unshift(entry);
    if (log.length > 300) log.splice(300);
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(log));
    _broadcastChange("activity", { type, payload });
  } catch {}
}

function _broadcastChange(channel, data = {}) {
  try {
    const bc = new BroadcastChannel("fka_admin_channel");
    bc.postMessage({ channel, data, ts: new Date().toISOString() });
    bc.close();
  } catch {}
}

/* ── Phone normaliser ──────────────────────────────────── */
function _normalisePhone(phone) {
  if (!phone) return "";
  const p = String(phone).replace(/[\s\-()]/g,"");
  if (p.startsWith("0")) return "+234" + p.slice(1);
  if (p.startsWith("234") && !p.startsWith("+234")) return "+" + p;
  return p;
}

/* ── WhatsApp / Email link builders ────────────────────── */
/**
 * Build a WhatsApp click-to-chat link.
 * @param {string} phone  — Nigerian number (07..., 08..., 09..., or +234...)
 * @param {string} msg    — pre-filled message text (optional)
 */
function buildWhatsAppLink(phone, msg = "") {
  const normalised = _normalisePhone(phone).replace(/\+/,"");
  if (!normalised) return "#";
  const encoded = msg ? "?text=" + encodeURIComponent(msg) : "";
  return `https://wa.me/${normalised}${encoded}`;
}

/**
 * Build a mailto link.
 * @param {string} email
 * @param {string} subject
 * @param {string} body
 */
function buildEmailLink(email, subject = "", body = "") {
  if (!email) return "#";
  const s = subject ? "?subject=" + encodeURIComponent(subject) : "";
  const b = body    ? (subject ? "&body=" : "?body=") + encodeURIComponent(body) : "";
  return `mailto:${email}${s}${b}`;
}

/**
 * Build a pre-filled WhatsApp message for an order.
 * Used by admin to contact customer about their order.
 */
function buildOrderWhatsAppLink(order, adminMessage = "") {
  const items = order.items.map(i => `• ${i.name} ×${i.qty}${i.size ? " ("+i.size+")" : ""}`).join("\n");
  const msg   = adminMessage
    || `Hi ${order.customer.fullName},\n\nThis is FKA Atelier regarding your order *${order.id}*.\n\nItems:\n${items}\n\nTotal: ₦${(order.total||0).toLocaleString("en-NG")}\n\nPlease let us know if you have any questions.`;
  return buildWhatsAppLink(order.customer.phone, msg);
}

function buildOrderEmailLink(order, adminMessage = "") {
  const subject = `Your FKA Atelier Order — ${order.id}`;
  const body    = adminMessage
    || `Hi ${order.customer.fullName},\n\nThank you for your order (${order.id}).\n\nWe'll be in touch shortly with payment details.\n\nFKA Atelier Team`;
  return buildEmailLink(order.customer.email, subject, body);
}

/* ── Customer Operations ───────────────────────────────── */
function customerUpsert(data) {
  const customers = customersLoad();
  const email     = (data.email || "").toLowerCase().trim();
  let   customer  = customers.find(c => c.email === email);
  const isNew     = !customer;

  if (isNew) {
    customer = {
      id:          generateCustomerId(),
      email,
      firstName:   data.firstName || "",
      lastName:    data.lastName  || "",
      fullName:    data.fullName  || `${data.firstName||""} ${data.lastName||""}`.trim(),
      phone:       data.phone     || "",
      createdAt:   new Date().toISOString(),
      orderCount:  0,
      totalSpend:  0,
      lastOrderAt: null,
      addresses:   [],
      notes:       "",
      contactLog:  []
    };
    customers.push(customer);
  } else {
    if (data.firstName)  customer.firstName = data.firstName;
    if (data.lastName)   customer.lastName  = data.lastName;
    if (data.fullName)   customer.fullName  = data.fullName;
    if (data.phone)      customer.phone     = data.phone;
    if (!customer.contactLog)  customer.contactLog = [];
    if (!customer.notes)       customer.notes      = "";
    customer.fullName = customer.fullName || `${customer.firstName} ${customer.lastName}`.trim();
  }

  if (data.shippingAddress && data.shippingAddress.line1) {
    if (!customer.addresses) customer.addresses = [];
    const key    = `${data.shippingAddress.line1}|${data.shippingAddress.city}`.toLowerCase();
    const exists = customer.addresses.some(a => `${a.line1}|${a.city}`.toLowerCase() === key);
    if (!exists) {
      customer.addresses.unshift({ ...data.shippingAddress, addedAt: new Date().toISOString() });
      if (customer.addresses.length > 5) customer.addresses.pop();
    }
  }

  customersSave(customers);

  if (isNew) {
    _emitActivity("new_customer", {
      id: customer.id, fullName: customer.fullName,
      email: customer.email, phone: customer.phone
    });
  }

  return customer;
}

function customerGetById(id)        { return customersLoad().find(c => c.id === id) || null; }
function customerGetByEmail(email)  { return customersLoad().find(c => c.email === (email||"").toLowerCase()) || null; }
function customersGetAll()          { return customersLoad().sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)); }

function customersSearch(query) {
  if (!query) return customersGetAll();
  const q = query.toLowerCase();
  return customersLoad().filter(c =>
    (c.fullName||"").toLowerCase().includes(q) ||
    (c.email||"").toLowerCase().includes(q)    ||
    (c.phone||"").includes(q)                  ||
    (c.id||"").toLowerCase().includes(q)
  );
}

/**
 * Admin: add a note to a customer profile and log it.
 */
function customerAddNote(customerId, note, adminUser = "admin") {
  const customers = customersLoad();
  const c = customers.find(x => x.id === customerId);
  if (!c) return null;
  if (!c.contactLog) c.contactLog = [];
  const entry = { text: note, by: adminUser, ts: new Date().toISOString(), type: "note" };
  c.contactLog.unshift(entry);
  if (!c.notes) c.notes = "";
  customersSave(customers);
  _emitActivity("customer_note", { customerId, fullName: c.fullName, note });
  return c;
}

/**
 * Admin: log a contact action (whatsapp sent, email sent, call made).
 */
function customerLogContact(customerId, method, note = "", adminUser = "admin") {
  const customers = customersLoad();
  const c = customers.find(x => x.id === customerId);
  if (!c) return null;
  if (!c.contactLog) c.contactLog = [];
  c.contactLog.unshift({ method, note, by: adminUser, ts: new Date().toISOString(), type: "contact" });
  customersSave(customers);
  _emitActivity("customer_contacted", { customerId, fullName: c.fullName, method });
  return c;
}

/* ── Order Operations ──────────────────────────────────── */
function orderPlace(checkoutData, cartItems, deliveryInfo) {
  // Required field validation
  const required = ["firstName","lastName","email","phone","shippingLine1","shippingCity","shippingState"];
  for (const field of required) {
    if (!checkoutData[field] || !String(checkoutData[field]).trim())
      throw new Error(`Missing required field: ${field}`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutData.email))
    throw new Error("Invalid email address.");
  const phoneClean = checkoutData.phone.replace(/[\s\-()]/g,"");
  if (!/^(\+234|0)[789][01]\d{8}$/.test(phoneClean))
    throw new Error("Please enter a valid Nigerian phone number.");

  const shippingAddress = {
    line1:    checkoutData.shippingLine1.trim(),
    line2:    (checkoutData.shippingLine2||"").trim(),
    city:     checkoutData.shippingCity.trim(),
    state:    checkoutData.shippingState.trim(),
    fullText: [checkoutData.shippingLine1, checkoutData.shippingLine2,
               checkoutData.shippingCity, checkoutData.shippingState, "Nigeria"].filter(Boolean).join(", ")
  };
  const billingAddress = checkoutData.billingSameAsShipping ? { ...shippingAddress } : {
    line1:    (checkoutData.billingLine1||"").trim(),
    line2:    (checkoutData.billingLine2||"").trim(),
    city:     (checkoutData.billingCity||"").trim(),
    state:    (checkoutData.billingState||"").trim(),
    fullText: [checkoutData.billingLine1, checkoutData.billingLine2,
               checkoutData.billingCity, checkoutData.billingState, "Nigeria"].filter(Boolean).join(", ")
  };

  const subtotal    = cartItems.reduce((s,i) => s + (i.price * i.qty), 0);
  const deliveryFee = deliveryInfo ? deliveryInfo.fee : 0;
  const total       = subtotal + deliveryFee;

  const customer = customerUpsert({
    firstName: checkoutData.firstName.trim(),
    lastName:  checkoutData.lastName.trim(),
    fullName:  `${checkoutData.firstName} ${checkoutData.lastName}`.trim(),
    email:     checkoutData.email.trim().toLowerCase(),
    phone:     phoneClean,
    shippingAddress
  });


  // Save as a BOOKING (awaiting payment) — not a real order yet
  const bookingRef = generateBookingRef();
  const booking = {
    ref:        bookingRef,
    status:     "awaiting_payment",   // becomes "converted" after admin confirms
    customerId: customer.id,
    accountId:  checkoutData.accountId || null,
    orderData: {                      // full order snapshot saved here
      id:             null,           // filled in when payment confirmed
      customerId:     customer.id,
      accountId:      checkoutData.accountId || null,
      customer: {
        id:       customer.id,
        fullName: customer.fullName,
        email:    customer.email,
        phone:    customer.phone
      },
      items: cartItems.map(i => ({
        productId: i.productId, name: i.name,
        price: i.price, qty: i.qty,
        size: i.size||"", colour: i.colour||"",
        image: i.image||"", lineTotal: i.price * i.qty
      })),
      shippingAddress,
      billingAddress,
      deliveryZone:  deliveryInfo ? deliveryInfo.zone : null,
      deliveryFee,
      subtotal,
      total,
      status:        "pending",
      statusHistory: [],
      adminNotes:    [],
      notes:         (checkoutData.notes||"").trim(),
      paymentMethod: "bank_transfer",
      paymentStatus: "unpaid",
      createdAt:     new Date().toISOString(),
      updatedAt:     new Date().toISOString()
    },
    createdAt: new Date().toISOString()
  };

  const bookings = bookingsLoad();
  bookings.unshift(booking);
  bookingsSave(bookings);

  // DO NOT save to orders yet — order ID assigned after payment verified

  // Update customer profile (address) but NOT order count / spend yet
  // (those update when payment is confirmed)
  const allCustomers = customersLoad();
  const cust         = allCustomers.find(c => c.id === customer.id);
  if (cust) {
    // just bump a "pending" counter so admin can see interest
    cust.pendingBookings = (cust.pendingBookings || 0) + 1;
  }
  customersSave(allCustomers);

  if (typeof cartClear === "function") cartClear();

  _emitActivity("new_booking", {
    bookingRef,
    customer: { fullName: customer.fullName, email: customer.email, phone: customer.phone },
    total,
    items:    cartItems.length,
    zone:     deliveryInfo ? deliveryInfo.zone?.name : null
  });

  return { bookingRef, booking, total, customer, shippingAddress };
}

function orderGetById(id)              { return ordersLoad().find(o => o.id === id) || null; }
function ordersGetAll()                { return ordersLoad(); }
function ordersGetByCustomer(custId)   { return ordersLoad().filter(o => o.customerId === custId || o.accountId === custId); }
function ordersFilterByStatus(status)  { return !status||status==="all" ? ordersGetAll() : ordersLoad().filter(o => o.status===status); }

function ordersSearch(query) {
  if (!query) return ordersGetAll();
  const q = query.toLowerCase();
  return ordersLoad().filter(o =>
    (o.id||"").toLowerCase().includes(q)                ||
    (o.customer.fullName||"").toLowerCase().includes(q) ||
    (o.customer.email||"").toLowerCase().includes(q)    ||
    (o.customer.phone||"").includes(q)                  ||
    (o.status||"").includes(q)
  );
}

function orderUpdateStatus(orderId, newStatus, note = "", adminUser = "admin") {
  const orders = ordersLoad();
  const order  = orders.find(o => o.id === orderId);
  if (!order) return null;
  order.status    = newStatus;
  order.updatedAt = new Date().toISOString();
  order.statusHistory.push({
    status: newStatus, timestamp: new Date().toISOString(),
    note: note || `Status updated to ${newStatus}.`, by: adminUser
  });
  ordersSave(orders);
  _emitActivity("order_status_changed", { orderId, newStatus, customer: order.customer, total: order.total });
  return order;
}

function orderAddAdminNote(orderId, note, adminUser = "admin") {
  const orders = ordersLoad();
  const order  = orders.find(o => o.id === orderId);
  if (!order) return null;
  if (!order.adminNotes) order.adminNotes = [];
  order.adminNotes.unshift({ text: note, by: adminUser, ts: new Date().toISOString() });
  order.updatedAt = new Date().toISOString();
  ordersSave(orders);
  return order;
}

function orderUpdate(orderId, fields) {
  const orders = ordersLoad();
  const idx    = orders.findIndex(o => o.id === orderId);
  if (idx < 0) return null;
  orders[idx] = { ...orders[idx], ...fields, updatedAt: new Date().toISOString() };
  ordersSave(orders);
  return orders[idx];
}

function orderDelete(orderId) {
  ordersSave(ordersLoad().filter(o => o.id !== orderId));
  _emitActivity("order_deleted", { orderId });
}

/* ── Dashboard Stats ───────────────────────────────────── */
function getDashboardStats() {
  const orders    = ordersLoad();
  const customers = customersLoad();
  const activity  = activityLoad();
  const totalRevenue   = orders.reduce((s,o) => s + (o.total||0), 0);
  const totalOrders    = orders.length;
  const totalCustomers = customers.length;
  const thirtyDaysAgo  = new Date(Date.now() - 30*24*60*60*1000).toISOString();
  const recentOrders   = orders.filter(o => o.createdAt >= thirtyDaysAgo);
  const recentRevenue  = recentOrders.reduce((s,o) => s + (o.total||0), 0);
  const byStatus = {};
  Object.keys(ORDER_STATUSES).forEach(s => byStatus[s] = 0);
  orders.forEach(o => { if (byStatus[o.status] !== undefined) byStatus[o.status]++; });
  const productCount = {};
  orders.forEach(o => o.items.forEach(i => { productCount[i.name] = (productCount[i.name]||0) + i.qty; }));
  const topProducts  = Object.entries(productCount).sort((a,b) => b[1]-a[1]).slice(0,5).map(([name,qty]) => ({name,qty}));
  const revenueByDay = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    const dateStr    = d.toISOString().split("T")[0];
    const dayRevenue = orders.filter(o => o.createdAt.startsWith(dateStr)).reduce((s,o) => s + (o.total||0), 0);
    revenueByDay.push({ date: dateStr, revenue: dayRevenue });
  }
  const recentActivity = activity.slice(0, 20);
  return {
    totalRevenue, totalOrders, totalCustomers, recentRevenue,
    recentOrders: recentOrders.length, byStatus, latestOrders: orders.slice(0,5),
    topProducts, revenueByDay, recentActivity,
    avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    pendingCount:  byStatus.pending || 0
  };
}

/* ── Format helpers ────────────────────────────────────── */
function formatOrderDate(iso)     { if (!iso) return "—"; return new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}); }
function formatOrderTime(iso)     { if (!iso) return ""; return new Date(iso).toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"}); }
function getStatusBadgeHTML(s)    { const st = ORDER_STATUSES[s]||{label:s,color:"#6B7280"}; return `<span class="status-badge" style="background:${st.color}20;color:${st.color};border:1px solid ${st.color}40;">${st.label}</span>`; }

/* ── Activity helpers ──────────────────────────────────── */
function activityGetRecent(n = 20) { return activityLoad().slice(0, n); }
function activityGetLabel(entry) {
  const p = entry.payload || {};
  switch (entry.type) {
    case "new_booking":         return `New booking <strong>${p.bookingRef}</strong> from ${p.customer?.fullName||""} — ₦${(p.total||0).toLocaleString("en-NG")} (awaiting payment)`;
    case "payment_confirmed":   return `Payment confirmed for <strong>${p.orderId}</strong> (was ${p.bookingRef}) from ${p.customer?.fullName||""}`;
    case "new_order":           return `New order <strong>${p.orderId}</strong> from ${p.customer?.fullName||""} — ₦${(p.total||0).toLocaleString("en-NG")}`;
    case "new_customer":        return `New customer registered: <strong>${p.fullName||p.email}</strong>`;
    case "new_account":         return `New account created: <strong>${p.fullName||p.email}</strong>`;
    case "order_status_changed":return `Order <strong>${p.orderId}</strong> → <em>${p.newStatus}</em>`;
    case "customer_note":       return `Note added to <strong>${p.fullName}</strong>`;
    case "customer_contacted":  return `Contacted <strong>${p.fullName}</strong> via ${p.method}`;
    case "order_deleted":       return `Order <strong>${p.orderId}</strong> deleted`;
    default:                    return entry.type.replace(/_/g," ");
  }
}
function activityGetIcon(type) {
  const map = { new_order:"fa-bag-shopping", new_booking:"fa-clock", payment_confirmed:"fa-circle-check",
    new_customer:"fa-user-plus", new_account:"fa-user-plus",
    order_status_changed:"fa-rotate", customer_note:"fa-note-sticky",
    customer_contacted:"fa-comment", order_deleted:"fa-trash" };
  return "fa-regular " + (map[type] || "fa-circle-dot");
}

/* ── Demo data seeder ──────────────────────────────────── */
function seedDemoOrders() {
  if (ordersLoad().length > 0) return;

  const demoOrders = [
    { id:"FKA-DEMO01", customerId:"CUST-DEMO01", accountId:null,
      customer:{ id:"CUST-DEMO01", fullName:"Amina Hassan", email:"amina@example.com", phone:"08012345678" },
      items:[{ productId:"fka-001", name:"Noir Flow Abaya", price:65000, qty:1, size:"M", colour:"Noir", image:"", lineTotal:65000 }],
      shippingAddress:{ line1:"14 Ajose Adeogun Street", city:"Victoria Island", state:"Lagos", fullText:"14 Ajose Adeogun Street, Victoria Island, Lagos, Nigeria" },
      billingAddress: { line1:"14 Ajose Adeogun Street", city:"Victoria Island", state:"Lagos", fullText:"14 Ajose Adeogun Street, Victoria Island, Lagos, Nigeria" },
      deliveryZone:{ id:"zone-lagos-island", name:"Lagos Island" }, deliveryFee:0, subtotal:65000, total:65000,
      status:"delivered", paymentStatus:"paid", adminNotes:[],
      statusHistory:[{ status:"delivered", timestamp:new Date(Date.now()-86400000*2).toISOString(), note:"Delivered." }],
      createdAt:new Date(Date.now()-86400000*3).toISOString(), updatedAt:new Date(Date.now()-86400000*2).toISOString() },
    { id:"FKA-DEMO02", customerId:"CUST-DEMO02", accountId:null,
      customer:{ id:"CUST-DEMO02", fullName:"Fatima Abubakar", email:"fatima@example.com", phone:"09087654321" },
      items:[
        { productId:"fka-003", name:"Linen Grace Dress", price:58000, qty:1, size:"S", colour:"Sand", image:"", lineTotal:58000 },
        { productId:"fka-009", name:"Fluid Maxi Skirt",  price:38000, qty:1, size:"S", colour:"Ivory",image:"", lineTotal:38000 }
      ],
      shippingAddress:{ line1:"Plot 23 Maitama District", city:"Maitama", state:"FCT Abuja", fullText:"Plot 23 Maitama District, Maitama, FCT Abuja, Nigeria" },
      billingAddress: { line1:"Plot 23 Maitama District", city:"Maitama", state:"FCT Abuja", fullText:"Plot 23 Maitama District, Maitama, FCT Abuja, Nigeria" },
      deliveryZone:{ id:"zone-abuja", name:"Abuja (FCT)" }, deliveryFee:5500, subtotal:96000, total:101500,
      status:"shipped", paymentStatus:"paid", adminNotes:[],
      statusHistory:[
        { status:"pending", timestamp:new Date(Date.now()-86400000).toISOString(), note:"Order placed." },
        { status:"shipped", timestamp:new Date(Date.now()-43200000).toISOString(), note:"Dispatched." }
      ],
      createdAt:new Date(Date.now()-86400000).toISOString(), updatedAt:new Date(Date.now()-43200000).toISOString() },
    { id:"FKA-DEMO03", customerId:"CUST-DEMO03", accountId:null,
      customer:{ id:"CUST-DEMO03", fullName:"Zainab Okonkwo", email:"zainab@example.com", phone:"08099887766" },
      items:[{ productId:"fka-007", name:"Dusk Co-ord Set", price:62000, qty:1, size:"M", colour:"Dusk Rose", image:"", lineTotal:62000 }],
      shippingAddress:{ line1:"5 Bode Thomas Street", city:"Surulere", state:"Lagos", fullText:"5 Bode Thomas Street, Surulere, Lagos, Nigeria" },
      billingAddress: { line1:"5 Bode Thomas Street", city:"Surulere", state:"Lagos", fullText:"5 Bode Thomas Street, Surulere, Lagos, Nigeria" },
      deliveryZone:{ id:"zone-lagos-mainland", name:"Lagos Mainland" }, deliveryFee:3000, subtotal:62000, total:65000,
      status:"processing", paymentStatus:"pending", adminNotes:[],
      statusHistory:[
        { status:"pending",    timestamp:new Date(Date.now()-7200000).toISOString(), note:"Order placed." },
        { status:"confirmed",  timestamp:new Date(Date.now()-3600000).toISOString(), note:"Confirmed." },
        { status:"processing", timestamp:new Date(Date.now()-1800000).toISOString(), note:"Being prepared." }
      ],
      createdAt:new Date(Date.now()-7200000).toISOString(), updatedAt:new Date(Date.now()-1800000).toISOString() },
    { id:"FKA-DEMO04", customerId:"CUST-DEMO04", accountId:null,
      customer:{ id:"CUST-DEMO04", fullName:"Hauwa Ibrahim", email:"hauwa@example.com", phone:"07011223344" },
      items:[{ productId:"fka-002", name:"Pearl Drape Abaya", price:72000, qty:1, size:"L", colour:"Pearl", image:"", lineTotal:72000 }],
      shippingAddress:{ line1:"22 GRA Phase 2", city:"Port Harcourt", state:"Rivers", fullText:"22 GRA Phase 2, Port Harcourt, Rivers, Nigeria" },
      billingAddress: { line1:"22 GRA Phase 2", city:"Port Harcourt", state:"Rivers", fullText:"22 GRA Phase 2, Port Harcourt, Rivers, Nigeria" },
      deliveryZone:{ id:"zone-ph", name:"Port Harcourt" }, deliveryFee:6000, subtotal:72000, total:78000,
      status:"pending", paymentStatus:"unpaid", adminNotes:[],
      statusHistory:[{ status:"pending", timestamp:new Date().toISOString(), note:"Order placed." }],
      createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() }
  ];
  const demoCustomers = [
    { id:"CUST-DEMO01", email:"amina@example.com",  firstName:"Amina",  lastName:"Hassan",   fullName:"Amina Hassan",   phone:"08012345678", orderCount:1, totalSpend:65000,  lastOrderAt:demoOrders[0].createdAt, createdAt:new Date(Date.now()-86400000*10).toISOString(), addresses:[demoOrders[0].shippingAddress], notes:"", contactLog:[] },
    { id:"CUST-DEMO02", email:"fatima@example.com", firstName:"Fatima", lastName:"Abubakar", fullName:"Fatima Abubakar",phone:"09087654321", orderCount:1, totalSpend:101500, lastOrderAt:demoOrders[1].createdAt, createdAt:new Date(Date.now()-86400000*5).toISOString(),  addresses:[demoOrders[1].shippingAddress], notes:"", contactLog:[] },
    { id:"CUST-DEMO03", email:"zainab@example.com", firstName:"Zainab", lastName:"Okonkwo",  fullName:"Zainab Okonkwo", phone:"08099887766", orderCount:1, totalSpend:65000,  lastOrderAt:demoOrders[2].createdAt, createdAt:new Date(Date.now()-86400000*2).toISOString(),  addresses:[demoOrders[2].shippingAddress], notes:"", contactLog:[] },
    { id:"CUST-DEMO04", email:"hauwa@example.com",  firstName:"Hauwa",  lastName:"Ibrahim",  fullName:"Hauwa Ibrahim",  phone:"07011223344", orderCount:1, totalSpend:78000,  lastOrderAt:demoOrders[3].createdAt, createdAt:new Date().toISOString(),                        addresses:[demoOrders[3].shippingAddress], notes:"", contactLog:[] }
  ];
  ordersSave(demoOrders);
  customersSave(demoCustomers);
}


/* ── Booking helpers for admin ─────────────────────────── */

function bookingsSearch(query) {
  if (!query) return bookingsGetAll();
  const q = query.toLowerCase();
  return bookingsLoad().filter(b =>
    (b.ref||"").toLowerCase().includes(q) ||
    (b.orderData?.customer?.fullName||"").toLowerCase().includes(q) ||
    (b.orderData?.customer?.email||"").toLowerCase().includes(q) ||
    (b.orderData?.customer?.phone||"").includes(q)
  );
}

function bookingStatusBadge(status) {
  const map = {
    awaiting_payment: ["#92400E","#FEF3C7","Awaiting Payment"],
    converted:        ["#065F46","#D1FAE5","Payment Confirmed"],
    cancelled:        ["#991B1B","#FEE2E2","Cancelled"]
  };
  const [color, bg, label] = map[status] || ["#374151","#F3F4F6", status];
  return `<span class="adm-badge" style="color:${color};background:${bg};">${label}</span>`;
}

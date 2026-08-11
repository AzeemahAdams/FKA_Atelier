/* FKA ATELIER checkout.js v2 */

/* ── State ─────────────────────────────────────────────── */
let checkoutCurrentStep = 1;
const CHECKOUT_TOTAL_STEPS = 3;
let checkoutDeliveryInfo = null;
let checkoutFormData     = {};

/* ── Auth Gate ─────────────────────────────────────────── */
/**
 * Called on DOMContentLoaded for the checkout page.
 * If the user is not signed in, redirect to account page
 * and come back here after login.
 */
function checkoutAuthGate() {
  if (typeof authIsLoggedIn !== "function") return true; // auth.js not loaded
  if (!authIsLoggedIn()) {
    sessionStorage.setItem("fka_auth_return", "checkout.html");
    window.location.href = "account.html?mode=login";
    return false;
  }
  return true;
}

/* ── Pre-fill from account session ─────────────────────── */
function checkoutPrefillFromSession() {
  const session = (typeof authGetSession === "function") ? authGetSession() : null;
  if (!session) return;

  const set = (id, val) => { const el = document.getElementById(id); if (el && val && !el.value) el.value = val; };
  set("co-first-name", session.firstName || "");
  set("co-last-name",  (session.fullName || "").split(" ").slice(1).join(" ") || "");
  set("co-email",      session.email     || "");
  set("co-phone",      session.phone     || "");

  // Pre-fill most-recent address from account
  const account = (typeof authGetAccount === "function") ? authGetAccount(session.accountId) : null;
  if (account && account.addresses && account.addresses.length > 0) {
    const addr = account.addresses[0];
    set("co-shipping-line1", addr.line1  || "");
    set("co-shipping-line2", addr.line2  || "");
    set("co-shipping-city",  addr.city   || "");
    set("co-shipping-state", addr.state  || "");
  }
}

/* ── Step Navigation ───────────────────────────────────── */
function checkoutGoToStep(step) {
  if (step < 1 || step > CHECKOUT_TOTAL_STEPS) return;
  if (step > checkoutCurrentStep) {
    if (!checkoutValidateStep(checkoutCurrentStep)) return;
    checkoutCollectStep(checkoutCurrentStep);
  }
  checkoutCurrentStep = step;

  document.querySelectorAll(".checkout-step-indicator").forEach((el, idx) => {
    const n = idx + 1;
    el.classList.toggle("active",    n === step);
    el.classList.toggle("completed", n < step);
    el.classList.toggle("upcoming",  n > step);
  });
  document.querySelectorAll(".checkout-step-panel").forEach(panel => {
    panel.style.display = parseInt(panel.dataset.step) === step ? "block" : "none";
  });
  const pct = ((step - 1) / (CHECKOUT_TOTAL_STEPS - 1)) * 100;
  const bar = document.getElementById("checkout-progress-bar");
  if (bar) bar.style.width = pct + "%";

  if (step === 2) checkoutInitDeliveryStep();
  if (step === 3) checkoutInitReviewStep();

  const wrap = document.getElementById("checkout-form-wrapper");
  if (wrap) wrap.scrollIntoView({ behavior: "smooth", block: "start" });
}

function checkoutNext() { checkoutGoToStep(checkoutCurrentStep + 1); }
function checkoutBack() { checkoutCurrentStep--; checkoutGoToStep(checkoutCurrentStep); }

/* ── Validation ────────────────────────────────────────── */
function checkoutValidateStep(step) {
  clearCheckoutErrors();
  if (step === 1) return checkoutValidateCustomerDetails();
  if (step === 2) return checkoutValidateDelivery();
  return true;
}

function checkoutValidateCustomerDetails() {
  let valid = true;
  const fields = [
    { id:"co-first-name", label:"First name",   min:2 },
    { id:"co-last-name",  label:"Last name",    min:2 },
    { id:"co-email",      label:"Email",        type:"email" },
    { id:"co-phone",      label:"Phone number", type:"phone" }
  ];
  for (const f of fields) {
    const el = document.getElementById(f.id); if (!el) continue;
    const val = el.value.trim();
    if (!val)                                    { showFieldError(f.id, `${f.label} is required.`);         valid=false; continue; }
    if (f.min && val.length < f.min)             { showFieldError(f.id, `${f.label} must be at least ${f.min} characters.`); valid=false; }
    if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { showFieldError(f.id, "Valid email required."); valid=false; }
    if (f.type === "phone") {
      const c = val.replace(/[\s\-()]/g,"");
      if (!/^(\+234|0)[789][01]\d{8}$/.test(c)) { showFieldError(f.id, "Valid Nigerian phone required (e.g. 08012345678)."); valid=false; }
    }
  }
  return valid;
}

function checkoutValidateDelivery() {
  let valid = true;
  for (const f of [
    { id:"co-shipping-line1", label:"Street address" },
    { id:"co-shipping-city",  label:"City / Area" },
    { id:"co-shipping-state", label:"State" }
  ]) {
    const el = document.getElementById(f.id);
    if (el && !el.value.trim()) { showFieldError(f.id, `${f.label} is required.`); valid=false; }
  }
  const sameBilling = document.getElementById("co-billing-same");
  if (sameBilling && !sameBilling.checked) {
    for (const f of [
      { id:"co-billing-line1", label:"Billing street address" },
      { id:"co-billing-city",  label:"Billing city" },
      { id:"co-billing-state", label:"Billing state" }
    ]) {
      const el = document.getElementById(f.id);
      if (el && !el.value.trim()) { showFieldError(f.id, `${f.label} is required.`); valid=false; }
    }
  }
  return valid;
}

function showFieldError(fieldId, message) {
  const f = document.getElementById(fieldId); if (f) f.classList.add("co-input-error");
  const e = document.getElementById(`err-${fieldId}`); if (e) { e.textContent = message; e.style.display = "block"; }
}
function clearCheckoutErrors() {
  document.querySelectorAll(".co-input-error").forEach(el => el.classList.remove("co-input-error"));
  document.querySelectorAll(".co-field-error").forEach(el => { el.textContent = ""; el.style.display = "none"; });
}

/* ── Data Collection ───────────────────────────────────── */
function checkoutCollectStep(step) {
  if (step === 1) {
    checkoutFormData.firstName = (document.getElementById("co-first-name")?.value || "").trim();
    checkoutFormData.lastName  = (document.getElementById("co-last-name")?.value  || "").trim();
    checkoutFormData.email     = (document.getElementById("co-email")?.value      || "").trim().toLowerCase();
    checkoutFormData.phone     = (document.getElementById("co-phone")?.value      || "").trim();
    const s = (typeof authGetSession === "function") ? authGetSession() : null;
    checkoutFormData.accountId = s ? s.accountId : null;
  }
  if (step === 2) {
    checkoutFormData.shippingLine1 = (document.getElementById("co-shipping-line1")?.value || "").trim();
    checkoutFormData.shippingLine2 = (document.getElementById("co-shipping-line2")?.value || "").trim();
    checkoutFormData.shippingCity  = (document.getElementById("co-shipping-city")?.value  || "").trim();
    checkoutFormData.shippingState = (document.getElementById("co-shipping-state")?.value || "").trim();
    const sameBilling = document.getElementById("co-billing-same");
    checkoutFormData.billingSameAsShipping = sameBilling ? sameBilling.checked : true;
    if (!checkoutFormData.billingSameAsShipping) {
      checkoutFormData.billingLine1 = (document.getElementById("co-billing-line1")?.value || "").trim();
      checkoutFormData.billingLine2 = (document.getElementById("co-billing-line2")?.value || "").trim();
      checkoutFormData.billingCity  = (document.getElementById("co-billing-city")?.value  || "").trim();
      checkoutFormData.billingState = (document.getElementById("co-billing-state")?.value || "").trim();
    }
    checkoutFormData.notes = (document.getElementById("co-notes")?.value || "").trim();
  }
}

/* ── Delivery Step ─────────────────────────────────────── */
function checkoutInitDeliveryStep() {
  const fields = ["co-shipping-line1","co-shipping-line2","co-shipping-city","co-shipping-state"];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.addEventListener("input", checkoutUpdateDeliveryFee); el.addEventListener("change", checkoutUpdateDeliveryFee); }
  });
  const same    = document.getElementById("co-billing-same");
  const billing = document.getElementById("billing-address-block");
  if (same && billing) {
    const toggle = () => { billing.style.display = same.checked ? "none" : "block"; };
    same.addEventListener("change", toggle);
    toggle();
  }
  if (checkoutFormData.shippingLine1) {
    [["line1","shippingLine1"],["line2","shippingLine2"],["city","shippingCity"],["state","shippingState"]].forEach(([f,k]) => {
      const el = document.getElementById(`co-shipping-${f}`);
      if (el && checkoutFormData[k]) el.value = checkoutFormData[k];
    });
    checkoutUpdateDeliveryFee();
  }
}

function checkoutUpdateDeliveryFee() {
  const city    = (document.getElementById("co-shipping-city")?.value  || "").trim();
  const state   = (document.getElementById("co-shipping-state")?.value || "").trim();
  const line1   = (document.getElementById("co-shipping-line1")?.value || "").trim();
  const fullAddr= `${line1} ${city} ${state}`.trim();
  const subtotal= typeof cartGetSubtotal === "function" ? cartGetSubtotal() : 0;
  checkoutDeliveryInfo = (typeof calculateDeliveryFee === "function") ? calculateDeliveryFee(fullAddr, subtotal) : { fee:4500, isFree:false, message:"", zone:null, estimatedDays:"3–7 business days" };

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const feeEl = document.getElementById("co-delivery-fee-display");
  if (feeEl) { feeEl.textContent = checkoutDeliveryInfo.isFree ? "FREE" : `₦${checkoutDeliveryInfo.fee.toLocaleString("en-NG")}`; feeEl.style.color = checkoutDeliveryInfo.isFree ? "var(--warm-brown)" : "inherit"; }
  const msgEl = document.getElementById("co-delivery-message");
  if (msgEl) { msgEl.textContent = checkoutDeliveryInfo.message; msgEl.style.display = fullAddr.length > 3 ? "block" : "none"; }
  if (checkoutDeliveryInfo.zone) set("co-zone-name", checkoutDeliveryInfo.zone.name);
  if (checkoutDeliveryInfo.estimatedDays) set("co-delivery-eta", checkoutDeliveryInfo.estimatedDays);

  const sub = subtotal, fee = checkoutDeliveryInfo.fee;
  const summFee = document.getElementById("summary-delivery");
  const summTot = document.getElementById("summary-total");
  if (summFee) summFee.textContent = fee === 0 ? "FREE" : `₦${fee.toLocaleString("en-NG")}`;
  if (summTot) summTot.textContent = `₦${(sub + fee).toLocaleString("en-NG")}`;

  // Sync sidebar
  const sbarFee = document.getElementById("co-sidebar-fee");
  const sbarTot = document.getElementById("co-sidebar-total");
  if (sbarFee) sbarFee.textContent = fee === 0 ? "FREE" : `₦${fee.toLocaleString("en-NG")}`;
  if (sbarTot) sbarTot.textContent = `₦${(sub + fee).toLocaleString("en-NG")}`;
}

/* ── Review Step ───────────────────────────────────────── */
function checkoutInitReviewStep() {
  checkoutCollectStep(2);
  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  const row = (l, v) => `<div class="review-row"><span>${l}</span><strong>${v}</strong></div>`;

  // Signed-in session banner
  const session = (typeof authGetSession === "function") ? authGetSession() : null;
  const banner  = document.getElementById("review-auth-banner");
  if (banner && session) {
    banner.style.display = "flex";
    banner.innerHTML     = `<i class="fa-regular fa-circle-check" style="color:var(--warm-brown);flex-shrink:0;"></i> Signed in as <strong>${session.email}</strong>`;
  }

  set("review-customer",
    row("Name",  `${checkoutFormData.firstName} ${checkoutFormData.lastName}`) +
    row("Email", checkoutFormData.email) +
    row("Phone", checkoutFormData.phone));

  const shippingText = [checkoutFormData.shippingLine1, checkoutFormData.shippingLine2,
    checkoutFormData.shippingCity, checkoutFormData.shippingState, "Nigeria"].filter(Boolean).join(", ");
  let addrHTML = row("Ships to", shippingText);
  if (checkoutDeliveryInfo?.zone)          addrHTML += row("Zone",     checkoutDeliveryInfo.zone.name);
  if (checkoutDeliveryInfo?.estimatedDays) addrHTML += row("Delivery", checkoutDeliveryInfo.estimatedDays);
  set("review-address", addrHTML);

  const items = (typeof cartGetItems === "function") ? cartGetItems() : [];
  const itemsEl = document.getElementById("review-items");
  if (itemsEl) itemsEl.innerHTML = items.map(i => `
    <div class="review-item">
      <div class="review-item-img">${i.image ? `<img src="${i.image}" alt="${i.name}" onerror="this.style.display='none'">` : ""}</div>
      <div class="review-item-info">
        <div class="review-item-name">${i.name}</div>
        <div class="review-item-meta">${[i.size?"Size: "+i.size:"", i.colour?"Colour: "+i.colour:""].filter(Boolean).join(" | ")}</div>
        <div class="review-item-qty">Qty: ${i.qty}</div>
      </div>
      <div class="review-item-price">₦${(i.price * i.qty).toLocaleString("en-NG")}</div>
    </div>`).join("");

  const sub = (typeof cartGetSubtotal === "function") ? cartGetSubtotal() : 0;
  const fee = checkoutDeliveryInfo ? checkoutDeliveryInfo.fee : 0;
  const setT = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setT("review-subtotal", `₦${sub.toLocaleString("en-NG")}`);
  setT("review-delivery", fee === 0 ? "FREE" : `₦${fee.toLocaleString("en-NG")}`);
  setT("review-total",    `₦${(sub+fee).toLocaleString("en-NG")}`);
}

/* ── Place Order ───────────────────────────────────────── */
function checkoutPlaceOrder() {
  const btn = document.getElementById("btn-place-order");
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-regular fa-spinner fa-spin"></i> Submitting Order…'; }

  try {
    const cartItems = (typeof cartGetItems === "function") ? cartGetItems() : [];
    if (cartItems.length === 0) {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-regular fa-check"></i> Place Order'; }
      alert("Your bag is empty."); return;
    }
    if (!checkoutDeliveryInfo) {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-regular fa-check"></i> Place Order'; }
      alert("Please complete your delivery address first.");
      checkoutGoToStep(2); return;
    }

    // Returns { bookingRef, booking, total, customer, shippingAddress }
    const result = orderPlace(checkoutFormData, cartItems, checkoutDeliveryInfo);
    const { bookingRef, booking, total, customer, shippingAddress } = result;

    // Save address to account if signed in
    const session = (typeof authGetSession === "function") ? authGetSession() : null;
    if (session && typeof authUpdateProfile === "function") {
      authUpdateProfile({ address: shippingAddress });
    }

    // Hide form, show success screen
    document.getElementById("checkout-form-wrapper").style.display = "none";
    const successEl = document.getElementById("checkout-success");
    if (successEl) successEl.style.display = "block";

    // Show the BOOKING REFERENCE (not an Order ID)
    const refEl = document.getElementById("success-order-id");
    if (refEl) refEl.textContent = bookingRef;

    // Payment instructions block
    const payInstructEl = document.getElementById("success-payment-instructions");
    if (payInstructEl) {
      payInstructEl.innerHTML = `
        <div style="background:var(--cream);border:1px solid var(--border);padding:1.25rem 1.5rem;margin-bottom:1.25rem;text-align:left;">
          <div style="font-size:0.68rem;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:var(--text-dark);margin-bottom:0.75rem;">
            How to complete your order
          </div>
          <ol style="font-size:0.85rem;color:var(--text-mid);line-height:1.9;padding-left:1.2rem;margin:0;">
            <li>Send your payment of <strong>₦${total.toLocaleString("en-NG")}</strong> to our bank account.</li>
            <li>Take a screenshot of your payment receipt.</li>
            <li>Send the screenshot + your booking reference <strong>${bookingRef}</strong> to us via WhatsApp or email.</li>
            <li>Once we verify your payment, you will receive your <strong>Order ID</strong> — your order is then confirmed.</li>
          </ol>
          <div style="margin-top:1rem;padding:0.75rem 1rem;background:var(--white);border:1px solid var(--border);font-size:0.82rem;">
            <strong>Bank Details</strong><br>
            <span style="color:var(--text-mid);">Bank: <strong>[Your Bank Name]</strong></span><br>
            <span style="color:var(--text-mid);">Account Number: <strong>[Your Account Number]</strong></span><br>
            <span style="color:var(--text-mid);">Account Name: <strong>[Your Account Name]</strong></span>
          </div>
        </div>`;
    }

    // WhatsApp link — pre-filled with booking reference + total + items
    const waBtn = document.getElementById("btn-whatsapp-order");
    if (waBtn) {
      const itemsList = booking.orderData.items.map(i => `${i.name} ×${i.qty}${i.size ? " ("+i.size+")" : ""}`).join(", ");
      const message   = encodeURIComponent(
        `Hi FKA Atelier! 🤍\n\n` +
        `I'd like to complete my order.\n` +
        `Booking Reference: *${bookingRef}*\n` +
        `Items: ${itemsList}\n` +
        `Total: ₦${total.toLocaleString("en-NG")}\n` +
        `Delivers to: ${shippingAddress.fullText}\n\n` +
        `Please send me your bank details so I can make payment. Thank you!`
      );
      waBtn.href = `https://wa.me/2347019243312?text=${message}`;
    }

    // Email link — pre-filled
    const emailBtn = document.getElementById("btn-email-order");
    if (emailBtn) {
      const subject = encodeURIComponent(`Payment — Booking ${bookingRef}`);
      const itemsList = booking.orderData.items.map(i => `${i.name} x${i.qty}`).join(", ");
      const body = encodeURIComponent(
        `Hi FKA Atelier,\n\nI'd like to complete my order.\n\nBooking Reference: ${bookingRef}\nItems: ${itemsList}\nTotal: ₦${total.toLocaleString("en-NG")}\n\nPlease send me your bank details. Thank you.`
      );
      emailBtn.href = `mailto:hello@fkaatelier.com?subject=${subject}&body=${body}`;
    }

  } catch (err) {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-regular fa-check"></i> Place Order'; }
    alert(err.message || "Something went wrong. Please try again.");
  }
}
    }

  } catch (err) {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-regular fa-check"></i> Place Order'; }
    alert(err.message || "Something went wrong. Please try again.");
  }
}

/* ── Cart Summary Sidebar ──────────────────────────────── */
function checkoutRenderCartSummary() {
  const el = document.getElementById("checkout-cart-summary");
  if (!el || typeof cartGetItems !== "function") return;
  const items    = cartGetItems();
  const subtotal = typeof cartGetSubtotal === "function" ? cartGetSubtotal() : 0;

  if (items.length === 0) {
    el.innerHTML = `<p style="font-size:0.82rem;color:var(--text-light);text-align:center;padding:1rem 0;">Your bag is empty. <a href="shop.html">Browse pieces</a></p>`;
    return;
  }
  el.innerHTML = `
    <div class="co-cart-items">
      ${items.map(i => `
        <div class="co-cart-item">
          <div class="co-cart-item-img">${i.image ? `<img src="${i.image}" alt="${i.name}" onerror="this.style.display='none'">` : `<i class="fa-light fa-shirt"></i>`}</div>
          <div class="co-cart-item-info">
            <div class="co-cart-item-name">${i.name}</div>
            <div class="co-cart-item-meta">${[i.size?"Size "+i.size:"", i.colour||""].filter(Boolean).join(" · ")}</div>
          </div>
          <div class="co-cart-item-qty-price">
            <span class="co-qty-badge">${i.qty}</span>
            <span class="co-item-price">₦${(i.price*i.qty).toLocaleString("en-NG")}</span>
          </div>
        </div>`).join("")}
    </div>
    <div class="co-cart-totals">
      <div class="co-total-row"><span>Subtotal</span><span>₦${subtotal.toLocaleString("en-NG")}</span></div>
      <div class="co-total-row" id="co-sidebar-delivery"><span>Delivery</span><span id="co-sidebar-fee">—</span></div>
      <div class="co-total-row total"><span>Total</span><span id="co-sidebar-total">₦${subtotal.toLocaleString("en-NG")}</span></div>
    </div>`;
}

/* ── Init ──────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("checkout-form-wrapper")) return;

  // Auth gate — must be signed in to checkout
  if (!checkoutAuthGate()) return;

  // Show signed-in user in navbar area
  if (typeof authSyncNavbar === "function") authSyncNavbar();

  // Empty cart redirect
  if (typeof cartGetItems === "function" && cartGetItems().length === 0) {
    const wrapper = document.getElementById("checkout-form-wrapper");
    if (wrapper) wrapper.innerHTML = `
      <div style="text-align:center;padding:4rem 1.5rem;">
        <i class="fa-regular fa-bag-shopping" style="font-size:2.5rem;color:var(--taupe);display:block;margin-bottom:1rem;"></i>
        <h2 style="font-family:var(--font-serif);font-weight:300;margin-bottom:0.75rem;">Your bag is empty</h2>
        <p style="color:var(--text-mid);margin-bottom:1.5rem;">Add some pieces before checking out.</p>
        <a href="shop.html" class="btn-fka-primary">Browse All Pieces</a>
      </div>`;
    return;
  }

  checkoutRenderCartSummary();

  // Inject signed-in user banner above step 1
  const session = (typeof authGetSession === "function") ? authGetSession() : null;
  if (session) {
    const step1 = document.querySelector('.checkout-step-panel[data-step="1"] .co-panel-header');
    if (step1) {
      const banner = document.createElement("div");
      banner.className = "co-auth-session-banner";
      banner.innerHTML = `
        <i class="fa-regular fa-circle-check"></i>
        Signed in as <strong>${session.email}</strong>
        <a href="account.html" style="margin-left:auto;font-size:0.72rem;color:var(--warm-brown);text-decoration:underline;">My Account</a>`;
      step1.insertAdjacentElement("afterend", banner);
    }
  }

  checkoutGoToStep(1);
  checkoutPrefillFromSession();
});

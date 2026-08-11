/* ============================================================
   FKA ATELIER — Shopping Bag (Cart)
   Persisted in localStorage under key "fka_cart"
   ============================================================ */

const CART_KEY = "fka_cart";
const DELIVERY_THRESHOLD = 70000;
const DELIVERY_FEE = 4500;

/* ── Storage helpers ───────────────────────────────────── */

function cartLoad() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function cartSave(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  cartUpdateBadge();
}

/* ── Core operations ───────────────────────────────────── */

/**
 * Add a product to the cart.
 * @param {string} productId
 * @param {number} qty
 * @param {string} size
 * @param {string} colour
 */
function cartAdd(productId, qty = 1, size = "", colour = "") {
  const product = getProductById(productId);
  if (!product) return;

  const cart = cartLoad();
  const key = `${productId}__${size}__${colour}`;
  const existing = cart.find(i => i.key === key);

  if (existing) {
    existing.qty = Math.min(existing.qty + qty, 10);
  } else {
    cart.push({
      key,
      productId,
      name: product.name,
      price: product.price,
      priceFormatted: product.priceFormatted,
      image: product.images[0] || "",
      size,
      colour,
      qty
    });
  }

  cartSave(cart);
  showToast(`<i class="fa-regular fa-bag-shopping"></i> ${product.name} added to bag`);
  cartAnimateBadge();
}

/**
 * Remove an item from the cart by key.
 * @param {string} key
 */
function cartRemove(key) {
  let cart = cartLoad();
  cart = cart.filter(i => i.key !== key);
  cartSave(cart);
}

/**
 * Update quantity of an item.
 * @param {string} key
 * @param {number} newQty  0 removes item
 */
function cartUpdateQty(key, newQty) {
  if (newQty < 1) { cartRemove(key); return; }
  const cart = cartLoad();
  const item = cart.find(i => i.key === key);
  if (item) item.qty = Math.min(newQty, 10);
  cartSave(cart);
}

/**
 * Clear entire cart.
 */
function cartClear() {
  localStorage.removeItem(CART_KEY);
  cartUpdateBadge();
}

/**
 * Get cart items array.
 * @returns {Array}
 */
function cartGetItems() {
  return cartLoad();
}

/**
 * Get number of items in cart.
 * @returns {number}
 */
function cartGetCount() {
  return cartLoad().reduce((sum, i) => sum + i.qty, 0);
}

/**
 * Get cart subtotal.
 * @returns {number}
 */
function cartGetSubtotal() {
  return cartLoad().reduce((sum, i) => sum + (i.price * i.qty), 0);
}

/**
 * Get delivery fee based on subtotal.
 * @returns {number}
 */
function cartGetDeliveryFee() {
  return cartGetSubtotal() >= DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}

/**
 * Get order total.
 * @returns {number}
 */
function cartGetTotal() {
  return cartGetSubtotal() + cartGetDeliveryFee();
}

/* ── Badge update ──────────────────────────────────────── */

function cartUpdateBadge() {
  const count = cartGetCount();
  document.querySelectorAll(".cart-count").forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  });
}

function cartAnimateBadge() {
  document.querySelectorAll(".cart-count").forEach(el => {
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
    setTimeout(() => el.classList.remove("bump"), 300);
  });
}

/* ── Render cart page ──────────────────────────────────── */

function cartRenderPage() {
  const container = document.getElementById("cart-items-container");
  const emptyState = document.getElementById("cart-empty");
  const summaryEl  = document.getElementById("cart-summary");

  if (!container) return;

  const items = cartGetItems();

  if (items.length === 0) {
    container.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    if (summaryEl)  summaryEl.style.display = "none";
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  if (summaryEl)  summaryEl.style.display = "block";

  container.innerHTML = items.map(item => `
    <div class="cart-item" data-key="${item.key}">
      <div class="cart-item-img">
        <img src="${item.image}" alt="${item.name}" onerror="this.parentElement.innerHTML='<div class=\\'product-img-placeholder\\'><i class=\\'fa-light fa-shirt\\'></i></div>'">
      </div>
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">
          ${item.size ? `Size: ${item.size}` : ""}
          ${item.size && item.colour ? " &nbsp;|&nbsp; " : ""}
          ${item.colour ? `Colour: ${item.colour}` : ""}
        </div>
        <div class="cart-item-qty">
          <button class="cart-qty-btn" onclick="cartUpdateQty('${item.key}', ${item.qty - 1}); cartRenderPage();">−</button>
          <span class="cart-qty-val">${item.qty}</span>
          <button class="cart-qty-btn" onclick="cartUpdateQty('${item.key}', ${item.qty + 1}); cartRenderPage();">+</button>
        </div>
        <button class="cart-item-remove" onclick="cartRemove('${item.key}'); cartRenderPage();">Remove</button>
      </div>
      <div class="cart-item-price">${formatPrice(item.price * item.qty)}</div>
    </div>
  `).join("");

  cartRenderSummary();
}

function cartRenderSummary() {
  const subtotal  = cartGetSubtotal();
  const delivery  = cartGetDeliveryFee();
  const total     = cartGetTotal();

  const subEl  = document.getElementById("cart-subtotal");
  const delEl  = document.getElementById("cart-delivery");
  const totEl  = document.getElementById("cart-total");
  const delMsg = document.getElementById("cart-delivery-msg");

  if (subEl) subEl.textContent = formatPrice(subtotal);
  if (delEl) delEl.textContent = delivery === 0 ? "FREE" : formatPrice(delivery);
  if (totEl) totEl.textContent = formatPrice(total);
  if (delMsg) {
    if (delivery === 0) {
      delMsg.textContent = "Free delivery applied on this order.";
    } else {
      const remaining = DELIVERY_THRESHOLD - subtotal;
      delMsg.textContent = `Add ${formatPrice(remaining)} more for free delivery.`;
    }
  }
}

/* ── Init ──────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  cartUpdateBadge();
  if (document.getElementById("cart-items-container")) {
    cartRenderPage();
  }
});

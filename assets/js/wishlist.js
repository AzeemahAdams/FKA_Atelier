/* ============================================================
   FKA ATELIER — Wishlist
   Persisted in localStorage under key "fka_wishlist"
   ============================================================ */

const WISHLIST_KEY = "fka_wishlist";

/* ── Storage helpers ───────────────────────────────────── */

function wishlistLoad() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
  } catch {
    return [];
  }
}

function wishlistSave(list) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  wishlistUpdateBadge();
}

/* ── Core operations ───────────────────────────────────── */

/**
 * Check if a product is in the wishlist.
 * @param {string} productId
 * @returns {boolean}
 */
function wishlistHas(productId) {
  return wishlistLoad().some(i => i.productId === productId);
}

/**
 * Add product to wishlist.
 * @param {string} productId
 */
function wishlistAdd(productId) {
  const product = getProductById(productId);
  if (!product) return;
  if (wishlistHas(productId)) return;

  const list = wishlistLoad();
  list.push({
    productId,
    name: product.name,
    price: product.price,
    priceFormatted: product.priceFormatted,
    image: product.images[0] || "",
    category: product.categoryLabel,
    addedAt: Date.now()
  });
  wishlistSave(list);
  showToast(`<i class="fa-regular fa-heart"></i> ${product.name} added to wishlist`);
  wishlistAnimateBadge();
}

/**
 * Remove product from wishlist.
 * @param {string} productId
 */
function wishlistRemove(productId) {
  let list = wishlistLoad();
  list = list.filter(i => i.productId !== productId);
  wishlistSave(list);
}

/**
 * Toggle product in/out of wishlist.
 * @param {string} productId
 * @returns {boolean} true = now in wishlist
 */
function wishlistToggle(productId) {
  if (wishlistHas(productId)) {
    wishlistRemove(productId);
    return false;
  } else {
    wishlistAdd(productId);
    return true;
  }
}

/**
 * Get all wishlist items.
 * @returns {Array}
 */
function wishlistGetItems() {
  return wishlistLoad();
}

/**
 * Get wishlist count.
 * @returns {number}
 */
function wishlistGetCount() {
  return wishlistLoad().length;
}

/**
 * Move item from wishlist to cart.
 * @param {string} productId
 */
function wishlistMoveToCart(productId) {
  cartAdd(productId, 1, "", "");
  wishlistRemove(productId);
  if (document.getElementById("wishlist-grid")) {
    wishlistRenderPage();
  }
}

/* ── Badge update ──────────────────────────────────────── */

function wishlistUpdateBadge() {
  const count = wishlistGetCount();
  document.querySelectorAll(".wishlist-count").forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  });
}

function wishlistAnimateBadge() {
  document.querySelectorAll(".wishlist-count").forEach(el => {
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
    setTimeout(() => el.classList.remove("bump"), 300);
  });
}

/**
 * Sync all wishlist heart buttons on the page.
 */
function wishlistSyncButtons() {
  document.querySelectorAll("[data-wishlist-id]").forEach(btn => {
    const id = btn.dataset.wishlistId;
    const icon = btn.querySelector("i");
    if (wishlistHas(id)) {
      btn.classList.add("active");
      if (icon) { icon.classList.remove("fa-regular"); icon.classList.add("fa-solid"); }
    } else {
      btn.classList.remove("active");
      if (icon) { icon.classList.remove("fa-solid"); icon.classList.add("fa-regular"); }
    }
  });
}

/* ── Render wishlist page ──────────────────────────────── */

function wishlistRenderPage() {
  const grid    = document.getElementById("wishlist-grid");
  const empty   = document.getElementById("wishlist-empty");
  const counter = document.getElementById("wishlist-count-label");

  if (!grid) return;

  const items = wishlistGetItems();

  if (counter) counter.textContent = `${items.length} item${items.length !== 1 ? "s" : ""}`;

  if (items.length === 0) {
    grid.innerHTML = "";
    if (empty) empty.style.display = "block";
    return;
  }

  if (empty) empty.style.display = "none";

  grid.innerHTML = items.map(item => `
    <div class="product-card" data-id="${item.productId}">
      <div class="product-card-image">
        <img src="${item.image}" alt="${item.name}"
             onerror="this.parentElement.innerHTML='<div class=\\'product-img-placeholder\\'><i class=\\'fa-regular fa-shirt\\'></i><span>${item.category}</span></div>'">
        <button class="product-wishlist-btn active" data-wishlist-id="${item.productId}"
          onclick="wishlistToggle('${item.productId}'); wishlistRenderPage();" title="Remove from wishlist">
          <i class="fa-solid fa-heart"></i>
        </button>
      </div>
      <div class="product-card-info">
        <div class="product-card-category">${item.category}</div>
        <div class="product-card-name">${item.name}</div>
        <div class="product-card-price" style="margin-bottom:0.75rem">${item.priceFormatted}</div>
        <button class="btn-fka-outline" style="font-size:0.68rem;padding:0.6rem 1.2rem;width:100%"
          onclick="wishlistMoveToCart('${item.productId}')">
          Move to Bag
        </button>
      </div>
    </div>
  `).join("");
}

/* ── Init ──────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  wishlistUpdateBadge();
  wishlistSyncButtons();

  if (document.getElementById("wishlist-grid")) {
    wishlistRenderPage();
  }
});

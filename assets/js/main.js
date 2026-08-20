/* ============================================================
   FKA ATELIER — Main JavaScript
   Handles: navbar, mobile menu, search overlay, scroll animations,
   Ask FKA placeholder UI, toast notifications, modals,
   product card rendering, shop page filtering/sorting,
   product detail page, newsletter, FAQ accordion.
   ============================================================ */

"use strict";

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
function showToast(html, duration = 3000) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = html;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

/* ============================================================
   NAVBAR — sticky scroll shadow
   ============================================================ */
function initNavbar() {
  const navbar = document.querySelector(".fka-navbar");
  if (!navbar) return;
  const onScroll = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 20);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ============================================================
   ACTIVE NAV LINK
   ============================================================ */
function setActiveNavLink() {
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".navbar-nav-links a, .mobile-nav-links a").forEach(link => {
    const href = link.getAttribute("href") || "";
    if (href === current || (current === "" && href === "index.html")) {
      link.classList.add("active");
    }
  });
}

/* ============================================================
   MOBILE NAV DRAWER
   ============================================================ */
function initMobileNav() {
  const toggler  = document.querySelector(".navbar-toggler");
  const drawer   = document.getElementById("mobile-nav-drawer");
  const overlay  = document.getElementById("mobile-nav-overlay");
  const closeBtn = document.getElementById("mobile-nav-close");
  if (!toggler || !drawer) return;

  const open = () => {
    drawer.classList.add("open");
    if (overlay) overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    drawer.classList.remove("open");
    if (overlay) overlay.classList.remove("active");
    document.body.style.overflow = "";
  };

  toggler.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);
  if (overlay)  overlay.addEventListener("click", close);
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
}

/* ============================================================
   SEARCH OVERLAY
   ============================================================ */
function initSearch() {
  const openBtns  = document.querySelectorAll(".search-open-btn");
  const overlay   = document.getElementById("search-overlay");
  const closeBtn  = document.getElementById("search-overlay-close");
  const input     = document.getElementById("search-input");
  const results   = document.getElementById("search-results-preview");
  if (!overlay) return;

  const open = () => {
    overlay.classList.add("active");
    // No body scroll lock — search is a compact bar, not full-screen
    setTimeout(() => { if (input) input.focus(); }, 80);
  };
  const close = () => {
    overlay.classList.remove("active");
    if (input) input.value = "";
    if (results) results.innerHTML = "";
  };

  openBtns.forEach(btn => btn.addEventListener("click", e => { e.stopPropagation(); open(); }));
  if (closeBtn) closeBtn.addEventListener("click", close);

  // Close when clicking anywhere outside the inner panel
  document.addEventListener("click", e => {
    if (!overlay.classList.contains("active")) return;
    const inner = overlay.querySelector(".search-overlay-inner");
    if (inner && !inner.contains(e.target) && !e.target.closest(".search-open-btn")) close();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && overlay.classList.contains("active")) close(); });

  if (input && results) {
    let _searchTimer;
    input.addEventListener("input", () => {
      clearTimeout(_searchTimer);
      const q = input.value.trim();
      if (q.length < 2) { results.innerHTML = ""; return; }
      _searchTimer = setTimeout(async () => {
        if (typeof searchProducts !== "function") return;
        let found;
        try { found = await searchProducts(q); } catch { found = []; }
        found = found.slice(0, 8);
        if (found.length === 0) {
          results.innerHTML = `<span class="search-no-results">No results for "<strong>${q}</strong>" — <a href="${_shopUrl()}">Browse all</a></span>`;
          return;
        }
        results.innerHTML = found.map(p =>
          `<a href="${_productUrl(p.id)}" class="search-result-chip">${p.name}</a>`
        ).join("");
      }, 200);
    });
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        const q = input.value.trim();
        if (q) window.location.href = _shopUrl(`q=${encodeURIComponent(q)}`);
      }
    });
  }
}

/* ============================================================
   SCROLL-IN ANIMATIONS (Intersection Observer)
   ============================================================ */
function initFadeIn() {
  const els = document.querySelectorAll(".fade-in");
  if (!els.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => observer.observe(el));
}

/* ============================================================
   FAQ ACCORDION
   ============================================================ */
function initFaqAccordion() {
  document.querySelectorAll(".faq-question").forEach(btn => {
    btn.addEventListener("click", () => {
      const answer = btn.nextElementSibling;
      const isOpen = btn.classList.contains("open");

      // Close all
      document.querySelectorAll(".faq-question").forEach(b => {
        b.classList.remove("open");
        if (b.nextElementSibling) b.nextElementSibling.classList.remove("open");
      });

      if (!isOpen) {
        btn.classList.add("open");
        if (answer) answer.classList.add("open");
      }
    });
  });
}

/* ============================================================
   PRODUCT ACCORDION (product detail page)
   ============================================================ */
function initProductAccordion() {
  document.querySelectorAll(".product-accordion-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const content = btn.nextElementSibling;
      btn.classList.toggle("open");
      if (content) content.classList.toggle("open");
    });
  });
}

/* ============================================================
   NEWSLETTER FORM
   ============================================================ */
function initNewsletter() {
  document.querySelectorAll(".newsletter-form").forEach(form => {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const input   = form.querySelector(".newsletter-input");
      const success = form.parentElement.querySelector(".newsletter-success");
      if (input && input.value.trim()) {
        form.style.display = "none";
        if (success) success.style.display = "block";
      }
    });
  });
}

/* ============================================================
   MODAL UTILITY
   ============================================================ */
function openModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.remove("open");
  document.body.style.overflow = "";
}
function initModals() {
  // Open triggers
  document.querySelectorAll("[data-modal-open]").forEach(el => {
    el.addEventListener("click", () => openModal(el.dataset.modalOpen));
  });
  // Close triggers
  document.querySelectorAll("[data-modal-close]").forEach(el => {
    el.addEventListener("click", () => closeModal(el.dataset.modalClose));
  });
  // Close on overlay click
  document.querySelectorAll(".fka-modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      document.querySelectorAll(".fka-modal-overlay.open").forEach(o => closeModal(o.id));
    }
  });
}

/* ============================================================
   ASK FKA — logic fully handled by askfka.js
   This stub prevents main.js from conflicting with it.
   ============================================================ */
function initAskFka() {
  // askfka.js owns all Ask FKA panel behaviour.
  // If askfka.js is not loaded (e.g. on a page without AI),
  // wire the bare open/close so the button still works.
  if (typeof initAskFkaAI === "function") return; // askfka.js handles it

  const fabBtn   = document.getElementById("ask-fka-fab-btn");
  const navBtn   = document.querySelector(".ask-fka-nav-btn");
  const panel    = document.getElementById("ask-fka-panel");
  const closeBtn = document.getElementById("ask-fka-close");
  if (!panel) return;

  const open  = () => { panel.classList.add("open");    if (fabBtn) fabBtn.setAttribute("aria-expanded","true");  };
  const close = () => { panel.classList.remove("open"); if (fabBtn) fabBtn.setAttribute("aria-expanded","false"); };

  if (fabBtn)   fabBtn.addEventListener("click",   e => { e.stopPropagation(); panel.classList.contains("open") ? close() : open(); });
  if (navBtn)   navBtn.addEventListener("click",   () => { panel.classList.contains("open") ? close() : open(); });
  if (closeBtn) closeBtn.addEventListener("click", close);
}

/* ============================================================
   PATH HELPERS
   Product cards are rendered from multiple page depths:
     depth 0  → root/index.html
     depth 1  → admin/*.html
     depth 2  → pages/html/*.html
   We compute the correct relative path at runtime so every
   product link resolves to pages/html/product.html correctly.
   ============================================================ */
function _pageDepth() {
  const parts = window.location.pathname.replace(/\\/g, "/").split("/").filter(p => p && p !== "");
  // parts is e.g. [] for root, ["admin","products.html"] for admin page
  return Math.max(parts.length - 1, 0);
}
function _productUrl(id) {
  const d = _pageDepth();
  if (d === 0) return `pages/html/product.html?id=${encodeURIComponent(id)}`;
  if (d === 1) return `../pages/html/product.html?id=${encodeURIComponent(id)}`;
  return `product.html?id=${encodeURIComponent(id)}`;
}
function _shopUrl(qs) {
  const d = _pageDepth();
  const base = d === 0 ? "pages/html/shop.html" : d === 1 ? "../pages/html/shop.html" : "shop.html";
  return qs ? `${base}?${qs}` : base;
}

/* ============================================================
   PRODUCT CARD BUILDER
   Returns HTML string for a product card.
   ============================================================ */
function buildProductCard(product) {
  const badge = product.isNew
    ? `<span class="product-badge">New</span>`
    : product.isBestseller
      ? `<span class="product-badge bestseller">Bestseller</span>`
      : "";

  const img = product.images && product.images[0]
    ? `<img src="${product.images[0]}" alt="${product.name}" loading="lazy"
         onerror="this.parentElement.innerHTML='<div class=\\'product-img-placeholder\\'><i class=\\'fa-regular fa-shirt\\'></i><span>${product.categoryLabel}</span></div>'">`
    : `<div class="product-img-placeholder"><i class="fa-regular fa-shirt"></i><span>${product.categoryLabel}</span></div>`;

  return `
    <div class="product-card fade-in" data-id="${product.id}" data-category="${product.category}" data-price="${product.price}">
      <div class="product-card-image">
        ${img}
        ${badge}
        <button class="product-wishlist-btn" data-wishlist-id="${product.id}"
          onclick="event.preventDefault(); wishlistToggle('${product.id}'); wishlistSyncButtons();"
          title="Add to wishlist" aria-label="Add ${product.name} to wishlist">
          <i class="fa-regular fa-heart"></i>
        </button>
        <a href="${_productUrl(product.id)}" class="product-quick-view" tabindex="-1" aria-hidden="true">
          View Product
        </a>
      </div>
      <div class="product-card-info">
        <div class="product-card-category">${product.categoryLabel}</div>
        <a href="${_productUrl(product.id)}">
          <div class="product-card-name">${product.name}</div>
        </a>
        <div class="product-card-price">${product.priceFormatted}</div>
      </div>
    </div>`;
}

/* ============================================================
   RENDER A GRID OF PRODUCT CARDS
   ============================================================ */
function renderProductGrid(containerId, products) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!products || products.length === 0) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = products.map(buildProductCard).join("");
  wishlistSyncButtons();
  initFadeIn();
}

/* ============================================================
   SHOP PAGE — Filtering, Sorting, Search
   ============================================================ */
function initShopPage() {
  const grid        = document.getElementById("shop-products-grid");
  const noResults   = document.getElementById("shop-no-results");
  const countLabel  = document.getElementById("shop-result-count");
  const sortSelect  = document.getElementById("shop-sort");
  const priceSlider = document.getElementById("price-slider");
  const priceLabel  = document.getElementById("price-slider-max");
  const catBtns     = document.querySelectorAll(".filter-category-btn");
  if (!grid) return;

  let activeCategory = "all";
  let activeSort     = "newest";
  let maxPrice       = 200000;

  const params = new URLSearchParams(window.location.search);
  if (params.get("q")) {
    const qInput = document.getElementById("shop-search-input");
    if (qInput) qInput.value = params.get("q");
  }
  if (params.get("cat")) {
    activeCategory = params.get("cat");
    catBtns.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.category === activeCategory);
    });
  }

  async function applyFilters() {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-light);font-size:0.85rem;"><i class="fa-regular fa-spinner fa-spin"></i> Loading pieces…</div>`;

    let products = await getAllProducts().catch(() => FKA_PRODUCTS || []);

    if (activeCategory !== "all") {
      products = products.filter(p => (p.category || p.category) === activeCategory);
    }

    const qInput = document.getElementById("shop-search-input");
    if (qInput && qInput.value.trim().length > 1) {
      const q = qInput.value.trim().toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category_label||p.categoryLabel||"").toLowerCase().includes(q) ||
        (p.description||"").toLowerCase().includes(q) ||
        (p.colours||[]).some(c => c.name.toLowerCase().includes(q))
      );
    }

    products = products.filter(p => p.price <= maxPrice);
    products = await sortProducts(products, activeSort).catch(() => products);

    if (products.length === 0) {
      grid.innerHTML = "";
      if (noResults) noResults.classList.add("show");
    } else {
      if (noResults) noResults.classList.remove("show");
      renderProductGrid("shop-products-grid", products);
    }

    if (countLabel) {
      countLabel.textContent = `${products.length} piece${products.length !== 1 ? "s" : ""}`;
    }
  }

  catBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      catBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.category || "all";
      applyFilters();
    });
  });

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      activeSort = sortSelect.value;
      applyFilters();
    });
  }

  if (priceSlider) {
    priceSlider.addEventListener("input", () => {
      maxPrice = parseInt(priceSlider.value);
      if (priceLabel) priceLabel.textContent = formatPrice(maxPrice);
      applyFilters();
    });
    maxPrice = parseInt(priceSlider.value) || 200000;
    if (priceLabel) priceLabel.textContent = formatPrice(maxPrice);
  }

  const shopSearch = document.getElementById("shop-search-input");
  if (shopSearch) {
    shopSearch.addEventListener("input",   applyFilters);
    shopSearch.addEventListener("keydown", e => { if (e.key === "Enter") applyFilters(); });
  }

  applyFilters();
}

/* ============================================================
   PRODUCT DETAIL PAGE
   ============================================================ */
async function initProductPage() {
  const container = document.getElementById("product-detail-container");
  if (!container) return;

  const params    = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  if (!productId) return;

  container.innerHTML = `<div style="text-align:center;padding:5rem 1.5rem;"><i class="fa-regular fa-spinner fa-spin" style="font-size:2rem;color:var(--taupe);"></i></div>`;

  const product = await getProductById(productId).catch(()=>null);

  if (!product) {
    container.innerHTML = `
      <div style="text-align:center;padding:5rem 1.5rem;">
        <h2 style="font-family:var(--font-serif);font-weight:300;margin-bottom:1rem;">Product Not Found</h2>
        <p style="color:var(--text-mid);margin-bottom:1.5rem;">We couldn't find that product.</p>
        <a href="shop.html" class="btn-fka-primary">Browse All Pieces</a>
      </div>`;
    return;
  }

  // Guard arrays defensively - a missing field crashes the whole render
  const colours    = Array.isArray(product.colours)     ? product.colours     : [];
  const sizes      = Array.isArray(product.sizes)       ? product.sizes       : ["XS","S","M","L","XL","XXL"];
  const images     = Array.isArray(product.images)      ? product.images      : [];
  const collections= Array.isArray(product.collections) ? product.collections : [];
  const firstImage = images[0] || "";
  const firstColour= colours[0] || { name:"Default", hex:"#C4B5A5" };
  const firstSize  = sizes[0]   || "";

  // Build colour swatches
  const swatches = colours.map((c, i) => `
    <span class="colour-swatch ${i === 0 ? "active" : ""}"
      style="background:${c.hex};"
      data-name="${c.name}"
      data-colour="${c.name}"
      title="${c.name}"
      tabindex="0" role="button" aria-label="${c.name}">
    </span>`).join("");

  // Build size buttons (use guarded `sizes` array)
  const sizeBtns = sizes.map((s, i) => `
    <button class="size-btn ${i === 0 ? "active" : ""}" data-size="${s}">${s}</button>`).join("");

  // Build thumbnails (use guarded `images` array)
  const thumbs = images.map((img, i) => `
    <div class="product-thumb ${i === 0 ? "active" : ""}" data-index="${i}" tabindex="0" role="button" aria-label="View image ${i+1}">
      <img src="${img}" alt="${product.name} view ${i+1}"
        onerror="this.parentElement.style.background='var(--cream)'">
    </div>`).join("");

  // Care info list
  const fabricHtml = `<p><strong>Fabric:</strong> ${product.fabric}</p>`;
  const careHtml   = `<p>${product.care}</p>`;

  const badge = product.isNew ? `<span class="product-badge" style="position:static;display:inline-block;margin-bottom:0.75rem;">New Arrival</span>` : "";

  container.innerHTML = `
    <div class="product-detail-layout">
      <!-- Gallery -->
      <div class="product-gallery">
        <div class="product-main-img" id="product-main-img">
          <img id="product-main-img-el" src="${firstImage}" alt="${product.name}"
            onerror="this.parentElement.innerHTML='<div class=\\'product-img-placeholder\\'><i class=\\'fa-regular fa-shirt\\'></i></div>'">
        </div>
        ${images.length > 1 ? `<div class="product-thumbnails">${thumbs}</div>` : ""}
      </div>

      <!-- Info -->
      <div class="product-detail-info">
        ${badge}
        <div class="product-detail-category">${product.categoryLabel}</div>
        <h1 class="product-detail-name">${product.name}</h1>
        <div class="product-detail-price">${product.priceFormatted || (product.price ? "₦" + Number(product.price).toLocaleString() : "")}</div>
        <p class="product-detail-desc">${product.description}</p>

        <!-- Colours -->
        <span class="option-label">Colour <span id="selected-colour-label" style="color:var(--warm-brown);font-weight:400;">${firstColour.name}</span></span>
        <div class="colour-swatches">${swatches}</div>

        <!-- Sizes -->
        <span class="option-label">
          Size <span id="selected-size-label" style="color:var(--warm-brown);font-weight:400;">${firstSize}</span>
          <span class="size-guide-link" data-modal-open="modal-size-guide">Size Guide</span>
        </span>
        <div class="size-btns">${sizeBtns}</div>

        <!-- Quantity -->
        <span class="option-label">Quantity</span>
        <div class="quantity-selector">
          <button class="qty-btn" id="qty-minus" aria-label="Decrease quantity">−</button>
          <div class="qty-value" id="qty-value">1</div>
          <button class="qty-btn" id="qty-plus" aria-label="Increase quantity">+</button>
        </div>

        <!-- Add to bag + wishlist -->
        <div class="product-add-actions">
          <button class="btn-add-to-bag" id="btn-add-to-bag">
            <i class="fa-regular fa-bag-shopping" style="margin-right:0.5rem;"></i> Add to Bag
          </button>
          <button class="btn-add-to-wishlist-detail" id="btn-wishlist-detail"
            data-wishlist-id="${product.id}" aria-label="Add to wishlist">
            <i class="fa-regular fa-heart"></i>
          </button>
        </div>

        <!-- Custom measurements banner -->
        <div class="custom-measure-banner">
          <i class="fa-regular fa-ruler"></i>
          <div class="custom-measure-banner-text">
            <strong>Custom Measurements Accepted.</strong><br>
            Prefer a perfect fit? We accept your measurements.
            <a href="measurements.html" class="size-guide-link" style="margin-left:0;">How do custom measurements work?</a>
          </div>
        </div>

        <!-- Accordion -->
        <div class="product-accordion">
          <div class="product-accordion-item">
            <button class="product-accordion-btn">Fabric & Materials <i class="fa-solid fa-chevron-down"></i></button>
            <div class="product-accordion-content">${fabricHtml}</div>
          </div>
          <div class="product-accordion-item">
            <button class="product-accordion-btn">Care Instructions <i class="fa-solid fa-chevron-down"></i></button>
            <div class="product-accordion-content">${careHtml}</div>
          </div>
          <div class="product-accordion-item">
            <button class="product-accordion-btn">Delivery & Returns <i class="fa-solid fa-chevron-down"></i></button>
            <div class="product-accordion-content">
              <p>Free delivery on orders over ₦70,000. Standard delivery ₦4,500.
              Custom orders may require additional processing time.
              <a href="shipping.html" style="color:var(--warm-brown);">Delivery info</a> &nbsp;|&nbsp;
              <a href="returns.html" style="color:var(--warm-brown);">Returns policy</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  // Image thumbnail switching
  document.querySelectorAll(".product-thumb").forEach(thumb => {
    thumb.addEventListener("click", () => {
      const idx = parseInt(thumb.dataset.index);
      const mainImg = document.getElementById("product-main-img-el");
      if (mainImg && images[idx]) mainImg.src = images[idx];
      document.querySelectorAll(".product-thumb").forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
    });
  });

  // Colour selection
  let selectedColour = firstColour.name;
  document.querySelectorAll(".colour-swatch").forEach(sw => {
    sw.addEventListener("click", () => {
      document.querySelectorAll(".colour-swatch").forEach(s => s.classList.remove("active"));
      sw.classList.add("active");
      selectedColour = sw.dataset.colour;
      const label = document.getElementById("selected-colour-label");
      if (label) label.textContent = selectedColour;
    });
  });

  // Size selection
  let selectedSize = firstSize;
  document.querySelectorAll(".size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedSize = btn.dataset.size;
      const label = document.getElementById("selected-size-label");
      if (label) label.textContent = selectedSize;
    });
  });

  // Quantity selector
  let qty = 1;
  const qtyVal = document.getElementById("qty-value");
  document.getElementById("qty-minus")?.addEventListener("click", () => {
    if (qty > 1) { qty--; if (qtyVal) qtyVal.textContent = qty; }
  });
  document.getElementById("qty-plus")?.addEventListener("click", () => {
    if (qty < 10) { qty++; if (qtyVal) qtyVal.textContent = qty; }
  });

  // Add to bag
  document.getElementById("btn-add-to-bag")?.addEventListener("click", () => {
    cartAdd(product.id, qty, selectedSize, selectedColour);
  });

  // Wishlist
  const wishBtn = document.getElementById("btn-wishlist-detail");
  if (wishBtn) {
    const syncWishBtn = () => {
      const inList = wishlistHas(product.id);
      wishBtn.classList.toggle("active", inList);
      const icon = wishBtn.querySelector("i");
      if (icon) {
        icon.className = inList ? "fa-solid fa-heart" : "fa-regular fa-heart";
      }
    };
    syncWishBtn();
    wishBtn.addEventListener("click", () => {
      wishlistToggle(product.id);
      syncWishBtn();
    });
  }

  // Init accordion & modals now that DOM is built
  initProductAccordion();
  initModals();

  // Update breadcrumb if present
  const breadcrumbProduct = document.getElementById("breadcrumb-product-name");
  if (breadcrumbProduct) breadcrumbProduct.textContent = product.name;

  // Update page title
  document.title = `${product.name} — FKA Atelier`;
}

/* ============================================================
   HOMEPAGE — New Arrivals render
   ============================================================ */
async function initHomePage() {
  const grid = document.getElementById("new-arrivals-grid");
  if (!grid) return;
  if (typeof getNewArrivals === "function") {
    const products = await getNewArrivals(4);
    renderProductGrid("new-arrivals-grid", products);
  }
}

/* ============================================================
   COLLECTIONS PAGE — per-collection grids
   ============================================================ */
async function initCollectionsPage() {
  const grids = document.querySelectorAll("[data-collection-grid]");
  for (const grid of grids) {
    const slug     = grid.dataset.collectionGrid;
    const products = await getProductsByCollection(slug).catch(()=>[]);
    renderProductGrid(grid.id, products.slice(0,4));
  }
}

/* ============================================================
   CONTACT FORM — placeholder submit handler
   ============================================================ */
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const btn = form.querySelector("[type=submit]");
    if (btn) btn.textContent = "Message Sent — We'll be in touch soon.";
    btn.disabled = true;
    showToast('<i class="fa-regular fa-check"></i> Your message has been received. We\'ll be in touch shortly.');
    setTimeout(() => {
      form.reset();
      btn.textContent = "Send Message";
      btn.disabled = false;
    }, 5000);
  });
}

/* ============================================================
   SMOOTH SCROLL for anchor links
   ============================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", e => {
      const target = document.querySelector(link.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

/* ============================================================
   HERO — Subtle parallax on scroll
   ============================================================ */
function initHeroParallax() {
  const heroImg = document.querySelector(".hero-image-col img");
  if (!heroImg || window.innerWidth < 900) return;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    heroImg.style.transform = `translateY(${y * 0.12}px)`;
  }, { passive: true });
}

/* ============================================================
   REAL-TIME PRODUCT SYNC
   Listens for admin product changes via both BroadcastChannel
   (same-device cross-tab) and storage events (different origins),
   then refreshes visible product grids without a page reload.
   ============================================================ */
function initProductSync() {
  // BroadcastChannel — fires when admin saves in any tab on same browser
  try {
    const bc = new BroadcastChannel("fka_products_channel");
    bc.onmessage = () => _refreshGrids();
  } catch {}

  // storage event — fires in OTHER tabs when localStorage changes
  window.addEventListener("storage", e => {
    if (e.key === "fka_admin_products_overrides") _refreshGrids();
  });
}

function _refreshGrids() {
  if (document.getElementById("shop-products-grid"))           initShopPage();
  if (document.getElementById("new-arrivals-grid"))            initHomePage();
  if (document.getElementById("product-detail-container"))     initProductPage();
  if (document.querySelectorAll("[data-collection-grid]").length) initCollectionsPage();
  if (typeof wishlistSyncButtons === "function")               wishlistSyncButtons();
}

/* ============================================================
   GLOBAL INIT — runs on every page
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  // Initialise Supabase auth state listener first
  if (typeof initAuthListener === "function") initAuthListener();

  initNavbar();
  setActiveNavLink();
  initMobileNav();
  initSearch();
  initFadeIn();
  initFaqAccordion();
  initNewsletter();
  initModals();
  initAskFka();
  initSmoothScroll();
  initHeroParallax();

  initProductSync();

  // Page-specific inits
  initHomePage();
  initShopPage();
  initProductPage();
  initCollectionsPage();
  initContactForm();
});

/* ============================================================
   UTILITY — URL param helper
   ============================================================ */
function getUrlParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

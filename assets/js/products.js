/* ============================================================
   FKA ATELIER â€” Product Data Catalogue
   Add / edit products here. Each product follows the schema below.
   ============================================================ */

const FKA_PRODUCTS = [

  /* â”€â”€ ABAYAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  {
    id: "fka-001",
    name: "Noir Flow Abaya",
    category: "abayas",
    categoryLabel: "Abayas",
    price: 65000,
    priceFormatted: "₦65,000",
    images: [
      "https://images.unsplash.com/photo-1601762603339-fd61e28b698a?w=600&q=80",
      "https://images.unsplash.com/photo-1585914924626-15adac1e6402?w=600&q=80"
    ],
    description: "A flowing, full-length abaya in deep noir crepe. Effortlessly modest and undeniably elegant, with subtle side slits for graceful movement. Designed for the woman who commands presence with ease.",
    fabric: "Premium crepe with silk lining",
    colours: [
      { name: "Noir", hex: "#1A1A1A" },
      { name: "Midnight Navy", hex: "#1B2A4A" },
      { name: "Deep Forest", hex: "#2C4A3E" }
    ],
    sizes: ["XS","S","M","L","XL","XXL"],
    care: "Dry clean recommended. Hand wash in cold water. Do not tumble dry.",
    available: true,
    isNew: true,
    isBestseller: false,
    collections: ["new-collection","occasion-wear"]
  },

  {
    id: "fka-002",
    name: "Pearl Drape Abaya",
    category: "abayas",
    categoryLabel: "Abayas",
    price: 72000,
    priceFormatted: "₦72,000",
    images: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4b4357?w=600&q=80",
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80"
    ],
    description: "Softly draped in pearl-toned fabric, this abaya wraps you in quiet luxury. The relaxed open-front silhouette and fluid movement make it ideal for both formal and everyday wear.",
    fabric: "Satin-touch chiffon blend",
    colours: [
      { name: "Pearl", hex: "#F0EAE0" },
      { name: "Blush", hex: "#E8D0C8" },
      { name: "Stone", hex: "#B8A898" }
    ],
    sizes: ["XS","S","M","L","XL","XXL"],
    care: "Hand wash cold. Iron on low heat. Do not bleach.",
    available: true,
    isNew: false,
    isBestseller: true,
    collections: ["signature","occasion-wear"]
  },

  /* â”€â”€ DRESSES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  {
    id: "fka-003",
    name: "Linen Grace Dress",
    category: "dresses",
    categoryLabel: "Dresses",
    price: 58000,
    priceFormatted: "₦58,000",
    images: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80",
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80"
    ],
    description: "An effortless essential designed for timeless elegance. Lightweight, comfortable and beautifully modest. The relaxed linen silhouette moves with you and keeps you cool throughout the day.",
    fabric: "100% natural linen",
    colours: [
      { name: "Sand", hex: "#C4A882" },
      { name: "Ivory", hex: "#FAF7F2" },
      { name: "Sage", hex: "#8FAF8A" }
    ],
    sizes: ["XS","S","M","L","XL","XXL"],
    care: "Machine wash cold, gentle cycle. Tumble dry low. Iron while slightly damp.",
    available: true,
    isNew: true,
    isBestseller: false,
    collections: ["new-collection","everyday-elegance"]
  },

  {
    id: "fka-004",
    name: "Sage Pleat Dress",
    category: "dresses",
    categoryLabel: "Dresses",
    price: 57000,
    priceFormatted: "₦57,000",
    images: [
      "https://images.unsplash.com/photo-1495385794356-15371f348318?w=600&q=80",
      "https://images.unsplash.com/photo-1529629468928-3c9b4f9b3b7a?w=600&q=80"
    ],
    description: "Delicate pleating at the waist creates gentle volume and movement in this softly toned sage dress. A refined piece that transitions seamlessly from daytime to evening.",
    fabric: "Woven polyester with cotton lining",
    colours: [
      { name: "Sage", hex: "#8FAF8A" },
      { name: "Dusty Lilac", hex: "#B8A8C8" },
      { name: "Warm White", hex: "#F5F0EA" }
    ],
    sizes: ["XS","S","M","L","XL","XXL"],
    care: "Hand wash or machine wash cold. Do not tumble dry.",
    available: true,
    isNew: true,
    isBestseller: false,
    collections: ["new-collection","everyday-elegance"]
  },

  {
    id: "fka-005",
    name: "Velvet Evening Dress",
    category: "dresses",
    categoryLabel: "Dresses",
    price: 84000,
    priceFormatted: "₦84,000",
    images: [
      "https://images.unsplash.com/photo-1548549557-dbe9946621da?w=600&q=80",
      "https://images.unsplash.com/photo-1518616888639-fd41ebb7fdb2?w=600&q=80"
    ],
    description: "Crafted from rich velvet, this long-sleeved evening dress is a study in restrained glamour. The column silhouette and high neckline deliver sophistication without compromise.",
    fabric: "Luxury velvet with full lining",
    colours: [
      { name: "Burgundy", hex: "#6B1A2A" },
      { name: "Midnight", hex: "#1A1A2E" },
      { name: "Forest", hex: "#2C4A3E" }
    ],
    sizes: ["XS","S","M","L","XL","XXL"],
    care: "Dry clean only. Store hanging to avoid crushing velvet pile.",
    available: true,
    isNew: false,
    isBestseller: true,
    collections: ["signature","occasion-wear"]
  },

  {
    id: "fka-006",
    name: "Ivory Maxi Dress",
    category: "dresses",
    categoryLabel: "Dresses",
    price: 62000,
    priceFormatted: "₦62,000",
    images: [
      "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&q=80",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80"
    ],
    description: "Pure and serene in ivory, this flowing maxi dress features a relaxed long-sleeve design and a gracefully flared hem. Simple, modest and completely timeless.",
    fabric: "Soft woven cotton blend",
    colours: [
      { name: "Ivory", hex: "#FAF7F2" },
      { name: "Cream", hex: "#F5EFE6" },
      { name: "Nude", hex: "#D4C4B5" }
    ],
    sizes: ["XS","S","M","L","XL","XXL"],
    care: "Machine wash cold. Iron on medium heat. Do not bleach.",
    available: true,
    isNew: false,
    isBestseller: false,
    collections: ["everyday-elegance"]
  },

  /* â”€â”€ CO-ORD SETS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  {
    id: "fka-007",
    name: "Dusk Co-ord Set",
    category: "coord-sets",
    categoryLabel: "Co-ord Sets",
    price: 62000,
    priceFormatted: "₦62,000",
    images: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80",
      "https://images.unsplash.com/photo-1561677978-583a6c32e5f8?w=600&q=80"
    ],
    description: "A beautifully matched two-piece set in the soft warmth of dusk-toned fabric. The relaxed wide-leg trousers and longline top create an effortlessly polished look that works for any occasion.",
    fabric: "Structured crepe â€” top and trousers",
    colours: [
      { name: "Dusk Rose", hex: "#D4A0A0" },
      { name: "Warm Taupe", hex: "#C4B5A5" },
      { name: "Muted Olive", hex: "#A0A878" }
    ],
    sizes: ["XS","S","M","L","XL","XXL"],
    care: "Hand wash cold. Do not tumble dry. Iron on low.",
    available: true,
    isNew: true,
    isBestseller: false,
    collections: ["new-collection","everyday-elegance"]
  },

  {
    id: "fka-008",
    name: "Latte Linen Co-ord",
    category: "coord-sets",
    categoryLabel: "Co-ord Sets",
    price: 68000,
    priceFormatted: "₦68,000",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
      "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=600&q=80"
    ],
    description: "Relaxed and refined in natural linen. The boxy blazer-style top and matching wide trousers make a quiet statement about considered dressing. Wear together or as separates.",
    fabric: "100% linen â€” top and trousers",
    colours: [
      { name: "Latte", hex: "#C8A882" },
      { name: "Natural", hex: "#D8CFC4" }
    ],
    sizes: ["XS","S","M","L","XL","XXL"],
    care: "Machine wash cold, gentle. Iron while slightly damp.",
    available: true,
    isNew: false,
    isBestseller: true,
    collections: ["everyday-elegance","signature"]
  },

  /* â”€â”€ SKIRTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  {
    id: "fka-009",
    name: "Fluid Maxi Skirt",
    category: "skirts",
    categoryLabel: "Skirts",
    price: 38000,
    priceFormatted: "₦38,000",
    images: [
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&q=80",
      "https://images.unsplash.com/photo-1594938298603-c8148c4b4357?w=600&q=80"
    ],
    description: "A full-length skirt with a beautifully fluid drape. The elasticated waistband provides comfort and ease, while the clean, unstructured silhouette creates effortless elegance.",
    fabric: "Viscose crepe",
    colours: [
      { name: "Ivory", hex: "#FAF7F2" },
      { name: "Sand", hex: "#C4A882" },
      { name: "Black", hex: "#1A1A1A" }
    ],
    sizes: ["XS","S","M","L","XL","XXL"],
    care: "Hand wash or delicate machine cycle. Hang to dry.",
    available: true,
    isNew: false,
    isBestseller: false,
    collections: ["everyday-elegance"]
  },

  {
    id: "fka-010",
    name: "Pleated Midi Skirt",
    category: "skirts",
    categoryLabel: "Skirts",
    price: 42000,
    priceFormatted: "₦42,000",
    images: [
      "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=600&q=80",
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80"
    ],
    description: "Fine pleating creates movement and structure in this midi skirt. Pair with any FKA top for a complete modest look, or style with your own pieces for versatility.",
    fabric: "Polyester chiffon with satin lining",
    colours: [
      { name: "Blush", hex: "#E8D0C8" },
      { name: "Sage", hex: "#8FAF8A" },
      { name: "Taupe", hex: "#C4B5A5" }
    ],
    sizes: ["XS","S","M","L","XL","XXL"],
    care: "Hand wash cold. Do not wring. Hang dry.",
    available: true,
    isNew: false,
    isBestseller: true,
    collections: ["everyday-elegance","signature"]
  },

  /* â”€â”€ TOPS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  {
    id: "fka-011",
    name: "Drape Shoulder Top",
    category: "tops",
    categoryLabel: "Tops",
    price: 32000,
    priceFormatted: "₦32,000",
    images: [
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80",
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80"
    ],
    description: "A soft, flowing top with elegantly draped shoulders. Designed to be modest and feminine, it pairs beautifully with wide-leg trousers or skirts for a complete look.",
    fabric: "Satin-touch georgette",
    colours: [
      { name: "Ivory", hex: "#FAF7F2" },
      { name: "Blush", hex: "#E8D0C8" },
      { name: "Charcoal", hex: "#2C2C2C" }
    ],
    sizes: ["XS","S","M","L","XL","XXL"],
    care: "Hand wash cold. Iron on low. Store folded.",
    available: true,
    isNew: false,
    isBestseller: false,
    collections: ["everyday-elegance"]
  },

  {
    id: "fka-012",
    name: "Longline Linen Top",
    category: "tops",
    categoryLabel: "Tops",
    price: 28000,
    priceFormatted: "₦28,000",
    images: [
      "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&q=80",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80"
    ],
    description: "A relaxed longline top in natural linen with a subtle curved hem. Modest, breathable and perfectly paired with any FKA skirt or trouser. A wardrobe essential.",
    fabric: "100% natural linen",
    colours: [
      { name: "Natural", hex: "#D8CFC4" },
      { name: "Black", hex: "#1A1A1A" },
      { name: "Sand", hex: "#C4A882" }
    ],
    sizes: ["XS","S","M","L","XL","XXL"],
    care: "Machine wash cold. Iron while damp.",
    available: true,
    isNew: false,
    isBestseller: false,
    collections: ["everyday-elegance"]
  },

  /* â”€â”€ ACCESSORIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  {
    id: "fka-013",
    name: "Silk Head Wrap",
    category: "accessories",
    categoryLabel: "Accessories",
    price: 18000,
    priceFormatted: "₦18,000",
    images: [
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80",
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80"
    ],
    description: "A generous square of pure silk designed to be styled as a head wrap or scarf. Printed with a subtle tonal pattern, it completes any FKA look with a finishing touch of luxury.",
    fabric: "100% pure silk",
    colours: [
      { name: "Ivory", hex: "#FAF7F2" },
      { name: "Taupe", hex: "#C4B5A5" },
      { name: "Black", hex: "#1A1A1A" }
    ],
    sizes: ["One Size"],
    care: "Hand wash cold with mild detergent. Press with cool iron on reverse.",
    available: true,
    isNew: false,
    isBestseller: false,
    collections: ["signature"]
  },

  {
    id: "fka-014",
    name: "Woven Tote Bag",
    category: "accessories",
    categoryLabel: "Accessories",
    price: 35000,
    priceFormatted: "₦35,000",
    images: [
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&q=80",
      "https://images.unsplash.com/photo-1575032617751-6ddec2089882?w=600&q=80"
    ],
    description: "A structured tote woven from natural fibres, with a suede-like interior and gold-toned hardware. Spacious, chic and designed to accompany every FKA outfit effortlessly.",
    fabric: "Woven straw with suede interior",
    colours: [
      { name: "Natural", hex: "#D8CFC4" },
      { name: "Camel", hex: "#C8A060" }
    ],
    sizes: ["One Size"],
    care: "Spot clean only. Store in dust bag. Avoid moisture.",
    available: true,
    isNew: true,
    isBestseller: false,
    collections: ["new-collection","signature"]
  }

];

/* â”€â”€ Supabase product normaliser â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function _normaliseProduct(p) {
  if (!p) return null;
  return {
    ...p,
    isNew:         p.is_new         !== undefined ? p.is_new         : p.isNew,
    isBestseller:  p.is_bestseller  !== undefined ? p.is_bestseller  : p.isBestseller,
    categoryLabel: p.category_label || p.categoryLabel || (p.category ? p.category.charAt(0).toUpperCase()+p.category.slice(1) : ""),
    priceFormatted:p.price_formatted || p.priceFormatted || ("₦"+Number(p.price).toLocaleString("en-NG")),
    images:        Array.isArray(p.images)      ? p.images      : _tryParse(p.images,     []),
    colours:       Array.isArray(p.colours)     ? p.colours     : _tryParse(p.colours,    []),
    sizes:         Array.isArray(p.sizes)       ? p.sizes       : _tryParse(p.sizes,      ["XS","S","M","L","XL","XXL"]),
    collections:   Array.isArray(p.collections) ? p.collections : _tryParse(p.collections,[])
  };
}
function _tryParse(val, fallback) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

/* â”€â”€ Admin override helpers (localStorage fallback) â”€â”€â”€â”€ */
const _ADMIN_PROD_KEY = "fka_admin_products_overrides";
function _loadAdminOverrides() {
  try { return JSON.parse(localStorage.getItem(_ADMIN_PROD_KEY)) || []; }
  catch { return []; }
}
function _saveAdminOverrides(list) {
  localStorage.setItem(_ADMIN_PROD_KEY, JSON.stringify(list));
  // Broadcast to other tabs so storefront reloads
  try {
    const bc = new BroadcastChannel("fka_products_channel");
    bc.postMessage({ type: "products_updated" });
    bc.close();
  } catch {}
}

/**
 * Merge FKA_PRODUCTS with localStorage overrides.
 * Used as a fallback when Supabase is not configured.
 */
function _getMergedProducts() {
  const overrides = _loadAdminOverrides();
  if (!overrides.length) return FKA_PRODUCTS;
  const base   = [...FKA_PRODUCTS];
  const result = [];
  base.forEach(p => {
    const ov = overrides.find(o => o.id === p.id);
    result.push(ov ? { ...p, ...ov } : p);
  });
  overrides
    .filter(o => !base.find(p => p.id === o.id))
    .forEach(o => result.push(o));
  return result;
}

/* â”€â”€ Public helpers (async, Supabase-first) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/**
 * Get all available products.
 * Tries Supabase first; falls back to merged localStorage + FKA_PRODUCTS.
 */
async function getAllProducts() {
  if (typeof fkaDB === "function" && typeof _isSupabaseReady === "function" && _isSupabaseReady()) {
    try {
      const { data } = await fkaDB().from("products").select("*")
        .eq("available", true).order("sort_order").order("created_at", { ascending: false });
      if (data && data.length > 0) return data.map(_normaliseProduct);
    } catch (e) { console.warn("[FKA products] Supabase fetch failed, using fallback:", e.message); }
  }
  return _getMergedProducts();
}

/**
 * Get a single product by ID.
 */
async function getProductById(id) {
  if (typeof fkaDB === "function" && typeof _isSupabaseReady === "function" && _isSupabaseReady()) {
    try {
      const { data } = await fkaDB().from("products").select("*").eq("id", id).single();
      if (data) return _normaliseProduct(data);
    } catch {}
  }
  return _getMergedProducts().find(p => p.id === id) || null;
}

/**
 * Get new arrivals.
 */
async function getNewArrivals(limit = 4) {
  const all = await getAllProducts();
  return all.filter(p => (p.isNew || p.is_new) && p.available !== false).slice(0, limit);
}

/**
 * Get bestsellers.
 */
async function getBestsellers(limit = 4) {
  const all = await getAllProducts();
  return all.filter(p => (p.isBestseller || p.is_bestseller) && p.available !== false).slice(0, limit);
}

/**
 * Get products by category.
 */
async function getProductsByCategory(category) {
  const all = await getAllProducts();
  if (!category || category === "all") return all;
  return all.filter(p => p.category === category);
}

/**
 * Get products by collection slug.
 */
async function getProductsByCollection(collection) {
  const all = await getAllProducts();
  return all.filter(p => (p.collections || []).includes(collection) && p.available !== false);
}

/**
 * Search products.
 */
async function searchProducts(query) {
  if (!query || !query.trim()) return [];
  const q   = query.toLowerCase().trim();
  const all = await getAllProducts();
  return all.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.category_label||p.categoryLabel||"").toLowerCase().includes(q) ||
    (p.description||"").toLowerCase().includes(q) ||
    (p.colours||[]).some(c => c.name.toLowerCase().includes(q)) ||
    (p.fabric||"").toLowerCase().includes(q)
  );
}

async function filterByPrice(products, maxPrice) {
  return products.filter(p => p.price <= maxPrice);
}

async function sortProducts(products, sortBy) {
  const arr = [...products];
  switch (sortBy) {
    case "price-asc":  return arr.sort((a, b) => a.price - b.price);
    case "price-desc": return arr.sort((a, b) => b.price - a.price);
    case "name-asc":   return arr.sort((a, b) => a.name.localeCompare(b.name));
    default:           return arr.sort((a, b) => ((b.isNew||b.is_new)?1:0) - ((a.isNew||a.is_new)?1:0));
  }
}

function formatPrice(n) {
  return "\u20A6" + (n || 0).toLocaleString("en-NG");
}

/**
 * Admin: save a product to Supabase (or localStorage fallback).
 * This is the SINGLE function admin pages should call.
 */
async function adminSaveProduct(product) {
  const catLabels = { abayas:"Abayas", dresses:"Dresses", "coord-sets":"Co-ord Sets", skirts:"Skirts", tops:"Tops", accessories:"Accessories" };
  const cat = product.category || "dresses";
  const row = {
    id:             product.id || ("fka-" + Date.now()),
    name:           product.name,
    category:       cat,
    category_label: product.categoryLabel || catLabels[cat] || cat,
    price:          Number(product.price),
    price_formatted:"₦" + Number(product.price).toLocaleString("en-NG"),
    images:         product.images || [],
    description:    product.description || "",
    fabric:         product.fabric || "",
    colours:        product.colours || [],
    sizes:          product.sizes || ["XS","S","M","L","XL","XXL"],
    care:           product.care || "",
    available:      product.available !== false,
    is_new:         !!(product.isNew || product.is_new),
    is_bestseller:  !!(product.isBestseller || product.is_bestseller),
    collections:    product.collections || [],
    sort_order:     product.sort_order || 0
  };

  if (typeof fkaDB === "function" && typeof _isSupabaseReady === "function" && _isSupabaseReady()) {
    const { error } = await fkaDB().from("products").upsert(row);
    if (error) throw new Error(error.message);
  } else {
    // localStorage fallback
    const overrides = _loadAdminOverrides();
    const idx = overrides.findIndex(o => o.id === row.id);
    const localRow = { ...row, isNew: row.is_new, isBestseller: row.is_bestseller, categoryLabel: row.category_label, priceFormatted: row.price_formatted };
    if (idx >= 0) overrides[idx] = localRow;
    else overrides.push(localRow);
    _saveAdminOverrides(overrides);
  }
  return row;
}

/**
 * Admin: delete a product.
 */
async function adminDeleteProduct(id) {
  if (typeof fkaDB === "function" && typeof _isSupabaseReady === "function" && _isSupabaseReady()) {
    const { error } = await fkaDB().from("products").delete().eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const overrides = _loadAdminOverrides().filter(o => o.id !== id);
    _saveAdminOverrides(overrides);
  }
}

/**
 * Admin: get all products including unavailable ones (for admin product list).
 */
async function adminGetAllProducts() {
  if (typeof fkaDB === "function" && typeof _isSupabaseReady === "function" && _isSupabaseReady()) {
    try {
      const { data } = await fkaDB().from("products").select("*")
        .order("sort_order").order("created_at", { ascending: false });
      if (data) return data.map(_normaliseProduct);
    } catch (e) { console.warn("[FKA] adminGetAllProducts Supabase failed:", e.message); }
  }
  return _getMergedProducts();
}

/* â”€â”€ Realtime product sync for storefront â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/**
 * Listen for product changes (Supabase realtime or localStorage broadcast).
 * Call once on storefront pages to auto-refresh product grids.
 */
function initProductSync() {
  // Supabase realtime
  if (typeof _isSupabaseReady === "function" && _isSupabaseReady() && typeof fkaDB === "function") {
    try {
      fkaDB().channel("rt_products_storefront")
        .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
          _refreshProductGrids();
        })
        .subscribe();
    } catch {}
  }

  // localStorage broadcast (fallback / same-device cross-tab)
  try {
    const bc = new BroadcastChannel("fka_products_channel");
    bc.onmessage = () => _refreshProductGrids();
  } catch {}

  // Also listen for storage events (different tab, same device)
  window.addEventListener("storage", e => {
    if (e.key === _ADMIN_PROD_KEY) _refreshProductGrids();
  });
}

function _refreshProductGrids() {
  if (document.getElementById("shop-products-grid"))    initShopPage?.();
  if (document.getElementById("new-arrivals-grid"))     initHomePage?.();
  if (document.getElementById("product-detail-container")) initProductPage?.();
  if (document.querySelectorAll("[data-collection-grid]").length) initCollectionsPage?.();
  if (typeof wishlistSyncButtons === "function") wishlistSyncButtons();
}

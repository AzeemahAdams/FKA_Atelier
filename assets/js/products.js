/* ============================================================
   FKA ATELIER — Product Data Catalogue
   Add / edit products here. Each product follows the schema below.
   ============================================================ */

const FKA_PRODUCTS = [

  /* ── ABAYAS ─────────────────────────────────────────── */
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

  /* ── DRESSES ─────────────────────────────────────────── */
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

  /* ── CO-ORD SETS ─────────────────────────────────────── */
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
    fabric: "Structured crepe — top and trousers",
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
    fabric: "100% linen — top and trousers",
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

  /* ── SKIRTS ──────────────────────────────────────────── */
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

  /* ── TOPS ────────────────────────────────────────────── */
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

  /* ── ACCESSORIES ─────────────────────────────────────── */
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

/* ── Helpers ──────────────────────────────────────────── */

/**
 * Get all products
 * @returns {Array}
 */
function getAllProducts() {
  return FKA_PRODUCTS;
}

/**
 * Get product by ID
 * @param {string} id
 * @returns {Object|undefined}
 */
function getProductById(id) {
  return FKA_PRODUCTS.find(p => p.id === id);
}

/**
 * Get products by category slug
 * @param {string} category  e.g. "abayas", "dresses"
 * @returns {Array}
 */
function getProductsByCategory(category) {
  if (!category || category === "all") return FKA_PRODUCTS;
  return FKA_PRODUCTS.filter(p => p.category === category);
}

/**
 * Get new arrivals
 * @param {number} limit
 * @returns {Array}
 */
function getNewArrivals(limit = 4) {
  return FKA_PRODUCTS.filter(p => p.isNew).slice(0, limit);
}

/**
 * Get bestsellers
 * @param {number} limit
 * @returns {Array}
 */
function getBestsellers(limit = 4) {
  return FKA_PRODUCTS.filter(p => p.isBestseller).slice(0, limit);
}

/**
 * Get products by collection slug
 * @param {string} collection
 * @returns {Array}
 */
function getProductsByCollection(collection) {
  return FKA_PRODUCTS.filter(p => p.collections && p.collections.includes(collection));
}

/**
 * Search products by query string
 * @param {string} query
 * @returns {Array}
 */
function searchProducts(query) {
  if (!query || query.trim() === "") return [];
  const q = query.toLowerCase().trim();
  return FKA_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.categoryLabel.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    p.colours.some(c => c.name.toLowerCase().includes(q)) ||
    p.fabric.toLowerCase().includes(q)
  );
}

/**
 * Sort products array
 * @param {Array} products
 * @param {string} sortBy  "newest" | "price-asc" | "price-desc" | "name-asc"
 * @returns {Array}
 */
function sortProducts(products, sortBy) {
  const arr = [...products];
  switch (sortBy) {
    case "price-asc":   return arr.sort((a, b) => a.price - b.price);
    case "price-desc":  return arr.sort((a, b) => b.price - a.price);
    case "name-asc":    return arr.sort((a, b) => a.name.localeCompare(b.name));
    case "newest":
    default:            return arr.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  }
}

/**
 * Filter products by max price
 * @param {Array} products
 * @param {number} maxPrice
 * @returns {Array}
 */
function filterByPrice(products, maxPrice) {
  return products.filter(p => p.price <= maxPrice);
}

/**
 * Format price as ₦ string
 * @param {number} price
 * @returns {string}
 */
function formatPrice(price) {
  return "₦" + price.toLocaleString("en-NG");
}

/* ============================================================
   FKA ATELIER — Delivery Zone Configuration & Fee Engine
   All zone data lives in localStorage under "fka_delivery_zones"
   so the admin can edit it live via the admin dashboard.
   ============================================================ */

"use strict";

const DELIVERY_ZONES_KEY = "fka_delivery_zones";

/* ── Default zone definitions ──────────────────────────── */
const DEFAULT_DELIVERY_ZONES = [
  {
    id: "zone-lagos-island",
    name: "Lagos Island",
    description: "Lagos Island, Victoria Island, Ikoyi, Lekki Phase 1",
    keywords: ["lagos island","victoria island","vi","ikoyi","lekki phase 1","lekki 1","oniru","eti-osa"],
    state: "Lagos",
    fee: 2500,
    freeThreshold: 70000,
    estimatedDays: "1–2 business days",
    active: true
  },
  {
    id: "zone-lagos-mainland",
    name: "Lagos Mainland",
    description: "Yaba, Surulere, Ikeja, Ojota, Agege, Maryland, Mushin",
    keywords: ["yaba","surulere","ikeja","ojota","agege","maryland","mushin","oshodi","palmgrove","fadeyi","gbagada","pedro","bariga"],
    state: "Lagos",
    fee: 3000,
    freeThreshold: 70000,
    estimatedDays: "1–2 business days",
    active: true
  },
  {
    id: "zone-lagos-outskirts",
    name: "Lagos Outskirts",
    description: "Ajah, Sangotedo, Ibeju-Lekki, Epe, Badagry, Ikorodu",
    keywords: ["ajah","sangotedo","ibeju","ibeju-lekki","epe","badagry","ikorodu","lekki phase 2","lekki 2","chevron","jakande","ilaje","igbo-efon","ogombo","abraham adesanya","orchid"],
    state: "Lagos",
    fee: 4000,
    freeThreshold: 70000,
    estimatedDays: "2–3 business days",
    active: true
  },
  {
    id: "zone-abuja",
    name: "Abuja (FCT)",
    description: "All areas within Abuja Federal Capital Territory",
    keywords: ["abuja","fct","garki","wuse","maitama","asokoro","gwarinpa","kubwa","lugbe","life camp","jabi","utako","gudu","apo","kado","lokogoma","galadimawa","durumi"],
    state: "FCT",
    fee: 5500,
    freeThreshold: 100000,
    estimatedDays: "3–5 business days",
    active: true
  },
  {
    id: "zone-ph",
    name: "Port Harcourt",
    description: "Port Harcourt and surrounding Rivers State areas",
    keywords: ["port harcourt","ph","rivers","rumuola","rumuokwurushi","woji","eliozu","ada george","trans amadi","diobu","rumuibekwe","eneka","rumuodara","oyigbo"],
    state: "Rivers",
    fee: 6000,
    freeThreshold: 100000,
    estimatedDays: "3–5 business days",
    active: true
  },
  {
    id: "zone-ibadan",
    name: "Ibadan",
    description: "Ibadan and surrounding Oyo State areas",
    keywords: ["ibadan","oyo","ring road","challenge","bodija","agodi","iyaganku","jericho","new garage","ojoo","iwo road","mokola","dugbe","sango","eleyele","apata","olodo","gbagi"],
    state: "Oyo",
    fee: 5000,
    freeThreshold: 100000,
    estimatedDays: "3–5 business days",
    active: true
  },
  {
    id: "zone-south-west",
    name: "South West (Other)",
    description: "Abeokuta, Osogbo, Ado-Ekiti, Akure, Ile-Ife, Ilorin",
    keywords: ["abeokuta","ogun","osogbo","osun","ado ekiti","ekiti","akure","ondo","ile-ife","ife","ilorin","kwara","sagamu","ota","mowe","ofada","ijebu"],
    state: "South West",
    fee: 5500,
    freeThreshold: 100000,
    estimatedDays: "4–6 business days",
    active: true
  },
  {
    id: "zone-south-east",
    name: "South East",
    description: "Enugu, Aba, Onitsha, Owerri, Umuahia, Awka",
    keywords: ["enugu","aba","onitsha","owerri","umuahia","awka","anambra","imo","abia","ebonyi","afikpo","nsukka","ekwulobia","nnewi","asaba","delta south"],
    state: "South East",
    fee: 6500,
    freeThreshold: 100000,
    estimatedDays: "4–7 business days",
    active: true
  },
  {
    id: "zone-south-south",
    name: "South South",
    description: "Benin City, Warri, Calabar, Uyo, Yenagoa",
    keywords: ["benin","edo","warri","delta","calabar","cross river","uyo","akwa ibom","yenagoa","bayelsa","effurun","asaba","sapele","agbor"],
    state: "South South",
    fee: 6500,
    freeThreshold: 100000,
    estimatedDays: "4–7 business days",
    active: true
  },
  {
    id: "zone-north",
    name: "Northern Nigeria",
    description: "Kano, Kaduna, Jos, Maiduguri, Sokoto, Zaria, Katsina",
    keywords: ["kano","kaduna","jos","maiduguri","sokoto","zaria","katsina","bauchi","gombe","dutse","lafia","makurdi","benue","plateau","borno","yobe","jigawa","zamfara","kebbi","niger","kontagora","minna","suleja"],
    state: "North",
    fee: 7500,
    freeThreshold: 150000,
    estimatedDays: "5–8 business days",
    active: true
  },
  {
    id: "zone-default",
    name: "Other Locations",
    description: "All other Nigerian locations not listed above",
    keywords: [],
    state: "Other",
    fee: 8000,
    freeThreshold: 150000,
    estimatedDays: "5–10 business days",
    active: true,
    isDefault: true
  }
];

/* ── Zone storage helpers ──────────────────────────────── */

function deliveryZonesLoad() {
  try {
    const stored = localStorage.getItem(DELIVERY_ZONES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  // Seed defaults on first load
  deliveryZonesSave(DEFAULT_DELIVERY_ZONES);
  return DEFAULT_DELIVERY_ZONES;
}

function deliveryZonesSave(zones) {
  localStorage.setItem(DELIVERY_ZONES_KEY, JSON.stringify(zones));
}

function deliveryZonesReset() {
  deliveryZonesSave(DEFAULT_DELIVERY_ZONES);
  return DEFAULT_DELIVERY_ZONES;
}

function deliveryZonesGetActive() {
  return deliveryZonesLoad().filter(z => z.active);
}

/* ── Fee detection engine ──────────────────────────────── */

/**
 * Detect delivery zone from a free-text address string.
 * Checks city, area, state fields against zone keywords.
 * Returns the best-matching zone object.
 *
 * @param {string} address — free text (city, area, state, full address)
 * @returns {Object} zone
 */
function detectZoneFromAddress(address) {
  if (!address || address.trim() === "") return null;

  const zones = deliveryZonesGetActive();
  const query = address.toLowerCase().trim();

  // Score each zone — count how many keywords appear in the query
  let bestZone = null;
  let bestScore = -1;

  for (const zone of zones) {
    if (zone.isDefault) continue; // default is fallback, skip in scoring
    let score = 0;
    for (const kw of zone.keywords) {
      if (query.includes(kw)) {
        // Longer keyword match = more specific = higher weight
        score += kw.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestZone = zone;
    }
  }

  // If no keyword matched, fall back to default zone
  if (bestScore <= 0) {
    const defaultZone = zones.find(z => z.isDefault);
    return defaultZone || zones[zones.length - 1];
  }

  return bestZone;
}

/**
 * Calculate the delivery fee for a given address and order subtotal.
 *
 * @param {string} address
 * @param {number} subtotal
 * @returns {{ zone: Object, fee: number, isFree: boolean, message: string }}
 */
function calculateDeliveryFee(address, subtotal) {
  const zone = detectZoneFromAddress(address);

  if (!zone) {
    return {
      zone: null,
      fee: 0,
      isFree: false,
      message: "Enter your delivery address to see delivery fee."
    };
  }

  const isFree = subtotal >= zone.freeThreshold;
  const fee = isFree ? 0 : zone.fee;

  const remaining = zone.freeThreshold - subtotal;
  let message = isFree
    ? `✓ Free delivery to ${zone.name}`
    : `Delivery to ${zone.name}: ₦${fee.toLocaleString("en-NG")}. Add ₦${remaining.toLocaleString("en-NG")} more for free delivery.`;

  return {
    zone,
    fee,
    isFree,
    message,
    estimatedDays: zone.estimatedDays
  };
}

/**
 * Get all zones formatted for display in select/dropdown.
 * @returns {Array<{value: string, label: string, fee: number}>}
 */
function getZoneSelectOptions() {
  return deliveryZonesGetActive().map(z => ({
    id: z.id,
    label: `${z.name} — ₦${z.fee.toLocaleString("en-NG")} (${z.estimatedDays})`,
    fee: z.fee,
    freeThreshold: z.freeThreshold,
    estimatedDays: z.estimatedDays,
    name: z.name
  }));
}

/**
 * Admin: add or update a zone.
 * @param {Object} zone
 */
function deliveryZoneSave(zone) {
  const zones = deliveryZonesLoad();
  const idx = zones.findIndex(z => z.id === zone.id);
  if (idx >= 0) {
    zones[idx] = zone;
  } else {
    zones.push(zone);
  }
  deliveryZonesSave(zones);
}

/**
 * Admin: delete a zone by ID.
 * @param {string} id
 */
function deliveryZoneDelete(id) {
  const zones = deliveryZonesLoad().filter(z => z.id !== id);
  deliveryZonesSave(zones);
}

/**
 * Admin: toggle a zone active/inactive.
 * @param {string} id
 */
function deliveryZoneToggle(id) {
  const zones = deliveryZonesLoad();
  const zone = zones.find(z => z.id === id);
  if (zone) zone.active = !zone.active;
  deliveryZonesSave(zones);
  return zone ? zone.active : null;
}

/**
 * Gulf Market Pricing Engine
 * Based on real market data from UAE/Saudi Arabia 2024-2025
 * Sources: fitche.ae, interiofy.ae, renovationx.ae, yallarenovation.com
 *
 * 20+ real case studies across different scenarios:
 * - Scenario: surface / mid-range / full-transformation
 * - Room types: living room / bedroom / kitchen / bathroom
 * - Styles: minimal / bohemian / gulf-classic / contemporary / industrial / luxury
 * - Budget levels: economy / mid / premium
 */

export type RenovationScenario = "surface" | "mid" | "full";
export type BudgetLevel = "economy" | "mid" | "premium";
export type RoomType =
  | "living"
  | "bedroom"
  | "master_bedroom"
  | "kitchen"
  | "bathroom"
  | "office"
  | "dining"
  | "unknown";

export interface RoomDimensions {
  length?: number; // meters
  width?: number; // meters
  height?: number; // meters
}

export interface PricingResult {
  costMin: number;
  costMax: number;
  currency: string;
  breakdown: PricingBreakdownItem[];
  assumptions: string[];
  pricePerSqm: { min: number; max: number };
  roomArea: number;
  scenario: RenovationScenario;
  budgetLevel: BudgetLevel;
}

export interface PricingBreakdownItem {
  category: string;
  categoryAr: string;
  min: number;
  max: number;
  unit: string;
  quantity: number;
  note?: string;
}

// ─── Unit Costs (AED) from real Gulf market data ───────────────────────────

const UNIT_COSTS = {
  // Flooring per m²
  flooring: {
    economy: { ceramic: { min: 50, max: 100 }, spc: { min: 35, max: 80 }, vinyl: { min: 40, max: 100 } },
    mid: { ceramic: { min: 80, max: 150 }, spc: { min: 65, max: 130 }, parquet: { min: 150, max: 250 } },
    premium: { parquet: { min: 200, max: 350 }, marble: { min: 300, max: 700 }, porcelain: { min: 150, max: 400 } },
  },

  // Painting per m² (wall area)
  painting: {
    economy: { min: 10, max: 20 },
    mid: { min: 20, max: 40 },
    premium: { min: 40, max: 100 }, // includes wallpaper or panels
  },

  // Curtains per linear meter (installed)
  curtains: {
    economy: { min: 150, max: 300 },
    mid: { min: 300, max: 600 },
    premium: { min: 600, max: 1500 },
  },

  // Carpet per m²
  carpet: {
    economy: { min: 50, max: 150 },
    mid: { min: 150, max: 400 },
    premium: { min: 400, max: 1500 },
  },

  // Lighting per unit (spot/pendant)
  lighting_spot: {
    economy: { min: 50, max: 100 },
    mid: { min: 100, max: 200 },
    premium: { min: 200, max: 500 },
  },

  // Chandelier
  chandelier: {
    economy: { min: 300, max: 800 },
    mid: { min: 800, max: 3000 },
    premium: { min: 3000, max: 15000 },
  },

  // Ceiling gypsum per m²
  ceiling_gypsum: {
    economy: { min: 0, max: 0 }, // not included in surface
    mid: { min: 80, max: 150 },
    premium: { min: 150, max: 400 },
  },

  // Furniture sets (living room)
  sofa_set: {
    economy: { min: 2000, max: 5000 }, // 3+2 seater
    mid: { min: 5000, max: 15000 },
    premium: { min: 15000, max: 50000 },
  },

  coffee_table: {
    economy: { min: 400, max: 800 },
    mid: { min: 800, max: 2500 },
    premium: { min: 2500, max: 8000 },
  },

  tv_unit: {
    economy: { min: 800, max: 2000 },
    mid: { min: 2000, max: 6000 },
    premium: { min: 6000, max: 20000 },
  },

  // Bedroom furniture
  bed_frame: {
    economy: { min: 1500, max: 3000 },
    mid: { min: 3000, max: 8000 },
    premium: { min: 8000, max: 25000 },
  },

  wardrobe_per_lm: {
    economy: { min: 1200, max: 1600 }, // per linear meter
    mid: { min: 1600, max: 2500 },
    premium: { min: 2500, max: 4500 },
  },

  // Accessories / decor
  accessories: {
    economy: { min: 500, max: 1500 },
    mid: { min: 1500, max: 4000 },
    premium: { min: 4000, max: 15000 },
  },

  // Plants / greenery
  plants: {
    economy: { min: 200, max: 500 },
    mid: { min: 500, max: 1500 },
    premium: { min: 1500, max: 5000 },
  },
};

// ─── Style Multipliers ──────────────────────────────────────────────────────
const STYLE_MULTIPLIERS: Record<string, { min: number; max: number }> = {
  minimal: { min: 0.80, max: 0.95 },
  scandinavian: { min: 0.80, max: 0.95 },
  bohemian: { min: 0.90, max: 1.10 },
  natural: { min: 0.85, max: 1.05 },
  contemporary: { min: 1.00, max: 1.20 },
  modern: { min: 1.00, max: 1.20 },
  gulf: { min: 1.20, max: 1.60 },
  classic: { min: 1.20, max: 1.60 },
  arabic: { min: 1.20, max: 1.60 },
  industrial: { min: 0.90, max: 1.10 },
  luxury: { min: 1.50, max: 2.50 },
  hotel: { min: 1.50, max: 2.50 },
  farmhouse: { min: 0.90, max: 1.10 },
  coastal: { min: 0.95, max: 1.15 },
  default: { min: 1.00, max: 1.00 },
};

// ─── Scenario Scope Definitions ────────────────────────────────────────────
// What's included in each scenario
const SCENARIO_SCOPE = {
  surface: {
    includesFlooring: false,
    includesFurniture: false,
    includesCeiling: false,
    includesCurtains: true,
    includesPainting: true,
    includesLighting: false, // only minor fixture swap
    includesAccessories: true,
    furnitureFraction: 0, // 0% furniture replacement
    flooringFraction: 0,
    description: "تجديد سطحي: دهان + ستائر + إكسسوار",
  },
  mid: {
    includesFlooring: true,
    includesFurniture: true,
    includesCeiling: false,
    includesCurtains: true,
    includesPainting: true,
    includesLighting: true,
    includesAccessories: true,
    furnitureFraction: 0.6, // 60% furniture replacement
    flooringFraction: 1.0,
    description: "تحسين متوسط: أرضيات + دهان + أثاث جزئي + ستائر + إضاءة",
  },
  full: {
    includesFlooring: true,
    includesFurniture: true,
    includesCeiling: true,
    includesCurtains: true,
    includesPainting: true,
    includesLighting: true,
    includesAccessories: true,
    furnitureFraction: 1.0, // 100% furniture replacement
    flooringFraction: 1.0,
    description: "تحول شامل: كل شيء من الصفر",
  },
};

// ─── Room-specific defaults ─────────────────────────────────────────────────
function getRoomDefaults(roomType: RoomType, area: number, height: number) {
  const perimeter = area > 0 ? Math.sqrt(area) * 4 : 16; // rough perimeter
  const wallArea = perimeter * height;
  const windowCount = Math.max(1, Math.round(area / 15));
  const curtainLength = windowCount * 2.5; // 2.5m per window

  switch (roomType) {
    case "living":
    case "dining":
      return {
        wallArea,
        curtainLength,
        lightingSpots: Math.round(area / 4),
        hasChandelier: true,
        carpetArea: area * 0.6,
        wardrobeLength: 0,
        hasSofaSet: true,
        hasBed: false,
        hasTvUnit: true,
        hasCoffeeTable: true,
      };
    case "bedroom":
      return {
        wallArea,
        curtainLength,
        lightingSpots: Math.round(area / 5),
        hasChandelier: false,
        carpetArea: area * 0.4,
        wardrobeLength: Math.min(4, Math.sqrt(area) * 0.8),
        hasSofaSet: false,
        hasBed: true,
        hasTvUnit: false,
        hasCoffeeTable: false,
      };
    case "master_bedroom":
      return {
        wallArea,
        curtainLength: curtainLength * 1.2,
        lightingSpots: Math.round(area / 4),
        hasChandelier: true,
        carpetArea: area * 0.5,
        wardrobeLength: Math.min(5, Math.sqrt(area) * 1.0),
        hasSofaSet: false,
        hasBed: true,
        hasTvUnit: false,
        hasCoffeeTable: false,
      };
    case "kitchen":
      return {
        wallArea: wallArea * 0.5, // only paintable area
        curtainLength: 1.5,
        lightingSpots: Math.round(area / 3),
        hasChandelier: false,
        carpetArea: 0,
        wardrobeLength: 0,
        hasSofaSet: false,
        hasBed: false,
        hasTvUnit: false,
        hasCoffeeTable: false,
      };
    case "bathroom":
      return {
        wallArea: wallArea * 0.3,
        curtainLength: 0,
        lightingSpots: 2,
        hasChandelier: false,
        carpetArea: 0,
        wardrobeLength: 0,
        hasSofaSet: false,
        hasBed: false,
        hasTvUnit: false,
        hasCoffeeTable: false,
      };
    default:
      return {
        wallArea,
        curtainLength,
        lightingSpots: Math.round(area / 5),
        hasChandelier: false,
        carpetArea: area * 0.4,
        wardrobeLength: 0,
        hasSofaSet: false,
        hasBed: false,
        hasTvUnit: false,
        hasCoffeeTable: false,
      };
  }
}

// ─── Style keyword matching ─────────────────────────────────────────────────
function getStyleMultiplier(styleKeywords: string): { min: number; max: number } {
  const lower = styleKeywords.toLowerCase();
  for (const [key, mult] of Object.entries(STYLE_MULTIPLIERS)) {
    if (lower.includes(key)) return mult;
  }
  return STYLE_MULTIPLIERS.default;
}

// ─── Main pricing function ──────────────────────────────────────────────────
export function calculateRealisticPrice(params: {
  scenario: RenovationScenario;
  budgetLevel: BudgetLevel;
  roomType: RoomType;
  dimensions?: RoomDimensions;
  estimatedArea?: number; // m²
  styleKeywords?: string;
  styleNameAr?: string;
}): PricingResult {
  const {
    scenario,
    budgetLevel,
    roomType,
    dimensions,
    estimatedArea,
    styleKeywords = "",
    styleNameAr = "",
  } = params;

  // Calculate area
  let area = estimatedArea || 20;
  if (dimensions?.length && dimensions?.width) {
    area = dimensions.length * dimensions.width;
  }
  area = Math.max(8, Math.min(area, 100)); // clamp 8-100m²

  const height = dimensions?.height || 2.8;
  const scope = SCENARIO_SCOPE[scenario];
  const costs = UNIT_COSTS;
  const bl = budgetLevel;
  const styleMult = getStyleMultiplier(styleKeywords + " " + styleNameAr);
  const roomDefaults = getRoomDefaults(roomType, area, height);

  const breakdown: PricingBreakdownItem[] = [];
  const assumptions: string[] = [];

  let totalMin = 0;
  let totalMax = 0;

  // ── 1. Painting ──────────────────────────────────────────────────────────
  if (scope.includesPainting) {
    const wallArea = roomDefaults.wallArea;
    const paintMin = costs.painting[bl].min * wallArea;
    const paintMax = costs.painting[bl].max * wallArea;
    breakdown.push({
      category: "Painting & Wall Finishes",
      categoryAr: "دهان وتشطيبات الجدران",
      min: Math.round(paintMin),
      max: Math.round(paintMax),
      unit: "م²",
      quantity: Math.round(wallArea),
      note: bl === "premium" ? "شامل ورق جدران أو لوحات" : undefined,
    });
    totalMin += paintMin;
    totalMax += paintMax;
    assumptions.push(`مساحة الجدران المقدرة: ${Math.round(wallArea)} م²`);
  }

  // ── 2. Flooring ──────────────────────────────────────────────────────────
  if (scope.includesFlooring && scope.flooringFraction > 0) {
    const floorArea = area * scope.flooringFraction;
    let floorMin: number, floorMax: number;
    if (bl === "economy") {
      floorMin = costs.flooring.economy.spc.min * floorArea;
      floorMax = costs.flooring.economy.ceramic.max * floorArea;
    } else if (bl === "mid") {
      floorMin = costs.flooring.mid.spc.min * floorArea;
      floorMax = costs.flooring.mid.parquet.max * floorArea;
    } else {
      floorMin = costs.flooring.premium.parquet.min * floorArea;
      floorMax = costs.flooring.premium.marble.max * floorArea;
    }
    breakdown.push({
      category: "Flooring",
      categoryAr: "الأرضيات",
      min: Math.round(floorMin),
      max: Math.round(floorMax),
      unit: "م²",
      quantity: Math.round(floorArea),
    });
    totalMin += floorMin;
    totalMax += floorMax;
  }

  // ── 3. Curtains ──────────────────────────────────────────────────────────
  if (scope.includesCurtains && roomDefaults.curtainLength > 0) {
    const curtainMin = costs.curtains[bl].min * roomDefaults.curtainLength;
    const curtainMax = costs.curtains[bl].max * roomDefaults.curtainLength;
    breakdown.push({
      category: "Curtains & Window Treatments",
      categoryAr: "الستائر ومعالجات النوافذ",
      min: Math.round(curtainMin),
      max: Math.round(curtainMax),
      unit: "م طولي",
      quantity: Math.round(roomDefaults.curtainLength * 10) / 10,
    });
    totalMin += curtainMin;
    totalMax += curtainMax;
  }

  // ── 4. Lighting ──────────────────────────────────────────────────────────
  if (scope.includesLighting) {
    const spotMin = costs.lighting_spot[bl].min * roomDefaults.lightingSpots;
    const spotMax = costs.lighting_spot[bl].max * roomDefaults.lightingSpots;
    let lightMin = spotMin;
    let lightMax = spotMax;

    if (roomDefaults.hasChandelier) {
      lightMin += costs.chandelier[bl].min;
      lightMax += costs.chandelier[bl].max;
    }

    breakdown.push({
      category: "Lighting",
      categoryAr: "الإضاءة",
      min: Math.round(lightMin),
      max: Math.round(lightMax),
      unit: "وحدة",
      quantity: roomDefaults.lightingSpots + (roomDefaults.hasChandelier ? 1 : 0),
    });
    totalMin += lightMin;
    totalMax += lightMax;
  }

  // ── 5. Ceiling ───────────────────────────────────────────────────────────
  if (scope.includesCeiling && costs.ceiling_gypsum[bl].max > 0) {
    const ceilMin = costs.ceiling_gypsum[bl].min * area;
    const ceilMax = costs.ceiling_gypsum[bl].max * area;
    breakdown.push({
      category: "Ceiling Works",
      categoryAr: "أعمال الأسقف",
      min: Math.round(ceilMin),
      max: Math.round(ceilMax),
      unit: "م²",
      quantity: Math.round(area),
    });
    totalMin += ceilMin;
    totalMax += ceilMax;
  }

  // ── 6. Carpet / Rug ──────────────────────────────────────────────────────
  if (roomDefaults.carpetArea > 0 && (scope.includesFurniture || scenario === "surface")) {
    const carpetMin = costs.carpet[bl].min * roomDefaults.carpetArea;
    const carpetMax = costs.carpet[bl].max * roomDefaults.carpetArea;
    breakdown.push({
      category: "Carpet / Rug",
      categoryAr: "السجاد",
      min: Math.round(carpetMin),
      max: Math.round(carpetMax),
      unit: "م²",
      quantity: Math.round(roomDefaults.carpetArea),
    });
    totalMin += carpetMin;
    totalMax += carpetMax;
  }

  // ── 7. Furniture ─────────────────────────────────────────────────────────
  if (scope.includesFurniture && scope.furnitureFraction > 0) {
    const ff = scope.furnitureFraction;

    if (roomDefaults.hasSofaSet) {
      const sfMin = costs.sofa_set[bl].min * ff;
      const sfMax = costs.sofa_set[bl].max * ff;
      breakdown.push({
        category: "Sofa Set",
        categoryAr: "طقم الكنب",
        min: Math.round(sfMin),
        max: Math.round(sfMax),
        unit: "طقم",
        quantity: 1,
      });
      totalMin += sfMin;
      totalMax += sfMax;
    }

    if (roomDefaults.hasCoffeeTable) {
      const ctMin = costs.coffee_table[bl].min * ff;
      const ctMax = costs.coffee_table[bl].max * ff;
      breakdown.push({
        category: "Coffee Table",
        categoryAr: "طاولة القهوة",
        min: Math.round(ctMin),
        max: Math.round(ctMax),
        unit: "قطعة",
        quantity: 1,
      });
      totalMin += ctMin;
      totalMax += ctMax;
    }

    if (roomDefaults.hasTvUnit) {
      const tvMin = costs.tv_unit[bl].min * ff;
      const tvMax = costs.tv_unit[bl].max * ff;
      breakdown.push({
        category: "TV Unit",
        categoryAr: "وحدة التلفاز",
        min: Math.round(tvMin),
        max: Math.round(tvMax),
        unit: "قطعة",
        quantity: 1,
      });
      totalMin += tvMin;
      totalMax += tvMax;
    }

    if (roomDefaults.hasBed) {
      const bedMin = costs.bed_frame[bl].min * ff;
      const bedMax = costs.bed_frame[bl].max * ff;
      breakdown.push({
        category: "Bed Frame",
        categoryAr: "إطار السرير",
        min: Math.round(bedMin),
        max: Math.round(bedMax),
        unit: "قطعة",
        quantity: 1,
      });
      totalMin += bedMin;
      totalMax += bedMax;
    }

    if (roomDefaults.wardrobeLength > 0) {
      const wdMin = costs.wardrobe_per_lm[bl].min * roomDefaults.wardrobeLength * ff;
      const wdMax = costs.wardrobe_per_lm[bl].max * roomDefaults.wardrobeLength * ff;
      breakdown.push({
        category: "Wardrobe",
        categoryAr: "خزانة الملابس",
        min: Math.round(wdMin),
        max: Math.round(wdMax),
        unit: "م طولي",
        quantity: Math.round(roomDefaults.wardrobeLength * 10) / 10,
      });
      totalMin += wdMin;
      totalMax += wdMax;
    }
  }

  // ── 8. Accessories & Decor ───────────────────────────────────────────────
  if (scope.includesAccessories) {
    const accMin = costs.accessories[bl].min;
    const accMax = costs.accessories[bl].max;
    breakdown.push({
      category: "Accessories & Decor",
      categoryAr: "الإكسسوار والديكور",
      min: Math.round(accMin),
      max: Math.round(accMax),
      unit: "مجموعة",
      quantity: 1,
    });
    totalMin += accMin;
    totalMax += accMax;

    // Plants for bohemian/natural styles
    if (
      styleKeywords.toLowerCase().includes("boho") ||
      styleKeywords.toLowerCase().includes("natural") ||
      styleKeywords.toLowerCase().includes("tropical")
    ) {
      const plantMin = costs.plants[bl].min;
      const plantMax = costs.plants[bl].max;
      breakdown.push({
        category: "Plants & Greenery",
        categoryAr: "النباتات والخضرة",
        min: Math.round(plantMin),
        max: Math.round(plantMax),
        unit: "مجموعة",
        quantity: 1,
      });
      totalMin += plantMin;
      totalMax += plantMax;
    }
  }

  // ── Apply style multiplier ───────────────────────────────────────────────
  totalMin = Math.round(totalMin * styleMult.min);
  totalMax = Math.round(totalMax * styleMult.max);

  // ── Sanity bounds per scenario ───────────────────────────────────────────
  const bounds = {
    surface: { min: 1500, max: 15000 },
    mid: { min: 8000, max: 55000 },
    full: { min: 20000, max: 200000 },
  };

  totalMin = Math.max(bounds[scenario].min, Math.min(totalMin, bounds[scenario].max));
  totalMax = Math.max(totalMin + 2000, Math.min(totalMax, bounds[scenario].max));

  // Ensure min < max with reasonable gap
  if (totalMax < totalMin * 1.2) {
    totalMax = Math.round(totalMin * 1.35);
  }

  return {
    costMin: totalMin,
    costMax: totalMax,
    currency: "AED",
    breakdown,
    assumptions,
    pricePerSqm: {
      min: Math.round(totalMin / area),
      max: Math.round(totalMax / area),
    },
    roomArea: Math.round(area * 10) / 10,
    scenario,
    budgetLevel,
  };
}

// ─── Map scenario string to enum ────────────────────────────────────────────
export function mapScenario(scenarioStr: string): RenovationScenario {
  const lower = scenarioStr.toLowerCase();
  if (lower.includes("surface") || lower.includes("سطحي") || lower.includes("تجديد سطحي")) {
    return "surface";
  }
  if (
    lower.includes("full") ||
    lower.includes("complete") ||
    lower.includes("شامل") ||
    lower.includes("تحول")
  ) {
    return "full";
  }
  return "mid";
}

// ─── Map budget level from scenario ─────────────────────────────────────────
export function mapBudgetLevel(scenarioStr: string, budgetStr: string): BudgetLevel {
  const lower = (scenarioStr + " " + budgetStr).toLowerCase();
  if (
    lower.includes("economy") ||
    lower.includes("اقتصادي") ||
    lower.includes("budget") ||
    lower.includes("cheap")
  ) {
    return "economy";
  }
  if (
    lower.includes("luxury") ||
    lower.includes("premium") ||
    lower.includes("فاخر") ||
    lower.includes("راقي")
  ) {
    return "premium";
  }
  return "mid";
}

// ─── Map room type ───────────────────────────────────────────────────────────
export function mapRoomType(roomStr: string): RoomType {
  const lower = roomStr.toLowerCase();
  if (lower.includes("master") || lower.includes("ماستر")) return "master_bedroom";
  if (
    lower.includes("bedroom") ||
    lower.includes("غرفة نوم") ||
    lower.includes("نوم")
  )
    return "bedroom";
  if (
    lower.includes("kitchen") ||
    lower.includes("مطبخ")
  )
    return "kitchen";
  if (
    lower.includes("bathroom") ||
    lower.includes("toilet") ||
    lower.includes("حمام")
  )
    return "bathroom";
  if (
    lower.includes("office") ||
    lower.includes("مكتب")
  )
    return "office";
  if (
    lower.includes("dining") ||
    lower.includes("طعام")
  )
    return "dining";
  if (
    lower.includes("living") ||
    lower.includes("صالة") ||
    lower.includes("معيشة") ||
    lower.includes("استقبال")
  )
    return "living";
  return "unknown";
}

/**
 * محرك حساب جدول الكميات الهندسي الاحترافي
 * Bill of Quantities (BOQ) Calculator
 *
 * المعايير المتبعة:
 * - FIDIC / CIOB standards for interior fit-out
 * - Gulf region pricing benchmarks (AED)
 * - 10% waste factor on flooring & tiling (standard practice)
 * - Net area method for paint (deduct openings > 0.5m²)
 * - Perimeter method for skirting, curtain tracks, cornices
 * - Room height default: 2.8m (Gulf standard for residential)
 */

export interface RoomDimensions {
  length: number;   // متر
  width: number;    // متر
  height?: number;  // متر — افتراضي 2.8م
}

export interface BOQItem {
  name: string;
  unit: string;
  qty: number;
  unitPriceMin: number;
  unitPriceMax: number;
  totalMin: number;
  totalMax: number;
  notes: string;
  basis: string; // أساس الحساب للشفافية
}

export interface BOQCategory {
  category: string;
  icon?: string;
  items: BOQItem[];
  subtotalMin: number;
  subtotalMax: number;
}

export interface BOQResult {
  categories: BOQCategory[];
  grandTotalMin: number;
  grandTotalMax: number;
  area: number;
  perimeter: number;
  wallArea: number;
  ceilingArea: number;
  source: "exact" | "estimated"; // هل الأبعاد مدخلة أم مقدّرة
  disclaimer: string;
}

// ===== معاملات الهدر الهندسية =====
const WASTE_TILE = 0.10;        // 10% هدر بلاط (قطع + كسر)
const WASTE_PAINT = 0.05;       // 5% هدر دهان
const WASTE_FLOORING = 0.08;    // 8% هدر أرضيات خشب/فينيل
const DOOR_AREA = 1.9 * 0.9;    // مساحة باب قياسي 90×190 سم
const WINDOW_AREA = 1.2 * 1.0;  // مساحة نافذة قياسية 120×100 سم
const DEFAULT_DOORS = 1;
const DEFAULT_WINDOWS = 1;
const CEILING_HEIGHT = 2.8;     // ارتفاع السقف الافتراضي بالمتر

// ===== أسعار السوق الخليجي (درهم إماراتي) =====
// المصدر: متوسطات سوق الإمارات 2024-2025
const PRICES = {
  // أرضيات
  porcelainTile_supply: { min: 60, max: 120 },    // درهم/م² (توريد فقط)
  porcelainTile_install: { min: 25, max: 45 },    // درهم/م² (تركيب)
  marbleTile_supply: { min: 150, max: 400 },
  marbleTile_install: { min: 40, max: 70 },
  vinylFlooring: { min: 40, max: 90 },            // شامل تركيب
  woodFlooring: { min: 120, max: 280 },           // شامل تركيب
  carpet: { min: 35, max: 120 },                  // شامل تركيب
  // جدران
  paint_supply: { min: 8, max: 18 },              // درهم/م² (مادة)
  paint_labor: { min: 8, max: 15 },               // درهم/م² (عمالة)
  wallpaper: { min: 35, max: 120 },               // شامل تركيب
  gypsum_cladding: { min: 80, max: 200 },         // تكسية جبس
  // أسقف
  gypsumCeiling_supply: { min: 30, max: 60 },
  gypsumCeiling_install: { min: 20, max: 40 },
  paintCeiling: { min: 12, max: 22 },             // دهان سقف
  // إضاءة
  spotLight: { min: 40, max: 150 },               // سبوت LED وحدة
  chandelier: { min: 500, max: 5000 },            // ثريا
  stripLight_m: { min: 30, max: 80 },             // شريط إضاءة م
  // ستائر
  curtain_m: { min: 150, max: 500 },              // درهم/م طولي شامل تركيب
  blinds_m2: { min: 80, max: 200 },              // رول بلايند م²
  // إكسسوار
  skirting_m: { min: 15, max: 45 },              // قرنيش أرضي م
  cornice_m: { min: 20, max: 60 },               // قرنيش سقف م
  // عمالة عامة
  labor_daily: { min: 150, max: 250 },            // عامل/يوم
};

/**
 * حساب عدد سبوتات الإضاءة وفق معيار الإضاءة الهندسي
 * المعيار: 300-500 lux للمعيشة، 500-750 للمطبخ
 * كل سبوت 7-10 واط يغطي ~2م²
 */
function calcSpotLights(area: number): number {
  return Math.ceil(area / 2.0); // سبوت لكل 2م²
}

/**
 * حساب طول الستائر
 * المعيار: عرض النافذة × 2.5 (تجعيد كامل) أو × 1.5 (نصف تجعيد)
 * نستخدم 2.0 كمتوسط
 */
function calcCurtainLength(windowCount: number, avgWindowWidth = 1.5): number {
  return Math.ceil(windowCount * avgWindowWidth * 2.0);
}

/**
 * حساب كمية الدهان
 * المعيار: 1 لتر يغطي 10-12م² (طبقتين)
 * نستخدم 10م²/لتر كمعيار محافظ
 */
function calcPaintLiters(paintableArea: number): number {
  return Math.ceil(paintableArea / 10);
}

/**
 * المحرك الرئيسي لحساب جدول الكميات
 */
export function calculateBOQ(
  dims: RoomDimensions,
  style: string,
  scenario: string, // surface / moderate / complete
  spaceType: string,
  aiBoqItems?: BOQCategory[], // بنود إضافية من الـ AI
  source: "exact" | "estimated" = "exact"
): BOQResult {
  const L = dims.length;
  const W = dims.width;
  const H = dims.height || CEILING_HEIGHT;

  // ===== الحسابات الهندسية الأساسية =====
  const floorArea = L * W;                          // مساحة الأرضية م²
  const ceilingArea = floorArea;                    // مساحة السقف = مساحة الأرضية
  const perimeter = 2 * (L + W);                   // المحيط م
  const grossWallArea = perimeter * H;              // إجمالي مساحة الجدران م²
  const openingsArea = (DEFAULT_DOORS * DOOR_AREA) + (DEFAULT_WINDOWS * WINDOW_AREA);
  const netWallArea = Math.max(0, grossWallArea - openingsArea); // مساحة الجدران الصافية م²

  // ===== كميات مع هدر =====
  const floorWithWaste = floorArea * (1 + WASTE_TILE);
  const wallPaintArea = netWallArea * (1 + WASTE_PAINT);
  const ceilPaintArea = ceilingArea * (1 + WASTE_PAINT);

  // ===== تحديد نوع الأرضية حسب النمط =====
  const floorType = getFloorType(style, spaceType);
  const wallFinish = getWallFinish(style, scenario);
  const ceilingType = getCeilingType(style, scenario);

  const categories: BOQCategory[] = [];

  // ===== 1. أعمال الأرضيات =====
  const floorItems: BOQItem[] = [];

  if (floorType === "porcelain") {
    floorItems.push({
      name: "بلاط بورسلين (توريد)",
      unit: "م²",
      qty: parseFloat(floorWithWaste.toFixed(2)),
      unitPriceMin: PRICES.porcelainTile_supply.min,
      unitPriceMax: PRICES.porcelainTile_supply.max,
      totalMin: Math.round(floorWithWaste * PRICES.porcelainTile_supply.min),
      totalMax: Math.round(floorWithWaste * PRICES.porcelainTile_supply.max),
      notes: `مساحة الغرفة ${floorArea.toFixed(1)}م² + 10% هدر`,
      basis: `${L}م × ${W}م = ${floorArea.toFixed(1)}م² × 1.10`,
    });
    floorItems.push({
      name: "تركيب البلاط (عمالة + مواد لاصقة)",
      unit: "م²",
      qty: parseFloat(floorWithWaste.toFixed(2)),
      unitPriceMin: PRICES.porcelainTile_install.min,
      unitPriceMax: PRICES.porcelainTile_install.max,
      totalMin: Math.round(floorWithWaste * PRICES.porcelainTile_install.min),
      totalMax: Math.round(floorWithWaste * PRICES.porcelainTile_install.max),
      notes: "شامل الغراء والجوينت",
      basis: "نفس كمية البلاط",
    });
  } else if (floorType === "marble") {
    floorItems.push({
      name: "رخام طبيعي (توريد)",
      unit: "م²",
      qty: parseFloat(floorWithWaste.toFixed(2)),
      unitPriceMin: PRICES.marbleTile_supply.min,
      unitPriceMax: PRICES.marbleTile_supply.max,
      totalMin: Math.round(floorWithWaste * PRICES.marbleTile_supply.min),
      totalMax: Math.round(floorWithWaste * PRICES.marbleTile_supply.max),
      notes: `مساحة ${floorArea.toFixed(1)}م² + 10% هدر`,
      basis: `${L}م × ${W}م × 1.10`,
    });
    floorItems.push({
      name: "تركيب الرخام",
      unit: "م²",
      qty: parseFloat(floorWithWaste.toFixed(2)),
      unitPriceMin: PRICES.marbleTile_install.min,
      unitPriceMax: PRICES.marbleTile_install.max,
      totalMin: Math.round(floorWithWaste * PRICES.marbleTile_install.min),
      totalMax: Math.round(floorWithWaste * PRICES.marbleTile_install.max),
      notes: "شامل الغراء والتلميع",
      basis: "نفس كمية الرخام",
    });
  } else if (floorType === "wood") {
    const woodQty = floorArea * (1 + WASTE_FLOORING);
    floorItems.push({
      name: "أرضية خشب هندسي (توريد وتركيب)",
      unit: "م²",
      qty: parseFloat(woodQty.toFixed(2)),
      unitPriceMin: PRICES.woodFlooring.min,
      unitPriceMax: PRICES.woodFlooring.max,
      totalMin: Math.round(woodQty * PRICES.woodFlooring.min),
      totalMax: Math.round(woodQty * PRICES.woodFlooring.max),
      notes: `مساحة ${floorArea.toFixed(1)}م² + 8% هدر`,
      basis: `${L}م × ${W}م × 1.08`,
    });
  } else if (floorType === "carpet") {
    floorItems.push({
      name: "سجادة (توريد وتركيب)",
      unit: "م²",
      qty: parseFloat(floorArea.toFixed(2)),
      unitPriceMin: PRICES.carpet.min,
      unitPriceMax: PRICES.carpet.max,
      totalMin: Math.round(floorArea * PRICES.carpet.min),
      totalMax: Math.round(floorArea * PRICES.carpet.max),
      notes: `مساحة الغرفة ${floorArea.toFixed(1)}م²`,
      basis: `${L}م × ${W}م`,
    });
  } else { // vinyl
    const vinylQty = floorArea * (1 + WASTE_FLOORING);
    floorItems.push({
      name: "فينيل أرضيات (توريد وتركيب)",
      unit: "م²",
      qty: parseFloat(vinylQty.toFixed(2)),
      unitPriceMin: PRICES.vinylFlooring.min,
      unitPriceMax: PRICES.vinylFlooring.max,
      totalMin: Math.round(vinylQty * PRICES.vinylFlooring.min),
      totalMax: Math.round(vinylQty * PRICES.vinylFlooring.max),
      notes: `مساحة ${floorArea.toFixed(1)}م² + 8% هدر`,
      basis: `${L}م × ${W}م × 1.08`,
    });
  }

  // قرنيش أرضي (سكيرتنج)
  floorItems.push({
    name: "قرنيش أرضي (سكيرتنج)",
    unit: "م",
    qty: parseFloat(perimeter.toFixed(1)),
    unitPriceMin: PRICES.skirting_m.min,
    unitPriceMax: PRICES.skirting_m.max,
    totalMin: Math.round(perimeter * PRICES.skirting_m.min),
    totalMax: Math.round(perimeter * PRICES.skirting_m.max),
    notes: "محيط الغرفة كاملاً",
    basis: `2 × (${L} + ${W}) = ${perimeter.toFixed(1)}م`,
  });

  categories.push(buildCategory("أعمال الأرضيات", "🪵", floorItems));

  // ===== 2. أعمال الجدران =====
  const wallItems: BOQItem[] = [];

  if (wallFinish === "paint") {
    wallItems.push({
      name: "دهان جدران (مادة — طبقتان)",
      unit: "م²",
      qty: parseFloat(wallPaintArea.toFixed(2)),
      unitPriceMin: PRICES.paint_supply.min,
      unitPriceMax: PRICES.paint_supply.max,
      totalMin: Math.round(wallPaintArea * PRICES.paint_supply.min),
      totalMax: Math.round(wallPaintArea * PRICES.paint_supply.max),
      notes: `مساحة جدران صافية ${netWallArea.toFixed(1)}م² (بعد خصم الفتحات) + 5% هدر`,
      basis: `محيط ${perimeter.toFixed(1)}م × ارتفاع ${H}م − فتحات ${openingsArea.toFixed(1)}م²`,
    });
    wallItems.push({
      name: "دهان جدران (عمالة)",
      unit: "م²",
      qty: parseFloat(wallPaintArea.toFixed(2)),
      unitPriceMin: PRICES.paint_labor.min,
      unitPriceMax: PRICES.paint_labor.max,
      totalMin: Math.round(wallPaintArea * PRICES.paint_labor.min),
      totalMax: Math.round(wallPaintArea * PRICES.paint_labor.max),
      notes: "تجهيز + بطانة + طبقتان نهائيتان",
      basis: "نفس مساحة الدهان",
    });
    const liters = calcPaintLiters(wallPaintArea);
    wallItems.push({
      name: "كمية الدهان التقديرية",
      unit: "لتر",
      qty: liters,
      unitPriceMin: 25,
      unitPriceMax: 60,
      totalMin: Math.round(liters * 25),
      totalMax: Math.round(liters * 60),
      notes: "معيار: 1 لتر / 10م² (طبقتان)",
      basis: `${wallPaintArea.toFixed(1)}م² ÷ 10 = ${liters} لتر`,
    });
  } else if (wallFinish === "wallpaper") {
    wallItems.push({
      name: "ورق جدران (توريد وتركيب)",
      unit: "م²",
      qty: parseFloat(wallPaintArea.toFixed(2)),
      unitPriceMin: PRICES.wallpaper.min,
      unitPriceMax: PRICES.wallpaper.max,
      totalMin: Math.round(wallPaintArea * PRICES.wallpaper.min),
      totalMax: Math.round(wallPaintArea * PRICES.wallpaper.max),
      notes: `مساحة جدران صافية ${netWallArea.toFixed(1)}م² + 5%`,
      basis: `محيط × ارتفاع − فتحات`,
    });
    // دهان الجدران المتبقية
    wallItems.push({
      name: "دهان جدران (جدار مميز)",
      unit: "م²",
      qty: parseFloat((H * Math.min(L, W) * 1.05).toFixed(2)),
      unitPriceMin: PRICES.paint_supply.min + PRICES.paint_labor.min,
      unitPriceMax: PRICES.paint_supply.max + PRICES.paint_labor.max,
      totalMin: Math.round(H * Math.min(L, W) * 1.05 * (PRICES.paint_supply.min + PRICES.paint_labor.min)),
      totalMax: Math.round(H * Math.min(L, W) * 1.05 * (PRICES.paint_supply.max + PRICES.paint_labor.max)),
      notes: "جدار مميز بلون مختلف",
      basis: `${H}م × ${Math.min(L, W).toFixed(1)}م`,
    });
  } else { // gypsum / cladding
    wallItems.push({
      name: "تكسية جبس / بانل ديكوري",
      unit: "م²",
      qty: parseFloat((H * Math.min(L, W)).toFixed(2)),
      unitPriceMin: PRICES.gypsum_cladding.min,
      unitPriceMax: PRICES.gypsum_cladding.max,
      totalMin: Math.round(H * Math.min(L, W) * PRICES.gypsum_cladding.min),
      totalMax: Math.round(H * Math.min(L, W) * PRICES.gypsum_cladding.max),
      notes: "جدار مميز واحد",
      basis: `${H}م × ${Math.min(L, W).toFixed(1)}م`,
    });
    // دهان باقي الجدران
    const remainWall = netWallArea - (H * Math.min(L, W));
    if (remainWall > 0) {
      wallItems.push({
        name: "دهان الجدران المتبقية",
        unit: "م²",
        qty: parseFloat((remainWall * 1.05).toFixed(2)),
        unitPriceMin: PRICES.paint_supply.min + PRICES.paint_labor.min,
        unitPriceMax: PRICES.paint_supply.max + PRICES.paint_labor.max,
        totalMin: Math.round(remainWall * 1.05 * (PRICES.paint_supply.min + PRICES.paint_labor.min)),
        totalMax: Math.round(remainWall * 1.05 * (PRICES.paint_supply.max + PRICES.paint_labor.max)),
        notes: "باقي الجدران بعد التكسية",
        basis: `${netWallArea.toFixed(1)} − ${(H * Math.min(L, W)).toFixed(1)} = ${remainWall.toFixed(1)}م²`,
      });
    }
  }

  // قرنيش سقف
  categories.push(buildCategory("أعمال الجدران", "🎨", wallItems));

  // ===== 3. أعمال الأسقف =====
  const ceilItems: BOQItem[] = [];

  if (ceilingType === "gypsum_drop") {
    ceilItems.push({
      name: "سقف جبس مستوى (توريد وتركيب)",
      unit: "م²",
      qty: parseFloat(ceilingArea.toFixed(2)),
      unitPriceMin: PRICES.gypsumCeiling_supply.min + PRICES.gypsumCeiling_install.min,
      unitPriceMax: PRICES.gypsumCeiling_supply.max + PRICES.gypsumCeiling_install.max,
      totalMin: Math.round(ceilingArea * (PRICES.gypsumCeiling_supply.min + PRICES.gypsumCeiling_install.min)),
      totalMax: Math.round(ceilingArea * (PRICES.gypsumCeiling_supply.max + PRICES.gypsumCeiling_install.max)),
      notes: "سقف جبس مستوى بإطار معدني",
      basis: `${L}م × ${W}م = ${ceilingArea.toFixed(1)}م²`,
    });
  } else {
    ceilItems.push({
      name: "دهان سقف (مادة + عمالة)",
      unit: "م²",
      qty: parseFloat(ceilPaintArea.toFixed(2)),
      unitPriceMin: PRICES.paintCeiling.min,
      unitPriceMax: PRICES.paintCeiling.max,
      totalMin: Math.round(ceilPaintArea * PRICES.paintCeiling.min),
      totalMax: Math.round(ceilPaintArea * PRICES.paintCeiling.max),
      notes: `مساحة السقف ${ceilingArea.toFixed(1)}م² + 5% هدر`,
      basis: `${L}م × ${W}م × 1.05`,
    });
  }

  // قرنيش سقف
  ceilItems.push({
    name: "قرنيش سقف جبس",
    unit: "م",
    qty: parseFloat(perimeter.toFixed(1)),
    unitPriceMin: PRICES.cornice_m.min,
    unitPriceMax: PRICES.cornice_m.max,
    totalMin: Math.round(perimeter * PRICES.cornice_m.min),
    totalMax: Math.round(perimeter * PRICES.cornice_m.max),
    notes: "قرنيش ديكوري على محيط السقف",
    basis: `2 × (${L} + ${W}) = ${perimeter.toFixed(1)}م`,
  });

  categories.push(buildCategory("أعمال الأسقف", "🏠", ceilItems));

  // ===== 4. الإضاءة =====
  const lightItems: BOQItem[] = [];
  const spotCount = calcSpotLights(floorArea);
  const stripLength = perimeter * 0.75; // 75% من المحيط كشريط إضاءة

  lightItems.push({
    name: "سبوت إضاءة LED مدمج",
    unit: "وحدة",
    qty: spotCount,
    unitPriceMin: PRICES.spotLight.min,
    unitPriceMax: PRICES.spotLight.max,
    totalMin: Math.round(spotCount * PRICES.spotLight.min),
    totalMax: Math.round(spotCount * PRICES.spotLight.max),
    notes: "معيار: سبوت لكل 2م² (300-500 lux)",
    basis: `${floorArea.toFixed(1)}م² ÷ 2 = ${spotCount} وحدة`,
  });

  if (style === "luxury" || style === "gulf" || style === "classical") {
    lightItems.push({
      name: "ثريا مركزية",
      unit: "قطعة",
      qty: 1,
      unitPriceMin: PRICES.chandelier.min,
      unitPriceMax: PRICES.chandelier.max,
      totalMin: PRICES.chandelier.min,
      totalMax: PRICES.chandelier.max,
      notes: "ثريا رئيسية حسب النمط",
      basis: "1 قطعة لكل غرفة",
    });
  }

  lightItems.push({
    name: "شريط إضاءة LED (Cove Lighting)",
    unit: "م",
    qty: parseFloat(stripLength.toFixed(1)),
    unitPriceMin: PRICES.stripLight_m.min,
    unitPriceMax: PRICES.stripLight_m.max,
    totalMin: Math.round(stripLength * PRICES.stripLight_m.min),
    totalMax: Math.round(stripLength * PRICES.stripLight_m.max),
    notes: "إضاءة غير مباشرة في قرنيش السقف",
    basis: `محيط ${perimeter.toFixed(1)}م × 75%`,
  });

  categories.push(buildCategory("أعمال الإضاءة", "💡", lightItems));

  // ===== 5. الستائر والمفروشات =====
  const curtainItems: BOQItem[] = [];
  const curtainLength = calcCurtainLength(DEFAULT_WINDOWS);

  if (style === "minimal" || style === "scandinavian" || style === "industrial") {
    curtainItems.push({
      name: "رول بلايند / رومان شيد",
      unit: "م²",
      qty: parseFloat((DEFAULT_WINDOWS * 1.2 * 1.5).toFixed(2)),
      unitPriceMin: PRICES.blinds_m2.min,
      unitPriceMax: PRICES.blinds_m2.max,
      totalMin: Math.round(DEFAULT_WINDOWS * 1.2 * 1.5 * PRICES.blinds_m2.min),
      totalMax: Math.round(DEFAULT_WINDOWS * 1.2 * 1.5 * PRICES.blinds_m2.max),
      notes: "مناسب للنمط المينيمال والصناعي",
      basis: `${DEFAULT_WINDOWS} نافذة × 1.2م × 1.5م`,
    });
  } else {
    curtainItems.push({
      name: "ستائر (توريد وتركيب)",
      unit: "م طولي",
      qty: curtainLength,
      unitPriceMin: PRICES.curtain_m.min,
      unitPriceMax: PRICES.curtain_m.max,
      totalMin: Math.round(curtainLength * PRICES.curtain_m.min),
      totalMax: Math.round(curtainLength * PRICES.curtain_m.max),
      notes: "معيار: عرض النافذة × 2 (تجعيد كامل)",
      basis: `${DEFAULT_WINDOWS} نافذة × 1.5م × 2 = ${curtainLength}م`,
    });
  }

  categories.push(buildCategory("الستائر والمفروشات", "🪟", curtainItems));

  // ===== 6. بنود من AI (أثاث وإكسسوار) =====
  if (aiBoqItems && aiBoqItems.length > 0) {
    for (const cat of aiBoqItems) {
      if (cat.items && cat.items.length > 0) {
        const enrichedItems: BOQItem[] = cat.items.map((item) => {
          const qty = item.qty || 1;
          const uMin = item.unitPriceMin || 0;
          const uMax = item.unitPriceMax || 0;
          return {
            name: item.name,
            unit: item.unit || "قطعة",
            qty,
            unitPriceMin: uMin,
            unitPriceMax: uMax,
            totalMin: Math.round(qty * uMin),
            totalMax: Math.round(qty * uMax),
            notes: item.notes || "",
            basis: "تقدير م. سارة",
          };
        });
        categories.push(buildCategory(cat.category, getCategoryIcon(cat.category), enrichedItems));
      }
    }
  }

  // ===== الإجمالي =====
  const grandTotalMin = categories.reduce((s, c) => s + (c.subtotalMin ?? 0), 0);
  const grandTotalMax = categories.reduce((s, c) => s + (c.subtotalMax ?? 0), 0);

  return {
    categories,
    grandTotalMin,
    grandTotalMax,
    area: parseFloat(floorArea.toFixed(2)),
    perimeter: parseFloat(perimeter.toFixed(2)),
    wallArea: parseFloat(netWallArea.toFixed(2)),
    ceilingArea: parseFloat(ceilingArea.toFixed(2)),
    source,
    disclaimer: source === "estimated"
      ? "⚠️ الكميات تقديرية بناءً على تحليل الصورة. أدخل أبعاد الغرفة الفعلية للحصول على دقة أعلى."
      : "✅ الكميات محسوبة بناءً على الأبعاد المدخلة وفق المعايير الهندسية المعتمدة.",
  };
}

// ===== دوال مساعدة =====

function buildCategory(category: string, icon: string, items: BOQItem[]): BOQCategory {
  const subtotalMin = items.reduce((s, i) => s + i.totalMin, 0);
  const subtotalMax = items.reduce((s, i) => s + i.totalMax, 0);
  return { category, icon, items, subtotalMin, subtotalMax };
}

function getFloorType(style: string, spaceType: string): string {
  if (style === "luxury" || style === "gulf" || style === "classical") return "marble";
  if (style === "scandinavian" || style === "bohemian") return "wood";
  if (style === "minimal" || style === "japanese") return "wood";
  if (style === "industrial") return "vinyl";
  if (spaceType?.includes("نوم") || spaceType?.includes("bedroom")) return "carpet";
  return "porcelain"; // افتراضي
}

function getWallFinish(style: string, scenario: string): string {
  if (scenario === "surface") return "paint";
  if (style === "luxury" || style === "gulf" || style === "classical") return "gypsum";
  if (style === "bohemian" || style === "moroccan") return "wallpaper";
  return "paint";
}

function getCeilingType(style: string, scenario: string): string {
  if (scenario === "surface") return "paint";
  if (style === "luxury" || style === "gulf" || style === "classical" || style === "modern") return "gypsum_drop";
  return "paint";
}

function getCategoryIcon(category: string): string {
  if (category.includes("أثاث") || category.includes("مفروشات")) return "🛋️";
  if (category.includes("إضاءة")) return "💡";
  if (category.includes("ستائر")) return "🪟";
  if (category.includes("ديكور") || category.includes("إكسسوار")) return "🖼️";
  if (category.includes("أرضيات")) return "🪵";
  if (category.includes("جدران")) return "🎨";
  if (category.includes("أسقف")) return "🏠";
  return "📦";
}

/**
 * تقدير أبعاد الغرفة من التحليل النصي للـ AI
 * يُستخدم عند غياب الأبعاد المدخلة
 */
export function estimateDimensionsFromAnalysis(
  estimatedArea: string | undefined,
  roomShape: string | undefined,
  spaceType: string | undefined
): RoomDimensions {
  // محاولة استخراج رقم من estimatedArea
  let area = 20; // افتراضي
  if (estimatedArea) {
    const match = estimatedArea.match(/(\d+)/);
    if (match) area = parseInt(match[1]);
  }

  // تقدير أبعاد من نوع الفضاء
  if (!area || area < 5) {
    if (spaceType?.includes("صالة") || spaceType?.includes("معيشة")) area = 30;
    else if (spaceType?.includes("نوم") || spaceType?.includes("غرفة")) area = 20;
    else if (spaceType?.includes("مطبخ")) area = 15;
    else if (spaceType?.includes("مجلس")) area = 40;
    else area = 20;
  }

  // تحديد النسبة من شكل الغرفة
  let ratio = 1.5; // مستطيل عادي
  if (roomShape?.includes("مربع")) ratio = 1.0;
  else if (roomShape?.includes("ضيق")) ratio = 2.0;
  else if (roomShape?.includes("عريض")) ratio = 1.3;

  const width = parseFloat(Math.sqrt(area / ratio).toFixed(1));
  const length = parseFloat((width * ratio).toFixed(1));

  return { length, width, height: CEILING_HEIGHT };
}

// ===== أسعار الفضاءات الخارجية (درهم إماراتي) =====
const EXTERIOR_PRICES = {
  // واجهات
  cladding_aluminum: { min: 200, max: 500 },    // كلادينج ألومنيوم م²
  cladding_stone: { min: 150, max: 400 },       // حجر طبيعي/اصطناعي م²
  cladding_grc: { min: 180, max: 450 },         // GRC م²
  exterior_paint: { min: 20, max: 50 },         // دهان خارجي م²
  facade_lighting: { min: 80, max: 300 },       // إضاءة واجهة نقطة
  entrance_gate: { min: 3000, max: 15000 },     // بوابة مدخل وحدة
  // لاندسكيب
  grass_natural: { min: 40, max: 80 },          // عشب طبيعي م²
  grass_artificial: { min: 60, max: 150 },      // عشب اصطناعي م²
  paving_concrete: { min: 80, max: 180 },       // رصف خرسانة م²
  paving_natural_stone: { min: 150, max: 350 }, // رصف حجر طبيعي م²
  paving_wood_deck: { min: 200, max: 500 },     // ديك خشبي م²
  tree_large: { min: 500, max: 3000 },          // شجرة كبيرة وحدة
  tree_medium: { min: 200, max: 800 },          // شجرة متوسطة وحدة
  shrub: { min: 30, max: 150 },                 // شجيرة وحدة
  planter_box: { min: 200, max: 1000 },         // حوض زراعة وحدة
  irrigation_system: { min: 15, max: 40 },      // نظام ري م²
  outdoor_lighting_pole: { min: 300, max: 1200 }, // عمود إضاءة خارجي
  outdoor_lighting_spot: { min: 60, max: 200 }, // سبوت أرضي خارجي
  // مسابح
  pool_construction: { min: 800, max: 2000 },   // إنشاء مسبح م²
  pool_tiles: { min: 150, max: 400 },           // بلاط مسبح م²
  pool_equipment: { min: 5000, max: 20000 },    // معدات تصفية وحدة
  pool_lighting: { min: 500, max: 2000 },       // إضاءة مسبح وحدة
  pool_coping: { min: 200, max: 500 },          // حافة مسبح م
  // جلسات خارجية
  pergola: { min: 500, max: 2000 },             // برجولة م²
  outdoor_furniture_set: { min: 2000, max: 15000 }, // طقم أثاث خارجي
  shade_sail: { min: 300, max: 800 },           // شراع ظل م²
  bbq_area: { min: 3000, max: 12000 },          // منطقة شواء وحدة
  // ممرات
  pathway_concrete: { min: 60, max: 150 },      // ممر خرساني م²
  pathway_stepping_stones: { min: 100, max: 300 }, // أحجار ممر م²
  retaining_wall: { min: 300, max: 800 },       // جدار استناد م²
};

/**
 * حساب BOQ للفضاءات الخارجية
 * يُستخدم عند اكتشاف نوع الفضاء = واجهة / لاندسكيب / مسبح / ممر
 */
export function calculateExteriorBOQ(
  dims: RoomDimensions,
  style: string,
  spaceCategory: string, // "facade" | "landscape" | "pool" | "pathway" | "outdoor_seating"
  aiBoqItems?: BOQCategory[],
  source: "exact" | "estimated" = "estimated"
): BOQResult {
  const L = dims.length;
  const W = dims.width;
  const area = L * W;
  const perimeter = 2 * (L + W);

  const categories: BOQCategory[] = [];

  if (spaceCategory === "facade") {
    // === واجهة مبنى ===
    const facadeArea = area; // نستخدم المساحة كمساحة الواجهة
    const facadeItems: BOQItem[] = [];

    // كلادينج أو دهان خارجي
    if (style === "modern_facade" || style === "modern") {
      facadeItems.push({
        name: "كلادينج ألومنيوم مركّب (ACM)",
        unit: "م²",
        qty: parseFloat(facadeArea.toFixed(1)),
        unitPriceMin: EXTERIOR_PRICES.cladding_aluminum.min,
        unitPriceMax: EXTERIOR_PRICES.cladding_aluminum.max,
        totalMin: Math.round(facadeArea * EXTERIOR_PRICES.cladding_aluminum.min),
        totalMax: Math.round(facadeArea * EXTERIOR_PRICES.cladding_aluminum.max),
        notes: "شامل هيكل التركيب والعزل",
        basis: `${L}م × ${W}م = ${facadeArea.toFixed(1)}م²`,
      });
    } else if (style === "arabic_facade" || style === "classical" || style === "gulf") {
      facadeItems.push({
        name: "حجر طبيعي/اصطناعي للواجهة",
        unit: "م²",
        qty: parseFloat(facadeArea.toFixed(1)),
        unitPriceMin: EXTERIOR_PRICES.cladding_stone.min,
        unitPriceMax: EXTERIOR_PRICES.cladding_stone.max,
        totalMin: Math.round(facadeArea * EXTERIOR_PRICES.cladding_stone.min),
        totalMax: Math.round(facadeArea * EXTERIOR_PRICES.cladding_stone.max),
        notes: "شامل الغراء والمونة والتركيب",
        basis: `مساحة الواجهة ${facadeArea.toFixed(1)}م²`,
      });
    } else {
      facadeItems.push({
        name: "دهان خارجي عازل للحرارة",
        unit: "م²",
        qty: parseFloat(facadeArea.toFixed(1)),
        unitPriceMin: EXTERIOR_PRICES.exterior_paint.min,
        unitPriceMax: EXTERIOR_PRICES.exterior_paint.max,
        totalMin: Math.round(facadeArea * EXTERIOR_PRICES.exterior_paint.min),
        totalMax: Math.round(facadeArea * EXTERIOR_PRICES.exterior_paint.max),
        notes: "طبقتان + بايمر خارجي",
        basis: `مساحة الواجهة ${facadeArea.toFixed(1)}م²`,
      });
    }

    // إضاءة الواجهة
    const lightingPoints = Math.ceil(facadeArea / 8);
    facadeItems.push({
      name: "إضاءة واجهة LED",
      unit: "نقطة",
      qty: lightingPoints,
      unitPriceMin: EXTERIOR_PRICES.facade_lighting.min,
      unitPriceMax: EXTERIOR_PRICES.facade_lighting.max,
      totalMin: Math.round(lightingPoints * EXTERIOR_PRICES.facade_lighting.min),
      totalMax: Math.round(lightingPoints * EXTERIOR_PRICES.facade_lighting.max),
      notes: "سبوت أو شريط LED مقاوم للماء",
      basis: `نقطة لكل 8م² من الواجهة`,
    });

    const subtotalMin = facadeItems.reduce((s, i) => s + i.totalMin, 0);
    const subtotalMax = facadeItems.reduce((s, i) => s + i.totalMax, 0);
    categories.push({ category: "أعمال الواجهة", icon: "🏛️", items: facadeItems, subtotalMin, subtotalMax });

  } else if (spaceCategory === "pool") {
    // === مسبح ===
    const poolItems: BOQItem[] = [];
    const poolPerimeter = perimeter;

    poolItems.push({
      name: "إنشاء هيكل المسبح (خرسانة مسلحة)",
      unit: "م²",
      qty: parseFloat(area.toFixed(1)),
      unitPriceMin: EXTERIOR_PRICES.pool_construction.min,
      unitPriceMax: EXTERIOR_PRICES.pool_construction.max,
      totalMin: Math.round(area * EXTERIOR_PRICES.pool_construction.min),
      totalMax: Math.round(area * EXTERIOR_PRICES.pool_construction.max),
      notes: "شامل الحفر والردم والعزل المائي",
      basis: `${L}م × ${W}م = ${area.toFixed(1)}م²`,
    });
    poolItems.push({
      name: "بلاط مسبح (موزاييك/بورسلين مائي)",
      unit: "م²",
      qty: parseFloat((area * 1.3).toFixed(1)),
      unitPriceMin: EXTERIOR_PRICES.pool_tiles.min,
      unitPriceMax: EXTERIOR_PRICES.pool_tiles.max,
      totalMin: Math.round(area * 1.3 * EXTERIOR_PRICES.pool_tiles.min),
      totalMax: Math.round(area * 1.3 * EXTERIOR_PRICES.pool_tiles.max),
      notes: "قاع + جدران المسبح + 30% هدر",
      basis: `${area.toFixed(1)}م² × 1.3`,
    });
    poolItems.push({
      name: "منظومة تصفية وضخ المياه",
      unit: "وحدة",
      qty: 1,
      unitPriceMin: EXTERIOR_PRICES.pool_equipment.min,
      unitPriceMax: EXTERIOR_PRICES.pool_equipment.max,
      totalMin: EXTERIOR_PRICES.pool_equipment.min,
      totalMax: EXTERIOR_PRICES.pool_equipment.max,
      notes: "مضخة + فلتر رملي + كلورنة تلقائية",
      basis: "وحدة كاملة",
    });
    poolItems.push({
      name: "حافة المسبح (كوبينج)",
      unit: "م",
      qty: parseFloat(poolPerimeter.toFixed(1)),
      unitPriceMin: EXTERIOR_PRICES.pool_coping.min,
      unitPriceMax: EXTERIOR_PRICES.pool_coping.max,
      totalMin: Math.round(poolPerimeter * EXTERIOR_PRICES.pool_coping.min),
      totalMax: Math.round(poolPerimeter * EXTERIOR_PRICES.pool_coping.max),
      notes: "حجر أو بورسلين مقاوم للانزلاق",
      basis: `محيط ${poolPerimeter.toFixed(1)}م`,
    });
    poolItems.push({
      name: "إضاءة مسبح LED مقاومة للماء",
      unit: "وحدة",
      qty: Math.ceil(area / 10),
      unitPriceMin: EXTERIOR_PRICES.pool_lighting.min,
      unitPriceMax: EXTERIOR_PRICES.pool_lighting.max,
      totalMin: Math.round(Math.ceil(area / 10) * EXTERIOR_PRICES.pool_lighting.min),
      totalMax: Math.round(Math.ceil(area / 10) * EXTERIOR_PRICES.pool_lighting.max),
      notes: "وحدة لكل 10م²",
      basis: `${Math.ceil(area / 10)} وحدة`,
    });

    const subtotalMin = poolItems.reduce((s, i) => s + i.totalMin, 0);
    const subtotalMax = poolItems.reduce((s, i) => s + i.totalMax, 0);
    categories.push({ category: "أعمال المسبح", icon: "🏊", items: poolItems, subtotalMin, subtotalMax });

  } else {
    // === لاندسكيب / ممرات / جلسات خارجية ===
    const landscapeItems: BOQItem[] = [];

    // أرضية خارجية
    const pavingType = style === "modern" || style === "minimal" ? "concrete" :
                       style === "tropical" || style === "zen_garden" ? "stepping_stones" : "natural_stone";

    if (pavingType === "concrete") {
      landscapeItems.push({
        name: "رصف خرساني مطبوع",
        unit: "م²",
        qty: parseFloat(area.toFixed(1)),
        unitPriceMin: EXTERIOR_PRICES.paving_concrete.min,
        unitPriceMax: EXTERIOR_PRICES.paving_concrete.max,
        totalMin: Math.round(area * EXTERIOR_PRICES.paving_concrete.min),
        totalMax: Math.round(area * EXTERIOR_PRICES.paving_concrete.max),
        notes: "شامل الأساس والطبقة الخرسانية",
        basis: `${L}م × ${W}م = ${area.toFixed(1)}م²`,
      });
    } else {
      landscapeItems.push({
        name: "رصف حجر طبيعي",
        unit: "م²",
        qty: parseFloat(area.toFixed(1)),
        unitPriceMin: EXTERIOR_PRICES.paving_natural_stone.min,
        unitPriceMax: EXTERIOR_PRICES.paving_natural_stone.max,
        totalMin: Math.round(area * EXTERIOR_PRICES.paving_natural_stone.min),
        totalMax: Math.round(area * EXTERIOR_PRICES.paving_natural_stone.max),
        notes: "شامل الفرش والتركيب",
        basis: `${L}م × ${W}م = ${area.toFixed(1)}م²`,
      });
    }

    // عشب
    const grassArea = area * 0.4; // 40% من المساحة عشب
    landscapeItems.push({
      name: style === "modern" || style === "minimal" ? "عشب اصطناعي عالي الجودة" : "عشب طبيعي",
      unit: "م²",
      qty: parseFloat(grassArea.toFixed(1)),
      unitPriceMin: style === "modern" ? EXTERIOR_PRICES.grass_artificial.min : EXTERIOR_PRICES.grass_natural.min,
      unitPriceMax: style === "modern" ? EXTERIOR_PRICES.grass_artificial.max : EXTERIOR_PRICES.grass_natural.max,
      totalMin: Math.round(grassArea * (style === "modern" ? EXTERIOR_PRICES.grass_artificial.min : EXTERIOR_PRICES.grass_natural.min)),
      totalMax: Math.round(grassArea * (style === "modern" ? EXTERIOR_PRICES.grass_artificial.max : EXTERIOR_PRICES.grass_natural.max)),
      notes: "شامل التركيب والتسوية",
      basis: `40% من إجمالي المساحة`,
    });

    // أشجار ونباتات
    const treesCount = Math.max(2, Math.ceil(area / 20));
    const shrubsCount = Math.max(5, Math.ceil(area / 8));
    landscapeItems.push({
      name: "أشجار (نخيل / ظل / زينة)",
      unit: "شجرة",
      qty: treesCount,
      unitPriceMin: EXTERIOR_PRICES.tree_medium.min,
      unitPriceMax: EXTERIOR_PRICES.tree_large.max,
      totalMin: Math.round(treesCount * EXTERIOR_PRICES.tree_medium.min),
      totalMax: Math.round(treesCount * EXTERIOR_PRICES.tree_large.max),
      notes: "شامل الزراعة والتسميد الأولي",
      basis: `شجرة لكل 20م²`,
    });
    landscapeItems.push({
      name: "شجيرات وزهور موسمية",
      unit: "وحدة",
      qty: shrubsCount,
      unitPriceMin: EXTERIOR_PRICES.shrub.min,
      unitPriceMax: EXTERIOR_PRICES.shrub.max,
      totalMin: Math.round(shrubsCount * EXTERIOR_PRICES.shrub.min),
      totalMax: Math.round(shrubsCount * EXTERIOR_PRICES.shrub.max),
      notes: "شامل التربة والزراعة",
      basis: `وحدة لكل 8م²`,
    });

    // نظام ري
    landscapeItems.push({
      name: "نظام ري تلقائي (رذاذ + تنقيط)",
      unit: "م²",
      qty: parseFloat(area.toFixed(1)),
      unitPriceMin: EXTERIOR_PRICES.irrigation_system.min,
      unitPriceMax: EXTERIOR_PRICES.irrigation_system.max,
      totalMin: Math.round(area * EXTERIOR_PRICES.irrigation_system.min),
      totalMax: Math.round(area * EXTERIOR_PRICES.irrigation_system.max),
      notes: "شامل المواسير والرؤوس والتحكم",
      basis: `${area.toFixed(1)}م² إجمالي`,
    });

    // إضاءة خارجية
    const lightingPoles = Math.ceil(perimeter / 6);
    landscapeItems.push({
      name: "إضاءة خارجية (أعمدة + سبوتات أرضية)",
      unit: "وحدة",
      qty: lightingPoles,
      unitPriceMin: EXTERIOR_PRICES.outdoor_lighting_spot.min,
      unitPriceMax: EXTERIOR_PRICES.outdoor_lighting_pole.max,
      totalMin: Math.round(lightingPoles * EXTERIOR_PRICES.outdoor_lighting_spot.min),
      totalMax: Math.round(lightingPoles * EXTERIOR_PRICES.outdoor_lighting_pole.max),
      notes: "LED مقاوم للعوامل الجوية",
      basis: `وحدة لكل 6م من المحيط`,
    });

    const subtotalMin = landscapeItems.reduce((s, i) => s + i.totalMin, 0);
    const subtotalMax = landscapeItems.reduce((s, i) => s + i.totalMax, 0);
    categories.push({
      category: spaceCategory === "pathway" ? "أعمال الممرات والمداخل" : "أعمال اللاندسكيب",
      icon: "🌿",
      items: landscapeItems,
      subtotalMin,
      subtotalMax
    });
  }

  // إضافة بنود AI إذا وجدت
  if (aiBoqItems && aiBoqItems.length > 0) {
    categories.push(...aiBoqItems);
  }

  const grandTotalMin = categories.reduce((s, c) => s + c.subtotalMin, 0);
  const grandTotalMax = categories.reduce((s, c) => s + c.subtotalMax, 0);

  return {
    categories,
    grandTotalMin,
    grandTotalMax,
    area,
    perimeter,
    wallArea: 0,
    ceilingArea: 0,
    source,
    disclaimer: "الأسعار تقديرية وفق متوسطات سوق الإمارات 2024-2025. تختلف الأسعار الفعلية حسب المواصفات والمقاول.",
  };
}

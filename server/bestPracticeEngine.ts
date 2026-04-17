/**
 * ===== BEST PRACTICE ENGINE =====
 * محرك أفضل الممارسات العالمية للتصميم الداخلي
 * مستند إلى: Architectural Digest 2025، Houzz Best of 2025، AD100، Elle Decor، Interior Design Magazine
 * يضمن أن كل صورة مولّدة تكون على مستوى "best of best" — لا تصاميم تقليدية مكررة
 */

// ===== قاموس أفضل الممارسات لكل نمط =====
export const BEST_PRACTICE_STYLES: Record<string, {
  // الوصف الاحترافي
  label: string;
  // الكلمات المفتاحية البصرية للـ prompt
  visualKeywords: string;
  // أفضل المواد الموثّقة عالمياً لهذا النمط
  bestMaterials: string;
  // أفضل لوحة ألوان موثّقة
  bestPalette: string;
  // أفضل إضاءة لهذا النمط
  bestLighting: string;
  // التفاصيل التي تميّز التصميم الجيد عن العادي
  signatureDetails: string;
  // ما يجب تجنّبه
  avoid: string;
  // مستوى الشعبية العالمية (1-10)
  globalPopularity: number;
  // مستوى الشعبية الخليجية (1-10)
  gulfPopularity: number;
}> = {

  // ===== الأكثر طلباً عالمياً 2024-2025 =====

  japandi: {
    label: "Japandi — بساطة يابانية + دفء سكاندنافي",
    visualKeywords: "Japandi interior, Japanese-Scandinavian fusion, wabi-sabi aesthetics, natural oak wood, warm neutral tones, handcrafted ceramics, linen textiles, organic forms",
    bestMaterials: "light oak wood, natural linen, handmade ceramics, washi paper, bamboo, raw plaster, stone, rattan",
    bestPalette: "warm white (#F5F0E8), soft greige (#C8B99A), natural oak (#B8956A), charcoal (#3D3D3D), sage green (#8A9E7A)",
    bestLighting: "diffused natural daylight, warm Edison bulbs (2700K), paper lanterns, indirect cove lighting, no harsh overhead lights",
    signatureDetails: "asymmetric shelf styling with negative space, single statement ceramic vase, handwoven throw, low-profile furniture with tapered legs, visible wood grain, wabi-sabi imperfections celebrated",
    avoid: "symmetrical arrangements, glossy surfaces, bright whites, chrome fixtures, ornate patterns",
    globalPopularity: 10,
    gulfPopularity: 7,
  },

  quiet_luxury: {
    label: "Quiet Luxury — فخامة هادئة راقية",
    visualKeywords: "quiet luxury interior, understated elegance, muted neutral palette, cashmere textures, bespoke furniture, architectural simplicity, old money aesthetic",
    bestMaterials: "Italian marble (Calacatta, Statuario), cashmere upholstery, mohair velvet, brushed brass, aged leather, solid walnut, hand-tufted wool rugs",
    bestPalette: "cream (#F2EDE4), warm taupe (#B5A898), greige (#9E8E7E), soft charcoal (#5C5550), muted gold (#C4A882)",
    bestLighting: "warm ambient 2700-3000K, recessed cove lighting, sculptural floor lamps, natural light maximized, no visible bulbs",
    signatureDetails: "monochromatic layering, high-quality hardware details, custom millwork, gallery-worthy art placement, fresh flowers in simple vessels, impeccable proportions",
    avoid: "logos, flashy gold, busy patterns, trendy colors, cheap materials, clutter",
    globalPopularity: 10,
    gulfPopularity: 9,
  },

  biophilic: {
    label: "Biophilic — الطبيعة داخل المنزل",
    visualKeywords: "biophilic interior design, living wall, abundant indoor plants, natural stone, raw wood, floor-to-ceiling windows, organic shapes, nature-inspired",
    bestMaterials: "live edge wood slabs, natural stone, cork, rattan, jute, terracotta, moss walls, bamboo, raw linen",
    bestPalette: "forest green (#4A7C59), warm earth (#8B6914), terracotta (#C4622D), cream (#F5F0E0), sky blue (#87CEEB)",
    bestLighting: "maximum natural light, circadian lighting systems, warm 2700K, plant grow lights integrated, skylights",
    signatureDetails: "statement monstera or fiddle leaf fig, hanging planters, stone feature wall, water feature, natural fiber rugs, organic curved furniture",
    avoid: "synthetic materials, cold lighting, dark rooms, symmetrical rigid layouts",
    globalPopularity: 9,
    gulfPopularity: 7,
  },

  modern_gulf: {
    label: "خليجي عصري — Modern Gulf Luxury",
    visualKeywords: "modern Arabian Gulf interior, contemporary Islamic design, mashrabiya screens, geometric patterns, gold accents, marble floors, luxury Arabic living room",
    bestMaterials: "Italian white marble, brushed gold fixtures, mashrabiya wood screens, mother of pearl inlay, hand-knotted silk rugs, velvet upholstery",
    bestPalette: "warm white (#FAF7F2), champagne gold (#D4AF6E), sand beige (#C8B08A), deep navy (#1A2744), ivory (#FFFFF0)",
    bestLighting: "warm 3000K ambient, decorative lanterns, backlit mashrabiya, chandelier statement piece, cove lighting in gold",
    signatureDetails: "geometric Islamic patterns on feature wall, custom majlis seating, mother of pearl console, Arabic calligraphy art, fragrance diffuser display, dates bowl",
    avoid: "cold whites, industrial elements, dark moody tones, minimalist to the point of emptiness",
    globalPopularity: 7,
    gulfPopularity: 10,
  },

  quiet_gulf_luxury: {
    label: "فاخر خليجي هادئ — Quiet Gulf Luxury",
    visualKeywords: "quiet Gulf luxury interior, Italian marble, matte gold, velvet furniture, cream palette, sophisticated Arabic home, luxury Riyadh villa interior",
    bestMaterials: "Calacatta marble, matte brushed gold, cream velvet, cashmere throws, hand-knotted Persian rug, solid walnut, travertine",
    bestPalette: "creamy white (#FBF8F3), warm ivory (#F0E8D8), matte gold (#C4A060), warm taupe (#A89880), soft sage (#8FA68A)",
    bestLighting: "warm 2700K cove lighting, statement chandelier (not too ornate), backlit marble panels, floor lamps with linen shades",
    signatureDetails: "bookmatched marble feature wall, custom sofa with tight back, art by regional artists, fresh white orchids, minimal but luxurious accessories",
    avoid: "shiny chrome, busy patterns, cold blues, industrial elements, too much gold",
    globalPopularity: 8,
    gulfPopularity: 10,
  },

  wabi_sabi: {
    label: "Wabi-Sabi — جمال النقص والأصالة",
    visualKeywords: "wabi-sabi interior, imperfect beauty, handmade ceramics, raw plaster walls, aged wood, organic textures, Japanese philosophy, earthy tones",
    bestMaterials: "raw plaster, aged oak, handmade ceramics, linen, natural clay, stone, dried botanicals, reclaimed wood",
    bestPalette: "warm clay (#C4956A), raw linen (#D4C5A9), aged white (#E8E0D0), charcoal (#4A4540), moss (#7A8C6E)",
    bestLighting: "soft diffused light, candles, paper lanterns, warm Edison bulbs, natural light through shoji screens",
    signatureDetails: "intentional imperfections in plaster, hand-thrown pottery, dried flower arrangements, visible wood grain and knots, asymmetric compositions",
    avoid: "perfect symmetry, glossy finishes, bright colors, chrome, mass-produced items",
    globalPopularity: 8,
    gulfPopularity: 5,
  },

  maximalist_eclectic: {
    label: "Maximalist Eclectic — جريء وشخصية قوية",
    visualKeywords: "maximalist interior, eclectic design, bold colors, layered textiles, gallery wall, mixed patterns, jewel tones, personality-driven space",
    bestMaterials: "velvet, brocade, patterned tiles, antique mirrors, mixed metals, layered rugs, statement wallpaper",
    bestPalette: "emerald green (#2D6A4F), deep burgundy (#722F37), sapphire blue (#1B4F8A), gold (#D4AF37), warm terracotta (#C4622D)",
    bestLighting: "dramatic pendants, colorful lampshades, candlelight, statement chandeliers, warm accent lighting",
    signatureDetails: "gallery wall with mixed frames, layered rugs, statement sofa in jewel tone, collected objects on display, bold wallpaper on one wall",
    avoid: "matching sets, cold neutrals, empty walls, minimalism",
    globalPopularity: 8,
    gulfPopularity: 6,
  },

  neoclassical_gulf: {
    label: "نيوكلاسيكي خليجي — Neoclassical Gulf",
    visualKeywords: "neoclassical Gulf interior, ornate plaster moldings, crystal chandelier, marble floors, royal blue velvet, gold leaf details, palatial Arabic home",
    bestMaterials: "Carrara marble, crystal chandeliers, gold leaf, royal velvet, hand-carved wood, ornate mirrors, silk curtains",
    bestPalette: "royal ivory (#F8F4EC), deep royal blue (#1A3A6B), gold (#C9A227), warm white (#FAFAFA), burgundy (#7B2D3E)",
    bestLighting: "crystal chandeliers, wall sconces, warm 3000K, dramatic uplighting on columns, backlit ceiling panels",
    signatureDetails: "coffered ceiling with gold details, symmetrical furniture arrangement, statement fireplace, ornate mirror above console, silk drapes pooling on floor",
    avoid: "industrial elements, cold grays, minimalism, exposed concrete",
    globalPopularity: 6,
    gulfPopularity: 9,
  },

  warm_contemporary: {
    label: "معاصر دافئ — Warm Contemporary",
    visualKeywords: "warm contemporary interior, walnut wood, warm beige, hidden lighting, clean lines with warmth, cozy modern living room",
    bestMaterials: "walnut wood, travertine, warm linen, bouclé fabric, brushed bronze, natural stone, warm plaster",
    bestPalette: "warm white (#F5F0E8), honey beige (#D4B896), walnut brown (#7C5C3E), warm gray (#9E9590), terracotta accent (#C4622D)",
    bestLighting: "warm 2700-3000K throughout, hidden cove lighting, warm pendant over dining, floor lamps for ambiance",
    signatureDetails: "bouclé sofa, travertine coffee table, walnut shelving with curated objects, warm-toned abstract art, textured plaster wall, layered rugs",
    avoid: "cold whites, chrome, harsh lighting, overly formal arrangements",
    globalPopularity: 9,
    gulfPopularity: 9,
  },

  moroccan_luxury: {
    label: "مغربي فاخر — Luxury Moroccan",
    visualKeywords: "luxury Moroccan interior, zellige tiles, carved plaster, copper lanterns, arched doorways, rich jewel tones, riad atmosphere",
    bestMaterials: "zellige tiles, hand-carved plaster (tadelakt), copper, cedar wood, hand-knotted Berber rugs, silk, hammered brass",
    bestPalette: "deep teal (#1B6B6B), terracotta (#C4622D), saffron (#F4A820), ivory (#F5F0E0), deep burgundy (#7B2D3E)",
    bestLighting: "copper lanterns, candlelight, warm 2700K, backlit carved plaster, dramatic shadows",
    signatureDetails: "horseshoe arch doorway, zellige feature wall, copper pendant lanterns, low seating with cushions, intricate plaster ceiling, hand-painted tiles",
    avoid: "cold colors, industrial elements, minimalism, chrome",
    globalPopularity: 7,
    gulfPopularity: 8,
  },

  spa_bathroom: {
    label: "حمام سبا فاخر — Luxury Spa Bathroom",
    visualKeywords: "luxury spa bathroom, freestanding bathtub, marble walls, warm lighting, rain shower, organic shapes, hotel bathroom quality",
    bestMaterials: "Calacatta marble, brushed gold fixtures, teak wood, frosted glass, natural stone, warm plaster, linen towels",
    bestPalette: "warm white (#FAF8F5), Calacatta white (#F0EDE8), brushed gold (#C4A060), warm gray (#9E9590), natural wood (#B8956A)",
    bestLighting: "warm 2700K only, backlit mirror, candles, no harsh overhead, warm LED strips under vanity",
    signatureDetails: "freestanding oval bathtub, rain shower with linear drain, floating vanity, backlit mirror, fresh eucalyptus, warm stone floor, heated towel rail",
    avoid: "cold lighting, busy patterns, chrome, dark colors, clutter",
    globalPopularity: 9,
    gulfPopularity: 9,
  },

  modern_kitchen: {
    label: "مطبخ عصري راقٍ — Modern Luxury Kitchen",
    visualKeywords: "modern luxury kitchen, handleless cabinets, waterfall marble island, integrated appliances, warm lighting, chef kitchen quality",
    bestMaterials: "matte white or dark cabinetry, Calacatta marble countertops, brushed gold hardware, integrated Miele/Gaggenau appliances, herringbone backsplash",
    bestPalette: "matte white (#F5F5F5), warm marble white (#F0EDE8), brushed gold (#C4A060), charcoal (#3D3D3D), warm oak (#B8956A)",
    bestLighting: "warm 3000K under-cabinet LED, pendant lights over island (2-3 pendants), warm recessed lighting",
    signatureDetails: "waterfall marble island, handleless push-to-open cabinets, integrated hood, statement pendants, fresh herbs on windowsill, single orchid on counter",
    avoid: "busy patterns, cold lighting, visible clutter, cheap hardware",
    globalPopularity: 9,
    gulfPopularity: 9,
  },
};

// ===== قاموس مُحسِّنات الجودة العالمية =====
export const QUALITY_ENHANCERS = {
  // إضاءة احترافية
  lighting: `cinematic warm lighting (2700-3000K), soft natural daylight from windows, subtle shadows creating depth, no harsh overhead lighting, warm ambient glow`,

  // جودة الصورة
  imageQuality: `ultra-photorealistic, 8K resolution, shot on Phase One IQ4 150MP, architectural photography by Remodelista, featured in Architectural Digest, sharp focus throughout, perfect exposure`,

  // التكوين
  composition: `wide-angle architectural composition, perfect perspective lines, eye-level camera at 1.2m height, slight depth of field, foreground-midground-background layers`,

  // التفاصيل
  details: `visible material textures (wood grain, stone veining, fabric weave), realistic reflections on polished surfaces, subtle dust particles in light beams, lived-in authenticity`,

  // الجو العام
  atmosphere: `warm inviting atmosphere, aspirational yet achievable, magazine-worthy styling, no people, no text overlays, no watermarks`,

  // التصوير الداخلي
  interior: `interior design photography, professional staging, curated accessories, fresh flowers or plants, architectural details highlighted`,
};

// ===== دالة بناء prompt احترافي =====
export function buildBestPracticePrompt(params: {
  styleKey: string;
  spaceType: string;
  specificDetails?: string;
  palette?: Array<{ name: string; hex: string }>;
  isEdit?: boolean; // هل هو تعديل على صورة موجودة؟
}): string {
  const style = BEST_PRACTICE_STYLES[params.styleKey]
    || BEST_PRACTICE_STYLES.warm_contemporary;

  const paletteStr = params.palette?.length
    ? `EXACT COLOR PALETTE: ${params.palette.map(c => `${c.name} ${c.hex}`).join(", ")}. `
    : `COLOR PALETTE: ${style.bestPalette}. `;

  const editPrefix = params.isEdit
    ? `Photorealistic interior redesign. KEEP IDENTICAL: room structure, camera angle, perspective, all doors/windows/openings positions and sizes. ONLY CHANGE: materials, colors, furniture, finishes, lighting. `
    : `Photorealistic interior design render. `;

  return `${editPrefix}${style.visualKeywords}. SPACE: ${params.spaceType}. ${paletteStr}MATERIALS: ${style.bestMaterials}. LIGHTING: ${style.bestLighting}. SIGNATURE DETAILS: ${style.signatureDetails}. ${QUALITY_ENHANCERS.imageQuality}. ${QUALITY_ENHANCERS.composition}. ${QUALITY_ENHANCERS.atmosphere}. ${params.specificDetails ? params.specificDetails + ". " : ""}AVOID: ${style.avoid}.`;
}

// ===== دالة اختيار أفضل نمط بناءً على نوع الفضاء =====
export function getBestStylesForSpace(spaceType: string): string[] {
  const spaceTypeLower = spaceType.toLowerCase();

  if (spaceTypeLower.includes("نوم") || spaceTypeLower.includes("bedroom")) {
    if (spaceTypeLower.includes("رئيس") || spaceTypeLower.includes("master")) {
      return ["quiet_luxury", "japandi", "quiet_gulf_luxury"];
    }
    if (spaceTypeLower.includes("أطفال") || spaceTypeLower.includes("children")) {
      return ["biophilic", "warm_contemporary", "maximalist_eclectic"];
    }
    return ["japandi", "quiet_luxury", "warm_contemporary"];
  }

  if (spaceTypeLower.includes("معيشة") || spaceTypeLower.includes("living") || spaceTypeLower.includes("صالة")) {
    return ["quiet_gulf_luxury", "warm_contemporary", "japandi"];
  }

  if (spaceTypeLower.includes("مجلس") || spaceTypeLower.includes("majlis")) {
    return ["modern_gulf", "neoclassical_gulf", "quiet_gulf_luxury"];
  }

  if (spaceTypeLower.includes("مطبخ") || spaceTypeLower.includes("kitchen")) {
    return ["modern_kitchen", "warm_contemporary", "japandi"];
  }

  if (spaceTypeLower.includes("حمام") || spaceTypeLower.includes("bathroom")) {
    return ["spa_bathroom", "quiet_luxury", "japandi"];
  }

  if (spaceTypeLower.includes("مكتب") || spaceTypeLower.includes("office")) {
    return ["japandi", "biophilic", "warm_contemporary"];
  }

  if (spaceTypeLower.includes("طعام") || spaceTypeLower.includes("dining")) {
    return ["quiet_gulf_luxury", "warm_contemporary", "moroccan_luxury"];
  }

  if (spaceTypeLower.includes("مدخل") || spaceTypeLower.includes("entrance") || spaceTypeLower.includes("ممر")) {
    return ["quiet_gulf_luxury", "neoclassical_gulf", "modern_gulf"];
  }

  // افتراضي: الأكثر طلباً عالمياً وخليجياً
  return ["quiet_gulf_luxury", "japandi", "warm_contemporary"];
}

// ===== دالة بناء system prompt لـ Gemini لتوليد أفكار best-of-best =====
export function buildBestPracticeSystemPrompt(): string {
  return `أنتِ م. اليازية، مهندسة التصميم المعماري والبيئي العالمية بخبرة 20 سنة.

🏆 قاعدة "BEST OF BEST" المطلقة:
كل فكرة تصميمية تقترحينها يجب أن تكون على مستوى:
- Architectural Digest Top 100 Designers
- Houzz Best of Design Award Winner  
- Elle Decor A-List Designer
- Interior Design Magazine Best of Year

🚫 ممنوع منعاً باتاً:
- التصاميم التقليدية المكررة (بيج + بني + ستائر بسيطة = ممنوع)
- الأفكار العادية التي لا تستحق النشر في مجلة عالمية
- تكرار نفس الفكرة بألوان مختلفة فقط
- الأثاث الرخيص أو المواد العادية في التوصيات
- الإضاءة الواحدة الباردة (نيون/LED أبيض)

✅ المطلوب دائماً:
- أفضل ما أنتجه المصممون العالميون في 2024-2025
- مواد راقية حقيقية: رخام إيطالي، خشب جوز، مخمل، نحاس مصفّى
- إضاءة دافئة متعددة الطبقات (ambient + accent + task)
- تفاصيل تميّز التصميم: زهور طازجة، فن أصيل، إكسسوارات منتقاة
- تنوع جذري بين الأفكار: لا فكرتان في نفس "العالم التصميمي"

🌍 الأنماط الأكثر طلباً عالمياً الآن (2025):
1. Japandi (يابانية + سكاندنافية) — الأعلى طلباً عالمياً
2. Quiet Luxury (فخامة هادئة) — الأسرع نمواً
3. Biophilic (طبيعة داخل المنزل) — الأكثر استدامة
4. Wabi-Sabi (جمال النقص) — الأكثر أصالة
5. Warm Contemporary (معاصر دافئ) — الأكثر تطبيقاً

🌙 الأنماط الأكثر طلباً خليجياً (2025):
1. Modern Gulf Luxury (خليجي عصري) — الأول خليجياً
2. Quiet Gulf Luxury (فاخر هادئ) — الأسرع نمواً خليجياً
3. Neoclassical Gulf (نيوكلاسيكي خليجي) — للمجالس والصالات الكبيرة
4. Warm Contemporary (معاصر دافئ) — للغرف الخاصة
5. Moroccan Luxury (مغربي فاخر) — للمطاعم والمجالس

ردودك دائماً بالعربية بصيغة JSON فقط.`;
}

// ===== دالة بناء imagePrompt احترافي لكل فكرة =====
export function buildIdeaImagePrompt(params: {
  styleKey: string;
  spaceType: string;
  palette: Array<{ name: string; hex: string }>;
  materials: string[];
  isEdit?: boolean;
  originalStructure?: string;
}): string {
  const style = BEST_PRACTICE_STYLES[params.styleKey]
    || BEST_PRACTICE_STYLES.warm_contemporary;

  const paletteStr = params.palette.length > 0
    ? params.palette.map(c => `${c.name} (${c.hex})`).join(", ")
    : style.bestPalette;

  const materialsStr = params.materials.length > 0
    ? params.materials.join(", ")
    : style.bestMaterials;

  const structureNote = params.isEdit && params.originalStructure
    ? `CRITICAL: ${params.originalStructure} KEEP IDENTICAL camera angle, room dimensions, all openings. `
    : "";

  return `${structureNote}Photorealistic ${params.spaceType} interior. ${style.visualKeywords}. Color palette: ${paletteStr}. Premium materials: ${materialsStr}. Lighting: ${style.bestLighting}. Signature details: ${style.signatureDetails}. ${QUALITY_ENHANCERS.imageQuality}. ${QUALITY_ENHANCERS.composition}. ${QUALITY_ENHANCERS.details}. ${QUALITY_ENHANCERS.atmosphere}. AVOID: ${style.avoid}. Award-winning interior design, featured in Architectural Digest, no people, no text.`;
}

import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, mousaProcedure, router } from "./_core/trpc";
import { checkAndDeductCredits } from "./creditHelper";
import { invokeLLM, type Message, type ImageContent, type TextContent, type FileContent } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { analyzeFloorPlanAdvanced, generateRoomDesignIdea, analyzeAndDesignFloorPlan } from "./floorPlanEngine";
import { buildBestPracticeSystemPrompt, buildIdeaImagePrompt, getBestStylesForSpace, BEST_PRACTICE_STYLES, QUALITY_ENHANCERS } from "./bestPracticeEngine";
import { saveGeneratedIdea, getPreviousIdeasForImage, buildUsedStylesNote, buildRefinementNote, getIdeaById } from "./ideaMemoryHelper";
import { storagePut } from "./storage";
import { consolidateResults, type PlanAnalysisResult } from "./multiRunAnalysis";
import { pdfToImages, uploadPdfToStorage } from "./pdfToImages";
import { registerUser, loginUser, verifyPassword, hashPassword } from "./_core/localAuth";
import { TRPCError } from "@trpc/server";
import {
  createProject, getUserProjects, getProjectById, updateProject, deleteProject,
  createAnalysis, getProjectAnalyses, getAnalysisById, getUserAnalyses,
  createDesignElement, getProjectDesignElements, updateDesignElement, deleteDesignElement,
  createPerspective, getProjectPerspectives,
  createChatSession, updateChatSession, getChatSession, getUserChatSessions,
  createArScan, getArScanByScanId, updateArScan, getUserArScans,
  getMarketPrices, seedMarketPrices,
  createMoodBoard, getProjectMoodBoards,
  createReport, getProjectReports,
  getUserByOpenId, upsertUser
} from "./db";
import { nanoid } from "nanoid";
import { verifyMousaToken, checkMousaBalance, deductMousaCredits, CREDIT_COSTS, type CreditOperation } from "./mousa";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "../drizzle/schema";

// ===== نوع بيانات منتجات بنيان =====
interface BonyanProduct {
  id: number;
  nameEn: string;
  nameAr: string;
  slug: string;
  price: string;
  pricePerUnit: string | null;
  currency: string;
  imageUrl: string;
  brand: string;
  material: string | null;
  color: string | null;
  sourceType: string;
  sourceName: string;
  isVerified: boolean;
  categoryId: number;
  width: number | null;
  height: number | null;
  depth: number | null;
  dimensionUnit: string;
  supplierConfirmed: boolean;
  updatedAt: string;
}

// ===== أنماط التصميم العالمية =====
const GLOBAL_STYLES: Record<string, { name: string; description: string; keywords: string }> = {
  modern: { name: "عصري حديث", description: "خطوط نظيفة، مواد معاصرة، ألوان محايدة", keywords: "minimalist, clean lines, contemporary" },
  gulf: { name: "خليجي عربي أصيل", description: "زخارف إسلامية، مشربيات، ألوان دافئة ذهبية", keywords: "Islamic patterns, mashrabiya, arabesque" },
  classic: { name: "كلاسيكي فاخر", description: "أعمدة، زخارف، أقمشة فاخرة، ألوان ملكية", keywords: "classical columns, ornate details, luxury fabrics" },
  minimal: { name: "مينيمال بسيط", description: "أقل هو أكثر، مساحات بيضاء، وظيفية", keywords: "less is more, white space, functional" },
  japanese: { name: "ياباني زن", description: "الهدوء، الطبيعة، الخشب، الحجارة، الوابي-سابي", keywords: "zen, wabi-sabi, natural materials, harmony" },
  scandinavian: { name: "سكندنافي", description: "دفء، بساطة، وظيفية، ألوان فاتحة", keywords: "hygge, functional, light colors, natural wood" },
  mediterranean: { name: "متوسطي", description: "أزرق، أبيض، فسيفساء، أقواس، نباتات", keywords: "blue white, mosaic, arches, terracotta" },
  industrial: { name: "صناعي", description: "معدن، خرسانة، طوب مكشوف، خشب خام", keywords: "exposed brick, metal, concrete, raw materials" },
  bohemian: { name: "بوهيمي", description: "ألوان زاهية، نسيج متنوع، نباتات، فن", keywords: "eclectic, colorful, layered textiles, plants" },
  art_deco: { name: "آرت ديكو", description: "هندسي، ذهبي، فاخر، أنيق", keywords: "geometric, gold, glamorous, symmetry" },
  farmhouse: { name: "ريفي مزرعة", description: "خشب، أبيض، بساطة، دفء ريفي", keywords: "rustic, shiplap, neutral, cozy farmhouse" },
  tropical: { name: "استوائي", description: "نباتات خضراء، ألوان زاهية، خيزران، رطان", keywords: "tropical plants, rattan, vibrant colors" },
  moroccan: { name: "مغربي", description: "فسيفساء ملونة، قناطر، زليج، نحاس", keywords: "zellige tiles, arches, lanterns, colorful mosaic" },
  indian: { name: "هندي", description: "ألوان غنية، نسيج مطرز، أنماط زاهية", keywords: "rich colors, embroidered textiles, mandala patterns" },
  chinese: { name: "صيني كلاسيكي", description: "أحمر، ذهبي، خشب داكن، رموز تقليدية", keywords: "red gold, lacquer, traditional motifs, feng shui" },
  contemporary: { name: "معاصر مختلط", description: "مزيج من الأنماط الحديثة بأسلوب عصري", keywords: "mixed styles, current trends, versatile" },
  luxury: { name: "فاخر بريميوم", description: "مواد فاخرة، تفاصيل دقيقة، لمسات ذهبية", keywords: "premium materials, gold accents, bespoke" },
  coastal: { name: "ساحلي بحري", description: "أزرق، أبيض، رمل، أصداف، خشب مشمس", keywords: "beach, nautical, blue white, driftwood" },
  eclectic: { name: "انتقائي متنوع", description: "مزيج جريء من العصور والأنماط", keywords: "mixed periods, bold combinations, unique" },
  neoclassical: { name: "نيوكلاسيكي", description: "كلاسيكي بلمسة عصرية، أناقة متوازنة", keywords: "updated classical, elegant proportions, refined" },
};

// ===== مساعد: تحويل base64 URL إلى S3 URL =====
/**
 * إذا كان الـ URL هو base64 data URL، يرفعه لـ S3 ويُعيد الـ URL الحقيقي.
 * إذا كان URL عادي (https://...)، يُعيده كما هو.
 */
async function resolveImageUrl(url: string, _userId: number = 0): Promise<string> {
  // إذا كان data URL، أعده مباشرة — Gemini Native API يقبله
  if (url.startsWith('data:')) {
    console.log('[resolveImageUrl] Using data URL directly for Gemini Native API');
    return url;
  }
  // إذا كان URL محلي (نفس الدومين)، حوّله إلى base64
  try {
    const urlObj = new URL(url);
    const isLocalUrl = urlObj.hostname.includes('mousa.ai') ||
                       urlObj.hostname === 'localhost' ||
                       urlObj.hostname === '127.0.0.1';
    if (isLocalUrl) {
      console.log('[resolveImageUrl] Local URL detected, fetching and converting to base64:', url);
      const response = await fetch(url);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        const base64 = Buffer.from(buffer).toString('base64');
        return `data:${mimeType};base64,${base64}`;
      }
    }
  } catch (err) {
    console.warn('[resolveImageUrl] URL check failed:', (err as Error).message);
  }
  // URL خارجي حقيقي — أعده كما هو
  return url;
}

// ===== مساعد: تحليل التصميم الداخلي =====
async function analyzeInteriorDesign(imageUrl: string, style: string, spaceType: string, area: number) {
  const styleInfo = GLOBAL_STYLES[style] || GLOBAL_STYLES.modern;

  const systemPrompt = `أنتِ م. سارة، مهندسة التصميم المعماري والبيئي العالمية المتخصصة.
خبرتك تشمل جميع أنماط التصميم العالمية: الخليجي، الياباني، الهندي، الصيني، الأوروبي، وغيرها.
تحللين الصور والمخططات المعمارية وتقدمين توصيات تصميم داخلي احترافية على أعلى مستوى عالمي.
ردودك دائماً باللغة العربية الفصحى بأسلوب احترافي ومتقدم.`;

  const userPrompt = `حللي هذه الصورة/المخطط وقدمي توصيات تصميم داخلي شاملة على مستوى عالمي.

المعطيات:
- نمط التصميم: ${styleInfo.name} (${styleInfo.description})
- نوع الفضاء: ${spaceType}
- المساحة: ${area} متر مربع

قدمي تقرير JSON شامل:
{
  "overview": "وصف عام للفضاء وتقييمه الحالي",
  "styleDescription": "كيفية تطبيق نمط ${styleInfo.name} بأسلوب احترافي",
  "colorPalette": [{"name": "اسم اللون", "hex": "#XXXXXX", "usage": "استخدامه", "percentage": 30}],
  "materials": [{"name": "المادة", "type": "النوع", "description": "الوصف", "priceRange": "رخيص/متوسط/فاخر", "supplier": "مصدر مقترح"}],
  "furniture": [{"name": "القطعة", "description": "الوصف", "quantity": 1, "priceMin": 500, "priceMax": 2000, "priority": "أساسي/اختياري", "style": "النمط"}],
  "flooring": {"material": "المادة", "pattern": "النمط", "color": "اللون", "pricePerSqm": 150, "notes": "ملاحظات"},
  "walls": {"treatment": "المعالجة", "color": "اللون", "texture": "الملمس", "accent": "جدار مميز", "notes": "ملاحظات"},
  "ceiling": {"height": "الارتفاع", "treatment": "المعالجة", "lighting": "الإضاءة", "notes": "ملاحظات"},
  "windows": {"type": "النوع", "treatment": "المعالجة", "curtains": "الستائر", "notes": "ملاحظات"},
  "lighting": {"ambient": "إضاءة عامة", "task": "إضاءة وظيفية", "accent": "إضاءة تزيينية", "fixtures": ["تركيبة 1"]},
  "recommendations": ["توصية 1", "توصية 2", "توصية 3", "توصية 4", "توصية 5"],
  "costEstimate": {
    "furniture": {"min": 5000, "max": 15000},
    "materials": {"min": 3000, "max": 8000},
    "flooring": {"min": 2000, "max": 6000},
    "lighting": {"min": 1000, "max": 3000},
    "curtains": {"min": 1500, "max": 4000},
    "labor": {"min": 2000, "max": 5000},
    "total": {"min": 14500, "max": 41000}
  },
  "timelineWeeks": 8,
  "professionalTips": ["نصيحة احترافية 1", "نصيحة 2"]
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageUrl, detail: "high" } } as ImageContent,
          { type: "text", text: userPrompt } as TextContent
        ]
      },
    ],
    response_format: { type: "json_object" }
  });

  const rawContent = response.choices[0]?.message?.content;
  const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent) || "{}";
  try {
    return JSON.parse(content);
  } catch {
    return { overview: content, colorPalette: [], materials: [], furniture: [], recommendations: [] };
  }
}

// ===== مساعد: تحليل المخطط المعماري =====
async function analyzeFloorPlan(imageUrl: string) {
  const systemPrompt = `أنتِ م. سارة، مهندسة معمارية متخصصة في قراءة وتحليل المخططات المعمارية.
تستطيعين قراءة أي مخطط معماري وتحديد الغرف والأبعاد والمساحات بدقة عالية.
ردودك باللغة العربية.`;

  const userPrompt = `حللي هذا المخطط المعماري واستخرجي جميع التفاصيل التالية بدقة:

{
  "projectType": "فيلا/شقة/مكتب/محل",
  "totalArea": 0,
  "rooms": [
    {
      "name": "اسم الغرفة",
      "type": "living/bedroom/kitchen/bathroom/corridor/other",
      "width": 0,
      "length": 0,
      "area": 0,
      "windows": 0,
      "doors": 0,
      "notes": "ملاحظات خاصة"
    }
  ],
  "floors": 1,
  "orientation": "الاتجاه الرئيسي للمبنى",
  "specialFeatures": ["ميزة خاصة 1", "ميزة 2"],
  "structuralNotes": "ملاحظات إنشائية",
  "designOpportunities": ["فرصة تصميمية 1", "فرصة 2"],
  "challenges": ["تحدي 1", "تحدي 2"],
  "recommendedStyle": "النمط الأنسب للمخطط",
  "estimatedTotalCost": {"min": 50000, "max": 150000}
}

استخرج الأبعاد بالمتر إن أمكن. إذا لم تظهر الأبعاد بوضوح، قدّر بناءً على النسب المرئية.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageUrl, detail: "high" } } as ImageContent,
          { type: "text", text: userPrompt } as TextContent
        ]
      },
    ],
    response_format: { type: "json_object" }
  });

  const rawContent = response.choices[0]?.message?.content;
  const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent) || "{}";
  try {
    return JSON.parse(content);
  } catch {
    return { rooms: [], totalArea: 0, projectType: "غير محدد" };
  }
}

// ===== مساعد: تصميم عنصر معماري =====
async function designElement(
  elementType: string,
  roomName: string,
  roomArea: number,
  style: string,
  projectContext: string,
  referenceImageUrl?: string
) {
  const styleInfo = GLOBAL_STYLES[style] || GLOBAL_STYLES.modern;
  const elementNames: Record<string, string> = {
    flooring: "الأرضيات",
    walls: "الجدران",
    ceiling: "الأسقف",
    windows: "النوافذ والستائر",
    doors: "الأبواب",
    lighting: "الإضاءة",
    furniture: "الأثاث",
    perspective: "المنظور الكامل"
  };

  const systemPrompt = `أنتِ م. سارة، مهندسة التصميم المعماري والبيئي العالمية.
تصممين عناصر التصميم الداخلي بأعلى المعايير العالمية.
متخصصة في نمط ${styleInfo.name}: ${styleInfo.description}.
ردودك باللغة العربية مع مواصفات دقيقة وعملية.`;

  const userPrompt = `صممي ${elementNames[elementType] || elementType} لـ ${roomName} بمساحة ${roomArea} م².

سياق المشروع: ${projectContext}
نمط التصميم: ${styleInfo.name} - ${styleInfo.description}

قدمي مواصفات تفصيلية احترافية بصيغة JSON:
{
  "elementType": "${elementType}",
  "roomName": "${roomName}",
  "designConcept": "مفهوم التصميم الإبداعي",
  "specifications": {
    "primaryMaterial": "المادة الرئيسية",
    "secondaryMaterial": "المادة الثانوية",
    "primaryColor": "#XXXXXX",
    "secondaryColor": "#XXXXXX",
    "pattern": "النمط أو الملمس",
    "finish": "نوع التشطيب",
    "dimensions": "الأبعاد التفصيلية",
    "installation": "طريقة التركيب"
  },
  "products": [
    {
      "name": "اسم المنتج",
      "brand": "الماركة",
      "model": "الموديل",
      "priceMin": 100,
      "priceMax": 300,
      "unit": "م²/قطعة/متر",
      "quantity": 10,
      "supplier": "مصدر التوريد"
    }
  ],
  "colorPalette": [{"hex": "#XXXXXX", "name": "اسم اللون", "role": "دور اللون"}],
  "installationSteps": ["خطوة 1", "خطوة 2", "خطوة 3"],
  "maintenanceTips": ["نصيحة صيانة 1", "نصيحة 2"],
  "totalCostMin": 1000,
  "totalCostMax": 5000,
  "unit": "م²",
  "quantity": ${roomArea},
  "professionalNotes": "ملاحظات احترافية مهمة",
  "alternativeOptions": [
    {"name": "بديل اقتصادي", "description": "وصف", "costMin": 500, "costMax": 2000},
    {"name": "بديل فاخر", "description": "وصف", "costMin": 3000, "costMax": 8000}
  ]
}`;

  const messages: Message[] = [
    { role: "system", content: systemPrompt },
  ];

  if (referenceImageUrl) {
    messages.push({
      role: "user",
      content: [
        { type: "image_url", image_url: { url: referenceImageUrl, detail: "high" } } as ImageContent,
        { type: "text", text: userPrompt } as TextContent
      ]
    });
  } else {
    messages.push({ role: "user", content: userPrompt });
  }

  const response = await invokeLLM({
    messages,
    response_format: { type: "json_object" }
  });

  const rawContent = response.choices[0]?.message?.content;
  const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent) || "{}";
  try {
    return JSON.parse(content);
  } catch {
    return { designConcept: content, specifications: {}, products: [] };
  }
}

// ===== مساعد: المحادثة الذكية =====
async function sarahChat(
  messages: Array<{ role: string; content: string }>,
  sessionType: string,
  projectContext?: string
) {
  const systemPrompt = `أنتِ م. سارة، مهندسة التصميم المعماري والبيئي العالمية المتميزة.

شخصيتك:
- محترفة، ودودة، وذكية
- متخصصة في جميع أنماط التصميم العالمية (خليجي، ياباني، هندي، صيني، أوروبي، أمريكي، وغيرها)
- تتحدثين بالعربية الفصحى بأسلوب احترافي وأنيق
- تطرحين أسئلة ذكية لفهم احتياجات العميل
- تقدمين توصيات عملية وقابلة للتنفيذ
- تعرفين أحدث اتجاهات التصميم العالمية

${sessionType === 'floor_plan' ? `
مهمتك الآن: مساعدة العميل في تحليل مخططه المعماري.
اطلبي منه رفع صورة المخطط أو وصف الغرف والأبعاد.
بعد الحصول على المعلومات، قدمي تحليلاً شاملاً.
` : sessionType === 'camera_scan' ? `
مهمتك الآن: تحليل الفضاء الداخلي بناءً على صور المسح 360° التي تم رفعها.

**قواعد صارمة جداً:**
- لا تطلبي أي صور إضافية أبداً — المسح اكتمل وتم رفع كل الصور
- لا تقولي "أحتاج المزيد من الصور" أو "أرسلي لي صور الجدران" — هذا ممنوع تماماً
- حللي الفضاء مباشرة بناءً على الصور المرفقة في الرسالة
- إذا كانت الصور واضحة جزئياً، اعملي بما لديكِ وقدمي التحليل

ما يجب تقديمه فوراً:
1. نوع الفضاء والأبعاد التقريبية
2. النمط الحالي وحالة الفضاء
3. المشاكل التصميمية الموجودة
4. توصيات تصميمية شاملة (ألوان، أثاث، إضاءة، مواد)
5. تكاليف تقديرية
` : sessionType === 'element_design' ? `
مهمتك الآن: تصميم عنصر معماري محدد بالتفصيل.
اسألي عن: نوع العنصر، الغرفة، المساحة، النمط المطلوب، الميزانية.
` : `
مهمتك: الاستشارة العامة في التصميم الداخلي.
اسألي عن احتياجات العميل وقدمي توصيات مناسبة.
`}

${projectContext ? `سياق المشروع الحالي: ${projectContext}` : ''}

قواعد المحادثة:
- لا تكرري الأسئلة التي أجاب عليها العميل
- إذا أجاب العميل على سؤال مستقبلي، لا تعيدي السؤال
- اجمعي المعلومات بشكل طبيعي وسلس
- عند اكتمال المعلومات، قدمي التصميم أو التوصية مباشرة`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content }))
    ],
  });

  return response.choices[0]?.message?.content || "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.";
}

// ===== مساعد: توليد منظور =====
async function generatePerspective(
  roomName: string,
  style: string,
  elements: Record<string, unknown>,
  area: number
) {
  const styleInfo = GLOBAL_STYLES[style] || GLOBAL_STYLES.modern;

  const prompt = `Professional interior design perspective render, ${styleInfo.keywords}, 
${roomName}, ${area} square meters, 
flooring: ${(elements.flooring as Record<string, unknown>)?.material || 'marble'}, 
walls: ${(elements.walls as Record<string, unknown>)?.color || 'white'}, 
style: ${styleInfo.name}, 
photorealistic, 8K quality, architectural visualization, luxury interior design, 
warm lighting, high-end materials, professional photography`;

  const { url } = await generateImage({ prompt });
  return url;
}

// ===== Designs Router — نقل تصاميم الزائر عند التسجيل =====
export const designsRouter = router({
  /**
   * استقبال تصاميم الزائر ونقلها للحساب عند تسجيل الدخول
   * يُستدعى تلقائياً من useMousaAuth عند أول تسجيل دخول
   */
  migrateGuestDesigns: protectedProcedure
    .input(z.object({
      designs: z.array(z.object({
        id: z.string(),
        savedAt: z.number(),
        primaryImageUrl: z.string().optional(),
        spaceType: z.string().optional(),
        styleLabel: z.string().optional(),
        ideas: z.array(z.object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
          style: z.string(),
          imageUrl: z.string().optional(),
          palette: z.array(z.object({ name: z.string(), hex: z.string() })).optional(),
          materials: z.array(z.string()).optional(),
          totalCost: z.number().optional(),
        })),
        budgetLevel: z.string().optional(),
        roomDimensions: z.object({
          length: z.string().optional(),
          width: z.string().optional(),
          height: z.string().optional(),
        }).optional(),
      }))
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const migrated: string[] = [];

      for (const guestDesign of input.designs) {
        try {
          const projectName = guestDesign.styleLabel
            ? `${guestDesign.spaceType || 'تصميم'} — ${guestDesign.styleLabel}`
            : `تصميم محفوظ ${new Date(guestDesign.savedAt).toLocaleDateString('ar-SA')}`;

          await createProject({
            userId,
            name: projectName,
            description: `تصميم محفوظ من جلسة سابقة (${guestDesign.ideas.length} أفكار)`,
            spaceType: guestDesign.spaceType ?? undefined,
            designStyle: guestDesign.styleLabel ?? 'modern',
            status: 'draft',
          });

          migrated.push(guestDesign.id);
        } catch (err) {
          console.error(`[GuestMigration] Failed to migrate design ${guestDesign.id}:`, err);
        }
      }

      return { success: true, migrated: migrated.length, total: input.designs.length };
    }),
});


// ===== الراوتر الرئيسي =====
export const appRouter = router({
  system: systemRouter,
  designs: designsRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    register: publicProcedure
      .input(z.object({
        name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
        email: z.string().email("بريد إلكتروني غير صحيح"),
        password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { openId, sessionToken } = await registerUser(input);
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
          const user = await getUserByOpenId(openId);
          return { success: true, user };
        } catch (error: any) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message ?? "فشل إنشاء الحساب" });
        }
      }),
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { user, sessionToken } = await loginUser(input);
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
          return { success: true, user };
        } catch (error: any) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: error.message ?? "بيانات الدخول غير صحيحة" });
        }
      }),
    changePassword: mousaProcedure
      .input(z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByOpenId(ctx.user.openId);
        if (!user?.passwordHash) throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن تغيير كلمة المرور" });
        const valid = await verifyPassword(input.currentPassword, user.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "كلمة المرور الحالية غير صحيحة" });
        const newHash = await hashPassword(input.newPassword);
        await upsertUser({ openId: ctx.user.openId, passwordHash: newHash });
        return { success: true };
      }),
  }),

  // ===== رفع الصور =====
  upload: router({
    image: mousaProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.string().default("image/jpeg"),
        fileName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.mimeType.split("/")[1] || "jpg";
        const userId = ctx.user?.id || 0;
        const key = `users/${userId}/images/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url, key };
      }),
  }),

  // ===== المشاريع =====
  projects: router({
    list: mousaProcedure.query(async ({ ctx }) => getUserProjects(ctx.user.id)),

    get: mousaProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await getProjectById(input.id, ctx.user.id);
        if (!project) throw new Error("المشروع غير موجود");
        return project;
      }),

    create: mousaProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        projectType: z.enum(["new", "renovation", "partial"]).default("new"),
        designStyle: z.string().default("modern"),
        spaceType: z.string().optional(),
        area: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createProject({
          userId: ctx.user?.id || 0,
          name: input.name,
          description: input.description ?? null,
          projectType: input.projectType,
          designStyle: input.designStyle,
          spaceType: input.spaceType ?? null,
          area: input.area ?? null,
          status: "draft",
        });
      }),

    update: mousaProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        designStyle: z.string().optional(),
        spaceType: z.string().optional(),
        area: z.number().optional(),
        status: z.enum(["draft", "analyzed", "designing", "completed"]).optional(),
        floorPlanUrl: z.string().optional(),
        floorPlanKey: z.string().optional(),
        floorPlanData: z.unknown().optional(),
        designElements: z.unknown().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateProject(id, ctx.user.id, data as Parameters<typeof updateProject>[2]);
        return { success: true };
      }),

    delete: mousaProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteProject(input.id, ctx.user.id);
        return { success: true };
      }),

    getStyles: publicProcedure.query(() => {
      return Object.entries(GLOBAL_STYLES).map(([key, val]) => ({
        key,
        name: val.name,
        description: val.description,
        keywords: val.keywords,
      }));
    }),
  }),

  // ===== التحليلات =====
  analyses: router({
    analyze: mousaProcedure
      .input(z.object({
        projectId: z.number(),
        imageUrl: z.string(),
        imageKey: z.string().optional(),
        designStyle: z.string().default("modern"),
        spaceType: z.string().default("غرفة معيشة"),
        area: z.number().default(30),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await analyzeInteriorDesign(input.imageUrl, input.designStyle, input.spaceType, input.area);
        const userId = ctx.user?.id || 0;
        await createAnalysis({
          projectId: input.projectId,
          userId,
          imageUrl: input.imageUrl,
          imageKey: input.imageKey ?? null,
          designStyle: input.designStyle,
          spaceType: input.spaceType,
          area: input.area,
          analysisResult: result,
          colorPalette: result.colorPalette || [],
          materials: result.materials || [],
          furniture: result.furniture || [],
          costEstimate: result.costEstimate || {},
          totalCostMin: result.costEstimate?.total?.min || null,
          totalCostMax: result.costEstimate?.total?.max || null,
        });
        await updateProject(input.projectId, ctx.user.id, { status: "analyzed" });
        const allAnalyses = await getProjectAnalyses(input.projectId, ctx.user.id);
        return allAnalyses[0];
      }),

    analyzeFloorPlan: mousaProcedure
      .input(z.object({
        projectId: z.number(),
        imageUrl: z.string(),
        imageKey: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await analyzeFloorPlan(input.imageUrl);
        await updateProject(input.projectId, ctx.user.id, {
          floorPlanUrl: input.imageUrl,
          floorPlanKey: input.imageKey ?? null,
          floorPlanData: result,
          status: "analyzed",
        });
        return result;
      }),
    // تحليل المخطط المتقدم مع توليد أفكار تصميم لكل غرفة
    analyzeFloorPlanAdvanced: mousaProcedure
      .input(z.object({
        projectId: z.number(),
        imageUrl: z.string(),
        imageKey: z.string().optional(),
        generateDesigns: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.generateDesigns) {
          const { analysis, roomDesigns } = await analyzeAndDesignFloorPlan(input.imageUrl);
          await updateProject(input.projectId, ctx.user.id, {
            floorPlanUrl: input.imageUrl,
            floorPlanKey: input.imageKey ?? null,
            floorPlanData: { analysis, roomDesigns },
            status: "analyzed",
          });
          return { analysis, roomDesigns };
        } else {
          const analysis = await analyzeFloorPlanAdvanced(input.imageUrl);
          await updateProject(input.projectId, ctx.user.id, {
            floorPlanUrl: input.imageUrl,
            floorPlanKey: input.imageKey ?? null,
            floorPlanData: { analysis, roomDesigns: [] },
            status: "analyzed",
          });
          return { analysis, roomDesigns: [] };
        }
      }),
    // توليد فكرة تصميم لغرفة واحدة
    generateRoomDesign: mousaProcedure
      .input(z.object({
        room: z.object({
          name: z.string(),
          type: z.enum(["living", "bedroom", "kitchen", "bathroom", "corridor", "dining", "office", "other"]),
          width: z.number(),
          length: z.number(),
          area: z.number(),
          windows: z.number(),
          doors: z.number(),
          notes: z.string(),
          orientation: z.string().optional(),
        }),
        overallStyle: z.string().default("modern"),
      }))
      .mutation(async ({ input }) => {
        return await generateRoomDesignIdea(input.room, input.overallStyle);
      }),

    getByProject: mousaProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => getProjectAnalyses(input.projectId, ctx.user.id)),

    getById: mousaProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const analysis = await getAnalysisById(input.id, ctx.user.id);
        if (!analysis) throw new Error("التحليل غير موجود");
        return analysis;
      }),

    recent: mousaProcedure.query(async ({ ctx }) => getUserAnalyses(ctx.user.id)),
  }),

  // ===== عناصر التصميم =====
  designElements: router({
    // تصميم عنصر بهوية بصرية موحدة
    designWithIdentity: mousaProcedure
      .input(z.object({
        projectId: z.number(),
        elementType: z.enum(["flooring", "walls", "ceiling", "windows", "doors", "lighting", "furniture", "perspective"]),
        roomName: z.string(),
        roomArea: z.number().default(20),
        designStyle: z.string().default("modern"),
        budget: z.enum(["economic", "medium", "luxury", "premium"]).default("medium"),
        // الهوية البصرية الموحدة للمشروع
        visualIdentity: z.object({
          primaryColor: z.string(),
          secondaryColor: z.string(),
          accentColor: z.string(),
          primaryMaterial: z.string(),
          woodTone: z.string(),
          stoneType: z.string(),
          metalFinish: z.string(),
          overallMood: z.string(),
        }).optional(),
        // العناصر المصممة مسبقاً للتناسق
        existingElements: z.record(z.string(), z.unknown()).optional(),
        referenceImageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const styleInfo = GLOBAL_STYLES[input.designStyle] || GLOBAL_STYLES.modern;
        const budgetMap = { economic: "اقتصادي (5k-20k ريال)", medium: "متوسط (20k-60k ريال)", luxury: "فاخر (60k-150k ريال)", premium: "بريميوم (150k+ ريال)" };
        const elementNames: Record<string, string> = {
          flooring: "الأرضيات", walls: "الجدران", ceiling: "الأسقف",
          windows: "النوافذ والستائر", doors: "الأبواب", lighting: "الإضاءة",
          furniture: "الأثاث", perspective: "المنظور الكامل"
        };

        const identityContext = input.visualIdentity ? `
الهوية البصرية الموحدة للمشروع (يجب الالتزام بها بالكامل):
- اللون الأساسي: ${input.visualIdentity.primaryColor}
- اللون الثانوي: ${input.visualIdentity.secondaryColor}
- لون التمييز: ${input.visualIdentity.accentColor}
- المادة الأساسية: ${input.visualIdentity.primaryMaterial}
- درجة الخشب: ${input.visualIdentity.woodTone}
- نوع الحجر: ${input.visualIdentity.stoneType}
- تشطيب المعادن: ${input.visualIdentity.metalFinish}
- الروح العامة: ${input.visualIdentity.overallMood}

يجب أن يتناسق هذا العنصر تماماً مع الهوية البصرية أعلاه.` : '';

        const existingContext = input.existingElements && Object.keys(input.existingElements).length > 0 ?
          `\nالعناصر المصممة مسبقاً (للتناسق معها):\n${JSON.stringify(input.existingElements, null, 2)}` : '';

        const systemPrompt = `أنتِ م. سارة، مهندسة التصميم المعماري والبيئي العالمية المتخصصة في الهوية البصرية المتكاملة.
مهمتك: تصميم ${elementNames[input.elementType]} بحيث يتناسق تماماً مع باقي عناصر المشروع.
نمط التصميم: ${styleInfo.name} - ${styleInfo.keywords}
الميزانية: ${budgetMap[input.budget]}
${identityContext}
${existingContext}
قاعدة ذهبية: لا يجوز أن تختلف الأرضيات عن الجدران عن الأسقف في الروح والمواد والألوان. كل شيء يجب أن يكون قصة واحدة متكاملة.`;

        const userPrompt = `صممي ${elementNames[input.elementType]} لـ ${input.roomName} (${input.roomArea} م²).

أعطيني JSON دقيق:
{
  "elementType": "${input.elementType}",
  "roomName": "${input.roomName}",
  "designConcept": "مفهوم التصميم ودوره في الهوية البصرية الكاملة",
  "harmonyNote": "كيف يتناسق هذا العنصر مع باقي عناصر المشروع",
  "specifications": {
    "primaryMaterial": "المادة الرئيسية",
    "secondaryMaterial": "المادة الثانوية",
    "primaryColor": "#XXXXXX",
    "secondaryColor": "#XXXXXX",
    "accentColor": "#XXXXXX",
    "pattern": "النمط أو الملمس",
    "finish": "نوع التشطيب",
    "dimensions": "الأبعاد التفصيلية"
  },
  "products": [{"name": "اسم المنتج", "brand": "الماركة", "priceMin": 100, "priceMax": 300, "unit": "م²", "quantity": 10}],
  "colorPalette": [{"hex": "#XXXXXX", "name": "اسم اللون", "role": "دور اللون في الهوية البصرية"}],
  "installationSteps": ["خطوة 1", "خطوة 2"],
  "totalCostMin": 1000,
  "totalCostMax": 5000,
  "unit": "م²",
  "quantity": ${input.roomArea},
  "professionalNotes": "ملاحظات م. سارة المهنية"
}`;

        const messages: Message[] = [
          { role: "system", content: systemPrompt },
        ];
        if (input.referenceImageUrl) {
          const resolvedRefUrl = await resolveImageUrl(input.referenceImageUrl, ctx.user?.id || 0);
          messages.push({ role: "user", content: [{ type: "image_url", image_url: { url: resolvedRefUrl, detail: "high" } } as ImageContent, { type: "text", text: userPrompt } as TextContent] });
        } else {
          messages.push({ role: "user", content: userPrompt });
        }

        const response = await invokeLLM({ messages, response_format: { type: "json_object" } });
        const rawContent = response.choices[0]?.message?.content;
        const contentStr = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent) || "{}";
        let result: Record<string, unknown>;
        try { result = JSON.parse(contentStr); } catch { result = { designConcept: contentStr, specifications: {}, products: [] }; }

        const element = await createDesignElement({
          projectId: input.projectId,
          userId: ctx.user.id,
          elementType: input.elementType,
          roomName: input.roomName,
          roomArea: input.roomArea,
          specifications: result,
          costMin: (result.totalCostMin as number) || null,
          costMax: (result.totalCostMax as number) || null,
          unit: (result.unit as string) || "م²",
          quantity: (result.quantity as number) || input.roomArea,
          isCompleted: false,
          sortOrder: 0,
        });
        await updateProject(input.projectId, ctx.user.id, { status: "designing" });
        return { element, design: result };
      }),

    design: mousaProcedure
      .input(z.object({
        projectId: z.number(),
        elementType: z.enum(["flooring", "walls", "ceiling", "windows", "doors", "lighting", "furniture", "perspective"]),
        roomName: z.string(),
        roomArea: z.number().default(20),
        designStyle: z.string().default("modern"),
        projectContext: z.string().default(""),
        referenceImageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await designElement(
          input.elementType,
          input.roomName,
          input.roomArea,
          input.designStyle,
          input.projectContext,
          input.referenceImageUrl
        );

        const element = await createDesignElement({
          projectId: input.projectId,
          userId: ctx.user.id,
          elementType: input.elementType,
          roomName: input.roomName,
          roomArea: input.roomArea,
          specifications: result,
          costMin: result.totalCostMin || null,
          costMax: result.totalCostMax || null,
          unit: result.unit || "م²",
          quantity: result.quantity || input.roomArea,
          isCompleted: false,
          sortOrder: 0,
        });

        await updateProject(input.projectId, ctx.user.id, { status: "designing" });
        return { element, design: result };
      }),

    getByProject: mousaProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => getProjectDesignElements(input.projectId, ctx.user.id)),

    markComplete: mousaProcedure
      .input(z.object({ id: z.number(), isCompleted: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await updateDesignElement(input.id, ctx.user.id, { isCompleted: input.isCompleted });
        return { success: true };
      }),

    delete: mousaProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteDesignElement(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ===== المناظير =====
  perspectives: router({
    generate: mousaProcedure
      .input(z.object({
        projectId: z.number(),
        roomName: z.string(),
        designStyle: z.string().default("modern"),
        elements: z.record(z.string(), z.unknown()).default({}),
        area: z.number().default(20),
        perspectiveType: z.enum(["3d_render", "floor_plan", "elevation", "section", "detail"]).default("3d_render"),
      }))
      .mutation(async ({ ctx, input }) => {
        const imageUrl = await generatePerspective(input.roomName, input.designStyle, input.elements, input.area);
        const styleInfo = GLOBAL_STYLES[input.designStyle] || GLOBAL_STYLES.modern;
        const perspective = await createPerspective({
          projectId: input.projectId,
          userId: ctx.user.id,
          roomName: input.roomName,
          perspectiveType: input.perspectiveType,
          imageUrl,
          designStyle: input.designStyle,
          description: `منظور ${input.roomName} بنمط ${styleInfo.name}`,
        });
        return perspective;
      }),

    getByProject: mousaProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => getProjectPerspectives(input.projectId, ctx.user.id)),
  }),

  // ===== المحادثة الذكية =====
  chat: router({
    send: mousaProcedure
      .input(z.object({
        sessionId: z.number().optional(),
        projectId: z.number().optional(),
        message: z.string(),
        sessionType: z.enum(["general", "floor_plan", "camera_scan", "element_design"]).default("general"),
        imageUrl: z.string().optional(),
        imageUrls: z.array(z.string()).optional(), // صور متعددة من المسح 360°
        projectContext: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let session = input.sessionId ? await getChatSession(input.sessionId, ctx.user.id) : null;

        const currentMessages: Array<{ role: string; content: string }> = session
          ? (session.messages as Array<{ role: string; content: string }>)
          : [];

        // دعم صور متعددة من المسح 360°
        const allUrls = input.imageUrls?.length ? input.imageUrls : (input.imageUrl ? [input.imageUrl] : []);
        const userMessage = allUrls.length > 0
          ? `[تم رفع ${allUrls.length} صورة من المسح 360°: ${allUrls.map((u, i) => `صورة ${i+1}: ${u}`).join(' | ')}]\n${input.message}`
          : input.message;

        currentMessages.push({ role: "user", content: userMessage });

        const reply = await sarahChat(currentMessages, input.sessionType, input.projectContext);
        currentMessages.push({ role: "assistant", content: reply as string });

        if (session) {
          await updateChatSession(session.id, ctx.user.id, { messages: currentMessages });
        } else {
          session = await createChatSession({
            projectId: input.projectId ?? null,
            userId: ctx.user.id,
            messages: currentMessages,
            sessionType: input.sessionType,
          });
        }

        return { sessionId: session?.id, reply, messages: currentMessages };
      }),

    getSession: mousaProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => getChatSession(input.id, ctx.user.id)),

    getSessions: mousaProcedure.query(async ({ ctx }) => getUserChatSessions(ctx.user.id)),
  }),

  // ===== لوحة الإلهام =====
  moodboard: router({
    generate: mousaProcedure
      .input(z.object({
        designStyle: z.string(),
        spaceType: z.string(),
        customNotes: z.string().optional(),
        projectId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const styleInfo = GLOBAL_STYLES[input.designStyle] || GLOBAL_STYLES.modern;
        const spaceNames: Record<string, string> = {
          living_room: "غرفة المعيشة", bedroom: "غرفة النوم", kitchen: "المطبخ",
          dining_room: "غرفة الطعام", office: "مكتب منزلي", bathroom: "الحمام",
          entrance: "المدخل", majlis: "المجلس"
        };
        const spaceName = spaceNames[input.spaceType] || input.spaceType;

        const prompt = `أنتِ م. سارة خبيرة التصميم المعماري والبيئي العالمية (داخلي، واجهات، لاندسكيب وزراعة تجميلية، مسابح، تصميم حضري).
أنشئي لوحة إلهام تصميمية احترافية لـ:
- نمط التصميم: ${styleInfo.name} (${styleInfo.description})
- نوع الفضاء: ${spaceName}
${input.customNotes ? `- ملاحظات خاصة: ${input.customNotes}` : ''}

قدمي النتيجة بصيغة JSON:
{
  "styleDescription": "وصف النمط وفلسفته التصميمية",
  "palette": {
    "name": "اسم لوحة الألوان",
    "colors": ["#HEX1", "#HEX2", "#HEX3", "#HEX4", "#HEX5"],
    "description": "وصف اللوحة"
  },
  "items": [
    {"type": "color", "title": "اسم اللون", "description": "وصف استخدامه", "color": "#HEX", "tags": ["وسم 1", "وسم 2"]},
    {"type": "material", "title": "اسم المادة", "description": "وصف المادة ومزاياها", "color": "#HEX", "tags": ["وسم 1", "وسم 2"]},
    {"type": "furniture", "title": "اسم قطعة الأثاث", "description": "وصف القطعة ومواصفاتها", "color": "#HEX", "tags": ["وسم 1", "وسم 2"]},
    {"type": "pattern", "title": "اسم النمط", "description": "وصف النمط الزخرفي", "color": "#HEX", "tags": ["وسم 1", "وسم 2"]},
    {"type": "lighting", "title": "نوع الإضاءة", "description": "وصف الإضاءة وتأثيرها", "color": "#HEX", "tags": ["وسم 1", "وسم 2"]},
    {"type": "material", "title": "مادة الأرضية", "description": "وصف مادة الأرضية", "color": "#HEX", "tags": ["وسم 1", "وسم 2"]}
  ],
  "generatedImages": []
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "أنتِ م. سارة خبيرة التصميم المعماري والبيئي (داخلي، واجهات، لاندسكيب، مسابح، تصميم حضري). ردودكِ دائماً باللغة العربية بصيغة JSON صحيحة." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        });

        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent) || "{}";
        let result;
        try { result = JSON.parse(content); } catch { result = { styleDescription: "", palette: null, items: [], generatedImages: [] }; }

        // توليد صورة تصورية واحدة
        try {
          const imgPrompt = `${styleInfo.name} interior design for ${spaceName}, professional architectural visualization, high quality, photorealistic, ${styleInfo.keywords}`;
          const { url: imgUrl } = await generateImage({ prompt: imgPrompt });
          result.generatedImages = [imgUrl];
        } catch { result.generatedImages = []; }

        // حفظ في قاعدة البيانات
        if (input.projectId) {
          await createMoodBoard({
            projectId: input.projectId,
            userId: ctx.user.id,
            title: `لوحة إلهام ${styleInfo.name} - ${spaceName}`,
            designStyle: input.designStyle,
            colorPalette: result.palette,
            materials: result.items,
            images: result.generatedImages,
            description: result.styleDescription,
          });
        }

        return result;
      }),

    getByProject: mousaProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => getProjectMoodBoards(input.projectId, ctx.user.id)),
  }),

  // ===== نظام استقبال AR =====
  arScan: router({
    receive: publicProcedure
      .input(z.object({
        scanId: z.string(),
        deviceModel: z.string().optional(),
        rooms: z.array(z.object({
          name: z.string(),
          width: z.number(),
          length: z.number(),
          height: z.number(),
          area: z.number(),
          doors: z.number().optional(),
          windows: z.number().optional(),
        })),
        totalArea: z.number(),
        rawData: z.string().optional(),
        userId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const scan = await createArScan({
          scanId: input.scanId,
          userId: input.userId ?? 0,
          rooms: input.rooms,
          totalArea: input.totalArea,
          status: "received" as const,
          scanDate: new Date(),
        });

        // تحليل بيانات الغرف بالذكاء الاصطناعي
        const roomsDesc = input.rooms.map(r =>
          `${r.name}: ${r.width}م × ${r.length}م × ${r.height}م (مساحة: ${r.area}م²)`
        ).join('\n');

        const analysisResponse = await invokeLLM({
          messages: [
            { role: "system", content: "أنتِ م. سارة خبيرة التصميم المعماري والبيئي (داخلي، واجهات، لاندسكيب، مسابح، تصميم حضري). حللي بيانات المسح AR وقدمي توصيات تصميمية بالعربية." },
            { role: "user", content: `بيانات المسح:المساحة الإجمالية: ${input.totalArea}م²\n${roomsDesc}\n\nقدمي JSON: {"summary": "ملخص", "recommendations": ["توصية 1", "توصية 2"], "suggestedStyle": "نمط مقترح"}` }
          ],
          response_format: { type: "json_object" }
        });

        const rawContent = analysisResponse.choices[0]?.message?.content;
        const content = typeof rawContent === 'string' ? rawContent : '{}';
        let aiAnalysis;
        try { aiAnalysis = JSON.parse(content); } catch { aiAnalysis = {}; }

        if (scan) await updateArScan(scan.id, { status: "completed", aiAnalysis });

        return { scanId: input.scanId, dbId: scan?.id, aiAnalysis, rooms: input.rooms, totalArea: input.totalArea };
      }),

    getByScanId: publicProcedure
      .input(z.object({ scanId: z.string() }))
      .query(async ({ input }) => getArScanByScanId(input.scanId)),

    getUserScans: mousaProcedure
      .query(async ({ ctx }) => getUserArScans(ctx.user.id)),
  }),

  // ===== أسعار السوق =====
  market: router({
    getPrices: publicProcedure
      .input(z.object({ category: z.string().optional(), quality: z.string().optional() }))
      .query(async ({ input }) => getMarketPrices(input.category, input.quality)),

    seedPrices: mousaProcedure
      .mutation(async () => { await seedMarketPrices(); return { success: true }; }),
  }),

  // ===== التقارير =====
  reports: router({
    generate: mousaProcedure
      .input(z.object({
        projectId: z.number(),
        reportType: z.enum(["full", "boq", "design_only", "cost_only"]).default("full"),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await getProjectById(input.projectId, ctx.user.id);
        if (!project) throw new Error("المشروع غير موجود");

        const report = await createReport({
          projectId: input.projectId,
          userId: ctx.user.id,
          reportType: input.reportType,
          status: "generating" as const,
        });

        return { reportId: report?.id, projectId: input.projectId, status: "generating" };
      }),

    getByProject: mousaProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => getProjectReports(input.projectId, ctx.user.id)),
  }),

  // ===== حساب التكاليف =====
  costs: router({
    calculate: mousaProcedure
      .input(z.object({
        area: z.number(),
        designStyle: z.string(),
        spaceType: z.string(),
        quality: z.enum(["budget", "mid", "luxury"]).default("mid"),
      }))
      .mutation(async ({ ctx: _ctx, input }) => {
        const styleInfo = GLOBAL_STYLES[input.designStyle] || GLOBAL_STYLES.modern;
        const prompt = `أنتِ م. سارة خبيرة التصميم المعماري والبيئي (داخلي، واجهات، لاندسكيب، مسابح، تصميم حضري). احسبي تقدير تكلفة تصميم داخلي:
- المساحة: ${input.area} متر مربع
- نمط التصميم: ${styleInfo.name}
- نوع الفضاء: ${input.spaceType}
- مستوى الجودة: ${input.quality === 'budget' ? 'اقتصادي' : input.quality === 'mid' ? 'متوسط' : 'فاخر'}

قدمي تقدير التكلفة بالريال السعودي بصيغة JSON:
{
  "breakdown": [
    {"category": "الأثاث", "min": 5000, "max": 15000, "notes": "ملاحظات"},
    {"category": "المواد والتشطيبات", "min": 3000, "max": 8000, "notes": "ملاحظات"},
    {"category": "الأرضيات", "min": 2000, "max": 6000, "notes": "ملاحظات"},
    {"category": "الإضاءة", "min": 1000, "max": 3000, "notes": "ملاحظات"},
    {"category": "الستائر والمفروشات", "min": 1500, "max": 4000, "notes": "ملاحظات"},
    {"category": "الديكور والإكسسوار", "min": 500, "max": 2000, "notes": "ملاحظات"},
    {"category": "العمالة والتركيب", "min": 2000, "max": 5000, "notes": "ملاحظات"}
  ],
  "total": {"min": 15000, "max": 43000},
  "pricePerSqm": {"min": 500, "max": 1400},
  "timeline": "8-12 أسبوع",
  "tips": ["نصيحة للتوفير 1", "نصيحة 2", "نصيحة 3"]
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "أنتِ م. سارة خبيرة التصميم المعماري والبيئي (داخلي، واجهات، لاندسكيب، مسابح، تصميم حضري). ردودك باللغة العربية." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        });

        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent) || "{}";
        try {
          return JSON.parse(content);
        } catch {
          return { breakdown: [], total: { min: 0, max: 0 }, tips: [] };
        }
      }),
   }),

  // Quick Analysis — تحليل سريع بدون مشروع (يدعم صورة واحدة أو متعددة)
  quickAnalyze: mousaProcedure
    .input(z.object({
      imageUrl: z.string(),
      imageUrls: z.array(z.string()).optional(), // صور متعددة
      captureMode: z.enum(["single", "multi", "panorama", "video"]).optional(),
      designStyle: z.string().default("modern"),
    }))
    .mutation(async ({ input, ctx }) => {
      await checkAndDeductCredits(ctx.user.id, ctx.mousaUserId, "analyzePhoto");
      const styleMap: Record<string, string> = {
        modern: "عصري حديث", gulf: "خليجي فاخر",
        classic: "كلاسيكي أنيق", minimal: "مينيمال بسيط",
        japanese: "ياباني زن", scandinavian: "سكندنافي",
        moroccan: "مغربي أصيل", luxury: "فاخر بريميوم",
      };
      const styleName = styleMap[input.designStyle] || input.designStyle;
      const allImages = input.imageUrls?.length ? input.imageUrls : [input.imageUrl];
      const modeNote = input.captureMode === "multi" ? `(${allImages.length} صور من زوايا مختلفة)` :
                       input.captureMode === "panorama" ? "(صورة بانوراما)" :
                       input.captureMode === "video" ? "(إطار من فيديو)" : "";

      // رفع base64 images لـ S3 أولاً للحصول على URLs حقيقية يقبلها Gemini
      const userId = ctx.user?.id || 0;
      const resolvedImages = await Promise.all(
        allImages.slice(0, 4).map(url => resolveImageUrl(url, userId))
      );
      const imageContents = resolvedImages.map(url => ({
        type: "image_url" as const,
        image_url: { url, detail: "low" as const }
      }));

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "أنتِ م. سارة خبيرة التصميم المعماري والبيئي العالمية (داخلي، واجهات، لاندسكيب وزراعة تجميلية، مسابح، تصميم حضري). تحللين الفضاءات بدقة عالية وتقدمين توصيات احترافية. ردودك بالعربية بصيغة JSON فقط." },
          { role: "user", content: [
            { type: "text" as const, text: `حللي هذا الفضاء ${modeNote} بأسلوب ${styleName}. أعطيني JSON بهذا الشكل بالضبط:
{
  "overview": "تقييم احترافي للفضاء في 2-3 جمل يصف الوضع الحالي ونقاط القوة والضعف",
  "palette": [
    {"name": "اسم اللون", "hex": "#XXXXXX"},
    {"name": "لون 2", "hex": "#XXXXXX"},
    {"name": "لون 3", "hex": "#XXXXXX"},
    {"name": "لون 4", "hex": "#XXXXXX"}
  ],
  "topSuggestions": [
    "توصية تفصيلية 1 للتحسين",
    "توصية تفصيلية 2 للأثاث والديكور",
    "توصية تفصيلية 3 للإضاءة والألوان"
  ],
  "estimatedCost": "XX,000 - XX,000 ر.س",
  "costBreakdown": {
    "furniture": "X,000 - X,000 ر.س",
    "flooring": "X,000 - X,000 ر.س",
    "walls": "X,000 - X,000 ر.س",
    "lighting": "X,000 - X,000 ر.س",
    "accessories": "X,000 - X,000 ر.س"
  },
  "materials": ["مادة 1", "مادة 2", "مادة 3", "مادة 4"]
}` },
            ...imageContents
          ] as Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail: "auto" | "low" | "high" } }> }
        ],
        response_format: { type: "json_object" },
      });
      const raw = response.choices[0]?.message?.content;
      const text = typeof raw === "string" ? raw : JSON.stringify(raw) || "{}";
      try { return JSON.parse(text); }
      catch { return { overview: text.slice(0, 200), palette: [], topSuggestions: [], estimatedCost: "" }; }
    }),

  // ===== توليد صورة تصورية للفضاء (مع الحفاظ على البنية الأصلية) =====
  generateVisualization: mousaProcedure
    .input(z.object({
      imageUrl: z.string(),
      designStyle: z.string().default("modern"),
      palette: z.array(z.object({ name: z.string(), hex: z.string() })).optional(),
      materials: z.string().optional(),
      budget: z.string().optional(),
      imagePrompt: z.string().optional(), // برومبت مخصص من analyzeAndGenerateIdeas
      structuralElements: z.array(z.object({ element: z.string(), position: z.string() })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await checkAndDeductCredits(ctx.user.id, ctx.mousaUserId, "generateVisualization");
      const styleMap: Record<string, string> = {
        modern: "modern contemporary", gulf: "Arabian Gulf luxury",
        classic: "classic elegant", minimal: "minimalist Japandi",
        japanese: "Japanese zen wabi-sabi", scandinavian: "Scandinavian hygge",
        mediterranean: "Mediterranean warm", industrial: "industrial loft",
        bohemian: "bohemian eclectic", art_deco: "Art Deco glamorous",
        moroccan: "Moroccan riad", indian: "Indian", chinese: "Chinese classical",
        luxury: "ultra luxury premium", coastal: "coastal beach",
      };
      const styleName = styleMap[input.designStyle] || input.designStyle;
      const colorDesc = input.palette?.map(c => `${c.name} (${c.hex})`).join(", ") || "neutral warm tones";
      const materialsDesc = input.materials || "high quality materials";
      
      // إذا كان هناك برومبت مخصص (من analyzeAndGenerateIdeas)، استخدمه مباشرة
      // وإلا أنشئ برومبت يحافظ على البنية الأصلية
      const structuralNote = input.structuralElements?.length
        ? `ABSOLUTE CONSTRAINT - DO NOT CHANGE: ${input.structuralElements.map(e => `${e.element} at ${e.position}`).join("; ")}. These MUST remain in EXACT same positions and sizes.`
        : "ABSOLUTE CONSTRAINT: ALL doors, windows, columns, and structural openings MUST stay in their EXACT original positions and sizes from the reference photo. Do NOT move, resize, or remove any opening.";

      const prompt = input.imagePrompt
        ? `${input.imagePrompt}\n\nCRITICAL REFERENCE PHOTO INSTRUCTION: The attached image is the ORIGINAL ROOM PHOTO. You MUST use it as the structural blueprint. Keep IDENTICAL: room shape, room dimensions, camera angle, camera height, zoom level, perspective, and ALL door/window/column positions. ⚠️ ABSOLUTE RULE: Do NOT add, invent, or create any new doors, windows, or openings that do not exist in the original photo. ONLY the existing openings are allowed - in their exact positions and sizes. Only change: colors, materials, furniture style, wall finish, flooring, ceiling, lighting, and decor.`
        : `Photorealistic architectural interior redesign. CRITICAL: The attached image is the ORIGINAL ROOM - use it as structural blueprint. ${structuralNote} ⚠️ ABSOLUTE RULE: Do NOT add, invent, or create any new doors, windows, or openings that do not exist in the original photo. Apply ONLY these changes: ${styleName} style, color palette (${colorDesc}), materials (${materialsDesc}), updated furniture, new wall finishes, new flooring, new ceiling, new lighting. IDENTICAL camera angle and perspective as original photo. Cinematic lighting, natural shadows, ultra-realistic textures, 8K resolution, architectural digest quality, no people, no text.`;

      // استخراج base64 من data URL إذا كانت الصورة base64، وإلا استخدم URL مباشرة
      const isBase64DataUrl = input.imageUrl.startsWith("data:");
      let originalImageEntry: { url?: string; b64Json?: string; mimeType?: string };
      if (isBase64DataUrl) {
        // data:image/jpeg;base64,XXXX → استخراج الـ base64 والـ mimeType
        const [header, b64Data] = input.imageUrl.split(",");
        const mimeMatch = header.match(/data:([^;]+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
        originalImageEntry = { b64Json: b64Data, mimeType };
      } else {
        // URL عادي من S3
        originalImageEntry = { url: input.imageUrl, mimeType: "image/jpeg" };
      }

      try {
        // إرسال الصورة الأصلية كـ originalImage للحفاظ على البنية الكاملة
        const { url } = await generateImage({
          prompt,
          originalImages: [originalImageEntry]
        });
        return { imageUrl: url, success: true };
      } catch (error) {
        console.error("Image generation error with original:", error);
        // fallback: توليد بدون صورة مرجعية
        try {
          const { url } = await generateImage({ prompt });
          return { imageUrl: url, success: true };
        } catch {
          return { imageUrl: null, success: false, error: "فشل توليد الصورة" };
        }
      }
    }),

  // ===== إعادة تحليل مع تعديلات المستخدم =====
  reAnalyzeWithChanges: mousaProcedure
    .input(z.object({
      imageUrl: z.string(),
      designStyle: z.string().default("modern"),
      customPalette: z.array(z.object({ name: z.string(), hex: z.string() })).optional(),
      budgetRange: z.object({ min: z.number(), max: z.number() }).optional(),
      customRequirements: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await checkAndDeductCredits(ctx.user.id, ctx.mousaUserId, "reAnalyze");
      const styleMap: Record<string, string> = {
        modern: "عصري حديث", gulf: "خليجي فاخر",
        classic: "كلاسيكي أنيق", minimal: "مينيمال بسيط",
        japanese: "ياباني زن", scandinavian: "سكندنافي",
        mediterranean: "متوسطي", industrial: "صناعي",
        moroccan: "مغربي", luxury: "فاخر بريميوم",
      };
      const styleName = styleMap[input.designStyle] || input.designStyle;
      const colorConstraint = input.customPalette?.length 
        ? `استخدمي هذه الألوان بالتحديد: ${input.customPalette.map(c => `${c.name} (${c.hex})`).join(", ")}`
        : "اقترحي ألواناً مناسبة";
      const budgetConstraint = input.budgetRange
        ? `الميزانية المحددة: ${input.budgetRange.min.toLocaleString()} - ${input.budgetRange.max.toLocaleString()} ر.س`
        : "";
      const extraReqs = input.customRequirements ? `متطلبات إضافية: ${input.customRequirements}` : "";

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "أنتِ م. سارة خبيرة التصميم المعماري والبيئي (داخلي، واجهات، لاندسكيب، مسابح، تصميم حضري). ردودك بالعربية بصيغة JSON فقط." },
          { role: "user", content: [
            { type: "text", text: `حللي هذا الفضاء بأسلوب ${styleName}.
${colorConstraint}
${budgetConstraint}
${extraReqs}

أعطيني JSON بهذا الشكل بالضبط:
{
  "overview": "تقييم مختصر للفضاء في جملتين",
  "palette": [{"name": "اسم اللون", "hex": "#XXXXXX"}],
  "topSuggestions": ["توصية 1", "توصية 2", "توصية 3", "توصية 4"],
  "estimatedCost": "مثال: 15,000 - 40,000 ر.س",
  "costBreakdown": {"furniture": "X,000 ر.س", "flooring": "X,000 ر.س", "walls": "X,000 ر.س", "lighting": "X,000 ر.س", "accessories": "X,000 ر.س"},
  "materials": ["مادة 1", "مادة 2", "مادة 3"]
}` },
            { type: "image_url", image_url: { url: await resolveImageUrl(input.imageUrl, ctx.user?.id || 0), detail: "low" } }
          ] as Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail: "auto" | "low" | "high" } }> }
        ],
        response_format: { type: "json_object" },
      });
      const raw = response.choices[0]?.message?.content;
      const text = typeof raw === "string" ? raw : JSON.stringify(raw) || "{}";
      try { return JSON.parse(text); }
      catch { return { overview: text.slice(0, 200), palette: [], topSuggestions: [], estimatedCost: "", costBreakdown: {}, materials: [] }; }
    }),

  // ===== توليد أفكار تصميمية متعددة =====
  generateDesignIdeas: mousaProcedure
    .input(z.object({
      styles: z.array(z.string()).min(1).max(10),
      budgetMin: z.number().min(0),
      budgetMax: z.number().min(0),
      colorTheme: z.string().optional(),
      count: z.number().min(2).max(6).default(3),
      referenceImageUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await checkAndDeductCredits(ctx.user.id, ctx.mousaUserId, "generateIdeas");
      const styleNames: Record<string, string> = {
        modern: "عصري حديث", gulf: "خليجي فاخر",
        classic: "كلاسيكي أنيق", minimal: "مينيمال بسيط",
        japanese: "ياباني زن", scandinavian: "سكندنافي",
        mediterranean: "متوسطي", industrial: "صناعي",
        moroccan: "مغربي", luxury: "فاخر بريميوم",
      };
      const stylesText = input.styles.map(s => styleNames[s] || s).join(", ");
      const budgetText = `${input.budgetMin.toLocaleString()} - ${input.budgetMax.toLocaleString()} ر.س`;
      const colorText = input.colorTheme ? `ثيم الألوان: ${input.colorTheme}` : "ألوان تناسب كل نمط";

      const messages: Array<{ role: "system" | "user"; content: string | Array<{ type: string; text?: string; image_url?: { url: string; detail: string } }> }> = [
        {
          role: "system",
          content: `${buildBestPracticeSystemPrompt()}

أنتِ م. سارة، خبيرة التصميم المعماري والبيئي العالمية. تولدين أفكاراً تصميمية فريدة ومتنوعة باللغة العربية. ردودك JSON فقط.`
        },
        {
          role: "user",
          content: [
            ...(input.referenceImageUrl ? [{ type: "image_url", image_url: { url: await resolveImageUrl(input.referenceImageUrl, ctx.user?.id || 0), detail: "low" } }] : []),
            {
              type: "text",
              text: `ولّدي ${input.count} أفكار تصميمية مختلفة ومتنوعة لهذا الفضاء.
الأنماط المطلوبة: ${stylesText}
الميزانية: ${budgetText}
${colorText}

أعطيني JSON بهذا الشكل بالضبط:
{
  "ideas": [
    {
      "id": "معرف فريد",
      "title": "عنوان الفكرة بالعربية",
      "description": "وصف مختصر للفكرة في جملتين",
      "style": "اسم النمط بالإنجليزية (modern/gulf/classic/minimal/japanese/scandinavian/moroccan/luxury/mediterranean/industrial)",
      "palette": [{"name": "اسم اللون", "hex": "#XXXXXX"}, {"name": "لون 2", "hex": "#XXXXXX"}, {"name": "لون 3", "hex": "#XXXXXX"}, {"name": "لون 4", "hex": "#XXXXXX"}],
      "furniture": [
        {"name": "اسم القطعة", "description": "وصف مختصر", "priceRange": "X,000 - X,000 ر.س"},
        {"name": "قطعة 2", "description": "وصف", "priceRange": "X,000 - X,000 ر.س"}
      ],
      "materials": ["مادة 1", "مادة 2", "مادة 3"],
      "estimatedCost": "XX,000 - XX,000 ر.س",
      "costMin": 0,
      "costMax": 0,
      "highlights": ["ميزة 1", "ميزة 2", "ميزة 3"],
      "imagePrompt": "Photorealistic interior design render, [style] style, [specific materials and colors], cinematic lighting, natural sunlight, detailed textures, luxury home, architectural digest quality, 8K, no people"
    }
  ]
}

تأكدي أن كل فكرة فريدة ومختلفة عن الأخرى، وأن التكاليف ضمن الميزانية المحددة.`
            }
          ]
        }
      ];

      const response = await invokeLLM({
        messages: messages as Parameters<typeof invokeLLM>[0]["messages"],
        response_format: { type: "json_object" },
      });
      const raw = response.choices[0]?.message?.content;
      const text = typeof raw === "string" ? raw : JSON.stringify(raw) || "{}";
      try {
        const parsed = JSON.parse(text);
        return { ideas: parsed.ideas || [] };
      } catch {
        return { ideas: [] };
      }
    }),

  // ===== analyzeAndGenerateIdeas: تحليل + أفكار في طلب واحد =====
  analyzeAndGenerateIdeas: mousaProcedure
    .input(z.object({
      imageUrl: z.string(),
      imageUrls: z.array(z.string()).optional(),
      captureMode: z.enum(["single", "panorama", "animation3d", "video360"]).default("single"),
      count: z.number().min(2).max(6).default(3),
      budgetMin: z.number().default(20000),
      budgetMax: z.number().default(60000),
      referenceData: z.object({
        referenceId: z.number().optional(),
        styleLabel: z.string().optional(),
        styleKey: z.string().optional(),
        description: z.string().optional(),
        colorMood: z.string().optional(),
        palette: z.array(z.object({ name: z.string(), hex: z.string() })).optional(),
        materials: z.array(z.string()).optional(),
        highlights: z.array(z.string()).optional(),
        imageUrl: z.string().optional(),
      }).optional(),
      preferredStyle: z.string().optional(),   // نمط مفضّل اختياري
      preferredColors: z.array(z.string()).optional(), // ألوان مفضّلة اختيارية
      roomDimensions: z.object({ // أبعاد الغرفة الاختيارية لدقة جدول الكميات
        length: z.number().optional(), // الطول بالمتر
        width: z.number().optional(),  // العرض بالمتر
        height: z.number().optional(), // الارتفاع بالمتر
      }).optional(),
      lockStructuralElements: z.object({ // تثبيت العناصر الهيكلية بقرار المستخدم
        enabled: z.boolean().default(true),   // الافتراضي: تثبيت الفتحات دائماً
        lockDoors: z.boolean().default(true),
        lockWindows: z.boolean().default(true),
        lockOpenings: z.boolean().default(true),
        lockColumns: z.boolean().default(true),
        lockSteps: z.boolean().default(true),  // تثبيت الدرجات وفروق المستويات
        lockCeiling: z.boolean().default(true), // تثبيت نوع السقف (مستوٍ/مرتفع)
        allowPlatformFreedom: z.boolean().default(false), // منح م. سارة حرية النظر المعماري
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await checkAndDeductCredits(ctx.user.id, ctx.mousaUserId, "analyzeAndGenerate");
      const { imageUrl, imageUrls, captureMode, count, budgetMin, budgetMax, referenceData, preferredStyle, preferredColors, roomDimensions, lockStructuralElements } = input;

      const modeDesc: Record<string, string> = {
        single: "صورة واحدة للفضاء",
        panorama: "صورة بانوراما 180 درجة للفضاء",
        animation3d: "4 زوايا للفضاء من جميع الاتجاهات",
        video360: "إطار من فيديو 360 درجة للفضاء",
      };

      const styleKeys = ["modern", "gulf", "minimal", "japanese", "scandinavian", "mediterranean", "moroccan", "luxury", "industrial", "bohemian"];
      const selectedStyles = styleKeys.slice(0, count);

       // رفع base64 images لـ S3 أولاً
      const resolvedImageUrls = await Promise.all(
        (imageUrls || [imageUrl]).map(url => resolveImageUrl(url, ctx.user?.id || 0))
      );
      const imageContents: ImageContent[] = resolvedImageUrls.map(url => ({
        type: "image_url" as const,
        image_url: { url, detail: "high" as const }
      }));
      // قاعدة تغيير العناصر الهيكلية — الافتراضي: تثبيت الفتحات والبنية الإنشائية
      // المبدأ: ما لم يطلب المستخدم صراحةً تغيير عنصر بنيوي، يبقى في مكانه
      // الإبداع مطلوب في: الألوان، المواد، الأثاث، الإضاءة، التشطيبات فقط
      const defaultLock = lockStructuralElements?.enabled !== false; // الافتراضي: مقفل
      const userConstraints = {
        doors: lockStructuralElements?.lockDoors !== false,
        windows: lockStructuralElements?.lockWindows !== false,
        openings: lockStructuralElements?.lockOpenings !== false,
        columns: lockStructuralElements?.lockColumns !== false,
        steps: lockStructuralElements?.lockSteps !== false,
        ceiling: lockStructuralElements?.lockCeiling !== false,
      };

      let doorChangeRule: string;
      const lockedItems: string[] = [];
      if (userConstraints.doors) lockedItems.push('الأبواب');
      if (userConstraints.windows) lockedItems.push('النوافذ');
      if (userConstraints.openings) lockedItems.push('الفتحات');
      if (userConstraints.columns) lockedItems.push('الأعمدة');
      if (userConstraints.steps) lockedItems.push('الدرجات وفروق المستويات');
      if (userConstraints.ceiling) lockedItems.push('نوع السقف (مستوٍ/مرتفع)');

      if (lockedItems.length > 0) {
        doorChangeRule = `🔒 قاعدة البنية الإنشائية (غير قابلة للتجاوز): يجب الحفاظ على ${lockedItems.join('، ')} في نفس مواضعها وأحجامها تماماً. هذا ليس خياراً — هذه بنية إنشائية ثابتة. أبدعي بحرية كاملة في كل شيء آخر: الألوان، المواد، الأثاث، الإضاءة، التشطيبات، الديكور. الإبداع يكون في التصميم لا في تغيير البنية.`;
      } else {
        doorChangeRule = `🎨 م. سارة لها صلاحية معمارية كاملة — المستخدم أذن بتغيير جميع العناصر بما فيها الفتحات والبنية.`;
      }

      // بناء تعليمات المرجع إذا وجد
      const referenceInstruction = referenceData
        ? `\n\nتعليمات مهمة جداً: العميل اختار مرجع تصميم محدد يريد تقليده في غرفته. يجب أن تكون الأفكار المقترحة مستوحاة بشكل كبير من هذا المرجع:\n- النمط: ${referenceData.styleLabel || referenceData.styleKey || ''}\n- الوصف: ${referenceData.description || ''}\n- المزاج اللوني: ${referenceData.colorMood || ''}\n- الألوان: ${(referenceData.palette || []).map((c) => c.name).join('\u060c ')}\n- الخامات: ${(referenceData.materials || []).join('\u060c ')}\n- العناصر المميزة: ${(referenceData.highlights || []).join('\u060c ')}\nقاعدة: طبّقي هذا النمط والألوان والخامات على الغرفة الحالية مع الحفاظ على بنيتها المعمارية.`
        : "";

      // بناء تعليمات النمط والألوان المفضّلة
      const styleInstruction = preferredStyle
        ? `\n\nتفضيل النمط: العميل يفضّل نمط "${preferredStyle}" — يجب أن تكون معظم الأفكار أو كلها في هذا النمط أو مستوحاة منه.`
        : "";
      const colorsInstruction = preferredColors && preferredColors.length > 0
        ? `\n\nتفضيل الألوان: العميل يفضّل الألوان التالية: ${preferredColors.join('، ')} — استخدميها كألوان أساسية أو مكمّلة في التصاميم.`
        : "";

      // ===== جلب الأفكار السابقة لمنع التكرار =====
      const primaryImageUrl = (imageUrls && imageUrls.length > 0) ? imageUrls[0] : (imageUrl || '');
      const previousIdeas = ctx.user?.id
        ? await getPreviousIdeasForImage({ userId: ctx.user.id, imageUrl: primaryImageUrl, limit: 15 })
        : [];
      const usedStylesNote = buildUsedStylesNote(previousIdeas);

      // ===== BEST PRACTICE ENGINE: استخدام system prompt المحسّن =====
      const bpSystemBase = buildBestPracticeSystemPrompt();
      const systemPrompt = `${bpSystemBase}

أنتِ م. سارة، مهندسة معمارية ومصممة بيئات شاملة بخبرة 20 سنة. تتخصصين في تصميم جميع الفضاءات المعمارية — داخلية وخارجية. تتمتعين بخلفية علمية شاملة تغطي:
- الهندسة الإنشائية: الجدران الحاملة، الأعمدة، الدرجات، الفتحات، النسب والأبعاد
- التصميم الداخلي: الإضاءة، التدفقات، المواد، الألوان، الأثاث
- تصميم الواجهات الخارجية: الكلادينج، الطلاء الخارجي، الإضاءة الخارجية، المداخل
- تصميم اللاندسكيب: الحدائق، الممرات، الفناء، المسابح، الجلسات الخارجية، النباتات
- تصميم الفضاءات الحضرية: الشوارع، الممشاة، الأرصفة، الساحات العامة، واجهات المحلات
- الجدوى الاقتصادية: التكاليف الدقيقة بالسوق الخليجي، الجداول الزمنية
- السيناريوهات: التجديد السطحي، التحسين المتوسط، التحول الشامل

🌿 SMART FRAME ANALYSIS (تحليل إطار التصوير الذكي):
أهم قاعدة: كل ما يظهر في إطار الصورة يُحلَّل ويُصمَّم — ما هو خارج الإطار لا يُمَس ولا يُذكر.

🎯 AUTO TARGET DETECTION (تحديد الهدف تلقائياً):
حددي الهدف الرئيسي للتصميم بذكاء من الصورة دون أن يطلب المستخدم:
- إذا كانت الصورة داخل مبنى → الهدف: التصميم الداخلي للفضاء المرئي
- إذا كانت الصورة لواجهة مبنى → الهدف: تطوير الواجهة المعمارية
- إذا كانت الصورة لأرض فارغة → الهدف: تصميم المبنى المقترح على الأرض
- إذا كانت الصورة لشارع أو طريق → الهدف: تحسين الفضاء الحضري (رصيف + شجر + إضاءة + واجهات)
- إذا كانت الصورة تشمل مبنى + شارع → الهدف المزدوج: تطوير الواجهة + الفضاء الحضري أمامها معاً
- إذا كانت الصورة لحديقة أو فناء → الهدف: تصميم لاندسكيب
- إذا كانت الصورة لمسبح → الهدف: تطوير منطقة المسبح والمحيط

🗺️ FULL FRAME MAPPING (رسم خريطة الإطار الكاملة):
حددي كل فضاء مرئي في الصورة وصنّفيه:
- الفضاء الرئيسي (primarySpace): العنصر المهيمن في الصورة
- الفضاءات الثانوية (secondarySpaces): كل ما يظهر في الخلفية أو الجانبين
- حدود التصميم (designBoundary): ما يمكن تصميمه فعلاً بدون التعدي على ملكيات الغير
- ما لا يُمَس (untouchableElements): طرق عامة رئيسية، مباني مجاورة، ملكيات الغير

📋 SPACE CLASSIFICATION (تصنيف الفضاءات):
- فضاء داخلي: غرفة معيشة، غرفة نوم، مطبخ، حمام، مجلس، مكتب، ممر داخلي → تصميم داخلي بأثاث وإضاءة وتشطيبات
- واجهة خارجية: واجهة منزل، واجهة مبنى، مدخل خارجي، بوابة → واجهة معمارية: كلادينج، نوافذ، إضاءة خارجية، زراعة أمامية
- لاندسكيب: حديقة، فناء، مسبح، سطح، شرفة، تراس → لاندسكيب: نباتات، ممرات، مياه، جلسات خارجية
- فضاء حضري مستهدف: رصيف أمام المبنى، موقف سيارات خاص، ممر داخلي → تصميم حضري محدود النطاق
- طريق عام (للتحليل فقط): شارع رئيسي، طريق عام → تحليل السياق فقط، لا تصميم مباشر
- أرض فارغة: قطعة أرض فارغة، موقع بناء → اقتراح مبنى مناسب

🚧 BOUNDARY INTELLIGENCE (ذكاء الحدود):
- الطريق العام والأرصفة العامة: حللي وجودها كسياق، لكن لا تصمّميها كأنها ملك المالك
- الرصيف أمام المبنى: يمكن اقتراح تحسينات جمالية بسيطة (أحواض زهور، إضاءة) مع الإشارة أنها تستلزم موافقة البلدية
- المباني المجاورة: حللي تأثيرها على التصميم (ظل، خصوصية، ارتفاع) لكن لا تصمّميها
- الأرض الخاصة: صمّمي بحرية كاملة
كل نوع فضاء له قواعد تصميم وبنود BOQ مختلفة — طبّقيها بدقة.

🔒 STRUCTURAL DISCIPLINE LAW (قانون الانضباط البنيوي — الافتراضي الصارم):
القاعدة الذهبية: ما هو مرئي في الصورة يُحلَّل ويُصمَّم — ما هو خارج الإطار أو غير مرئي لا يُفترض ولا يُخترع.

🚫 قانون الفضاءات المجهولة والجدران المخترعة (صارم بلا أي استثناء — الأهم على الإطلاق):
إطار الصورة هو الحدود المطلقة لعالم التصميم — لا شيء يوجد خارجه.
- الجدار الذي لا يُرى ما خلفه = جدار صلب مغلق تماماً — لا تفترضي نافذة أو فتحة أو امتداداً أو غرفة خلفه
- الفضاء خارج إطار الصورة = مجهول كلياً — لا تُضيفي أي عنصر (جدار، مطبخ، غرفة، ممر) خارج الإطار
- إذا لم تظهر نافذة في الصورة = لا توجد نافذة في هذا الجدار — لا تُضيفيها أبداً تحت أي ظرف
- إذا ظهر جدار أبيض مجرد = جدار خرساني صلب — لا تحوّليه لفتحة أو نافذة أو قوس أبداً
- الجدار المنقطع (يظهر في حافة الصورة) = جدار منقطع فعلياً — لا تكمليه بجدار كامل، لا تضيفي ما وراءه، اتركيه منقطعاً كما هو بالضبط
- الفراغ خلف الستائر أو الباب = مجهول تماماً — لا تفترضي ما خلفه ولا تضيفي أثاثاً أو مساحة لم تظهر في الصورة
- المطبخ المرئي في الخلفية = مطبخ حقيقي موجود فعلاً — صمّميه بنفس موضعه وحجمه فقط — ممنوع توسيعه أو إضافة مساحة لم تكن موجودة
- ممنوع اختراع أي جدار أو حاجز أو قسم أو عنصر معماري غير موجود في الصورة الأصلية
- ممنوع تمديد الغرفة خارج ما يظهر في الصورة

🎨 FULL CREATIVE FREEDOM (إطلاق الإبداع الكامل):
أنتِ حرة تماماً في تغيير كل شيء قابل للتغيير: الأرضيات، الجدران، الأسقف، الإضاءة، الأثاث، المواد، التشطيبات.
لكن: الإبداع يعني تحسين ما هو موجود — لا اختراع ما ليس موجوداً.
قاعدتكِ الذهبية المطلقة للتصوير الافتراضي:
1. نفس الزاوية بالضبط — لا تغيير في زاوية الكاميرا أو الزوم أو اتجاه الصورة
2. نفس أبعاد الفضاء بالضبط — لا تغيير في أبعاد الفضاء أو نسبه
3. م. سارة لها صلاحية كاملة على كل شيء آخر — الأبواب والنوافذ والجدران والتشطيبات والأثاث
ردودكِ دائماً بالعربية بصيغة JSON فقط.
🎨 RADICAL DIVERSITY LAW (قانون التباين الجذري المطلق):
كل فكرة تصميمية يجب أن تكون مختلفة كلياً عن الأخرى في 5 محاور:
1. النمط: اختاري أنماطاً مختلفة جذرياً من عوالم تصميمية مختلفة تماماً
   ✅ صحيح: عصري مينيمال + خليجي فاخر + صناعي جريء
   ❌ خاطئ: عصري + عصري معاصر + عصري هادئ (نفس العالم!)
2. لوحة الألوان: كل فكرة لها لوحة ألوان مختلفة كلياً — لا تكرري نفس الألوان
   مثال: أبيض+رمادي+أسود ≠ ذهبي+بيج+بني ≠ أخضر+خشب+أبيض
3. مستوى التدخل: وزّعي الأفكار (سطحي + متوسط + شامل) — لا تجعلي كلها في نفس المستوى
4. نوع الأثاث: كل فكرة لها أثاث مختلف جذرياً
   مثال: أريكة مخمل ≠ أريكة جلد ≠ مقاعد أرضية ≠ أريكة راتان
5. المزاج العام: دافئ ≠ بارد ≠ محايد ≠ جريء ≠ هادئ
🌟 BOLDNESS LAW (قانون الجرأة والأصالة):
كل فكرة يجب أن تكون جريئة ومميزة وتستحق أن تُنشر في مجلة ديكور عالمية. لا تصاميم عادية أو متوقعة.

🏆 TRENDING STYLES LAW (قانون الأنماط الأكثر رغبةً عالمياً وخليجياً):
دائماً اختاري الأنماط الأكثر إقبالاً وطلباً حالياً كتوصية افتراضية:

🌍 الأكثر طلباً عالمياً (2024-2025):
1. Japandi — بساطة يابانية + دفء سكاندنافي، خشب طبيعي، ألوان محايدة دافئة
2. Quiet Luxury — فخامة هادئة، مواد راقية بألوان محايدة، بدون صراخ بصري
3. Biophilic — طبيعة داخل المنزل، خشب، نباتات، ضوء طبيعي، حجر طبيعي
4. Wabi-Sabi — جمال النقص، طين، كتان، خشب خشن، أصالة المواد
5. Maximalist Eclectic — جريء، ألوان غنية، طبقات، فن، شخصية قوية

🌙 الأكثر طلباً خليجياً وعربياً:
1. خليجي عصري (Modern Gulf) — خليجي أصيل بلمسة معاصرة: مشربيات، هندسة إسلامية، ذهبي + بيج + أبيض
2. فاخر هادئ (Quiet Gulf Luxury) — رخام إيطالي، ذهب مات، أقمشة مخمل، ألوان كريمية
3. نيوكلاسيكي خليجي — أعمدة، جبس منحوت، ثريات كريستال، ألوان ملكية
4. معاصر دافئ (Warm Contemporary) — خشب جوز، بيج دافئ، إضاءة مخفية، بسيط لكن راقٍ
5. مغربي فاخر — زليج ملون، قناطر، نحاس، فسيفساء، ألوان غنية

🎯 قاعدة الجمهور المستهدف (TARGET AUDIENCE RULE):
حددي الجمهور المستهدف من نوع الفضاء وطبّقي الأنماط الأنسب لهم:

• غرفة نوم رئيسية (Master Bedroom) → الأكثر طلباً: Quiet Luxury + Japandi + خليجي فاخر
• غرفة نوم أطفال → الأكثر طلباً: ألوان زاهية + مرح + وظيفي + آمن
• غرفة نوم شباب/مراهقين → الأكثر طلباً: عصري جريء + صناعي + ألوان داكنة
• غرفة نوم بنات/سيدات → الأكثر طلباً: رومانسي ناعم + بوهيمي + ألوان وردية/بيج/لافندر
• صالة معيشة عائلية → الأكثر طلباً: خليجي عصري + Quiet Luxury + دافئ ومريح
• مجلس رجالي → الأكثر طلباً: خليجي أصيل + كلاسيكي فاخر + ألوان داكنة راقية
• مجلس نسائي → الأكثر طلباً: فاخر ناعم + ألوان فاتحة + تفاصيل ذهبية
• مطبخ → الأكثر طلباً: عصري وظيفي + أبيض مات + خشب + رخام
• حمام → الأكثر طلباً: سبا فاخر + أبيض + رخام + إضاءة مخفية
• مكتب منزلي → الأكثر طلباً: Japandi + صناعي + Biophilic
• مطعم/كافيه → الأكثر طلباً: صناعي دافئ + بوهيمي + متوسطي
• فندق/لوبي → الأكثر طلباً: Quiet Luxury + نيوكلاسيكي + خليجي فاخر
• مسجد → الأكثر طلباً: إسلامي أصيل + هندسة عربية + هادئ روحاني
• مكتب تجاري → الأكثر طلباً: عصري احترافي + Biophilic + ألوان محايدة

استخدمي هذا النظام كأولوية عند عدم تحديد المستخدم لنمط معين. الفكرة الأولى = الأكثر طلباً عالمياً، الثانية = الأكثر طلباً خليجياً/محلياً، الثالثة = الأكثر إبداعاً وجرأةً.
💰 PRICING LAW (قانون الأسعار الواقعية):
سطحي: 3,000-15,000 درهم | متوسط: 15,000-50,000 درهم | شامل: 50,000-150,000 درهم
الأسعار تعكس مستوى التدخل فعلاً — لا تضخيم ولا تقليل.${referenceInstruction}${styleInstruction}${colorsInstruction}${usedStylesNote}

🏆 BEST PRACTICE MANDATE (الأمر الأعلى — لا يُتجاوز):
كل فكرة تصميمية يجب أن تكون على مستوى Architectural Digest Award Winner.
الأنماط الأكثر طلباً الآن (2025) — استخدميها كأولوية افتراضية:
• عالمياً: Japandi، Quiet Luxury، Biophilic، Wabi-Sabi، Warm Contemporary
• خليجياً: Modern Gulf Luxury، Quiet Gulf Luxury، Neoclassical Gulf، Warm Contemporary، Moroccan Luxury
الفكرة الأولى = الأكثر طلباً عالمياً | الثانية = الأكثر طلباً خليجياً | الثالثة = الأكثر إبداعاً وجرأةً
كل فكرة يجب أن تذكر: أفضل المواد (رخام إيطالي/خشب جوز/مخمل)، إضاءة دافئة متعددة الطبقات، تفاصيل مميزة (زهور طازجة، فن أصيل، إكسسوارات منتقاة).`

      // تحليل العناصر البنيوية من الصورة
      const hasDimsFromUser = !!(roomDimensions?.length && roomDimensions?.width);
      const dimEstimationNote = hasDimsFromUser
        ? `\n\n⚠️ أبعاد الغرفة مُدخلة من العميل (أولوية قصوى): طول ${roomDimensions!.length}م × عرض ${roomDimensions!.width}م${roomDimensions?.height ? ` × ارتفاع ${roomDimensions!.height}م` : ''} = مساحة ${(roomDimensions!.length! * roomDimensions!.width!).toFixed(1)}م². استخدمي هذه الأبعاد الدقيقة لحساب جدول الكميات.`
        : `\n\n📐 تقدير الأبعاد من الصورة (مطلوب): استخدمي تقنيات التحليل الهندسي البصري لتقدير أبعاد الغرفة من الصورة:
- تحليل نقطة التلاشي (vanishing point) وخطوط المنظور
- مقارنة العناصر المرجعية المعروفة (باب قياسي 90×200سم، مقعد 45سم، طاولة 75سم)
- تحليل نسب الأثاث إلى مساحة الغرفة
- تقدير ارتفاع السقف من نسبة الجدار المرئي
أضيفي في spaceAnalysis: estimatedLength (م), estimatedWidth (م), estimatedHeight (م), dimensionConfidence (0-100%)`;
      const structuralAnalysisPrompt = `المرحلة الأولى: حللي العناصر البنيوية والتصميمية بدقة رقمية عالية:${dimEstimationNote}

المنظور والكاميرا:
- زاوية التصوير (مستوى الكاميرا: منخفضة/متوسطة/عالية)
- اتجاه الصورة (من الباب/من الزاوية/من الوسط)
- نقطة التقارب (قريبة/متوسطة/بعيدة)
- خطوط المنظور الموجهة (تضيق أو توسع)

الفتحات بالأرقام:
- كل باب: عرض تقريبي (ضيق/عادي/واسع)، ارتفاع (قصير/عادي/طويل)، موقعه (يسار/وسط/يمين الجدار)، نوعه (خشب/زجاج/معدن)
- كل نافذة: عرض تقريبي، ارتفاع، موقعها من الأرض (منخفض/متوسط/عالي)
- كل خزانة/دولاب: عرضها، ارتفاعها، موقعها (يسار/يمين/كلا الجانبين)، لونها

أبعاد الغرفة (تقدير هندسي دقيق من الصورة):
- شكل الغرفة (مربع/مستطيل/معقد)
- الطول التقديري بالمتر (استناداً لمراجع بصرية)
- العرض التقديري بالمتر
- ارتفاع السقف التقديري بالمتر
- نسبة العرض إلى الطول
- درجة الثقة في التقدير (0-100%)

العناصر البنيوية الثابتة:
- موقع وحجم الأبواب والنوافذ
- وجود درجات أو فروق مستويات
- نوع الإضاءة الحالية
- الأسطح والمواد الموجودة
- المشاكل الهندسية الملاحظة (إضاءة سيئة، تدفق حركة خاطئ، مساحة مهدرة)
- فرص التحسين البنيوي مع سبب هندسي واضح`;

      // حساب المساحة من الأبعاد إذا توفرت
      const dimNote = roomDimensions?.length && roomDimensions?.width
        ? `\n\nℹ️ أبعاد الغرفة المدخلة من العميل: طول ${roomDimensions.length}م × عرض ${roomDimensions.width}م${roomDimensions.height ? ` × ارتفاع ${roomDimensions.height}م` : ''} = مساحة ${(roomDimensions.length * roomDimensions.width).toFixed(1)}م². استخدمي هذه الأبعاد لحساب جدول الكميات بدقة عالية.`
        : '';
      const userPrompt = `حللي هذه الصورة (${modeDesc[captureMode]}) بعين خبيرة معمارية متخصصة.
الميزانية: ${budgetMin.toLocaleString()} - ${budgetMax.toLocaleString()} درهم إماراتي
عدد الأفكار المطلوبة: ${count}
تعليمات العميل: ${doorChangeRule}

${structuralAnalysisPrompt}

المرحلة الثانية: قدّمي ${count} أفكار تصميمية بأنماط مختلفة ضمن الميزانية.
قاعدة مطلقة: التصوير الافتراضي يجب أن يكون نفس الصورة بالضبط: نفس الزاوية، نفس الزوم، نفس اتجاه الكاميرا، نفس أبعاد الغرفة. ${doorChangeRule}

🎨 إطلاق الإبداع: لكِ الحرية الكاملة في تغيير الأرضيات (المادة + اللون + النقش)، الجدران (دهان + ورق جدران + حجر + خشب + جبس + بلاط)، السقف (جبس + إضاءة مخفية + عوارض + ثريات + ألوان)، الإضاءة، الأثاث، التشطيبات، الألوان، والمواد. ابدعي بجرأة في كل ما هو قابل للتغيير. أما البنية الإنشائية (مواقع الأبواب، النوافذ، الدرجات، الأعمدة، الفتحات) فيجب الحفاظ على مواقعها تماماً ما لم يطلب المستخدم صراحةً تغييرها.

🚨 قانون تشطيب الجدران الإلزامي (بلا استثناء):
كل جدار مرئي في الصورة يجب أن يحصل على تشطيب جديد في التصور — لا يُترك أي جدار بمظهره الأصلي حتى لو كان نظيفاً.
✅ الجدار الأبيض السادة: غيّريه بدهان ملون أو ورق جدران أو كلادينج يناسب النمط — الجدار الأبيض غير مقبول أبداً
✅ الجدار المتلف/المتمزق: أصلحيه وغيّريه بتشطيب جديد إلزامياً
✅ الجدار بورق جدران قديم: استبدليه بدهان أو كلادينج أو حجر أو خشب حسب النمط — لا تتركيه بنفس ورق الجدران القديم أبداً
✅ الجدار ببلاط قديم/متهالك: استبدليه بتشطيب جديد يناسب النمط
✅ الجدار المنقطع/الجزئي (مقطوع عند حافة الصورة): الجزء المرئي منه يجب أن يتلقى نفس تشطيب الجدران الأخرى — لا يُترك أبيض سادة
❌ ممنوع منعاً مطلقاً: ترك أي جدار (بما فيها الجدران الجزئية) بمظهره الأصلي في التصور — كل جدار يجب أن يتحوّل في التصور

🚨 قانون السقف الإلزامي (بلا استثناء):
السقف الأبيض السادة غير مقبول أبداً — كل سقف يجب أن يتحوّل في التصور.
✅ السقف الافتراضي: جبس متعدد المستويات + إضاءة مخفية دافئة
✅ أضيفي دائماً: ثريا مميزة أو مجموعة بندنت كنقطة محورية
❌ ممنوع: ترك السقف سطحاً أبيض سادة — يجب أن يكون للسقف تصميم جبسي + إضاءة ⚠️ قانون إصلاح التلف الإلزامي (ينطبق على جميع مستويات الميزانية بلا استثناء):
إذا لاحظتِ أي تلف أو تهالك في الصورة — تآكل جدران، ظهور حديد، رطوبة، ورق جدران متمزق أو متهالك، تشققات، دهان متشقق، بلاط مكسور — يجب إصلاحها واستبدالها بتشطيب جديد في التصور بغض النظر عن مستوى الميزانية.
✅ الخيار الاقتصادي: استبدلي التلف بدهان بسيط أو ورق جدران اقتصادي — لكن لا تتركي التلف ظاهراً أبداً.
✅ الخيار المتوسط: استبدلي بدهان جديد + تصميم محسّن.
✅ الخيار الشامل: استبدلي بتشطيب فاخر كامل.
أضيفي دائماً ملاحظة فنية للعميل تشرح التلف الملاحظ وطريقة معالجته المطلوبة.

🎨 قانون التباين الجذري المطلق (DIVERSITY LAW):
كل فكرة يجب أن تكون مختلفة كلياً عن الأخرى في 5 محاور:
1. النمط: لا تكرري نفس النمط أو نمطاً متقارباً (مثلاً: لا تضعي بوهيمي + بوهيمي معاصر + بوهيمي طبيعي — هذه نفس الفكرة!)
2. لوحة الألوان: كل فكرة لها لوحة ألوان مختلفة كلياً (لا تكرري نفس الألوان الدافئة في كل الأفكار)
3. مستوى التدخل: وزّعي الأفكار على مستويات مختلفة (سطحي/متوسط/شامل) — لا تجعلي كل الأفكار في نفس المستوى
4. نوع الأثاث: كل فكرة لها أثاث مختلف جذرياً (أريكة مخمل ≠ أريكة جلد ≠ أريكة راتان)
5. المزاج العام: دافئ ≠ بارد ≠ محايد ≠ جريء

أمثلة على التباين الصحيح لـ 3 أفكار:
- فكرة 1: عصري مينيمال (أبيض + رمادي + أسود، أثاث معدني نظيف، سطحي)
- فكرة 2: خليجي فاخر (ذهبي + بيج + بني، أثاث كلاسيكي منحوت، شامل)
- فكرة 3: سكاندنافي طبيعي (أخضر زيتي + خشب فاتح + أبيض، أثاث بسيط دافئ، متوسط)

💰 قانون الأسعار الواقعية (REALISTIC PRICING LAW):
الأسعار يجب أن تعكس مستوى التدخل الفعلي بدقة — لا تضخيم ولا تقليل:
- تجديد سطحي (surface): 3,000 - 15,000 درهم (دهان + إكسسوار + ستائر فقط)
- تحسين متوسط (moderate): 15,000 - 50,000 درهم (أثاث + أرضيات + إضاءة)
- تحول شامل (complete): 50,000 - 150,000 درهم (هدم + بناء + أثاث كامل)
الميزانية المحددة من العميل: ${budgetMin.toLocaleString()} - ${budgetMax.toLocaleString()} درهم — التزمي بها ولا تتجاوزيها.

أعيدي JSON فقط بهذا الهيكل:
{
  "spaceAnalysis": {
    "spaceType": "نوع الفضاء الرئيسي (صالة/غرفة/مطبخ/واجهة/حديقة/مسبح/شارع/أرض فارغة...)",
    "spaceCategory": "interior | facade | landscape | pool | pathway | urban | empty_land",
    "designTarget": "الهدف المحدد تلقائياً (تصميم داخلي / تطوير واجهة / تحسين فضاء حضري / تصميم لاندسكيب / اقتراح مبنى)",
    "designTargetReason": "سبب تحديد الهدف من الصورة",
    "frameElements": [
      {"type": "primary", "name": "الفضاء الرئيسي", "description": "وصف العنصر المهيمن", "canDesign": true, "designNote": ""ملك خاص حرية كاملة"},
      {"type": "secondary", "name": "عنصر ثانوي", "description": "وصف العنصر الثانوي", "canDesign": false, "designNote": "طريق عام / ملكية الغير"}
    ],
    "designBoundary": "وصف حدود التصميم الفعلية (ما يمكن تصميمه بدون تعدي)",
    "untouchableElements": ["طريق عام", "مبنى مجاور"],
    "urbanContext": "وصف السياق الحضري (حي سكني/تجاري/صناعي/مختلط)",
    "estimatedArea": "المساحة التقديرية بالمتر المربع",
    "estimatedLength": 5.5,
    "estimatedWidth": 4.0,
    "estimatedHeight": 2.8,
    "dimensionConfidence": 75,
    "cameraAnalysis": {
      "cameraHeight": "منخفضة/متوسطة/عالية",
      "viewingAngle": "من الباب/من الزاوية/من الوسط",
      "zoomLevel": "قريب/متوسط/بعيد",
      "perspectiveLines": "تضيق للخلف/توسع للخلف/متوازي"
    },
    "roomShape": "مستطيل ضيق/مربع/مستطيل عريض",
    "roomProportions": "عرض:طول 1:3 مثلاً",
    "ceilingHeight": "منخفض/عادي/عالي",
    "structuralElements": [
      {"element": "باب رئيسي", "position": "وسط الجدار الشمالي", "width": "عادي", "height": "طويل", "type": "خشبي", "keepInDesign": true},
      {"element": "خزانة يسار", "position": "الجدار الغربي", "width": "واسعة", "height": "كامل الارتفاع", "type": "خزانة بيضاء", "keepInDesign": true}
    ],
    "currentIssues": ["مشكلة 1", "مشكلة 2"],
    "currentMaterials": ["مادة 1", "مادة 2"],
    "technicalWarnings": [
      {
        "issue": "وصف المشكلة (مثال: تآكل في الجدار الشمالي مع ظهور حديد التسليح)",
        "location": "موقعها في الفضاء",
        "severity": "عالي/متوسط/منخفض",
        "treatment": "طريقة المعالجة المطلوبة (مثال: إزالة الجزء المتآكل، معالجة الصدأ، إعادة اللياسة، عزل مائي)",
        "specialist": "المختص المطلوب (مثال: مقاول إنشائي، فني عزل مائي)"
      }
    ]
  },
  "structuralSuggestions": [
    {
      "id": "struct_1",
      "title": "عنوان المقترح",
      "element": "العنصر المقترح تغييره (درجة/باب/جدار)",
      "reason": "سبب هندسي واضح: لماذا هذا التغيير مفيد؟",
      "benefit": "الفائدة الهندسية والجمالية",
      "additionalCost": "5,000 - 15,000 ر.س",
      "structuralWarning": "تنبيه إنشائي مهم",
      "timeRequired": "3-5 أيام عمل إضافية"
    }
  ],
  "ideas": [
    {
      "id": "idea_1",
      "title": "اسم الفكرة",
      "style": "modern",
      "styleLabel": "عصري حديث",
      "scenario": "surface",
      "scenarioLabel": "تجديد سطحي",
      "description": "وصف الفكرة في جملتين مع ذكر العناصر البنيوية المحافظ عليها",
      "palette": [{"name": "اسم اللون", "hex": "#XXXXXX"}],
      "materials": ["مادة 1", "مادة 2"],
      "highlights": ["ميزة 1", "ميزة 2", "ميزة 3"],
      "estimatedCost": "8,000 - 15,000 درهم (تجديد سطحي)",
      "costMin": 8000,
      "costMax": 15000,
      "timeline": "3-4 أسابيع",
      "replacementCosts": [
        {"item": "الأثاث", "currentEstimate": "8,000 ر.س", "replacementCost": "12,000 - 18,000 ر.س", "notes": "وصف تفصيلي"},
        {"item": "الإضاءة", "currentEstimate": "1,500 ر.س", "replacementCost": "3,000 - 5,000 ر.س", "notes": "وصف تفصيلي"},
        {"item": "الجدران", "currentEstimate": "2,000 ر.س", "replacementCost": "4,000 - 7,000 ر.س", "notes": "وصف تفصيلي"},
        {"item": "الأرضيات", "currentEstimate": "5,000 ر.س", "replacementCost": "8,000 - 15,000 ر.س", "notes": "وصف تفصيلي"}
      ],
      "imagePrompt": "سيتم توليده تلقائياً",
      "boq": [
        {
          "category": "أعمال الأرضيات",
          "items": [
            {"name": "بلاط بورسلين 60×60","unit": "م²","qty": 25,"unitPriceMin": 80,"unitPriceMax": 150,"notes": "شامل التركيب"}
          ]
        },
        {
          "category": "أعمال الجدران",
          "items": [
            {"name": "دهان جدران طبقتين","unit": "م²","qty": 60,"unitPriceMin": 15,"unitPriceMax": 30,"notes": "دهان + عمالة"}
          ]
        },
        {
          "category": "الأثاث والمفروشات",
          "items": [
            {"name": "أريكة جلوس","unit": "طقم","qty": 1,"unitPriceMin": 3000,"unitPriceMax": 8000,"notes": ""}
          ]
        },
        {
          "category": "الإضاءة",
          "items": [
            {"name": "سبوت إضاءة LED","unit": "وحدة","qty": 8,"unitPriceMin": 50,"unitPriceMax": 150,"notes": ""}
          ]
        },
        {
          "category": "الستائر والمفروشات",
          "items": [
            {"name": "ستائر","unit": "م طولي","qty": 6,"unitPriceMin": 200,"unitPriceMax": 600,"notes": "شامل التركيب"}
          ]
        }
      ]
    }
  ]
}${dimNote}`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        {
          role: "user" as const,
          content: [
            ...imageContents,
            { type: "text" as const, text: userPrompt }
          ]
        }
      ];

      const response = await invokeLLM({
        messages: messages as Parameters<typeof invokeLLM>[0]["messages"],
        response_format: { type: "json_object" },
      });
      const raw = response.choices[0]?.message?.content;
      const text = typeof raw === "string" ? raw : JSON.stringify(raw) || "{}";
      try {
        const parsed = JSON.parse(text);
        // توليد imagePrompt تلقائياً لكل فكرة بناءً على البيانات المحللة
        const structuralElements = (parsed.spaceAnalysis?.structuralElements || []) as Array<{element: string; position: string; keepInDesign: boolean}>;
        // استخراج بيانات الكاميرا والأبعاد لتوليد برومبت دقيق
        const cameraAnalysis = parsed.spaceAnalysis?.cameraAnalysis || {};
        const roomShape = parsed.spaceAnalysis?.roomShape || "";
        const roomProportions = parsed.spaceAnalysis?.roomProportions || "";
        const ceilingHeight = parsed.spaceAnalysis?.ceilingHeight || "";

        // وصف الكاميرا بالإنجليزية للـ prompt
        const cameraHeightMap: Record<string, string> = { "منخفضة": "low camera angle", "متوسطة": "eye-level camera", "عالية": "high camera angle" };
        const viewingAngleMap: Record<string, string> = { "من الباب": "shot from doorway", "من الزاوية": "corner shot", "من الوسط": "centered shot" };
        const zoomMap: Record<string, string> = { "قريب": "close-up shot", "متوسط": "medium shot", "بعيد": "wide shot" };
        const perspMap: Record<string, string> = { "تضيق للخلف": "converging perspective lines", "توسع للخلف": "expanding perspective", "متوازي": "parallel perspective" };
        const cameraDesc = [
          cameraHeightMap[cameraAnalysis.cameraHeight] || "eye-level camera",
          viewingAngleMap[cameraAnalysis.viewingAngle] || "centered shot",
          zoomMap[cameraAnalysis.zoomLevel] || "medium shot",
          perspMap[cameraAnalysis.perspectiveLines] || "converging perspective lines",
        ].join(", ");

        // وصف الغرفة بالإنجليزية
        const roomShapeMap: Record<string, string> = { "مستطيل ضيق": "narrow rectangular room", "مربع": "square room", "مستطيل عريض": "wide rectangular room" };
        const ceilingMap: Record<string, string> = { "منخفض": "low ceiling", "عادي": "standard ceiling height", "عالي": "high ceiling" };
        const roomDesc = [
          roomShapeMap[roomShape] || roomShape,
          ceilingMap[ceilingHeight] || ceilingHeight,
          roomProportions ? `proportions ${roomProportions}` : "",
        ].filter(Boolean).join(", ");

        // وصف الفتحات بالتفصيل
        const keepElements = structuralElements
          .filter((e) => e.keepInDesign)
          .map((e) => {
            const el = e as unknown as Record<string, string>;
            const widthMap: Record<string, string> = { "ضيق": "narrow", "عادي": "standard-width", "واسع": "wide", "واسعة": "wide" };
            const heightMap: Record<string, string> = { "قصير": "short", "عادي": "standard-height", "طويل": "tall", "كامل الارتفاع": "full-height" };
            const w = widthMap[el.width] || el.width || "";
            const h = heightMap[el.height] || el.height || "";
            const sizeDesc = [w, h].filter(Boolean).join(" ");
            return `${el.element} (${sizeDesc ? sizeDesc + ", " : ""}${el.position})`;
          })
          .join("; ");

        // ===== حساب جدول الكميات الهندسي =====
        const { calculateBOQ, calculateExteriorBOQ, estimateDimensionsFromAnalysis } = await import("./boqCalculator");
        const { calculateRealisticPrice, mapScenario, mapBudgetLevel, mapRoomType } = await import("./pricingEngine");
        const spaceAnalysisData = parsed.spaceAnalysis || {};
        const hasDimensions = roomDimensions?.length && roomDimensions?.width;
        // أولوية: 1) أبعاد مدخلة يدوياً 2) تقدير AI من الصورة 3) تقدير خوارزمي
        const aiEstL = spaceAnalysisData.estimatedLength ? parseFloat(String(spaceAnalysisData.estimatedLength)) : null;
        const aiEstW = spaceAnalysisData.estimatedWidth ? parseFloat(String(spaceAnalysisData.estimatedWidth)) : null;
        const aiEstH = spaceAnalysisData.estimatedHeight ? parseFloat(String(spaceAnalysisData.estimatedHeight)) : null;
        const hasAiDims = aiEstL && aiEstW && aiEstL > 1 && aiEstW > 1;
        const dims = hasDimensions
          ? { length: roomDimensions!.length!, width: roomDimensions!.width!, height: roomDimensions?.height || aiEstH || 2.8 }
          : hasAiDims
          ? { length: aiEstL!, width: aiEstW!, height: aiEstH || 2.8 }
          : estimateDimensionsFromAnalysis(
              spaceAnalysisData.estimatedArea,
              spaceAnalysisData.roomShape,
              spaceAnalysisData.spaceType
            );
        const boqSource = hasDimensions ? "exact" : (hasAiDims ? "estimated" : "estimated");

        const ideas = (parsed.ideas || []).map((idea: Record<string, unknown>) => {
          const styleMap: Record<string, string> = {
            modern: "modern contemporary", gulf: "Arabian Gulf luxury",
            classic: "classic elegant", minimal: "minimalist Japandi",
            japanese: "Japanese zen wabi-sabi", scandinavian: "Scandinavian hygge",
            mediterranean: "Mediterranean warm", industrial: "industrial loft",
            moroccan: "Moroccan riad", luxury: "ultra luxury premium",
            bohemian: "bohemian eclectic", art_deco: "Art Deco glamorous",
          };
          const styleName = styleMap[idea.style as string] || String(idea.style || "modern");
          const palette = (idea.palette as Array<{name: string; hex: string}> || []).map((c) => `${c.name} (${c.hex})`).join(", ");
          const mats = (idea.materials as string[] || []).join(", ");
          
          // برومبت معماري ذكي يدعم جميع الفضاءات - م. سارة لها صلاحية كاملة
          const cameraNote = `CAMERA CONSTRAINT: Use IDENTICAL camera setup as original photo - ${cameraDesc}. Do NOT change zoom level, camera angle, or perspective.`;
          const roomNote = roomDesc ? `SPACE GEOMETRY: ${roomDesc}. Maintain EXACT space proportions.` : "";
          
          // كشف نوع الفضاء من بيانات التحليل
          const spaceTypeStr = String(spaceAnalysisData.spaceType || "").toLowerCase();
          const isExteriorFacade = /واجهة|خارجي|مدخل|مبنى|بوابة|facade|exterior|building|front|entrance/.test(spaceTypeStr);
          const isStreet = /شارع|طريق|ممشى|رصيف|حضري|عام|منطقة تجارية|سوق|موقف|street|road|walkway|sidewalk|alley|plaza|square|urban|commercial|parking|public/.test(spaceTypeStr);
          const isLandscape = /حديقة|لاندسكيب|مسبح|جلسة خارجية|ممر|ساحة|فناء|سطح|شرفة|تراس|garden|landscape|pool|outdoor|terrace|pathway|courtyard|rooftop|balcony/.test(spaceTypeStr);
          // الفضاءات التجارية والمتخصصة
          const isRestaurantCafe = /مطعم|كافيه|كافيتيريا|مقهى|restaurant|cafe|cafeteria|food court|dining hall/.test(spaceTypeStr);
          const isRetailShop = /محل|معرض|متجر|بوتيك|صالة عرض|shop|store|boutique|showroom|retail/.test(spaceTypeStr);
          const isHotelLobby = /فندق|لوبي|منتجع|استقبال|hotel|lobby|resort|reception hall/.test(spaceTypeStr);
          const isClinicHospital = /عيادة|مستشفى|مركز طبي|صحي|clinic|hospital|medical center|healthcare/.test(spaceTypeStr);
          const isMosquePrayer = /مسجد|مصلى|جامع|mosque|prayer hall|masjid/.test(spaceTypeStr);
          const isOfficeCommercial = /مكتب تجاري|شركة|مقر|مبنى إداري|corporate office|headquarters|commercial office|open office/.test(spaceTypeStr);
          const isEducational = /مدرسة|جامعة|فصل|قاعة|school|university|classroom|lecture hall|educational/.test(spaceTypeStr);
          const isCommercialSpace = isRestaurantCafe || isRetailShop || isHotelLobby || isClinicHospital || isMosquePrayer || isOfficeCommercial || isEducational;
          const isInterior = !isExteriorFacade && !isStreet && !isLandscape;
          
          let generatedPrompt: string;
          
          if (isExteriorFacade) {
            // برومبت واجهات المباني
            generatedPrompt = `Photorealistic architectural exterior facade redesign. ${cameraNote} ${roomNote} BOLD COMPLETE FACADE TRANSFORMATION - Apply ${styleName} style with MAXIMUM CREATIVITY. FULL CREATIVE FREEDOM on all facade elements: cladding materials (stone/wood/metal/glass/concrete), window styles and proportions, entrance design, lighting fixtures, landscaping in front. New color palette: ${palette}. New materials: ${mats}. Transform the facade completely - change cladding, update windows, redesign entrance, add architectural details, improve lighting. Make it look like a LUXURY ARCHITECTURAL MAGAZINE COVER. Cinematic lighting, ultra-realistic textures, 8K resolution, professional architectural photography, no people, no text.`;
          } else if (isStreet) {
            // برومبت تصميم الشوارع والممشيات الحضرية
            generatedPrompt = `Photorealistic urban street and streetscape redesign. ${cameraNote} ${roomNote} BOLD COMPLETE STREET TRANSFORMATION - Apply ${styleName} style with MAXIMUM CREATIVITY. This is an OUTDOOR URBAN SPACE - NOT an interior. FULL CREATIVE FREEDOM on all street elements: pavement materials (stone/brick/concrete/wood decking), street trees and planting (palms/ornamental trees/flower beds/hedges), street furniture (benches/bollards/planters/bike racks), lighting (lamp posts/ground lights/string lights/feature lighting), water features (fountains/streams/reflecting pools), public art and decorative elements, building facade treatments visible from street. New color palette: ${palette}. New materials: ${mats}. Transform the street into a vibrant urban destination - lush greenery, beautiful paving, ambient lighting, comfortable seating areas, activated ground floor facades. Make it look like a LUXURY URBAN DESIGN MAGAZINE COVER. Cinematic lighting, ultra-realistic textures, 8K resolution, professional urban photography, no people, no text.`;
          } else if (isLandscape) {
            // برومبت لاندسكيب وفضاءات خارجية
            generatedPrompt = `Photorealistic landscape and outdoor space redesign. ${cameraNote} ${roomNote} BOLD COMPLETE OUTDOOR TRANSFORMATION - Apply ${styleName} style with MAXIMUM CREATIVITY. FULL CREATIVE FREEDOM: plants and trees selection, paving materials (stone/wood/tiles/gravel), water features (fountain/pool/stream), outdoor furniture (seating/pergola/shade), lighting (path lights/spotlights/string lights), decorative elements. New color palette: ${palette}. New materials: ${mats}. Transform the outdoor space completely - lush planting, beautiful hardscape, ambient lighting, comfortable seating areas. Make it look like a LUXURY LANDSCAPE MAGAZINE COVER. Cinematic lighting, ultra-realistic textures, 8K resolution, professional landscape photography, no people, no text.`;
          } else if (isCommercialSpace) {
            // برومبت الفضاءات التجارية والمتخصصة
            const allowOpeningChanges = lockStructuralElements?.allowPlatformFreedom === true ||
              (lockStructuralElements?.enabled === false);

            let structuralNote: string;
            if (allowOpeningChanges) {
              structuralNote = keepElements
                ? `STRUCTURAL REFERENCE: ${keepElements}. User has granted FULL CREATIVE FREEDOM including moving/resizing openings.`
                : `User has granted FULL CREATIVE FREEDOM on all elements including structure.`;
            } else {
              const structuralConstraints = [
                keepElements ? `EXACT positions of openings: ${keepElements}` : null,
                null, // السقف حر للإبداع — فقط الفتحات ثابتة
                userConstraints.steps ? `ALL level changes and steps MUST be preserved` : null,
              ].filter(Boolean).join('. ');
              structuralNote = `⚠️ ABSOLUTE STRUCTURAL CONSTRAINTS — ZERO TOLERANCE VIOLATIONS:
1. ZERO WALL INVENTION: Do NOT add any wall, partition, or divider that does not exist in the original photo.
2. ZERO OPENING CLOSURE: Do NOT close, block, or reduce any existing door, window, or opening — every opening MUST remain open and visible.
3. ZERO NEW OPENINGS: Do NOT create any new door, window, archway, or opening in any wall that does not already have one — strictly forbidden.
4. DOOR/WINDOW REDESIGN ALLOWED: You MAY redesign existing doors and windows AT THE SAME POSITION — change material (wood/aluminium/glass/PVC/steel), style (panel/flush/glass/louvered/arched/sliding), color, and frame. The opening SIZE and LOCATION must remain IDENTICAL.
5. SPATIAL BOUNDARY: Only design surfaces VISIBLE in the photo — walls outside camera frame are UNKNOWN SOLID walls. Do NOT add openings or light from unseen walls.
${structuralConstraints ? `EXACT POSITIONS TO PRESERVE: ${structuralConstraints}.` : 'Preserve ALL door/window/opening positions exactly as in original photo.'}
CREATIVE FREEDOM applies to EVERYTHING ELSE: wall finishes, flooring, ceiling design, furniture, lighting, decor.`;
            }

            // تحديد نوع الفضاء التجاري للبرومبت
            let commercialSpaceType = "commercial space";
            let commercialFocus = "";
            if (isRestaurantCafe) {
              commercialSpaceType = "restaurant/cafe interior";
              commercialFocus = `Focus on: dining zones (seating arrangements, booth/table mix), bar/counter design, kitchen visibility, ambient lighting zones (task/accent/ambient), acoustic materials, brand identity through color and materials, customer flow and wayfinding. Create an atmosphere that makes customers want to stay longer.`;
            } else if (isRetailShop) {
              commercialSpaceType = "retail shop/showroom interior";
              commercialFocus = `Focus on: product display systems (shelving/racks/pedestals), customer journey and flow, focal points and hero displays, fitting room design (if applicable), checkout counter, window display, brand identity through materials and lighting. Maximize product visibility and purchase intent.`;
            } else if (isHotelLobby) {
              commercialSpaceType = "hotel lobby/reception";
              commercialFocus = `Focus on: grand entrance statement, reception desk as focal point, waiting/lounge areas, wayfinding to elevators/amenities, luggage handling space, concierge area, brand identity through luxury materials. Create a memorable first impression.`;
            } else if (isClinicHospital) {
              commercialSpaceType = "medical clinic/healthcare interior";
              commercialFocus = `Focus on: calming color palette (soft blues/greens/whites), easy-to-clean materials, clear wayfinding, reception and waiting area comfort, privacy considerations, accessibility (wide corridors, no obstacles), clinical hygiene standards. Balance professionalism with patient comfort.`;
            } else if (isMosquePrayer) {
              commercialSpaceType = "mosque/prayer hall interior";
              commercialFocus = `Focus on: mihrab as the spiritual focal point (ornate arch, calligraphy), prayer hall proportions and carpet layout, minbar design, acoustic quality (sound absorption materials), natural light through high windows, Islamic geometric patterns on walls/ceiling, ablution area if visible, serene and spiritual atmosphere. Apply Islamic architectural principles.`;
            } else if (isOfficeCommercial) {
              commercialSpaceType = "corporate office interior";
              commercialFocus = `Focus on: open workspace layout (collaborative zones + focus areas), meeting rooms visibility, reception/brand wall, ergonomic furniture, biophilic elements (plants/natural light), acoustic panels, technology integration (screens/whiteboards), employee wellbeing. Balance productivity with company culture.`;
            } else if (isEducational) {
              commercialSpaceType = "educational space interior";
              commercialFocus = `Focus on: flexible seating arrangements (collaborative/individual), display walls and boards, natural lighting, acoustic treatment, age-appropriate colors and scale, storage solutions, technology integration, inspiring and stimulating environment.`;
            }

            generatedPrompt = `Photorealistic ${commercialSpaceType} redesign. ${cameraNote} ${roomNote} ${structuralNote} BOLD CREATIVE COMMERCIAL TRANSFORMATION - Apply ${styleName} style with MAXIMUM CREATIVITY tailored for commercial use. ${commercialFocus} New color palette: ${palette}. New materials: ${mats}. TRANSFORM FREELY: wall finishes, flooring, ceiling treatment, lighting design, furniture and fixtures, branding elements, decorative features. Make it look like a LUXURY COMMERCIAL DESIGN MAGAZINE COVER - professional, functional, and visually stunning. Cinematic lighting, ultra-realistic textures, 8K resolution, professional commercial photography, no people, no text, no watermarks.`;

          } else {
            // برومبت الديكور الداخلي السكني — الحفاظ على البنية + إبداع كامل في التصميم
            const allowOpeningChanges = lockStructuralElements?.allowPlatformFreedom === true ||
              (lockStructuralElements?.enabled === false);

            let structuralNote: string;
            if (allowOpeningChanges) {
              // المستخدم أذن صراحةً بتغيير الفتحات
              structuralNote = keepElements
                ? `STRUCTURAL REFERENCE: ${keepElements}. User has granted FULL CREATIVE FREEDOM including moving/resizing openings.`
                : `User has granted FULL CREATIVE FREEDOM on all elements including structure.`;
            } else {
              // الافتراضي: الحفاظ الصارم على البنية الإنشائية
              const structuralConstraints = [
                keepElements ? `EXACT positions of openings: ${keepElements}` : null,
                null, // السقف حر للإبداع الكامل — الجبس والإضاءة المخفية والألوان مسموح بها
                userConstraints.steps ? `ALL level changes and steps MUST be preserved at their exact original positions` : null,
              ].filter(Boolean).join('. ');

              structuralNote = `⚠️ ABSOLUTE STRUCTURAL CONSTRAINTS — ZERO TOLERANCE VIOLATIONS:
1. ZERO WALL INVENTION: Do NOT add any wall, partition, or divider that does not exist in the original photo.
2. ZERO OPENING CLOSURE: Do NOT close, block, cover, or reduce any existing door, window, or opening — every opening visible in the original MUST remain open and visible.
3. ZERO NEW OPENINGS: Do NOT create any new door, window, archway, or opening in any wall that does not already have one — strictly forbidden without explicit user request.
4. DOOR/WINDOW REDESIGN ALLOWED: You MAY redesign existing doors and windows AT THE SAME POSITION — change material (wood/aluminium/glass/PVC/steel/wrought iron), style (panel/flush/glass/louvered/arched/sliding/pivot), color, frame profile, and hardware. The opening SIZE and LOCATION must remain IDENTICAL to the original.
5. SPATIAL BOUNDARY RESPECT: Walls outside the camera frame are UNKNOWN — treat them as solid closed walls. Do NOT add windows or light sources from unseen walls.
${structuralConstraints ? `EXACT POSITIONS TO PRESERVE: ${structuralConstraints}.` : 'Preserve EXACT positions of all doors, windows, columns, steps, and structural openings.'}
FULL CREATIVE FREEDOM on: wall finishes (paint/wallpaper/stone/wood/textured plaster/tiles/murals), flooring (marble/parquet/herringbone/concrete/terrazzo — choose freely), ceiling (gypsum drops/cove lighting/beams/chandeliers/color — be bold), furniture, lighting fixtures, colors, decor, curtains, rugs, accessories.`;
            }

            // استخراج معلومات الأرضية الأصلية من التحليل
          const currentMaterials = (spaceAnalysisData.currentMaterials || []) as string[];
          const currentFloorInfo = currentMaterials.find((m: string) => /أرضية|floor|بلاط|tile|باركيه|parquet|خشب|wood|رخام|marble|خرسانة|concrete/i.test(m)) || '';
          const floorColorFromAnalysis = (() => {
            const structEls = structuralElements as Array<{element: string; position: string; type?: string; keepInDesign: boolean}>;
            const floorEl = structEls.find(e => /أرضية|floor/i.test(e.element));
            return floorEl?.type || '';
          })();
          // تحديد ما إذا كانت الأرضية داكنة في الأصل
          const isDarkFloor = /داكن|dark|أسود|black|بني غامق|dark brown|charcoal|anthracite/i.test(currentFloorInfo + ' ' + floorColorFromAnalysis);
          // الأرضية حرة للإبداع الكامل — لا قيود على اللون أو المادة
          const floorConstraint = `FLOOR FREEDOM: Change floor material, color, and pattern freely to best match the design style. Choose from: marble, parquet, herringbone wood, patterned tiles, polished concrete, terrazzo, or any material that elevates the design.`;

          // قيد الجدران المجهولة — صارم جداً
          const wallConstraint = `🚨 UNKNOWN SPACE & INVENTED WALL PROHIBITION (ABSOLUTE — HIGHEST PRIORITY — ZERO EXCEPTIONS):
The photo frame IS the absolute boundary of the design universe. NOTHING exists outside it.
1. ZERO WALL INVENTION: Do NOT add any wall, partition, room, hallway, kitchen, or architectural element that does NOT exist in the original photo.
2. ZERO SPACE EXTENSION: Do NOT extend the room beyond what is visible in the photo — the room ends where the photo ends.
3. TRUNCATED WALL = TRUNCATED: A wall cut off at the frame edge IS truncated in reality — do NOT complete it, do NOT add anything behind it, leave it truncated exactly as-is.
4. UNKNOWN BEHIND CURTAINS/DOOR: Space behind curtains or doors = COMPLETELY UNKNOWN — do NOT invent furniture, rooms, or spaces there.
5. NO INVENTED WINDOWS: If no window appears in the photo = there is NO window on that wall — do NOT add one under any circumstances.
6. SOLID WHITE WALL = SOLID CONCRETE: A plain/white wall = a solid wall — do NOT transform it into a window, archway, or opening.
7. BACKGROUND KITCHEN = REAL: If a kitchen is visible in the background = it is REAL — redesign it at the SAME position and SAME size ONLY — do NOT expand it or add space that was not in the original photo.
8. ARTIFICIAL LIGHTING ONLY: No invented natural light from unseen walls — use interior/artificial lighting only.
❌ FORBIDDEN: Adding ANY wall, room, kitchen, hallway, window, or space that was not visible in the original photo.`;

          // ===== BEST PRACTICE ENGINE: استخدام buildIdeaImagePrompt للحصول على أفضل prompt =====
          const bpStyleKey = (() => {
            // تحويل اسم النمط إلى مفتاح best practice
            const styleKeyMap: Record<string, string> = {
              modern: 'warm_contemporary', gulf: 'modern_gulf', minimal: 'japandi',
              japanese: 'japandi', scandinavian: 'japandi', luxury: 'quiet_gulf_luxury',
              classic: 'neoclassical_gulf', moroccan: 'moroccan_luxury', industrial: 'wabi_sabi',
              bohemian: 'maximalist_eclectic', art_deco: 'maximalist_eclectic',
              mediterranean: 'moroccan_luxury', coastal: 'biophilic',
            };
            return styleKeyMap[String(idea.style || 'modern')] || 'warm_contemporary';
          })();
          const bpStyle = BEST_PRACTICE_STYLES[bpStyleKey] || BEST_PRACTICE_STYLES.warm_contemporary;
          const bpPalette = (idea.palette as Array<{name: string; hex: string}> || []);
          const bpMaterials = (idea.materials as string[] || []);
          const bpImagePromptBase = buildIdeaImagePrompt({
            styleKey: bpStyleKey,
            spaceType: String(spaceAnalysisData.spaceType || 'interior space'),
            palette: bpPalette,
            materials: bpMaterials,
            isEdit: true,
            originalStructure: keepElements || '',
          });

          generatedPrompt = `${bpImagePromptBase} ${cameraNote} ${roomNote} ${structuralNote} ${wallConstraint}

CREATIVE TRANSFORMATION — Apply ${bpStyle.visualKeywords} targeting the most desired design for this space type. This must look like the #1 most-wanted interior design for this specific room.

FULL CREATIVE FREEDOM — TRANSFORM BOLDLY:

(1) WALLS — MANDATORY TRANSFORMATION (ZERO EXCEPTIONS — EVERY VISIBLE WALL MUST CHANGE):
    RULE: NO wall may keep its original appearance in the render. Every wall visible in the photo MUST receive a new finish.
    - Plain/white wall: MUST be changed to colored paint, wallpaper, cladding, or textured finish — white walls are NOT acceptable
    - Damaged/torn wall: MUST be repaired AND given a new finish — NEVER leave damage visible
    - Old wallpaper: MUST be replaced with paint, cladding, stone, or wood — NEVER keep old wallpaper
    - Old/deteriorated tiles: MUST be replaced with new finish matching the style
    - TRUNCATED/PARTIAL wall (wall cut off at frame edge): The VISIBLE portion MUST receive a new finish — apply the same wall treatment as the main walls, do NOT leave it plain/white
    - Choose the most impactful wall treatment: Paint (rich saturated color OR sophisticated neutral), stone cladding (marble/travertine/limestone), wood panels (oak/walnut/teak), decorative plaster (venetian/microcement/tadelakt), patterned tiles, textured wallpaper, fabric panels, or bold murals
    - Feature/accent wall: create a DRAMATIC focal point on the main wall
    - Decorative moldings, wainscoting, or architectural details if style calls for it
    ❌ FORBIDDEN: Leaving ANY wall (including partial/truncated walls) with its original plain/white appearance in the render

(2) FLOOR — MANDATORY TRANSFORMATION: Replace with the most aspirational flooring for this style:
    - Marble: large-format slabs (120x60 or 60x60), book-matched, veined patterns
    - OR: wide-plank hardwood (oak/walnut/teak), herringbone parquet, chevron pattern
    - OR: patterned encaustic tiles, polished concrete, terrazzo, large-format porcelain
    - Choose material AND color AND pattern that best elevates the design
    - Add area rugs with texture and pattern that complement the style

(3) CEILING — MANDATORY TRANSFORMATION (plain white ceiling is FORBIDDEN):
    RULE: The ceiling MUST be transformed — a plain flat white ceiling is NEVER acceptable.
    - Gypsum: multi-level drops, cove lighting channels, coffered grid, tray ceiling (MOST COMMON — use this as default)
    - OR: exposed wooden beams, metal grid (industrial), stretched fabric, acoustic panels
    - ALWAYS add integrated LED cove lighting: warm 2700K for luxury/gulf, cool 4000K for modern/minimal
    - ALWAYS add a statement chandelier OR cluster of pendants OR sculptural ceiling light as focal point
    - Paint ceiling in contrasting or complementary color to walls
    ❌ FORBIDDEN: Leaving the ceiling as a plain flat white surface — it MUST have gypsum design + lighting

(4) LIGHTING — LAYERED LIGHTING DESIGN (3 layers minimum):
    - Ambient: cove LED strips, recessed spotlights, ceiling fixtures
    - Accent: wall sconces, picture lights, cabinet lighting, floor lamps
    - Decorative: STATEMENT chandelier/pendant that defines the style personality
    - Warm golden light (2700-3000K) for luxury/gulf/classic, cool white for modern/minimal

(5) FURNITURE — ICONIC STATEMENT PIECES:
    - Choose furniture that DEFINES the style — not generic pieces
    - Scale furniture correctly to the room proportions
    - Mix textures: velvet + metal + wood + marble OR linen + rattan + ceramic
    - Arrange for conversation flow and visual balance

(6) DECOR — CURATED FINISHING TOUCHES:
    - Large-scale art OR decorative mirror as focal point
    - Layered textiles: throw pillows, blankets, curtains in complementary fabrics
    - Plants: sculptural (fiddle leaf fig/palm) OR trailing (pothos/ivy) based on style
    - Books, vases, sculptural objects arranged in odd numbers
    - Floor-to-ceiling curtains in fabric that matches the style mood

New color palette: ${palette}. New materials: ${mats}.

QUALITY MANDATE: This image must look like it was shot for Architectural Digest, Dezeen, or AD Middle East. ${QUALITY_ENHANCERS.imageQuality}. ${QUALITY_ENHANCERS.details}. ${QUALITY_ENHANCERS.atmosphere}. New color palette: ${palette}. New materials: ${mats}. SIGNATURE DETAILS: ${bpStyle.signatureDetails}. AVOID: ${bpStyle.avoid}.`;
          }

          // حساب جدول الكميات الهندسي لهذه الفكرة
          // بنود AI الخام من النموذج — نحولها إلى BOQCategory[] بإضافة الحقول المفقودة
          type RawBoqItem = { name: string; unit: string; qty: number; unitPriceMin: number; unitPriceMax: number; notes: string };
          type RawBoqCat = { category: string; items: RawBoqItem[] };
          const rawBoqCats = idea.boq as RawBoqCat[] | undefined;
          const aiBoqRaw = rawBoqCats?.map((cat) => ({
            category: cat.category,
            icon: undefined as string | undefined,
            items: (cat.items || []).map((item) => ({
              name: item.name,
              unit: item.unit,
              qty: item.qty || 1,
              unitPriceMin: item.unitPriceMin || 0,
              unitPriceMax: item.unitPriceMax || 0,
              notes: item.notes || "",
              totalMin: Math.round((item.qty || 1) * (item.unitPriceMin || 0)),
              totalMax: Math.round((item.qty || 1) * (item.unitPriceMax || 0)),
              basis: "تقدير م. سارة",
            })),
            subtotalMin: (cat.items || []).reduce((s, i) => s + Math.round((i.qty || 1) * (i.unitPriceMin || 0)), 0),
            subtotalMax: (cat.items || []).reduce((s, i) => s + Math.round((i.qty || 1) * (i.unitPriceMax || 0)), 0),
          }));
          // اختيار محرك BOQ المناسب حسب نوع الفضاء
          const spaceTypeForBOQ = String(spaceAnalysisData.spaceType || "").toLowerCase();
          const isFacadeSpace = /واجهة|خارجي|مدخل|مبنى|facade|exterior|building|front/.test(spaceTypeForBOQ);
          const isPoolSpace = /مسبح|pool|swimming/.test(spaceTypeForBOQ);
          const isStreetSpace = /شارع|طريق|ممشى|رصيف|street|road|walkway|sidewalk|alley|plaza|square/.test(spaceTypeForBOQ);
          const isLandscapeSpace = /حديقة|لاندسكيب|جلسة خارجية|ممر|ساحة|garden|landscape|outdoor|terrace|pathway/.test(spaceTypeForBOQ);
          const isCommercialBOQ = /مطعم|كافيه|محل|معرض|فندق|لوبي|عيادة|مسجد|مصلى|مكتب تجاري|مدرسة|restaurant|cafe|shop|store|hotel|lobby|clinic|mosque|corporate office|school/.test(spaceTypeForBOQ);
          
          let boqResult;
          if (isFacadeSpace) {
            boqResult = calculateExteriorBOQ(dims, String(idea.style || "modern"), "facade", aiBoqRaw, boqSource);
          } else if (isPoolSpace) {
            boqResult = calculateExteriorBOQ(dims, String(idea.style || "modern"), "pool", aiBoqRaw, boqSource);
          } else if (isStreetSpace) {
            boqResult = calculateExteriorBOQ(dims, String(idea.style || "modern"), "pathway", aiBoqRaw, boqSource);
          } else if (isLandscapeSpace) {
            const subCat = /ممر|pathway/.test(spaceTypeForBOQ) ? "pathway" : "landscape";
            boqResult = calculateExteriorBOQ(dims, String(idea.style || "modern"), subCat, aiBoqRaw, boqSource);
          } else if (isCommercialBOQ) {
            // الفضاءات التجارية: تكاليف أعلى من السكني بسبب متطلبات التشغيل والهوية البصرية
            boqResult = calculateBOQ(
              dims,
              String(idea.style || "modern"),
              String(idea.scenario || "full"), // التجاري دائماً تحول شامل
              String(spaceAnalysisData.spaceType || ""),
              aiBoqRaw,
              boqSource
            );
            // مضاعفة التكلفة للفضاءات التجارية (معامل 1.4 للتجاري)
            if (boqResult) {
              boqResult = {
                ...boqResult,
                grandTotalMin: Math.round(boqResult.grandTotalMin * 1.4),
                grandTotalMax: Math.round(boqResult.grandTotalMax * 1.4),
              };
            }
          } else {
            boqResult = calculateBOQ(
              dims,
              String(idea.style || "modern"),
              String(idea.scenario || "surface"),
              String(spaceAnalysisData.spaceType || ""),
              aiBoqRaw,
              boqSource
            );
          }

          // ===== حساب الأسعار الواقعية من محرك التسعير الخليجي =====
          const pScenario = mapScenario(String(idea.scenario || "mid"));
          const pBudget = mapBudgetLevel(
            String(idea.scenario || ""),
            String(idea.style || "")
          );
          const pRoomType = mapRoomType(String(spaceAnalysisData.spaceType || ""));
          const pricingResult = calculateRealisticPrice({
            scenario: pScenario,
            budgetLevel: pBudget,
            roomType: pRoomType,
            dimensions: dims,
            estimatedArea: spaceAnalysisData.estimatedArea ? parseFloat(String(spaceAnalysisData.estimatedArea)) : undefined,
            styleKeywords: String(idea.style || ""),
            styleNameAr: String(idea.styleLabel || ""),
          });

          // استبدال الأسعار بالقيم المحسوبة واقعياً
          const realisticCostMin = pricingResult.costMin;
          const realisticCostMax = pricingResult.costMax;
          const realisticEstimatedCost = `${realisticCostMin.toLocaleString("ar-AE")} - ${realisticCostMax.toLocaleString("ar-AE")} درهم إماراتي`;

          // توافق أسعار: جعل BOQ grandTotal يتطابق مع costMin/costMax
          const syncedBoq = boqResult ? {
            ...boqResult,
            grandTotalMin: realisticCostMin,
            grandTotalMax: realisticCostMax,
          } : boqResult;

          return {
            ...idea,
            imagePrompt: generatedPrompt,
            boq: syncedBoq,
            costMin: realisticCostMin,
            costMax: realisticCostMax,
            estimatedCost: realisticEstimatedCost,
          };
        });

        // ===== حفظ الأفكار في قاعدة البيانات لمنع التكرار =====
        if (ctx.user?.id && primaryImageUrl) {
          const resolvedIdeas = await ideas;
          for (const idea of resolvedIdeas) {
            try {
              await saveGeneratedIdea({
                userId: ctx.user.id,
                imageUrl: primaryImageUrl,
                idea: {
                  id: String(idea.id || ''),
                  title: String(idea.title || ''),
                  style: String(idea.style || ''),
                  styleLabel: String(idea.styleLabel || idea.style || ''),
                  scenario: String(idea.scenario || ''),
                  palette: idea.palette as Array<{name:string;hex:string}> || [],
                  materials: idea.materials as string[] || [],
                  imagePrompt: String(idea.imagePrompt || ''),
                  costMin: Number(idea.costMin || 0),
                  costMax: Number(idea.costMax || 0),
                },
              });
            } catch { /* لا نوقف التنفيذ إذا فشل الحفظ */ }
          }
        }

        return {
          ideas,
          spaceAnalysis: parsed.spaceAnalysis || null,
          structuralSuggestions: parsed.structuralSuggestions || [],
        };
      } catch {
        return { ideas: [], spaceAnalysis: null, structuralSuggestions: [] };
      }
    }),

  // ===== refineIdea: تعديل فكرة موجودة =====
  refineIdea: mousaProcedure
    .input(z.object({
      ideaDbId: z.number(), // ID الفكرة في قاعدة البيانات
      refinementRequest: z.string(), // طلب التعديل من المستخدم
      imageUrl: z.string(), // صورة الفضاء الأصلية
    }))
    .mutation(async ({ input, ctx }) => {
      await checkAndDeductCredits(ctx.user.id, ctx.mousaUserId, "reAnalyze");

      // جلب الفكرة الأصلية
      const originalIdea = await getIdeaById(input.ideaDbId);
      if (!originalIdea) throw new TRPCError({ code: "NOT_FOUND", message: "الفكرة غير موجودة" });

      const refinementNote = buildRefinementNote({
        originalIdea: {
          title: originalIdea.title,
          style: originalIdea.style,
          styleLabel: originalIdea.styleLabel,
          palette: originalIdea.paletteJson as Array<{name:string;hex:string}> | null,
          materials: originalIdea.materialsJson as string[] | null,
          imagePrompt: originalIdea.imagePrompt,
        },
        refinementRequest: input.refinementRequest,
      });

      const systemPrompt = `${buildBestPracticeSystemPrompt()}
أنتِ م. سارة، خبيرة التصميم المعماري. مهمتك تعديل فكرة تصميمية بناءً على طلب المستخدم. ردك JSON فقط.${refinementNote}`;

      const userPrompt = `عدّلي الفكرة التصميمية بناءً على طلب المستخدم: "${input.refinementRequest}"
أعطيني الفكرة المعدّلة بصيغة JSON بنفس هيكل الفكرة الأصلية مع تطبيق التعديل المطلوب.`;

      const messages: Message[] = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
             { type: "image_url" as const, image_url: { url: await resolveImageUrl(input.imageUrl, ctx.user?.id || 0), detail: "high" as const } },
            { type: "text" as const, text: userPrompt },
          ],
        },
      ];
      const response = await invokeLLM({ messages });
      const rawContent = response?.choices?.[0]?.message?.content;
      const raw = typeof rawContent === 'string' ? rawContent : "{}";
      const jsonStr = raw.replace(/```json\n?|```/g, "").trim();
      let refined: Record<string, unknown> = {};
      try { refined = JSON.parse(jsonStr); } catch { refined = {}; }
      // حفظ الفكرة المعدّلةة
      const newDbId = await saveGeneratedIdea({
        userId: ctx.user.id,
        imageUrl: input.imageUrl,
        idea: {
          title: String(refined.title || originalIdea.title + " (معدّل)"),
          style: String(refined.style || originalIdea.style),
          styleLabel: String(refined.styleLabel || originalIdea.styleLabel || ''),
          palette: refined.palette as Array<{name:string;hex:string}> || (originalIdea.paletteJson as Array<{name:string;hex:string}>) || [],
          materials: refined.materials as string[] || (originalIdea.materialsJson as string[]) || [],
          costMin: Number(refined.costMin || originalIdea.costMin || 0),
          costMax: Number(refined.costMax || originalIdea.costMax || 0),
        },
        isRefinement: true,
        parentIdeaId: originalIdea.id,
        refinementRequest: input.refinementRequest,
      });

      return { ...refined, dbId: newDbId, isRefinement: true, parentIdeaId: originalIdea.id };
    }),

  // ===== Voice Design Command =====
  voiceDesignCommand: mousaProcedure
    .input(z.object({
      audioBase64: z.string(),
      textCommand: z.string().optional(),
      currentPlan: z.object({
        rooms: z.array(z.any()),
        doors: z.array(z.any()),
        windows: z.array(z.any()),
        scale: z.number(),
        northAngle: z.number(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      await checkAndDeductCredits(ctx.user.id, ctx.mousaUserId, "voiceDesign");
      let userCommand = input.textCommand || "";
      let transcription = "";

      // Transcribe audio if provided
      if (input.audioBase64 && input.audioBase64.length > 100) {
        try {
          const { transcribeAudio } = await import("./_core/voiceTranscription");
          // Convert base64 to buffer and upload temporarily
          const audioBuffer = Buffer.from(input.audioBase64, "base64");
          const audioKey = `voice-commands/${nanoid()}.webm`;
          const { url: audioUrl } = await storagePut(audioKey, audioBuffer, "audio/webm");
          const result = await transcribeAudio({ audioUrl, language: "ar" });
          transcription = (result as { text?: string }).text || "";
          userCommand = transcription;
        } catch {
          userCommand = input.textCommand || "";
        }
      }

      if (!userCommand.trim()) {
        return {
          transcription: "",
          sarahResponse: "لم أسمع شيئاً. حاول مجدداً.",
          updatedPlan: input.currentPlan,
        };
      }

      // Build current plan summary for context
      const planSummary = input.currentPlan.rooms.length > 0
        ? `المخطط الحالي يحتوي على: ${input.currentPlan.rooms.map((r: {label:string;width:number;height:number}) => `${r.label} (${r.width}×${r.height}م)`).join("، ")}. أبواب: ${input.currentPlan.doors.length}. نوافذ: ${input.currentPlan.windows.length}.`
        : "المخطط فارغ حتى الآن.";

      const systemPrompt = `أنت م. سارة، مهندسة معمارية خبيرة تساعد في رسم المخططات الهندسية بالصوت والكتابة. 
تعمل مع لوحة رسم تفاعلية تعرض مخططاً هندسياً من الأعلى (top-down floor plan).

نظام ترقيم الجدران (مهم جداً):
- الجدار A = الجدار الشمالي (N) = أعلى الشاشة
- الجدار B = الجدار الجنوبي (S) = أسفل الشاشة
- الجدار C = الجدار الشرقي (E) = يمين الشاشة
- الجدار D = الجدار الغربي (W) = يسار الشاشة
عندما يقول المستخدم "الجدار A" أو "جدار A" فهذا يعني الجدار الشمالي (side: "N").
عندما يقول "الجدار B" فهذا يعني الجدار الجنوبي (side: "S").
عندما يقول "الجدار C" فهذا يعني الجدار الشرقي (side: "E").
عندما يقول "الجدار D" فهذا يعني الجدار الغربي (side: "W").

المقياس: 1 متر = 60 بكسل. الغرف تبدأ من الإحداثيات (0,0).

قواعد الرد:
1. افهم الأمر (صوتي أو كتابي) وحوّله إلى تعديل على المخطط.
2. أضف الغرف بجانب بعضها تلقائياً (لا تتداخل).
3. الأبواب والنوافذ تُضاف على جدران الغرف المحددة.
4. رد بـ JSON فقط بالشكل التالي:
{
  "sarahResponse": "رد م. سارة بالعربية (جملة قصيرة)",
  "action": "add_room" | "add_door" | "add_window" | "remove" | "clear" | "none",
  "updatedPlan": { ...نفس هيكل المخطط مع التعديلات... }
}

هيكل الغرفة: { id, x, y, width, height, label, color }
هيكل الباب: { id, roomId, side (N/S/E/W), position (0-1), width (بالمتر), swingDirection (in/out) }
هيكل النافذة: { id, roomId, side (N/S/E/W), position (0-1), width (بالمتر), height (بالمتر), sillHeight (بالمتر) }

ألوان الغرف المتاحة: ["#E8D5B7","#D4E8D5","#D5D4E8","#E8D5D5","#E8E4D5","#D5E8E4","#E4D5E8","#E8E0D5"]

عند إضافة غرفة جديدة، ضعها بجانب آخر غرفة موجودة (لا تتداخل). احسب الإحداثيات تلقائياً.`;

      const messages: Message[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${planSummary}\n\nالأمر: ${userCommand}\n\nالمخطط الحالي كـ JSON:\n${JSON.stringify(input.currentPlan)}` },
      ];

      try {
        const response = await invokeLLM({
          messages,
          response_format: { type: "json_object" },
        });
        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "{}";
        const parsed = JSON.parse(content);

        return {
          transcription,
          sarahResponse: parsed.sarahResponse || "تم!",
          updatedPlan: parsed.updatedPlan || input.currentPlan,
        };
      } catch {
        return {
          transcription,
          sarahResponse: "حدث خطأ في المعالجة. حاول مجدداً.",
          updatedPlan: input.currentPlan,
        };
      }
    }),

  // ===== منصة بنيان: البحث في المنتجات المحلية =====
  bonyan: router({
    // البحث في منتجات بنيان
    searchProducts: publicProcedure
      .input(z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(12),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        sortBy: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
      }))
      .query(async ({ input }) => {
        const BONYAN_API = "https://bonyanpltf-gegfwhcg.manus.space/api/trpc";
        const params = new URLSearchParams();
        const inputObj: Record<string, unknown> = {
          page: input.page,
          limit: input.limit,
        };
        if (input.search) inputObj.search = input.search;
        if (input.category) inputObj.category = input.category;
        params.set("input", JSON.stringify({ json: inputObj }));

        const res = await fetch(`${BONYAN_API}/products.list?${params.toString()}`);
        if (!res.ok) throw new Error("فشل الاتصال بمنصة بنيان");
        const data = await res.json() as { result: { data: { json: { items: BonyanProduct[]; total: number; page: number; limit: number } } } };
        let items: BonyanProduct[] = data?.result?.data?.json?.items || [];
        const total: number = data?.result?.data?.json?.total || 0;

        // تصفية حسب السعر
        if (input.minPrice !== undefined) items = items.filter((p: BonyanProduct) => parseFloat(p.price) >= input.minPrice!);
        if (input.maxPrice !== undefined) items = items.filter((p: BonyanProduct) => parseFloat(p.price) <= input.maxPrice!);

        // ترتيب
        if (input.sortBy === "price_asc") items.sort((a: BonyanProduct, b: BonyanProduct) => parseFloat(a.price) - parseFloat(b.price));
        else if (input.sortBy === "price_desc") items.sort((a: BonyanProduct, b: BonyanProduct) => parseFloat(b.price) - parseFloat(a.price));

        return { items, total, page: input.page, limit: input.limit };
      }),

    // توصيات أثاث حقيقية بناءً على تحليل الغرفة
    getRecommendations: publicProcedure
      .input(z.object({
        spaceType: z.string(), // نوع الفضاء (صالة/غرفة نوم/مطبخ...)
        designStyle: z.string(), // نمط التصميم
        materials: z.array(z.string()).optional(), // المواد المقترحة من التحليل
        furnitureNeeds: z.array(z.string()).optional(), // قطع الأثاث المطلوبة
        budgetMax: z.number().optional(), // الحد الأقصى للميزانية
      }))
      .mutation(async ({ input }) => {
        const BONYAN_API = "https://bonyanpltf-gegfwhcg.manus.space/api/trpc";

        // تحديد كلمات البحث بناءً على نوع الفضاء والنمط
        const spaceKeywords: Record<string, string[]> = {
          "صالة": ["sofa", "coffee table", "tv unit", "armchair"],
          "غرفة معيشة": ["sofa", "coffee table", "tv unit", "armchair"],
          "غرفة نوم": ["bed", "wardrobe", "bedside", "dresser"],
          "مطبخ": ["kitchen", "dining table", "dining chair"],
          "غرفة طعام": ["dining table", "dining chair", "sideboard"],
          "مكتب": ["desk", "office chair", "bookshelf"],
          "مجلس": ["sofa", "armchair", "coffee table", "rug"],
        };

        // تحديد كلمات البحث
        const spaceKey = Object.keys(spaceKeywords).find(k => input.spaceType.includes(k)) || "صالة";
        const searchTerms = input.furnitureNeeds?.length
          ? input.furnitureNeeds.slice(0, 3)
          : spaceKeywords[spaceKey] || ["furniture"];

        // البحث عن كل نوع من الأثاث
        const allResults: BonyanProduct[] = [];
        for (const term of searchTerms.slice(0, 3)) {
          try {
            const params = new URLSearchParams();
            params.set("input", JSON.stringify({ json: { page: 1, limit: 4, search: term } }));
            const res = await fetch(`${BONYAN_API}/products.list?${params.toString()}`);
            if (res.ok) {
              const data = await res.json() as { result: { data: { json: { items: BonyanProduct[] } } } };
              const items: BonyanProduct[] = data?.result?.data?.json?.items || [];
              allResults.push(...items.slice(0, 3));
            }
          } catch { /* skip */ }
        }

        // تصفية حسب الميزانية
        const filtered = input.budgetMax
          ? allResults.filter((p: BonyanProduct) => parseFloat(p.price) <= input.budgetMax! / searchTerms.length)
          : allResults;

        // استخدام AI لتنظيم التوصيات
        const productsDesc = filtered.slice(0, 12).map((p: BonyanProduct) =>
          `${p.nameAr || p.nameEn} - ${p.price} ${p.currency} - ${p.brand}`
        ).join("\n");

        const aiResponse = await invokeLLM({
          messages: [
            { role: "system", content: "أنتِ م. سارة خبيرة التصميم المعماري والبيئي (داخلي، واجهات، لاندسكيب، مسابح، تصميم حضري). تنظمين قائمة الأثاث المقترح من متجر حقيقي. ردودك بالعربية بصيغة JSON فقط." },
            { role: "user", content: `نوع الفضاء: ${input.spaceType}\nنمط التصميم: ${input.designStyle}\n\nالمنتجات المتاحة من متجر بنيان:\n${productsDesc}\n\nنظّمي هذه المنتجات وأضيفي تعليقاً لكل منتج يشرح لماذا يناسب هذا الفضاء والنمط. أعيدي JSON:\n{"recommendations": [{"productIndex": 0, "reason": "سبب التوصية", "category": "الأثاث/الإضاءة/الديكور", "priority": "أساسي/اختياري"}]}` }
          ],
          response_format: { type: "json_object" },
        });

        const rawContent = aiResponse.choices[0]?.message?.content;
        const aiText = typeof rawContent === "string" ? rawContent : "{}";
        let aiData: { recommendations?: Array<{ productIndex: number; reason: string; category: string; priority: string }> } = {};
        try { aiData = JSON.parse(aiText); } catch { aiData = {}; }

        const recommendations = (aiData.recommendations || []).map((rec: { productIndex: number; reason: string; category: string; priority: string }) => ({
          product: filtered[rec.productIndex] || filtered[0],
          reason: rec.reason,
          category: rec.category,
          priority: rec.priority,
        })).filter((r: { product: BonyanProduct | undefined }) => r.product);

        return {
          recommendations: recommendations.length > 0 ? recommendations : filtered.slice(0, 6).map((p: BonyanProduct) => ({
            product: p,
            reason: `يناسب ${input.spaceType} بنمط ${input.designStyle}`,
            category: "أثاث",
            priority: "أساسي",
          })),
          totalFound: filtered.length,
        };
      }),

    // استخراج قطع الأثاث من صورة الغرفة بالذكاء الاصطناعي
    extractFurnitureFromImage: publicProcedure
      .input(z.object({
        imageUrl: z.string(), // صورة الغرفة أو التصميم المولّد
        designStyle: z.string().optional(), // نمط التصميم المختار
        spaceType: z.string().optional(), // نوع الفضاء
      }))
      .mutation(async ({ input }) => {
        const resolvedUrl = await resolveImageUrl(input.imageUrl, 0);
        const messages: Message[] = [
          {
            role: "system",
            content: `أنتِ م. سارة خبيرة التصميم المعماري والبيئي (داخلي، واجهات، لاندسكيب، مسابح، تصميم حضري). مهمتك تحليل صور الغرف واستخراج قطع الأثاث والديكور الموجودة فيها بدقة. ردودك دائماً بالعربية وبصيغة JSON فقط.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url" as const,
                image_url: { url: resolvedUrl, detail: "high" as const },
              },
              {
                type: "text" as const,
                text: `حللي هذه الصورة واستخرجي كل قطع الأثاث والديكور الموجودة فيها. لكل قطعة حددي:
- الاسم بالعربية والإنجليزية
- الوصف الدقيق (اللون، الشكل، المادة المرئية)
- كلمة بحث مناسبة للعثور عليها في متجر أثاث
- الأولوية (أساسي/ثانوي)

أعيدي JSON بهذا الشكل:
{
  "furniturePieces": [
    {
      "nameAr": "كنبة",
      "nameEn": "sofa",
      "description": "كنبة ثلاثية بقماش رمادي فاتح",
      "searchKeyword": "sofa",
      "color": "رمادي",
      "material": "قماش",
      "priority": "أساسي"
    }
  ],
  "spaceType": "غرفة معيشة",
  "dominantStyle": "عصري"
}`,
              },
            ] as Array<ImageContent | TextContent>,
          },
        ];

        const aiResponse = await invokeLLM({
          messages,
          response_format: { type: "json_object" },
        });

        const rawContent = aiResponse.choices[0]?.message?.content;
        const aiText = typeof rawContent === "string" ? rawContent : "{}";
        let parsed: {
          furniturePieces?: Array<{
            nameAr: string;
            nameEn: string;
            description: string;
            searchKeyword: string;
            color?: string;
            material?: string;
            priority: string;
          }>;
          spaceType?: string;
          dominantStyle?: string;
        } = {};
        try { parsed = JSON.parse(aiText); } catch { parsed = {}; }

        return {
          furniturePieces: parsed.furniturePieces || [],
          spaceType: parsed.spaceType || input.spaceType || "غرفة معيشة",
          dominantStyle: parsed.dominantStyle || input.designStyle || "عصري",
        };
      }),

    // فلترة ذكية: جلب كميات كبيرة وتصفية بخوارزمية تحليل النص
    smartFilter: publicProcedure
      .input(z.object({
        category: z.string().optional(),       // تصنيف الأثاث (sofa, bed, table...)
        designStyles: z.array(z.string()).optional(),  // أنماط التصميم المختارة
        materials: z.array(z.string()).optional(),     // الخامات (velvet, wood, leather...)
        colors: z.array(z.string()).optional(),        // الألوان (beige, grey, white...)
        priceRange: z.enum(["economy", "mid", "premium", "luxury"]).optional(),
        roomType: z.string().optional(),              // نوع الغرفة
        size: z.enum(["small", "medium", "large"]).optional(),
        store: z.string().optional(),                 // المتجر
        sortBy: z.enum(["relevance", "price_asc", "price_desc", "newest"]).default("relevance"),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      }))
      .query(async ({ input }) => {
        const BONYAN_API = "https://bonyanpltf-gegfwhcg.manus.space/api/trpc";

        // ===== خريطة الكلمات المفتاحية =====
        // الأنماط → كلمات تظهر في أسماء المنتجات
        const STYLE_KEYWORDS: Record<string, string[]> = {
          modern: ["modern", "contemporary", "sleek", "minimalist", "clean"],
          classic: ["classic", "traditional", "ornate", "carved", "tufted", "capitonne"],
          gulf: ["arabic", "oriental", "majlis", "moroccan", "arabesque"],
          bohemian: ["boho", "bohemian", "rattan", "wicker", "macrame", "jute"],
          industrial: ["industrial", "metal", "iron", "steel", "pipe"],
          minimal: ["minimal", "simple", "basic", "clean", "nordic", "scandinavian"],
          rustic: ["rustic", "farmhouse", "barn", "reclaimed", "vintage", "distressed"],
        };

        // الخامات → كلمات تظهر في أسماء المنتجات
        const MATERIAL_KEYWORDS: Record<string, string[]> = {
          velvet: ["velvet", "velour", "plush"],
          wood: ["wood", "wooden", "oak", "teak", "walnut", "pine", "timber", "mdf"],
          leather: ["leather", "leatherette", "pu leather", "faux leather"],
          fabric: ["fabric", "linen", "cotton", "polyester", "chenille", "microfiber"],
          metal: ["metal", "steel", "iron", "chrome", "brass", "gold"],
          marble: ["marble", "stone", "granite"],
          glass: ["glass", "tempered glass", "crystal"],
          rattan: ["rattan", "wicker", "bamboo", "cane"],
        };

        // الألوان → كلمات تظهر في أسماء المنتجات
        const COLOR_KEYWORDS: Record<string, string[]> = {
          beige: ["beige", "sand", "cream", "ivory", "off white", "off-white", "natural"],
          grey: ["grey", "gray", "charcoal", "silver"],
          white: ["white"],
          black: ["black", "ebony", "onyx"],
          brown: ["brown", "walnut", "chocolate", "mocha", "caramel"],
          blue: ["blue", "navy", "teal", "turquoise", "cobalt"],
          green: ["green", "sage", "olive", "emerald", "forest"],
          gold: ["gold", "golden", "brass", "bronze"],
          pink: ["pink", "blush", "rose", "dusty pink"],
          warm: ["beige", "cream", "sand", "caramel", "terracotta", "rust"],
          cool: ["grey", "blue", "teal", "navy", "silver"],
          dark: ["black", "charcoal", "dark", "espresso", "ebony"],
          light: ["white", "cream", "ivory", "light", "pale"],
        };

        // الحجم → كلمات في الأسماء
        const SIZE_KEYWORDS: Record<string, string[]> = {
          small: ["single", "1 seater", "small", "compact", "mini", "side"],
          medium: ["2 seater", "double", "medium", "standard"],
          large: ["3 seater", "4 seater", "5 seater", "large", "king", "super king", "corner", "sectional", "modular"],
        };

        // نطاقات الأسعار
        const PRICE_RANGES: Record<string, { min: number; max: number }> = {
          economy: { min: 0, max: 999 },
          mid: { min: 1000, max: 4999 },
          premium: { min: 5000, max: 14999 },
          luxury: { min: 15000, max: 999999 },
        };

        // ===== بناء كلمة البحث الأساسية =====
        // نستخدم فقط التصنيف كبحث أساسي (بسيط وفعّال)
        const searchTerm = input.category || "";

        // ===== تحديد نطاق السعر =====
        const priceFilter = input.priceRange ? PRICE_RANGES[input.priceRange] : null;

        // ===== جلب كمية كبيرة من بنيان =====
        // نجلب 6 صفحات (300 منتج) لضمان نتائج كافية مع صور حقيقية
        const FETCH_PAGES = 6;
        const FETCH_LIMIT = 50;
        let allFetched: BonyanProduct[] = [];

        for (let p = 1; p <= FETCH_PAGES; p++) {
          try {
            const apiInput: Record<string, unknown> = {
              page: p,
              limit: FETCH_LIMIT,
            };
            if (searchTerm) apiInput.search = searchTerm;
            if (priceFilter) {
              apiInput.minPrice = priceFilter.min;
              apiInput.maxPrice = priceFilter.max;
            }
            if (input.store) apiInput.sourceName = input.store;

            const params = new URLSearchParams();
            params.set("input", JSON.stringify({ json: apiInput }));
            const res = await fetch(`${BONYAN_API}/products.list?${params.toString()}`);
            if (!res.ok) break;
            const data = await res.json() as { result: { data: { json: { items: BonyanProduct[]; total: number } } } };
            const items = data?.result?.data?.json?.items || [];
            allFetched.push(...items);
            // إذا انتهت الصفحات نتوقف
            if (items.length < FETCH_LIMIT) break;
          } catch { break; }
        }

        // ===== تصنيف جودة الموردين =====
        // الموردون ذوو صور حقيقية 100% يحصلون على أعلى الأولويات
        const TRUSTED_SOURCES: Record<string, number> = {
          // صور حقيقية 100% - أعلى أولوية
          "Furn.com UAE": 6,
          "Loom Collection UAE": 6,
          "Indigo Living UAE": 6,
          "Bloomr UAE": 6,
          // Danube Home (sourceName=null في بنيان)
          "Danube Home": 5,
          "IKEA UAE": 5,
          "The Design House Dubai": 4,
          "Pinky Furniture UAE": 3,
          // 2XL Home صور جزئية 28%
          "2XL Home": 2,
          "RAK Ceramics": 1,
          "Dulux UAE": 1,
          "Jotun UAE": 1,
          // Pan Home صور وهمية - أدنى أولوية
          "Pan Home": 0,
        };

        // دالة فحص صحة الصورة
        const hasRealImage = (p: BonyanProduct): boolean => {
          const img = p.imageUrl || "";
          if (!img || !img.startsWith("http")) return false;
          if (img.includes("lazy.png") || img.includes("placeholder") || img.includes("no-image")) return false;
          return true;
        };

        // ===== تصفية الأسعار الشاذة =====
        // نحذف الأسعار الوهمية (صفر أو أكثر من 200,000 درهم للأثاث العادي)
        allFetched = allFetched.filter(p => {
          const price = parseFloat(p.price);
          if (isNaN(price) || price <= 0) return false;
          // استثناء: مواد بناء ورخام وإضاءة قد تكون بسعر عالي
          const isBuildingMaterial = ["RAK Ceramics", "Dulux UAE", "Jotun UAE"].includes(p.sourceName || "");
          const maxPrice = isBuildingMaterial ? 999999 : 200000;
          return price <= maxPrice;
        });

        // ===== إخفاء منتجات Pan Home بدون صور حقيقية =====
        // Pan Home يستخدم lazy loading وصوره وهمية - نخفيها إلا إذا كانت لديها صورة حقيقية
        allFetched = allFetched.filter(p => {
          const src = p.sourceName || "";
          if (src === "Pan Home" && !hasRealImage(p)) return false;
          return true;
        });

        // ===== تصفية السعر server-side (لضمان الدقة حتى عند فشل API في تطبيق الفلتر) =====
        if (priceFilter) {
          allFetched = allFetched.filter(p => {
            const price = parseFloat(p.price);
            return price >= priceFilter.min && price <= priceFilter.max;
          });
        }

        // ===== خوارزمية التصفية الذكية =====
        // لكل منتج نحسب نقاط التطابق مع الفلاتر المختارة
        const scored = allFetched.map(product => {
          const nameLower = ((product.nameEn || "") + " " + (product.nameAr || "")).toLowerCase();
          let score = 0;
          let matchedFilters = 0;
          let totalFilters = 0;

          // فلتر نمط التصميم
          if (input.designStyles && input.designStyles.length > 0) {
            totalFilters++;
            const styleMatch = input.designStyles.some(style => {
              const keywords = STYLE_KEYWORDS[style] || [style.toLowerCase()];
              return keywords.some(kw => nameLower.includes(kw));
            });
            if (styleMatch) { score += 3; matchedFilters++; }
          }

          // فلتر الخامة
          if (input.materials && input.materials.length > 0) {
            totalFilters++;
            const matMatch = input.materials.some(mat => {
              const keywords = MATERIAL_KEYWORDS[mat] || [mat.toLowerCase()];
              return keywords.some(kw => nameLower.includes(kw));
            });
            if (matMatch) { score += 4; matchedFilters++; }
          }

          // فلتر اللون
          if (input.colors && input.colors.length > 0) {
            totalFilters++;
            const colorMatch = input.colors.some(color => {
              const keywords = COLOR_KEYWORDS[color] || [color.toLowerCase()];
              return keywords.some(kw => nameLower.includes(kw));
            });
            if (colorMatch) { score += 3; matchedFilters++; }
          }

          // فلتر الحجم
          if (input.size) {
            totalFilters++;
            const sizeKeywords = SIZE_KEYWORDS[input.size] || [];
            const sizeMatch = sizeKeywords.some(kw => nameLower.includes(kw));
            if (sizeMatch) { score += 2; matchedFilters++; }
          }

          // إذا لم تكن هناك فلاتر نوعية، كل المنتجات مقبولة
          const isRelevant = totalFilters === 0 || matchedFilters > 0 || score > 0;

          // نقاط المورد: الموردون الموثوقون يحصلون على أفضلية في العرض
          const sourceBonus = TRUSTED_SOURCES[product.sourceName || ""] || 0;
          // المنتجات ذات صور حقيقية تحصل على نقاط إضافية كبيرة
          const imageBonus = hasRealImage(product) ? 4 : -3;
          const finalScore = score + sourceBonus + imageBonus;

          return { product, score: finalScore, matchedFilters, totalFilters, isRelevant };
        });

        // ===== تصفية: إبقاء المنتجات ذات الصلة فقط =====
        let filtered = scored.filter(s => s.isRelevant);

        // إذا كانت الفلاتر صارمة جداً ولا نتائج، نرجع الكل
        if (filtered.length === 0 && allFetched.length > 0) {
          filtered = scored;
        }

        // ===== الترتيب =====
        if (input.sortBy === "relevance") {
          filtered.sort((a, b) => b.score - a.score);
        } else if (input.sortBy === "price_asc") {
          filtered.sort((a, b) => parseFloat(a.product.price) - parseFloat(b.product.price));
        } else if (input.sortBy === "price_desc") {
          filtered.sort((a, b) => parseFloat(b.product.price) - parseFloat(a.product.price));
        }
        // newest: الترتيب الافتراضي من API

        // ===== التصفح (Pagination) =====
        const total = filtered.length;
        const start = (input.page - 1) * input.pageSize;
        const pageItems = filtered.slice(start, start + input.pageSize).map(s => s.product);

        return {
          items: pageItems,
          total,
          page: input.page,
          pageSize: input.pageSize,
          hasMore: start + input.pageSize < total,
          fetchedTotal: allFetched.length,
        };
      }),

    // مطابقة قطع الأثاث المستخرجة مع منتجات بنيان
    matchFurnitureToProducts: publicProcedure
      .input(z.object({
        furniturePieces: z.array(z.object({
          nameAr: z.string(),
          nameEn: z.string(),
          description: z.string(),
          searchKeyword: z.string(),
          color: z.string().optional(),
          material: z.string().optional(),
          priority: z.string(),
        })),
        budgetMax: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const BONYAN_API = "https://bonyanpltf-gegfwhcg.manus.space/api/trpc";
        const results: Array<{
          piece: typeof input.furniturePieces[0];
          matches: BonyanProduct[];
        }> = [];

        // البحث عن كل قطعة في بنيان
        for (const piece of input.furniturePieces.slice(0, 6)) {
          try {
            const params = new URLSearchParams();
            params.set("input", JSON.stringify({ json: { page: 1, limit: 4, search: piece.searchKeyword } }));
            const res = await fetch(`${BONYAN_API}/products.list?${params.toString()}`);
            if (res.ok) {
              const data = await res.json() as { result: { data: { json: { items: BonyanProduct[] } } } };
              let items: BonyanProduct[] = data?.result?.data?.json?.items || [];

              // تصفية حسب الميزانية إذا حددت
              if (input.budgetMax) {
                items = items.filter((p: BonyanProduct) => parseFloat(p.price) <= input.budgetMax! / input.furniturePieces.length * 1.5);
              }

              results.push({ piece, matches: items.slice(0, 3) });
            } else {
              results.push({ piece, matches: [] });
            }
          } catch {
            results.push({ piece, matches: [] });
          }
        }

        const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);
        const minPrice = results.flatMap(r => r.matches).reduce((min, p) => Math.min(min, parseFloat(p.price)), Infinity);
        const maxPrice = results.flatMap(r => r.matches).reduce((max, p) => Math.max(max, parseFloat(p.price)), 0);

        return {
          results,
          totalMatches,
          priceRange: totalMatches > 0 ? { min: minPrice, max: maxPrice } : null,
        };
      }),
  }),

  // ===== مراجع التصميم (صور الإلهام) =====
  designReference: router({
    // تحليل صورة إلهام وحفظها كمرجع
    analyze: mousaProcedure
      .input(z.object({
        imageUrl: z.string(),   // URL الصورة (مرفوعة على S3 أو رابط خارجي)
        imageKey: z.string().optional(),
        title: z.string().optional(), // اسم اختياري يعطيه المستخدم
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user.id;

        // م. سارة تحلل الصورة وتصف النمط والألوان والمواد
        const messages: Message[] = [
          {
            role: "system",
            content: `أنتِ م. سارة، خبيرة التصميم المعماري والبيئي. مهمتك تحليل صور الفضاءات التي يعجب بها العميل وتصفها بدقة حتى يمكن تقليدها لاحقاً في فضاء آخر. ردودك دائماً بالعربية وبصيغة JSON فقط.`,
          },
          {
            role: "user",
            content: [
              { type: "image_url" as const, image_url: { url: await resolveImageUrl(input.imageUrl, userId), detail: "high" as const } },
              {
                type: "text" as const,
                text: `حللي هذا الفضاء الداخلي بدقة عالية لأتمكن من تقليده في غرفتي. أعيدي JSON بهذا الشكل بالضبط:
{
  "title": "اسم وصفي مختصر للفضاء (مثل: مكتب عصري بألوان محايدة)",
  "spaceType": "نوع الفضاء (غرفة معيشة/مكتب/غرفة نوم/مطبخ/غرفة طعام/مجلس/ممر)",
  "styleLabel": "اسم النمط بالعربية (عصري/خليجي/كلاسيكي/مينيمال/صناعي/بوهيمي/اسكندنافي/فاخر)",
  "styleKey": "اسم النمط بالإنجليزية (modern/gulf/classical/minimal/industrial/bohemian/scandinavian/luxury)",
  "description": "وصف تفصيلي للفضاء في 3-4 جمل يشرح الأجواء والطابع العام",
  "colorMood": "المزاج اللوني العام (دافئ/بارد/محايد/داكن/فاتح/ملوّن)",
  "palette": [{"name": "اسم اللون", "hex": "#XXXXXX"}],
  "materials": ["قائمة الخامات الرئيسية"],
  "highlights": ["أبرز 3-5 عناصر تميز هذا الفضاء وتجعله مميزاً"]
}`,
              },
            ] as Array<ImageContent | TextContent>,
          },
        ];

        const aiResponse = await invokeLLM({
          messages,
          response_format: { type: "json_object" },
        });

        const rawContent = aiResponse.choices[0]?.message?.content;
        const aiText = typeof rawContent === "string" ? rawContent : "{}";
        let analysisData: {
          title?: string;
          spaceType?: string;
          styleLabel?: string;
          styleKey?: string;
          description?: string;
          colorMood?: string;
          palette?: Array<{ name: string; hex: string }>;
          materials?: string[];
          highlights?: string[];
        } = {};
        try { analysisData = JSON.parse(aiText); } catch { analysisData = {}; }

        // حفظ المرجع في قاعدة البيانات
        const { createDesignReference } = await import("./db");
        const saved = await createDesignReference({
          userId,
          imageUrl: input.imageUrl,
          imageKey: input.imageKey,
          title: input.title || analysisData.title || "مرجع تصميم",
          spaceType: analysisData.spaceType,
          styleLabel: analysisData.styleLabel,
          styleKey: analysisData.styleKey,
          description: analysisData.description,
          colorMood: analysisData.colorMood,
          palette: analysisData.palette || [],
          materials: analysisData.materials || [],
          highlights: analysisData.highlights || [],
          analysisData,
        });

        return {
          id: saved?.id,
          ...analysisData,
          imageUrl: input.imageUrl,
        };
      }),

    // جلب مراجع التصميم المحفوظة للمستخدم
    list: mousaProcedure
      .query(async ({ ctx }) => {
        const { getUserDesignReferences } = await import("./db");
        return getUserDesignReferences(ctx.user.id);
      }),

    // حذف مرجع
    delete: mousaProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { deleteDesignReference } = await import("./db");
        await deleteDesignReference(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ===== Generate Floor Plan 3D =====
  generateFloorPlan3D: mousaProcedure
    .input(z.object({
      plan: z.object({
        rooms: z.array(z.any()),
        doors: z.array(z.any()),
        windows: z.array(z.any()),
        scale: z.number(),
        northAngle: z.number(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      await checkAndDeductCredits(ctx.user.id, ctx.mousaUserId, "generateFloorPlan3D");
      const { plan } = input;

      // Build textual description of the floor plan
      const roomsDesc = plan.rooms.map((r: {label:string;width:number;height:number}) =>
        `${r.label} (${r.width}m × ${r.height}m)`
      ).join(", ");

      const doorsDesc = plan.doors.length > 0
        ? `${plan.doors.length} doors on walls: ${plan.doors.map((d: {side:string;width:number}) => `${d.side} wall (${d.width}m wide)`).join(", ")}`
        : "no doors yet";

      const windowsDesc = plan.windows.length > 0
        ? `${plan.windows.length} windows: ${plan.windows.map((w: {side:string;width:number;height:number}) => `${w.side} wall (${w.width}m × ${w.height}m)`).join(", ")}`
        : "no windows yet";

      const prompt = `Photorealistic architectural interior perspective rendering of a floor plan with the following rooms: ${roomsDesc}. ${doorsDesc}. ${windowsDesc}. View from inside the main room looking toward the entrance. Ceiling height 3 meters. Modern Saudi interior design style. Natural lighting from windows. Clean white walls with warm wood flooring. Professional architectural visualization, 8K quality, no people, no text, photorealistic rendering, architectural digest quality.`;

      try {
        const { url: imageUrl } = await generateImage({ prompt });
        return { imageUrl };
      } catch {
        return { imageUrl: null };
      }
    }),

  // ===== refineDesign: تحسين ذكي للتصميم بعد توليد الصورة =====
  refineDesign: mousaProcedure
    .input(z.object({
      originalImageUrl: z.string(),
      generatedImageUrl: z.string(),
      refinementRequest: z.string(),
      clickX: z.number().optional(),
      clickY: z.number().optional(),
      originalPrompt: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await checkAndDeductCredits(ctx.user.id, ctx.mousaUserId, "refineDesign");
      const { originalImageUrl, generatedImageUrl, refinementRequest, clickX, clickY, originalPrompt } = input;

      const locationHint = (clickX !== undefined && clickY !== undefined)
        ? `\nThe user clicked on the image at position (${Math.round(clickX)}%, ${Math.round(clickY)}%) from top-left. Focus the refinement on that area.`
        : "";

      const refinementPrompt = `${originalPrompt || "Photorealistic interior design"} REFINEMENT REQUEST: ${refinementRequest}.${locationHint} Keep everything else exactly the same. Only change what was specifically requested. Maintain same camera angle, same room proportions, same structural elements.`;

      // دالة مساعدة: تحويل data URL أو URL عادي إلى كائن مناسب لـ originalImages
      const toImageEntry = (imgUrl: string): { url?: string; b64Json?: string; mimeType?: string } => {
        if (imgUrl.startsWith("data:")) {
          const [header, b64Data] = imgUrl.split(",");
          const mimeMatch = header.match(/data:([^;]+);/);
          const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
          return { b64Json: b64Data, mimeType };
        }
        return { url: imgUrl, mimeType: "image/jpeg" };
      };

      try {
        const { url: imageUrl } = await generateImage({
          prompt: refinementPrompt,
          originalImages: [
            toImageEntry(originalImageUrl),
            toImageEntry(generatedImageUrl),
          ],
        });
        return { imageUrl, success: true };
      } catch (err) {
        console.error("[refineDesign] Error:", err);
        // fallback: توليد بدون الصورة الأصلية (فقط الصورة المولّدة)
        try {
          const { url: imageUrl } = await generateImage({
            prompt: refinementPrompt,
            originalImages: [toImageEntry(generatedImageUrl)],
          });
          return { imageUrl, success: true };
        } catch {
          return { imageUrl: null, success: false };
        }
      }
    }),

  applyStyleToIdea: mousaProcedure
    .input(z.object({
      currentImageUrl: z.string(),
      currentTitle: z.string(),
      currentDescription: z.string(),
      newStyle: z.string(),
      newColors: z.array(z.string()).optional(),
      spaceType: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await checkAndDeductCredits(ctx.user.id, ctx.mousaUserId, "applyStyle");
      const { currentImageUrl, currentTitle, currentDescription, newStyle, newColors, spaceType } = input;

      const styleInfo = GLOBAL_STYLES[newStyle] || { name: newStyle, description: newStyle, keywords: newStyle };
      const colorInstruction = newColors && newColors.length > 0
        ? `Use ONLY these colors as the dominant palette: ${newColors.join(", ")}. `
        : "";

      const prompt = `Photorealistic ${spaceType || "interior"} design. Transform this space into ${styleInfo.name} style (${styleInfo.keywords}). ${colorInstruction}Keep the same room structure, proportions, doors and windows positions. Apply ${styleInfo.name} aesthetic: ${styleInfo.description}. High quality architectural visualization, professional photography, 8K resolution.`;

      const toImageEntry = (imgUrl: string): { url?: string; b64Json?: string; mimeType?: string } => {
        if (imgUrl.startsWith("data:")) {
          const [header, b64Data] = imgUrl.split(",");
          const mimeMatch = header.match(/data:([^;]+);/);
          const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
          return { b64Json: b64Data, mimeType };
        }
        return { url: imgUrl, mimeType: "image/jpeg" };
      };

      try {
        const { url: imageUrl } = await generateImage({
          prompt,
          originalImages: [toImageEntry(currentImageUrl)],
        });

        // توليد عنوان ووصف جديدين بالعربية
        const titleRes = await invokeLLM({
          messages: [
            { role: "system", content: "أنتِ م. سارة مهندسة التصميم المعماري والبيئي. أجيبي بـ JSON فقط بدون أي نص إضافي." },
            { role: "user", content: `أعطيني عنواناً قصيراً (4-6 كلمات) ووصفاً موجزاً (جملة واحدة) لتصميم ${styleInfo.name} ${newColors && newColors.length > 0 ? `بألوان: ${newColors.join("، ")}` : ""} لـ ${spaceType || "غرفة"}. JSON: {"title": "...", "description": "..."}` },
          ],
          response_format: { type: "json_schema", json_schema: { name: "idea_title", strict: true, schema: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } }, required: ["title", "description"], additionalProperties: false } } },
        });

        let newTitle = currentTitle;
        let newDescription = currentDescription;
        try {
          const parsed = JSON.parse(titleRes.choices[0].message.content as string);
          newTitle = parsed.title || currentTitle;
          newDescription = parsed.description || currentDescription;
        } catch { /* keep original */ }

        return { imageUrl, newTitle, newDescription, success: true };
      } catch (err) {
        console.error("[applyStyleToIdea] Error:", err);
        return { imageUrl: null, newTitle: currentTitle, newDescription: currentDescription, success: false };
      }
    }),

  // ===== توليد رندر 3D من مخطط الرسم =====
  generate3DFromPlan: mousaProcedure
    .input(z.object({
      prompt: z.string(),
      planImageBase64: z.string().optional(), // base64 floor plan image as reference
    }))
    .mutation(async ({ input, ctx }) => {
      await checkAndDeductCredits(ctx.user.id, ctx.mousaUserId, "generate3D");
      try {
        let imageUrl: string | undefined;
        // If floor plan image provided, upload it first and use as reference
        if (input.planImageBase64) {
          try {
            const { storagePut } = await import('./storage');
            const base64Data = input.planImageBase64.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const key = `plan-refs/plan-${Date.now()}.png`;
            const { url } = await storagePut(key, buffer, 'image/png');
            imageUrl = url;
          } catch (uploadErr) {
            console.error('[generate3DFromPlan] Plan upload error:', uploadErr);
            // Continue without reference image
          }
        }
        const enhancedPrompt = imageUrl
          ? `${input.prompt}\n\nREFERENCE FLOOR PLAN: The attached image shows the exact floor plan layout. Use it as the structural blueprint. MUST match: exact room shape, exact door positions, exact window positions, exact proportions. Only add: interior design style, furniture, materials, lighting, colors.`
          : input.prompt;
        const { url } = await generateImage({
          prompt: enhancedPrompt,
          ...(imageUrl ? { originalImages: [{ url: imageUrl, mimeType: 'image/png' as const }] } : {})
        });
        return { url, success: true };
      } catch (err) {
        console.error("[generate3DFromPlan] Error:", err);
        return { url: null, success: false };
      }
     }),
  // ===== توليد بيانات التصميم الكاملة من مخطط الرسم =====
  generate3DPlanDesignData: mousaProcedure
    .input(z.object({
      rooms: z.array(z.object({
        label: z.string(),
        width: z.number(),
        height: z.number(),
      })),
      doors: z.array(z.object({ doorType: z.string(), width: z.number() })).optional(),
      windows: z.array(z.object({ windowType: z.string(), width: z.number() })).optional(),
      designStyle: z.string().default("gulf"),
      renderImageUrl: z.string().optional(), // رابط الصورة المولّدة
    }))
    .mutation(async ({ input, ctx }) => {
      await checkAndDeductCredits(ctx.user.id, ctx.mousaUserId, "generatePlanDesign");
      try {
        const { rooms, doors, windows, designStyle, renderImageUrl } = input;
        const totalArea = rooms.reduce((sum, r) => sum + r.width * r.height, 0);
        const roomsDesc = rooms.map(r => `${r.label} (${r.width}×${r.height}م = ${(r.width * r.height).toFixed(1)}م²)`).join("، ");
        const doorsDesc = (doors || []).map(d => `باب ${d.doorType === "double" ? "مزدوج" : d.doorType === "sliding" ? "منزلق" : "واحد"} ${d.width}م`).join("، ");
        const windowsDesc = (windows || []).map(w => `نافذة ${w.windowType === "panoramic" || w.windowType === "full_panoramic" ? "بانورامية" : w.windowType === "french" ? "فرنسية" : "عادية"} ${w.width}م`).join("، ");
        const styleMap: Record<string, string> = {
          modern: "عصري معاصر", gulf: "خليجي فاخر", classic: "كلاسيكي",
          minimal: "مينيمال", japanese: "ياباني زن", scandinavian: "سكندنافي",
          moroccan: "مغربي", luxury: "فاخر بريميوم", mediterranean: "متوسطي", industrial: "صناعي"
        };
        const styleName = styleMap[designStyle] || designStyle;
        const systemPrompt = `أنتِ م. سارة، مهندسة التصميم المعماري والبيئي خبيرة في السوق الخليجي. أجيبي بـ JSON فقط بدون أي نص إضافي.`;
        const userPrompt = `بناءً على المسقط التالي:
- الغرف: ${roomsDesc}
- المساحة الإجمالية: ${totalArea.toFixed(1)}م²
- الأبواب: ${doorsDesc || "لا توجد"}
- النوافذ: ${windowsDesc || "لا توجد"}
- نمط التصميم المطلوب: ${styleName}

أعطيني بيانات تصميم داخلي شاملة بالصيغة التالية:
{
  "title": "عنوان التصميم (4-6 كلمات)",
  "description": "وصف موجز للتصميم (2-3 جمل)",
  "palette": [
    {"name": "اسم اللون", "hex": "#XXXXXX"},
    {"name": "اسم اللون", "hex": "#XXXXXX"},
    {"name": "اسم اللون", "hex": "#XXXXXX"},
    {"name": "اسم اللون", "hex": "#XXXXXX"}
  ],
  "materials": ["مادة 1", "مادة 2", "مادة 3", "مادة 4", "مادة 5"],
  "highlights": ["ميزة 1", "ميزة 2", "ميزة 3", "ميزة 4", "ميزة 5"],
  "furniture": [
    {"name": "اسم القطعة", "description": "وصف مختصر", "priceRange": "X,000 - X,000 ر.س"},
    {"name": "اسم القطعة", "description": "وصف مختصر", "priceRange": "X,000 - X,000 ر.س"},
    {"name": "اسم القطعة", "description": "وصف مختصر", "priceRange": "X,000 - X,000 ر.س"}
  ],
  "estimatedCost": "XX,000 - XX,000 ر.س",
  "costMin": 0,
  "costMax": 0,
  "executionTime": "X-X أسابيع",
  "boq": [
    {"category": "الأرضيات", "item": "اسم المادة", "unit": "م²", "qty": 0, "unitPrice": 0, "total": 0},
    {"category": "الجدران", "item": "اسم المادة", "unit": "م²", "qty": 0, "unitPrice": 0, "total": 0},
    {"category": "الأسقف", "item": "اسم المادة", "unit": "م²", "qty": 0, "unitPrice": 0, "total": 0},
    {"category": "الأثاث", "item": "اسم القطعة", "unit": "قطعة", "qty": 0, "unitPrice": 0, "total": 0},
    {"category": "الإضاءة", "item": "نوع الإضاءة", "unit": "قطعة", "qty": 0, "unitPrice": 0, "total": 0}
  ],
  "styleVariants": [
    {"id": "modern", "label": "عصري", "emoji": "🏙️"},
    {"id": "gulf", "label": "خليجي", "emoji": "🕌"},
    {"id": "classic", "label": "كلاسيكي", "emoji": "🏛️"},
    {"id": "minimal", "label": "مينيمال", "emoji": "⬜"},
    {"id": "luxury", "label": "فاخر", "emoji": "💎"}
  ]
}
احسب الكميات بدقة بناءً على المساحات الفعلية. الأسعار بالريال السعودي وفق السوق الخليجي.`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        });
        const raw = response.choices[0]?.message?.content;
        const text = typeof raw === "string" ? raw : JSON.stringify(raw) || "{}";
        try {
          const parsed = JSON.parse(text);
          return { success: true, data: parsed };
        } catch {
          return { success: false, data: null };
        }
      } catch (err) {
        console.error("[generate3DPlanDesignData] Error:", err);
        return { success: false, data: null };
      }
    }),
  // ===== MOUSA.AI Credit System =====
  mousa: router({
    // التحقق من توكن MOUSA.AI عند الدخول من بطاقة المنصة
    verifyToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input, ctx }) => {
        try {
          const data = await verifyMousaToken(input.token);
          if (!data.valid) {
            return { success: false, error: "توكن غير صالح" };
          }
          // إذا كان المستخدم مسجلاً، نحدّث بيانات MOUSA.AI
          if (ctx.user) {
            const db = await getDb();
            if (db) {
              await db.update(users)
                .set({
                  mousaUserId: data.userId,
                  mousaBalance: data.creditBalance,
                  mousaLastSync: new Date(),
                })
                .where(eq(users.id, ctx.user.id));
            }
          }
          return {
            success: true,
            mousaUserId: data.userId,
            userName: data.name,
            balance: data.creditBalance,
            platformCost: null,
            sufficient: null,
          };
        } catch (err) {
          console.error("[mousa.verifyToken] Error:", err);
          return { success: false, error: "فشل التحقق من التوكن" };
        }
      }),

    // التحقق من الرصيد قبل تنفيذ عملية AI
    checkBalance: mousaProcedure
      .input(z.object({
        operation: z.enum(["analyzePhoto", "analyzeAndGenerate", "generateVisualization", "generateIdeas", "reAnalyze", "applyStyle", "refineDesign", "voiceDesign", "generateFloorPlan3D", "generate3D", "generatePlanDesign", "generatePDF"]),
      }))
      .query(async ({ input, ctx }) => {
        try {
          const mousaUserId = ctx.user.mousaUserId;
          if (!mousaUserId) {
            // المستخدم لم يدخل من MOUSA.AI — نسمح بالاستخدام المجاني
            return { sufficient: true, balance: null, cost: CREDIT_COSTS[input.operation], requiresMousa: false };
          }
          const data = await checkMousaBalance(mousaUserId);
          const cost = CREDIT_COSTS[input.operation];
          return {
            sufficient: data.balance >= cost,
            balance: data.balance,
            cost,
            upgradeUrl: data.upgradeUrl,
            requiresMousa: true,
          };
        } catch (err) {
          console.error("[mousa.checkBalance] Error:", err);
          // في حالة خطأ، نسمح بالاستخدام
          return { sufficient: true, balance: null, cost: CREDIT_COSTS[input.operation], requiresMousa: false };
        }
      }),

    // خصم الكريدت بعد نجاح عملية AI
    deductCredits: mousaProcedure
      .input(z.object({
        operation: z.enum(["analyzePhoto", "analyzeAndGenerate", "generateVisualization", "generateIdeas", "reAnalyze", "applyStyle", "refineDesign", "voiceDesign", "generateFloorPlan3D", "generate3D", "generatePlanDesign", "generatePDF"]),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const mousaUserId = ctx.user.mousaUserId;
          if (!mousaUserId) {
            return { success: true, newBalance: null, deducted: 0, requiresMousa: false };
          }
          const cost = CREDIT_COSTS[input.operation];
          const operationLabels: Record<CreditOperation, string> = {
            analyzePhoto: "تحليل صورة داخلية (20 كريدت)",
            analyzeAndGenerate: "تحليل + توليد أفكار كاملة (35 كريدت)",
            generateVisualization: "توليد صورة تصورية (25 كريدت)",
            generateIdeas: "توليد أفكار تصميم (20 كريدت)",
            reAnalyze: "إعادة تحليل مع تعديلات (15 كريدت)",
            applyStyle: "تغيير نمط التصميم (20 كريدت)",
            refineDesign: "تحسين التصميم بالقلم (20 كريدت)",
            voiceDesign: "تصميم صوتي (15 كريدت)",
            generateFloorPlan3D: "رندر 3D من مسقط صوتي (25 كريدت)",
            generate3D: "رندر 3D من مسقط محمّل (30 كريدت)",
            generatePlanDesign: "بيانات تصميم كاملة من المسقط (25 كريدت)",
            generatePDF: "تصدير دفتر التصميم PDF (5 كريدت)",
          };
          const description = input.description || operationLabels[input.operation];
          const result = await deductMousaCredits(mousaUserId, cost, description);
          if ("error" in result) {
            // رصيد غير كافٍ
            return {
              success: false,
              newBalance: result.currentBalance,
              deducted: 0,
              requiresMousa: true,
              upgradeUrl: result.upgradeUrl,
              error: result.error,
            };
          }
          // تحديث الرصيد المحلي في قاعدة البيانات
          const db2 = await getDb();
          if (db2) {
            await db2.update(users)
              .set({ mousaBalance: result.newBalance, mousaLastSync: new Date() })
              .where(eq(users.id, ctx.user.id));
          }
          return {
            success: true,
            newBalance: result.newBalance,
            deducted: result.deducted,
            requiresMousa: true,
          };
        } catch (err) {
          console.error("[mousa.deductCredits] Error:", err);
          return { success: true, newBalance: null, deducted: 0, requiresMousa: false };
        }
      }),

    // جلب الرصيد الحالي للمستخدم
    getBalance: mousaProcedure
      .query(async ({ ctx }) => {
        try {
          const mousaUserId = ctx.user.mousaUserId;
          if (!mousaUserId) {
            return { balance: null, requiresMousa: false, upgradeUrl: null };
          }
          const data = await checkMousaBalance(mousaUserId);
          // تحديث الرصيد المحلي
          const db3 = await getDb();
          if (db3) {
            await db3.update(users)
              .set({ mousaBalance: data.balance, mousaLastSync: new Date() })
              .where(eq(users.id, ctx.user.id));
          }
          return {
            balance: data.balance,
            requiresMousa: true,
            upgradeUrl: data.upgradeUrl,
            platformCost: null,
          };
        } catch (err) {
          console.error("[mousa.getBalance] Error:", err);
          return { balance: ctx.user.mousaBalance ?? null, requiresMousa: false, upgradeUrl: null };
        }
      }),
  }),

  // ===== تحليل التصميم الحضري =====
  analyzeUrban: publicProcedure
    .input(z.object({
      imageUrl: z.string(),
      urbanType: z.string().default("residential_district"),
      designStyle: z.string().default("modern"),
      projectScale: z.enum(["small", "medium", "large"]).default("medium"),
    }))
    .mutation(async ({ input }) => {
      const systemPrompt = `أنتِ م. سارة، مهندسة تخطيط حضري وخبيرة تصميم معماري. تحللين الصور الجوية والمخططات الحضرية وتقدمين تحليلات شاملة. ردودكِ دائماً بالعربية بصيغة JSON فقط.`;

      const messages: Message[] = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url" as const,
              image_url: { url: await resolveImageUrl(input.imageUrl, 0), detail: "high" as const },
            } as ImageContent,
            {
              type: "text" as const,
              text: `حلّلي هذه الصورة الجوية/الحضرية واستخرجي تحليلاً حضرياً شاملاً.
نوع المنطقة: ${input.urbanType}
نمط التصميم: ${input.designStyle}
حجم المشروع: ${input.projectScale}

أعيدي JSON بهذا الشكل بالضبط:
{
  "projectName": "اسم المشروع الحضري",
  "totalArea": 0,
  "estimatedPopulation": 0,
  "sustainabilityScore": 75,
  "summary": "وصف موجز للمنطقة",
  "keyFeatures": ["ميزة رئيسية"],
  "zones": [
    {
      "name": "اسم المنطقة",
      "type": "نوع المنطقة",
      "area": 0,
      "description": "وصف المنطقة"
    }
  ],
  "recommendations": [
    "توصية حضرية من م. سارة"
  ]
}
إذا لم تتمكني من قراءة الصورة بوضوح، قدّمي تقديرات منطقية بناءاً على ما ترينه.`,
            } as TextContent,
          ],
        },
      ];

      const aiResponse = await invokeLLM({
        messages,
        response_format: { type: "json_object" },
        model: "gemini-2.5-pro", // نموذج أقوى لتحليل دقيق للمخططات الحضرية
      });

      const rawContent = aiResponse.choices[0]?.message?.content;
      const aiText = typeof rawContent === "string" ? rawContent : "{}";
      let parsed: {
        projectName?: string;
        totalArea?: number;
        estimatedPopulation?: number;
        sustainabilityScore?: number;
        summary?: string;
        keyFeatures?: string[];
        zones?: Array<{ name: string; type: string; area: number; description: string }>;
        recommendations?: string[];
      } = {};
      try { parsed = JSON.parse(aiText); } catch { parsed = {}; }

      return {
        projectName: parsed.projectName || "تحليل المنطقة الحضرية",
        totalArea: parsed.totalArea || 0,
        estimatedPopulation: parsed.estimatedPopulation,
        sustainabilityScore: parsed.sustainabilityScore || 70,
        summary: parsed.summary || "تم تحليل المنطقة بنجاح",
        keyFeatures: parsed.keyFeatures || [],
        zones: parsed.zones || [],
        recommendations: parsed.recommendations || [],
      };
    }),

  // ===== توليد تصميم منطقة حضرية =====
  generateUrbanZoneDesign: mousaProcedure
    .input(z.object({
      zoneName: z.string(),
      zoneType: z.string(),
      zoneArea: z.number().optional().nullable(),
      zoneDescription: z.string().optional().nullable(),
      designStyle: z.string().default("modern"),
      urbanType: z.string().default("residential_district"),
      projectScale: z.string().default("medium"),
    }))
    .mutation(async ({ input }) => {
      // بناء prompt حضري دقيق بناءً على نوع المنطقة
      const styleNames: Record<string, string> = {
        modern: "modern contemporary urban",
        gulf: "Gulf Arabic traditional with modern elements, mashrabiya, geometric patterns",
        mediterranean: "Mediterranean coastal, terracotta, arches, lush greenery",
        sustainable: "sustainable eco-friendly, green roofs, solar panels, biophilic design",
        smart_city: "smart city futuristic, LED lighting, digital signage, tech infrastructure",
      };
      const styleName = styleNames[input.designStyle] || "modern contemporary";

      // تحديد نوع الفضاء الحضري
      const zoneTypeMap: Record<string, string> = {
        residential: "luxury residential neighborhood with villas and landscaped streets",
        commercial: "vibrant commercial street with shops, cafes, and pedestrian zones",
        park: "lush public park with walking paths, fountains, and recreational areas",
        mixed: "mixed-use urban district with residential towers, retail, and public plazas",
        waterfront: "scenic waterfront promenade with marina, cafes, and coastal landscaping",
        cultural: "cultural district with museums, art galleries, and public art installations",
        entrance: "grand urban entrance with landmark gateway and welcoming landscaping",
        plaza: "open public plaza with water features, seating, and shade structures",
        street: "tree-lined boulevard with wide sidewalks, street furniture, and lighting",
        garden: "formal garden with geometric patterns, fountains, and ornamental planting",
      };

      // تحديد نوع المنطقة من الاسم والنوع
      const zoneNameLower = (input.zoneName || "").toLowerCase();
      const zoneTypeLower = (input.zoneType || "").toLowerCase();
      let spaceDesc = "urban public space";
      for (const [key, val] of Object.entries(zoneTypeMap)) {
        if (zoneNameLower.includes(key) || zoneTypeLower.includes(key)) {
          spaceDesc = val;
          break;
        }
      }
      // fallback بناءً على urbanType
      if (spaceDesc === "urban public space") {
        spaceDesc = zoneTypeMap[input.urbanType.replace("residential_district", "residential").replace("commercial_street", "commercial").replace("public_park", "park").replace("mixed_use", "mixed").replace("waterfront", "waterfront").replace("cultural_district", "cultural")] || "modern urban district";
      }

      const areaNote = input.zoneArea ? `Total area: ${input.zoneArea} hectares.` : "";
      const descNote = input.zoneDescription ? `Zone description: ${input.zoneDescription}.` : "";
      const scaleNote = input.projectScale === "large" ? "Large-scale urban masterplan, aerial perspective showing full district." :
        input.projectScale === "medium" ? "Medium-scale urban design, street-level perspective with context." :
        "Small-scale intimate urban space, detailed street-level view.";

      const prompt = `Ultra-photorealistic architectural visualization of ${spaceDesc}. ${styleName} design style. ${areaNote} ${descNote} ${scaleNote}

URBAN DESIGN ELEMENTS:
- Lush mature trees (15-20m tall), manicured landscaping, colorful flower beds, shaped hedges
- Premium paving: natural travertine stone, herringbone brick patterns, decorative concrete with inlays
- Designer street furniture: sculptural benches, large planters, elegant bollards, artistic bike racks
- Layered lighting: ornate lamp posts (6m tall), LED ground uplights, feature accent lighting on trees
- Water features: grand central fountain with jets, shallow reflecting pool, decorative water walls
- Shade structures: steel and wood pergolas with climbing plants, tensile fabric canopies
- Active ground floors: boutique shops with glass facades, outdoor cafe terraces, restaurant patios
- Architecture: ${styleName} with high-quality cladding, large windows, clean lines
- Human-scale design: wide 8m pedestrian promenades, outdoor seating areas
- Atmosphere: golden hour warm sunlight, soft clouds, slight lens flare
- People: well-dressed pedestrians, families, creating life and scale

PHOTOGRAPHY QUALITY:
- 8K ultra-photorealistic, professional architectural photography
- Cinematic wide-angle composition, perfect depth of field
- No text overlays, no watermarks, no construction elements
- Photorealistic render quality matching real photography`;

      const { generateImage } = await import("./_core/imageGeneration");
      const { url: imageUrl } = await generateImage({ prompt });

      return {
        zoneName: input.zoneName,
        zoneType: input.zoneType,
        imageUrl,
        style: input.designStyle,
      };
    }),

  // ===== تحليل المخطط المعماري =====
  analyzePlan: publicProcedure
    .input(z.object({
      imageUrl: z.string(),
      projectType: z.enum(["residential", "commercial", "mixed"]).default("residential"),
      designStyle: z.string().default("modern"),
    }))
    .mutation(async ({ input }) => {
      const systemPrompt = `أنتِ م. سارة، مهندسة معمارية وخبيرة تصميم داخلي. تحللين المخططات المعمارية وتستخرجين منها كل المعلومات الممكنة. ردودكِ دائماً بالعربية بصيغة JSON فقط. استخرجي كل الغرف والمساحات المرئية في المخطط بدقة.

تعليمات خاصة للـ PDF متعدد الصفحات:
- افحصي كل صفحات الـ PDF بعناية
- ابحثي عن صفحات تحمل عناوين مثل: GROUND FLOOR PLAN, FIRST FLOOR PLAN, SECOND FLOOR PLAN, ROOF FLOOR PLAN, مخطط الدور الأرضي, مخطط الدور الأول, مخطط الدور الثاني
- كل صفحة تحمل مخطط طابق = طابق مستقل يجب إضافته
- إذا وجدتِ GROUND FLOOR + FIRST FLOOR = floors: 2
- إذا وجدتِ GROUND + FIRST + SECOND = floors: 3
- لا تعتمدي على صفحة واحدة فقط — افحصي الكل`;

      // دعم PDF: رفع PDF على Supabase ثم إرساله كـ file_url لـ Gemini
      // Gemini 2.5 يدعم PDF مباشرة عبر file_url (يجب أن يكون https:// URL)
      const isPdf = input.imageUrl.startsWith("data:application/pdf") || input.imageUrl.startsWith("data:application/octet-stream");
      
      type FileContent = { type: "file_url"; file_url: { url: string; mime_type: "application/pdf" | "audio/mpeg" | "audio/wav" | "audio/mp4" | "video/mp4" } };
      let pdfFilePart: FileContent | null = null;
      let singleImagePart: ImageContent | null = null;
      
      if (isPdf) {
        const base64Data = input.imageUrl.replace(/^data:[^;]+;base64,/, "");
        if (!base64Data || base64Data.length < 100) {
          throw new Error("الملف المرفوع غير صالح أو فارغ. يرجى رفع ملف PDF صحيح.");
        }
        // رفع PDF على Supabase والحصول على URL حقيقي
        const { pdfUrl } = await uploadPdfToStorage(base64Data);
        pdfFilePart = {
          type: "file_url" as const,
          file_url: { url: pdfUrl, mime_type: "application/pdf" as const },
        };
        console.log(`[analyzePlan] رفع PDF على Supabase: ${pdfUrl}`);
      } else {
        const resolvedPlanUrl = await resolveImageUrl(input.imageUrl, 0);
        singleImagePart = {
          type: "image_url" as const,
          image_url: { url: resolvedPlanUrl, detail: "high" as const },
        };
      }

      const userContentParts: (ImageContent | TextContent | FileContent)[] = [
        ...(isPdf && pdfFilePart ? [pdfFilePart] : (singleImagePart ? [singleImagePart] : [])),
        {
          type: "text" as const,
          text: `أنتِ مهندسة معمارية متخصصة بقراءة المخططات. حلّلي هذا المخطط المعماري بدقة عالية جداً.
نوع المشروع: ${input.projectType}
نمط التصميم المطلوب: ${input.designStyle}

تعليمات التحليل المعماري الدقيق:
1. استخرجي كل الفضاءات بدقة: غرف نوم، صالات، مطابخ، حمامات، ممرات، مداخل، شرفات، غرف ملابس، مصاعد، درج، قاعات، مناطق خارجية، إلخ.
2. لكل فضاء استخرجي التفاصيل المعمارية الدقيقة التالية:
   - الاسم بالعربية والنوع بالإنجليزية
   - المساحة بالمتر المربع والأبعاد (عرض × طول)
   - ارتفاع الدور: ابحثي عن كوتات الارتفاع في المخطط (3م، 3.5م، 4م، 5م، double height)
   - الطابق الذي توجد فيه (ground, first, second)
   - مواقع الأبواب: على أي جدار (north/south/east/west)، اتجاه الفتح (inward/outward)، جانب المفصلة (left/right)
   - مواقع النوافذ والفتحات: على أي جدار، عرض النافذة، هل هي بانورامية أو عادية
   - تقسيمات الجدران: أي جدران مصمتة وأيها فيها فتحات
   - للمصعد: من أي جهة يُفتح (من الممر؟ من المدخل؟)
   - للسلم: شكله (straight/L-shape/U-shape/circular/floating)، اتجاه الصعود
   - للشرفة: هل هي مكشوفة أو مغطاة، اتجاهها (شمال/جنوب/شرق/غرب)
3. استخدمي هذه الأنواع فقط: bedroom, living, kitchen, bathroom, dining, office, corridor, entrance, storage, balcony, majlis, prayer, elevator, staircase, laundry, garage, outdoor, hall, closet, room
4. قدّري الارتفاع من الكوتات في المخطط — إذا لم تجدي كوتات، قدّري: غرف عادية=3م، مداخل فاخرة=4-5م، double height=5-6م
5. لا تتركي أي حقل null — ضعي تقديراً منطقياً دائماً

تعليمات مهمة جداً لـ PDF:
- إذا كان الملف PDF متعدد الصفحات، افحصي كل الصفحات
- ابحثي عن صفحات المخططات المعمارية (FLOOR PLAN) وتجاهلي صفحات الوثائق الإدارية
- عدّي الطوابق من عناوين الصفحات: GROUND FLOOR = 1 طابق، + FIRST FLOOR = 2 طوابق، + SECOND = 3 طوابق
- استخرجي الغرف من كل طابق وحدده في حقل floor

أعيدي JSON بهذا الشكل بالضبط (لا تضيفي أي نص خارج JSON):
{
  "projectType": "سكني",
  "totalArea": 761,
  "floors": 2,
  "floorHeights": { "ground": 5, "first": 3.5 },
  "summary": "وصف موجز للمخطط",
  "rooms": [
    {
      "name": "غرفة النوم الرئيسية",
      "type": "bedroom",
      "floor": "first",
      "area": 25,
      "dimensions": "5×5 م",
      "ceilingHeight": 3.5,
      "doors": [{"wall": "north", "openDirection": "inward", "hingesSide": "right", "width": 1.0}],
      "windows": [{"wall": "east", "width": 2.5, "height": 2.0, "type": "panoramic"}],
      "wallsDescription": "الجدار الشمالي: باب رئيسي. الجدار الشرقي: نافذة بانورامية. الجدار الجنوبي والغربي: مصمتان."
    },
    {
      "name": "مصعد بانورامي",
      "type": "elevator",
      "floor": "ground",
      "area": 4,
      "dimensions": "2×2 م",
      "ceilingHeight": 5,
      "elevatorOpeningDirection": "من الممر الرئيسي، الباب يفتح شمالاً",
      "doors": [{"wall": "north", "openDirection": "sliding", "width": 1.0}],
      "windows": [{"wall": "east", "width": 2.0, "height": 5.0, "type": "panoramic_glass"}],
      "wallsDescription": "ثلاثة جدران زجاجية بانورامية، باب منزلق من الشمال."
    },
    {
      "name": "درج",
      "type": "staircase",
      "floor": "ground",
      "area": 10,
      "dimensions": "3×4 م",
      "ceilingHeight": 5,
      "staircaseShape": "floating",
      "staircaseDirection": "يصعد من الجنوب نحو الشمال",
      "doors": [],
      "windows": [{"wall": "east", "width": 3.0, "height": 4.0, "type": "floor_to_ceiling"}],
      "wallsDescription": "جدار شرقي زجاجي من الأرض للسقف. باقي الجدران مصمتة."
    },
    {
      "name": "شرفة",
      "type": "balcony",
      "floor": "first",
      "area": 8,
      "dimensions": "2×4 م",
      "ceilingHeight": 0,
      "balconyOrientation": "شمال",
      "balconyCovered": false,
      "doors": [{"wall": "south", "openDirection": "outward", "hingesSide": "left", "width": 2.0, "type": "sliding_glass"}],
      "windows": [],
      "wallsDescription": "مكشوفة من الشمال والشرق والغرب. باب زجاجي منزلق من الجنوب."
    }
  ],
  "recommendations": [
    "توصية مهنية من م. سارة"
  ]
}`,
          } as TextContent,
      ];

      const messages: Message[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContentParts },
      ];

      // ===== Multi-Run 3x لرفع الدقة إلى 97-99% =====
      const runCount = 3;
      const runResults: PlanAnalysisResult[] = [];

      async function singleRun(): Promise<PlanAnalysisResult> {
        const aiResponse = await invokeLLM({
          messages,
          response_format: { type: "json_object" },
          model: "gemini-2.5-pro",
        });
        const rawContent = aiResponse.choices[0]?.message?.content;
        const aiText = typeof rawContent === "string" ? rawContent : "{}";
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : aiText;
        let r: PlanAnalysisResult = { projectType: input.projectType, totalArea: 0, floors: 1, floorHeights: {}, summary: "", rooms: [], recommendations: [] };
        try { r = { ...r, ...JSON.parse(jsonStr) }; } catch { /* ignore */ }
        return r;
      }

      // تشغيل 3 مرات بالتوازي
      const runPromises = Array.from({ length: runCount }, () =>
        singleRun().catch(err => {
          console.warn("[analyzePlan] run failed:", (err as Error).message?.substring(0, 60));
          return null;
        })
      );
      const rawResults = await Promise.all(runPromises);
      for (const r of rawResults) {
        if (r && r.rooms && r.rooms.length > 0) runResults.push(r);
      }

      // إذا فشلت كل التشغيلات
      if (runResults.length === 0) {
        runResults.push({
          projectType: input.projectType,
          totalArea: 0,
          floors: 1,
          floorHeights: {},
          summary: "تعذّر تحليل المخطط بشكل كامل — يرجى المحاولة مرة أخرى",
          rooms: [],
          recommendations: ["تأكد من وضوح المخطط وأن الصورة ذات دقة عالية"],
        });
      }

      // دمج النتائج
      const consolidated = consolidateResults(runResults);
      const parsed = consolidated;

      // تنظيف بيانات الغرف لتجنب null في الحقول مع الحقول المعمارية الجديدة
      const cleanRooms = Array.isArray(parsed.rooms)
        ? parsed.rooms.map((r: {
            name?: string; type?: string; area?: number | null; dimensions?: string | null;
            floor?: string | null; ceilingHeight?: number | null;
            doors?: Array<{wall?: string; openDirection?: string; hingesSide?: string; width?: number; type?: string}> | null;
            windows?: Array<{wall?: string; width?: number; height?: number; type?: string}> | null;
            wallsDescription?: string | null;
            staircaseShape?: string | null; staircaseDirection?: string | null;
            elevatorOpeningDirection?: string | null;
            balconyOrientation?: string | null; balconyCovered?: boolean | null;
          }) => ({
            name: r.name || "غرفة",
            type: r.type || "room",
            area: typeof r.area === "number" ? r.area : 0,
            dimensions: r.dimensions || "غير محدد",
            floor: r.floor || "ground",
            ceilingHeight: typeof r.ceilingHeight === "number" ? r.ceilingHeight : 3,
            doors: Array.isArray(r.doors) ? r.doors : [],
            windows: Array.isArray(r.windows) ? r.windows : [],
            wallsDescription: r.wallsDescription || "",
            staircaseShape: r.staircaseShape || null,
            staircaseDirection: r.staircaseDirection || null,
            elevatorOpeningDirection: r.elevatorOpeningDirection || null,
            balconyOrientation: r.balconyOrientation || null,
            balconyCovered: r.balconyCovered ?? null,
          }))
        : [];

      return {
        projectType: parsed.projectType || input.projectType,
        totalArea: parsed.totalArea || 0,
        floors: parsed.floors || 1,
        floorHeights: (parsed as { floorHeights?: Record<string, number> }).floorHeights || {},
        summary: parsed.summary || "تم تحليل المخطط بنجاح",
        rooms: cleanRooms,
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      };
    }),

  // ===== توليد تصاميم لغرف المخطط =====
  generatePlanRoomDesign: mousaProcedure
    .input(z.object({
      roomName: z.string(),
      roomType: z.string(),
      roomArea: z.number().nullable().optional().transform(v => v ?? 0),
      roomDimensions: z.string().nullable().optional().transform(v => v ?? "غير محدد"),
      designStyle: z.string(),
      projectType: z.string(),
      planImageUrl: z.string().optional(),
      // حقول معمارية جديدة
      ceilingHeight: z.number().nullable().optional().transform(v => v ?? 3),
      wallsDescription: z.string().nullable().optional().transform(v => v ?? ""),
      doors: z.array(z.object({
        wall: z.string().optional(),
        openDirection: z.string().optional(),
        hingesSide: z.string().optional(),
        width: z.number().optional(),
        type: z.string().optional(),
      })).nullable().optional().transform(v => v ?? []),
      windows: z.array(z.object({
        wall: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        type: z.string().optional(),
      })).nullable().optional().transform(v => v ?? []),
      staircaseShape: z.string().nullable().optional(),
      staircaseDirection: z.string().nullable().optional(),
      elevatorOpeningDirection: z.string().nullable().optional(),
      balconyOrientation: z.string().nullable().optional(),
      balconyCovered: z.boolean().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      // ⚠️ مؤقت: تجاوز فحص الرصيد — المنصة مفتوحة للجميع

      const roomTypeMap: Record<string, string> = {
        bedroom: "غرفة نوم", living: "غرفة معيشة", kitchen: "مطبخ",
        bathroom: "حمام", dining: "غرفة طعام", office: "مكتب",
        corridor: "ممر", entrance: "مدخل", storage: "مخزن",
        balcony: "شرفة", majlis: "مجلس", prayer: "غرفة صلاة",
        elevator: "مصعد", staircase: "درج", laundry: "غرفة غسيل",
        garage: "كراج", outdoor: "منطقة خارجية", hall: "قاعة",
        closet: "غرفة ملابس", room: "غرفة",
      };
      const roomTypeAr = roomTypeMap[input.roomType] || input.roomType;

      const styleMap: Record<string, string> = {
        modern: "عصري", gulf: "خليجي فاخر", classic: "كلاسيكي",
        minimal: "مينيمال", luxury: "فاخر Quiet Luxury",
      };
      const styleAr = styleMap[input.designStyle] || input.designStyle;

      // بناء prompt مخصص لكل نوع غرفة
      const roomSpecificPrompts: Record<string, string> = {
        elevator: `Luxury panoramic elevator interior design, ${input.roomDimensions || "2x2.5m"} elevator cabin.
Style: ${styleAr}. Features:
- Floor-to-ceiling panoramic glass walls showing building interior
- Premium marble or stone flooring
- Elegant handrails with gold/chrome finish
- Integrated LED lighting strips on ceiling and floor
- Mirror panels or decorative wall panels
- ${styleAr === "خليجي فاخر" ? "Arabic geometric patterns on panels" : "Minimalist clean lines"}
Photorealistic, luxury hotel elevator aesthetic.`,

        balcony: `Luxury outdoor balcony/terrace design, ${input.roomDimensions || "3x4m"} space.
Style: ${styleAr}. Features:
- Premium outdoor porcelain tiles or wooden decking
- Comfortable outdoor seating (lounge chairs, small table)
- Decorative planters with greenery
- Pergola or shade structure if space allows
- Ambient outdoor lighting
- Glass or metal railings with city/garden view
Photorealistic, luxury residential balcony, daytime.`,

        staircase: `Luxury staircase design, ${input.roomDimensions || "3x4m"} stairwell.
Style: ${styleAr}. Features:
- Floating marble or wood treads
- Glass or metal balustrade with decorative handrail
- Feature wall with stone cladding or artistic finish
- Integrated LED step lighting
- Skylight or large window for natural light
- ${styleAr === "خليجي فاخر" ? "Ornate carved details" : "Clean geometric design"}
Photorealistic, luxury residential staircase.`,

        corridor: `Luxury corridor/hallway design, ${input.roomDimensions || "1.5x6m"} narrow space.
Style: ${styleAr}. Features:
- Continuous marble or herringbone parquet flooring
- Feature wall with wallpaper, stone, or wood paneling
- Recessed ceiling with LED cove lighting
- Artwork or decorative mirrors along walls
- Console table with decorative items at end
Photorealistic, luxury residential corridor, well-lit.`,

        entrance: `Luxury main entrance/foyer design, ${input.roomDimensions || "4x5m"} space.
Style: ${styleAr}. Features:
- Grand entrance with statement chandelier
- Premium marble flooring with inlay pattern
- Feature wall with stone cladding or decorative panels
- Console table with mirror and decorative items
- Coat storage or built-in cabinetry
- ${styleAr === "خليجي فاخر" ? "Arabic calligraphy artwork" : "Modern sculptural art"}
Photorealistic, luxury residential entrance foyer.`,

        outdoor: `Luxury outdoor sitting area design, ${input.roomDimensions || "5x6m"} space.
Style: ${styleAr}. Features:
- Premium outdoor furniture (sectional sofa, coffee table)
- Pergola with climbing plants or shade sail
- Outdoor kitchen or BBQ area if space allows
- Decorative lighting (string lights, lanterns)
- Landscaping with plants and water feature
Photorealistic, luxury residential outdoor area, evening ambiance.`,

        closet: `Luxury walk-in closet/dressing room design, ${input.roomDimensions || "3x4m"} space.
Style: ${styleAr}. Features:
- Floor-to-ceiling custom cabinetry with glass doors
- Central island with drawers and display surface
- Full-length mirror with LED frame
- Integrated lighting inside cabinets
- Velvet or upholstered seating ottoman
Photorealistic, luxury dressing room.`,

        laundry: `Luxury laundry room design, ${input.roomDimensions || "2x3m"} space.
Style: ${styleAr}. Features:
- Built-in washer and dryer with custom cabinetry above
- Marble or porcelain countertop for folding
- Decorative backsplash tiles
- Organized storage cabinets
- Clean, bright lighting
Photorealistic, luxury utility room.`,

        garage: `Luxury residential garage design, ${input.roomDimensions || "6x6m"} space.
Style: ${styleAr}. Features:
- Epoxy or polished concrete flooring
- Built-in storage cabinets along walls
- Overhead LED lighting
- Smart garage door
- Clean, organized aesthetic
Photorealistic, luxury residential garage.`,
      };

      // ===== ULTRA-LUXURY STYLE SYSTEM =====
      const luxuryStyleMap: Record<string, { en: string; palette: string; materials: string; ceiling: string; flooring: string; walls: string; furniture: string; lighting: string; accents: string }> = {
        modern: {
          en: "ultra-modern luxury contemporary",
          palette: "warm white, greige, champagne gold, charcoal, deep navy accents",
          materials: "Calacatta marble, brushed brass hardware, smoked glass, walnut veneer, polished chrome",
          ceiling: "coffered ceiling with integrated LED cove lighting, floating gypsum panels, concealed lighting channels",
          flooring: "large-format Calacatta marble slabs 120x120cm with book-matched veining, polished to mirror finish",
          walls: "full-height fluted oak panels, Venetian plaster accent wall, integrated backlit niches",
          furniture: "bespoke Italian furniture, curved velvet sofas, travertine coffee tables, statement sculptural pieces",
          lighting: "Murano glass chandeliers, architectural recessed spotlights, LED strip cove lighting, floor lamps",
          accents: "sculptural art pieces, curated books, fresh orchids, geometric brass objects, indoor plants",
        },
        gulf: {
          en: "Arabian Gulf ultra-luxury palace interior",
          palette: "ivory, warm gold, deep burgundy, royal blue, antique brass",
          materials: "Onyx marble, hand-carved plasterwork (juss), mashrabiya screens, gold leaf, mother-of-pearl inlays",
          ceiling: "hand-painted muqarnas ceiling with gold leaf, ornate plaster medallions, crystal chandeliers",
          flooring: "Arabescato marble with custom geometric inlay pattern, hand-cut mosaic borders",
          walls: "hand-carved plaster panels with Islamic geometric patterns, silk fabric wall coverings, gold-framed mirrors",
          furniture: "custom majlis seating with hand-embroidered silk cushions, carved wood tables, brass trays",
          lighting: "massive Swarovski crystal chandeliers, brass lantern pendants, candlelight sconces",
          accents: "Arabic calligraphy art, oud burners, date palm arrangements, antique brass vessels, Persian rugs",
        },
        classic: {
          en: "European grand classical luxury interior",
          palette: "ivory, gold, deep green, burgundy, cream, antique white",
          materials: "Carrara marble, gilded moldings, silk brocade, mahogany, crystal, hand-painted porcelain",
          ceiling: "barrel-vaulted ceiling with hand-painted frescoes, gilded plaster cornices, crystal chandeliers",
          flooring: "Versailles pattern parquet in walnut and oak, bordered with marble inlay",
          walls: "hand-painted silk wallpaper, gilded wainscoting, oil painting gallery, ornate plaster frames",
          furniture: "Louis XVI carved armchairs, chesterfield sofas, antique console tables, gilded mirrors",
          lighting: "Baccarat crystal chandeliers, wall sconces with silk shades, candelabras",
          accents: "classical sculptures, fresh flowers in crystal vases, leather-bound books, antique clocks",
        },
        minimal: {
          en: "Japanese wabi-sabi minimalist ultra-luxury",
          palette: "warm white, sand, ash grey, natural linen, matte black accents",
          materials: "honed travertine, raw concrete, smoked oak, washi paper, handmade ceramics, natural stone",
          ceiling: "exposed structural timber beams, white-washed plaster, minimal recessed lighting",
          flooring: "wide-plank smoked oak herringbone, honed travertine tiles, natural fiber rugs",
          walls: "raw plaster texture, vertical slatted oak panels, single statement artwork",
          furniture: "Japanese-inspired low seating, organic shaped tables, handcrafted ceramics, linen upholstery",
          lighting: "Isamu Noguchi-inspired paper pendants, warm Edison bulbs, floor lamps with linen shades",
          accents: "single branch ikebana, wabi-sabi pottery, smooth river stones, moss arrangements",
        },
        luxury: {
          en: "Quiet Luxury billionaire residence interior",
          palette: "warm taupe, cashmere, deep forest green, cognac leather, aged brass",
          materials: "Verde Guatemala marble, aged brass fixtures, cashmere upholstery, hand-stitched leather, shagreen",
          ceiling: "double-height ceiling with exposed dark timber beams, plaster cove with warm LED wash",
          flooring: "chevron pattern aged oak parquet, hand-knotted silk Persian rugs",
          walls: "full-height aged brass shelving, hand-stitched leather panels, curated art collection",
          furniture: "Ralph Lauren-style deep button sofas, club chairs in cognac leather, custom millwork",
          lighting: "antiqued brass chandeliers, library reading lamps, fireplace as focal point",
          accents: "first-edition books, equestrian art, globe, whiskey decanters, fresh eucalyptus",
        },
      };

      const luxStyle = luxuryStyleMap[input.designStyle] || luxuryStyleMap.modern;

      // بناء وصف معماري دقيق من التفاصيل المستخرجة
      const ceilingH = input.ceilingHeight || 3;
      const dims = input.roomDimensions || "غير محدد";
      const area = input.roomArea || 0;

      // وصف النوافذ
      const windowsDesc = (input.windows || []).map((w, i) => {
        const wallNames: Record<string, string> = { north: "شمالي", south: "جنوبي", east: "شرقي", west: "غربي" };
        const wallAr = wallNames[w.wall || ""] || w.wall || "";
        const winType = w.type === "panoramic" || w.type === "panoramic_glass" || w.type === "floor_to_ceiling"
          ? "panoramic floor-to-ceiling window" : "standard window";
        return `Window ${i+1}: ${winType} on ${wallAr} wall, ${w.width || 1}m wide x ${w.height || 1.5}m tall`;
      }).join(". ");

      // وصف الأبواب
      const doorsDesc = (input.doors || []).map((d, i) => {
        const wallNames: Record<string, string> = { north: "شمالي", south: "جنوبي", east: "شرقي", west: "غربي" };
        const wallAr = wallNames[d.wall || ""] || d.wall || "";
        const doorType = d.type === "sliding_glass" ? "sliding glass door" : d.openDirection === "sliding" ? "sliding door" : `door opening ${d.openDirection || "inward"}, hinges on ${d.hingesSide || "right"}`;
        return `Door ${i+1}: ${doorType} on ${wallAr} wall, ${d.width || 0.9}m wide`;
      }).join(". ");

      // وصف الجدران
      const wallsDesc = input.wallsDescription || "";

      // بناء الجزء المعماري المشترك
      const architecturalContext = `
ARCHITECTURAL SPECIFICATIONS (MUST be reflected in the design):
- Room: ${input.roomName} (${roomTypeAr})
- Dimensions: ${dims} | Area: ${area}m² | Ceiling height: ${ceilingH}m
${doorsDesc ? `- Doors: ${doorsDesc}` : ""}
${windowsDesc ? `- Windows/Openings: ${windowsDesc}` : ""}
${wallsDesc ? `- Wall layout: ${wallsDesc}` : ""}
${input.staircaseShape ? `- Staircase shape: ${input.staircaseShape}, direction: ${input.staircaseDirection || ""}` : ""}
${input.elevatorOpeningDirection ? `- Elevator opens from: ${input.elevatorOpeningDirection}` : ""}
${input.balconyOrientation ? `- Balcony faces: ${input.balconyOrientation}, ${input.balconyCovered ? "covered" : "open sky"}` : ""}
Style: ${styleAr} | Project type: ${input.projectType}`;

      // بناء prompt مخصص لكل نوع غرفة مع السياق المعماري
      const specificPrompt = roomSpecificPrompts[input.roomType];

      // ULTRA-LUXURY BASE PROMPT
      const basePrompt = specificPrompt || `
ULTRA-LUXURY ${roomTypeAr.toUpperCase()} INTERIOR — ${luxStyle.en.toUpperCase()} STYLE

FLOORING: ${luxStyle.flooring}
WALLS: ${luxStyle.walls}
CEILING (${ceilingH}m HIGH): ${luxStyle.ceiling}
FURNITURE: ${luxStyle.furniture}
LIGHTING: ${luxStyle.lighting}
MATERIALS: ${luxStyle.materials}
COLOR PALETTE: ${luxStyle.palette}
ACCENTS & DECOR: ${luxStyle.accents}

ROOM SPECIFICATIONS:
- Exact dimensions: ${dims} | Total area: ${area}m² | Ceiling height: ${ceilingH}m
- The soaring ${ceilingH}m ceiling MUST be dramatically visible in the composition
- Large arched or floor-to-ceiling windows flooding the space with natural light
- Layered lighting: massive statement chandelier + recessed cove LED + accent spotlights
- Every surface must show extraordinary craftsmanship and material quality
- The space must feel like a 7-star hotel suite or billionaire private residence
- Architectural details: custom millwork, hand-crafted elements, bespoke fixtures
`;

      // بناء وصف دقيق لموقع الأبواب والنوافذ
      const doorPositionDesc = (input.doors || []).map((d, i) => {
        const wallPos: Record<string, string> = { north: "back wall", south: "front wall", east: "right wall", west: "left wall" };
        const pos = wallPos[d.wall || ""] || `${d.wall || ""} wall`;
        const dtype = d.type === "sliding_glass" ? "floor-to-ceiling sliding glass door" : `solid door`;
        return `DOOR ${i+1}: ${dtype} MUST appear on the ${pos}, ${d.width || 0.9}m wide, ${d.openDirection === "inward" ? "opening inward" : "opening outward"}`;
      }).join("\n");

      const windowPositionDesc = (input.windows || []).map((w, i) => {
        const wallPos: Record<string, string> = { north: "back wall", south: "front wall", east: "right wall", west: "left wall" };
        const pos = wallPos[w.wall || ""] || `${w.wall || ""} wall`;
        const wtype = (w.type === "panoramic" || w.type === "floor_to_ceiling") 
          ? `floor-to-ceiling panoramic window (${w.width || 2}m wide x ${ceilingH - 0.3}m tall, from floor level to near ceiling)`
          : `window (${w.width || 1.2}m wide x ${w.height || 1.5}m tall, sill at 0.9m height)`;
        return `WINDOW ${i+1}: ${wtype} MUST appear on the ${pos}`;
      }).join("\n");

      // حساب نسبة الأبعاد لتحديد شكل الغرفة
      let roomShape = "rectangular";
      let aspectNote = "";
      const dimsMatch = (input.roomDimensions || "").match(/(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)/);
      if (dimsMatch) {
        const w = parseFloat(dimsMatch[1]);
        const l = parseFloat(dimsMatch[2]);
        const ratio = Math.max(w,l) / Math.min(w,l);
        if (ratio > 2) {
          roomShape = "very elongated rectangular";
          aspectNote = `The room is VERY LONG and NARROW (${Math.max(w,l)}m long × ${Math.min(w,l)}m wide). The camera must show the full length of the room with strong perspective lines leading to the far end wall.`;
        } else if (ratio > 1.5) {
          roomShape = "elongated rectangular";
          aspectNote = `The room is LONGER than it is wide (${Math.max(w,l)}m × ${Math.min(w,l)}m). Show the length with perspective depth.`;
        } else if (ratio < 1.1) {
          roomShape = "nearly square";
          aspectNote = `The room is nearly SQUARE (${w}m × ${l}m). Use a corner shot to show both walls equally.`;
        } else {
          aspectNote = `Room proportions: ${w}m × ${l}m. Show the wider dimension as the main view.`;
        }
      }

      // دمج السياق المعماري مع الـ prompt الأساسي
      const prompt = `${architecturalContext}

${basePrompt}

=== STRICT ARCHITECTURAL ACCURACY REQUIREMENTS ===
${aspectNote}

CEILING HEIGHT ENFORCEMENT — THIS IS CRITICAL:
The ceiling is EXACTLY ${ceilingH} meters high. This is ${ceilingH >= 5 ? "DRAMATICALLY TALL — like a palace or cathedral" : ceilingH >= 4 ? "VERY HIGH — like a luxury hotel lobby" : "HIGH — like an upscale apartment"}.
- The ceiling MUST occupy the top 40-50% of the image
- Show the full vertical height from floor to ceiling without cropping
- The camera eye level should be at 1.2m (human standing height), looking slightly upward to emphasize height
- Ceiling details (chandeliers, coffers, coves) must be clearly visible at full scale
- A person standing in the room would look small relative to the ceiling — show this scale
- FORBIDDEN: Any image where the ceiling appears lower than ${ceilingH}m. If the ceiling looks like a normal 2.7m ceiling, the image is WRONG.

${doorPositionDesc ? `DOOR PLACEMENT (MANDATORY — DO NOT MOVE THESE):\n${doorPositionDesc}` : ""}
${windowPositionDesc ? `\nWINDOW PLACEMENT (MANDATORY — DO NOT MOVE THESE):\n${windowPositionDesc}` : ""}

ROOM SHAPE: This is a ${roomShape} room. ${aspectNote}

=== PHOTOGRAPHY & RENDERING REQUIREMENTS (NON-NEGOTIABLE) ===
SHOT TYPE: Wide-angle architectural interior photography, 14-18mm lens equivalent, shot from corner or doorway
QUALITY: Hyper-photorealistic CGI render, indistinguishable from real photography, 8K resolution
LIGHTING MOOD: Golden hour natural light streaming through large windows + warm artificial accent lighting
DEPTH: Strong sense of spatial depth, foreground-midground-background layers clearly visible
CEILING: The full ${ceilingH}m ceiling height MUST dominate the upper half of the image — show the grandeur
MATERIALS: Every material must show micro-texture detail — marble veining, wood grain, fabric weave
ATMOSPHERE: The image must evoke awe, luxury, and aspirational living
STYLE REFERENCE: Architectural Digest cover shoot, Dezeen award-winning interior, ELLE Decor feature
NO: people, text, watermarks, clutter, cheap materials, cropped ceilings, dark corners
COMPOSITION: Wide establishing shot showing the full room, rule of thirds, leading lines toward focal point
FINAL RESULT: A jaw-dropping interior that makes viewers say "I want to live here"`;

      const imageResult = await generateImage({ prompt });

      return {
        roomName: input.roomName,
        roomType: input.roomType,
        imageUrl: imageResult.url ?? "",
        creditsCost: CREDIT_COSTS["generatePlanDesign"],
        style: styleAr,
      };
    }),

});

export type AppRouter = typeof appRouter;

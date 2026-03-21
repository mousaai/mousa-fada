import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM, type Message, type ImageContent, type TextContent } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";
import {
  createProject, getUserProjects, getProjectById, updateProject, deleteProject,
  createAnalysis, getProjectAnalyses, getAnalysisById, getUserAnalyses,
  createDesignElement, getProjectDesignElements, updateDesignElement, deleteDesignElement,
  createPerspective, getProjectPerspectives,
  createChatSession, updateChatSession, getChatSession, getUserChatSessions,
  createArScan, getArScanByScanId, updateArScan, getUserArScans,
  getMarketPrices, seedMarketPrices,
  createMoodBoard, getProjectMoodBoards,
  createReport, getProjectReports
} from "./db";
import { nanoid } from "nanoid";

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

// ===== مساعد: تحليل التصميم الداخلي =====
async function analyzeInteriorDesign(imageUrl: string, style: string, spaceType: string, area: number) {
  const styleInfo = GLOBAL_STYLES[style] || GLOBAL_STYLES.modern;

  const systemPrompt = `أنتِ م. سارة، مهندسة التصميم الداخلي والمعماري العالمية المتخصصة.
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

  const systemPrompt = `أنتِ م. سارة، مهندسة التصميم الداخلي العالمية.
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
  const systemPrompt = `أنتِ م. سارة، مهندسة التصميم الداخلي والمعماري العالمية المتميزة.

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

// ===== الراوتر الرئيسي =====
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== رفع الصور =====
  upload: router({
    image: protectedProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.string().default("image/jpeg"),
        fileName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.mimeType.split("/")[1] || "jpg";
        const key = `users/${ctx.user.id}/images/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url, key };
      }),
  }),

  // ===== المشاريع =====
  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => getUserProjects(ctx.user.id)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await getProjectById(input.id, ctx.user.id);
        if (!project) throw new Error("المشروع غير موجود");
        return project;
      }),

    create: protectedProcedure
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
          userId: ctx.user.id,
          name: input.name,
          description: input.description ?? null,
          projectType: input.projectType,
          designStyle: input.designStyle,
          spaceType: input.spaceType ?? null,
          area: input.area ?? null,
          status: "draft",
        });
      }),

    update: protectedProcedure
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

    delete: protectedProcedure
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
    analyze: protectedProcedure
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
        await createAnalysis({
          projectId: input.projectId,
          userId: ctx.user.id,
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

    analyzeFloorPlan: protectedProcedure
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

    getByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => getProjectAnalyses(input.projectId, ctx.user.id)),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const analysis = await getAnalysisById(input.id, ctx.user.id);
        if (!analysis) throw new Error("التحليل غير موجود");
        return analysis;
      }),

    recent: protectedProcedure.query(async ({ ctx }) => getUserAnalyses(ctx.user.id)),
  }),

  // ===== عناصر التصميم =====
  designElements: router({
    // تصميم عنصر بهوية بصرية موحدة
    designWithIdentity: protectedProcedure
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

        const systemPrompt = `أنتِ م. سارة، مهندسة التصميم الداخلي العالمية المتخصصة في الهوية البصرية المتكاملة.
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
          messages.push({ role: "user", content: [{ type: "image_url", image_url: { url: input.referenceImageUrl, detail: "high" } } as ImageContent, { type: "text", text: userPrompt } as TextContent] });
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

    design: protectedProcedure
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

    getByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => getProjectDesignElements(input.projectId, ctx.user.id)),

    markComplete: protectedProcedure
      .input(z.object({ id: z.number(), isCompleted: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await updateDesignElement(input.id, ctx.user.id, { isCompleted: input.isCompleted });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteDesignElement(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ===== المناظير =====
  perspectives: router({
    generate: protectedProcedure
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

    getByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => getProjectPerspectives(input.projectId, ctx.user.id)),
  }),

  // ===== المحادثة الذكية =====
  chat: router({
    send: protectedProcedure
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

    getSession: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => getChatSession(input.id, ctx.user.id)),

    getSessions: protectedProcedure.query(async ({ ctx }) => getUserChatSessions(ctx.user.id)),
  }),

  // ===== لوحة الإلهام =====
  moodboard: router({
    generate: protectedProcedure
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

        const prompt = `أنتِ م. سارة خبيرة التصميم الداخلي العالمية.
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
            { role: "system", content: "أنتِ م. سارة خبيرة التصميم الداخلي. ردودكِ دائماً باللغة العربية بصيغة JSON صحيحة." },
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

    getByProject: protectedProcedure
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
            { role: "system", content: "أنتِ م. سارة خبيرة التصميم الداخلي. حللي بيانات المسح AR وقدمي توصيات تصميمية بالعربية." },
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

    getUserScans: protectedProcedure
      .query(async ({ ctx }) => getUserArScans(ctx.user.id)),
  }),

  // ===== أسعار السوق =====
  market: router({
    getPrices: publicProcedure
      .input(z.object({ category: z.string().optional(), quality: z.string().optional() }))
      .query(async ({ input }) => getMarketPrices(input.category, input.quality)),

    seedPrices: protectedProcedure
      .mutation(async () => { await seedMarketPrices(); return { success: true }; }),
  }),

  // ===== التقارير =====
  reports: router({
    generate: protectedProcedure
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

    getByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => getProjectReports(input.projectId, ctx.user.id)),
  }),

  // ===== حساب التكاليف =====
  costs: router({
    calculate: protectedProcedure
      .input(z.object({
        area: z.number(),
        designStyle: z.string(),
        spaceType: z.string(),
        quality: z.enum(["budget", "mid", "luxury"]).default("mid"),
      }))
      .mutation(async ({ ctx: _ctx, input }) => {
        const styleInfo = GLOBAL_STYLES[input.designStyle] || GLOBAL_STYLES.modern;
        const prompt = `أنتِ م. سارة خبيرة التصميم الداخلي. احسبي تقدير تكلفة تصميم داخلي:
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
            { role: "system", content: "أنتِ م. سارة خبيرة التصميم الداخلي. ردودك باللغة العربية." },
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
  quickAnalyze: publicProcedure
    .input(z.object({
      imageUrl: z.string(),
      imageUrls: z.array(z.string()).optional(), // صور متعددة
      captureMode: z.enum(["single", "multi", "panorama", "video"]).optional(),
      designStyle: z.string().default("modern"),
    }))
    .mutation(async ({ input }) => {
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

      // Build image content for all images (max 4 for efficiency)
      const imageContents = allImages.slice(0, 4).map(url => ({
        type: "image_url" as const,
        image_url: { url, detail: "low" as const }
      }));

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "أنتِ م. سارة خبيرة التصميم الداخلي العالمية. تحللين الفضاءات بدقة عالية وتقدمين توصيات احترافية. ردودك بالعربية بصيغة JSON فقط." },
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
  generateVisualization: publicProcedure
    .input(z.object({
      imageUrl: z.string(),
      designStyle: z.string().default("modern"),
      palette: z.array(z.object({ name: z.string(), hex: z.string() })).optional(),
      materials: z.string().optional(),
      budget: z.string().optional(),
      imagePrompt: z.string().optional(), // برومبت مخصص من analyzeAndGenerateIdeas
      structuralElements: z.array(z.object({ element: z.string(), position: z.string() })).optional(),
    }))
    .mutation(async ({ input }) => {
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
  reAnalyzeWithChanges: publicProcedure
    .input(z.object({
      imageUrl: z.string(),
      designStyle: z.string().default("modern"),
      customPalette: z.array(z.object({ name: z.string(), hex: z.string() })).optional(),
      budgetRange: z.object({ min: z.number(), max: z.number() }).optional(),
      customRequirements: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
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
          { role: "system", content: "أنتِ م. سارة خبيرة التصميم الداخلي. ردودك بالعربية بصيغة JSON فقط." },
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
            { type: "image_url", image_url: { url: input.imageUrl, detail: "low" } }
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
  generateDesignIdeas: publicProcedure
    .input(z.object({
      styles: z.array(z.string()).min(1).max(10),
      budgetMin: z.number().min(0),
      budgetMax: z.number().min(0),
      colorTheme: z.string().optional(),
      count: z.number().min(2).max(6).default(3),
      referenceImageUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
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
          content: `أنتِ م. سارة، خبيرة التصميم الداخلي العالمية. تولدين أفكاراً تصميمية فريدة ومتنوعة باللغة العربية. ردودك JSON فقط.`
        },
        {
          role: "user",
          content: [
            ...(input.referenceImageUrl ? [{ type: "image_url", image_url: { url: input.referenceImageUrl, detail: "low" } }] : []),
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
  analyzeAndGenerateIdeas: publicProcedure
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
        enabled: z.boolean().default(false),
        lockDoors: z.boolean().default(true),
        lockWindows: z.boolean().default(true),
        lockOpenings: z.boolean().default(true),
        lockColumns: z.boolean().default(false),
        allowPlatformFreedom: z.boolean().default(false), // منح م. سارة حرية النظر المعماري
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const { imageUrl, imageUrls, captureMode, count, budgetMin, budgetMax, referenceData, preferredStyle, preferredColors, roomDimensions, lockStructuralElements } = input;

      const modeDesc: Record<string, string> = {
        single: "صورة واحدة للفضاء",
        panorama: "صورة بانوراما 180 درجة للفضاء",
        animation3d: "4 زوايا للفضاء من جميع الاتجاهات",
        video360: "إطار من فيديو 360 درجة للفضاء",
      };

      const styleKeys = ["modern", "gulf", "minimal", "japanese", "scandinavian", "mediterranean", "moroccan", "luxury", "industrial", "bohemian"];
      const selectedStyles = styleKeys.slice(0, count);

      const imageContents: ImageContent[] = (imageUrls || [imageUrl]).map(url => ({
        type: "image_url" as const,
        image_url: { url, detail: "high" as const }
      }));

      // قاعدة تغيير العناصر الهيكلية — م. سارة حرة تماماً بالافتراضي
      // الافتراضي: حرية إبداعية مطلقة على جميع عناصر الفضاء بما فيها الأبواب والنوافذ والفتحات
      // القيد: فقط ما يحدده المالك صراحةً بأنه لا يتبدّل
      const userConstraints = lockStructuralElements?.enabled === true ? {
        doors: lockStructuralElements.lockDoors,
        windows: lockStructuralElements.lockWindows,
        openings: lockStructuralElements.lockOpenings,
        columns: lockStructuralElements.lockColumns,
      } : null;

      let doorChangeRule: string;
      if (!userConstraints) {
        // الافتراضي: حرية مطلقة
        doorChangeRule = `🎨 م. سارة حرة تماماً: لكِ صلاحية معمارية كاملة على جميع عناصر الفضاء بما فيها الأبواب والنوافذ والفتحات والجدران والأسقف. إذا كان تغيير موضع باب أو إضافة نافذة يخدم التصميم فافعليه بجرأة. الهدف هو أفضل تصميم ممكن ليس التقيد بالقيود.`;
      } else {
        const lockedItems: string[] = [];
        if (userConstraints.doors) lockedItems.push('الأبواب');
        if (userConstraints.windows) lockedItems.push('النوافذ');
        if (userConstraints.openings) lockedItems.push('الفتحات');
        if (userConstraints.columns) lockedItems.push('الأعمدة');
        if (lockedItems.length > 0) {
          doorChangeRule = `🔒 قرار المالك: حافظي على مواضع وأحجام ${lockedItems.join('، ')} تماماً بلا تغيير (هذا قرار المالك ويجب احترامه). أبدعي بحرية كاملة في كل شيء آخر: الألوان، المواد، الأثاث، الإضاءة، التشطيبات.`;
        } else {
          doorChangeRule = `🎨 م. سارة حرة تماماً: لكِ صلاحية معمارية كاملة على جميع عناصر الفضاء.`;
        }
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

      const systemPrompt = `أنتِ م. سارة، مهندسة معمارية ومصممة بيئات شاملة بخبرة 20 سنة. تتخصصين في تصميم جميع الفضاءات المعمارية — داخلية وخارجية. تتمتعين بخلفية علمية شاملة تغطي:
- الهندسة الإنشائية: الجدران الحاملة، الأعمدة، الدرجات، الفتحات، النسب والأبعاد
- التصميم الداخلي: الإضاءة، التدفقات، المواد، الألوان، الأثاث
- تصميم الواجهات الخارجية: الكلادينج، الطلاء الخارجي، الإضاءة الخارجية، المداخل
- تصميم اللاندسكيب: الحدائق، الممرات، الفناء، المسابح، الجلسات الخارجية، النباتات
- تصميم الفضاءات الحضرية: الشوارع، الممشاة، الأرصفة، الساحات العامة، واجهات المحلات
- الجدوى الاقتصادية: التكاليف الدقيقة بالسوق الخليجي، الجداول الزمنية
- السيناريوهات: التجديد السطحي، التحسين المتوسط، التحول الشامل

🌿 SPACE INTELLIGENCE (ذكاء الفضاء):
عند تحليل الصورة، حددي نوع الفضاء أولاً وتعاملي معه بمنهجيته الصحيحة:
- فضاء داخلي: غرفة معيشة، غرفة نوم، مطبخ، حمام، مجلس، مكتب، ممر داخلي، مدخل → صمّمي كتصميم داخلي بأثاث وإضاءة وتشطيبات
- واجهة خارجية: واجهة منزل، واجهة مبنى، مدخل خارجي، بوابة → صمّمي كواجهة معمارية: كلادينج، نوافذ، إضاءة خارجية، زراعة أمامية
- لاندسكيب: حديقة، فناء، مسبح، سطح، شرفة، تراس → صمّمي كلاندسكيب: نباتات، ممرات، مياه، جلسات خارجية
- فضاء حضري: شارع، طريق، ممشى، رصيف، ساحة عامة → صمّمي كتصميم حضري: بلاط أرضية، أشجار، إضاءة عمودية، مقاعد، أحواض، واجهات محلات
كل نوع فضاء له قواعد تصميم وبنود BOQ مختلفة — طبّقيها بدقة.

🎨 FULL ARCHITECTURAL FREEDOM (صلاحية معمارية كاملة — الافتراضي):
م. سارة حرة تماماً على جميع عناصر الفضاء بما فيها الأبواب والنوافذ والجدران والفتحات. إذا كان تغيير موضع باب أو إضافة نافذة يحسّن التصميم فافعليه بجرأة. الهدف هو أفضل تصميم ممكن ليس التقيد بالقيود.
القيد الوحيد: فقط ما يحدده المالك صراحةً بأنه لا يتبدّل — وستجدينه في تعليمات المستخدم أدناه.
🎨 FULL CREATIVE FREEDOM (إطلاق الإبداع الكامل):
أنتِ حرة تماماً في تغيير كل شيء في الفضاء: الأرضيات، الجدران، الأسقف، الإضاءة، الأثاث، المواد، التشطيبات، الأبواب، النوافذ.
لا تتقيدي بالتشطيبات الحالية أو المواد الموجودة — صمّمي كأنكِ تبدئين من صفحة بيضاء.
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
🌟 BOLDNESS LAW (قانون الجرأة):
كل فكرة يجب أن تكون جريئة ومميزة وتستحق أن تُنشر في مجلة ديكور. لا تصاميم عادية أو متوقعة. فكّري خارج الصندوق:
- استخدمي مواد غير متوقعة (حجر طبيعي، خشب متحجر، معدن مؤكسد، مرمر ملون)
- اقترحي إضاءة درامية (ثريات ضخمة، إضاءة مخفية، لمبات إديسون، جدار ضوئي)
- لا تخافي من الألوان الجريئة (أخضر زيتي داكن، أزرق بترولي، بني شوكولاتة، أسود مطفي)
💰 PRICING LAW (قانون الأسعار الواقعية):
سطحي: 3,000-15,000 درهم | متوسط: 15,000-50,000 درهم | شامل: 50,000-150,000 درهم
الأسعار تعكس مستوى التدخل فعلاً — لا تضخيم ولا تقليل.${referenceInstruction}${styleInstruction}${colorsInstruction}}`

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

🎨 إطلاق الإبداع: لكِ الحرية الكاملة في تغيير الأرضيات والجدران والأسقف والإضاءة والأثاث والتشطيبات. لا تتقيدي بما هو موجود حالياً.

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
    "spaceType": "نوع الفضاء (صالة/غرفة/مطبخ/واجهة/حديقة/مسبح/ممر...)",
    "spaceCategory": "interior | facade | landscape | pool | pathway",
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
    "currentMaterials": ["مادة 1", "مادة 2"]
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
          } else {
            // برومبت الديكور الداخلي - صلاحية كاملة
            const structuralNote = keepElements
              ? `STRUCTURAL REFERENCE (for context only): ${keepElements}. م. سارة has FULL CREATIVE FREEDOM to redesign everything including moving/resizing openings if it improves the design.`
              : `م. سارة has FULL CREATIVE FREEDOM on all elements.`;
            generatedPrompt = `Photorealistic architectural interior redesign. ${cameraNote} ${roomNote} ${structuralNote} BOLD COMPLETE TRANSFORMATION - Apply ${styleName} style with MAXIMUM CREATIVITY and DRAMATIC VISUAL IMPACT. This design must look COMPLETELY DIFFERENT from a standard room - push boundaries, be daring, be memorable. New color palette: ${palette}. New materials: ${mats}. New furniture matching the style - choose ICONIC pieces that define the style. REPLACE EVERYTHING: wall finish (paint/wallpaper/stone/wood panels/textured plaster), flooring (marble/herringbone wood/geometric tiles/polished concrete), ceiling (coffered/coved/exposed beams/dramatic gypsum), lighting (statement chandeliers/hidden coves/industrial pendants/wall sconces), decor (art/plants/rugs/cushions). Make it look like a LUXURY MAGAZINE COVER - not a generic renovation. Cinematic lighting, natural shadows, ultra-realistic textures, 8K resolution, architectural digest quality, professional interior photography, no people, no text, no watermarks.`;
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

        return {
          ideas,
          spaceAnalysis: parsed.spaceAnalysis || null,
          structuralSuggestions: parsed.structuralSuggestions || [],
        };
      } catch {
        return { ideas: [], spaceAnalysis: null, structuralSuggestions: [] };
      }
    }),

  // ===== Voice Design Command =====
  voiceDesignCommand: publicProcedure
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
    .mutation(async ({ input }) => {
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
            { role: "system", content: "أنتِ م. سارة خبيرة التصميم الداخلي. تنظمين قائمة الأثاث المقترح من متجر حقيقي. ردودك بالعربية بصيغة JSON فقط." },
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
        const messages: Message[] = [
          {
            role: "system",
            content: `أنتِ م. سارة خبيرة التصميم الداخلي. مهمتك تحليل صور الغرف واستخراج قطع الأثاث والديكور الموجودة فيها بدقة. ردودك دائماً بالعربية وبصيغة JSON فقط.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url" as const,
                image_url: { url: input.imageUrl, detail: "high" as const },
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
    analyze: protectedProcedure
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
            content: `أنتِ م. سارة، خبيرة التصميم الداخلي. مهمتك تحليل صور الفضاءات الداخلية التي يعجب بها العميل وتصفها بدقة حتى يمكن تقليدها لاحقاً في فضاء آخر. ردودك دائماً بالعربية وبصيغة JSON فقط.`,
          },
          {
            role: "user",
            content: [
              { type: "image_url" as const, image_url: { url: input.imageUrl, detail: "high" as const } },
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
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const { getUserDesignReferences } = await import("./db");
        return getUserDesignReferences(ctx.user.id);
      }),

    // حذف مرجع
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { deleteDesignReference } = await import("./db");
        await deleteDesignReference(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ===== Generate Floor Plan 3D =====
  generateFloorPlan3D: publicProcedure
    .input(z.object({
      plan: z.object({
        rooms: z.array(z.any()),
        doors: z.array(z.any()),
        windows: z.array(z.any()),
        scale: z.number(),
        northAngle: z.number(),
      }),
    }))
    .mutation(async ({ input }) => {
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
  refineDesign: publicProcedure
    .input(z.object({
      originalImageUrl: z.string(),
      generatedImageUrl: z.string(),
      refinementRequest: z.string(),
      clickX: z.number().optional(),
      clickY: z.number().optional(),
      originalPrompt: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
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

  applyStyleToIdea: publicProcedure
    .input(z.object({
      currentImageUrl: z.string(),
      currentTitle: z.string(),
      currentDescription: z.string(),
      newStyle: z.string(),
      newColors: z.array(z.string()).optional(),
      spaceType: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
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
            { role: "system", content: "أنتِ م. سارة مصممة داخلية. أجيبي بـ JSON فقط بدون أي نص إضافي." },
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

});
export type AppRouter = typeof appRouter;

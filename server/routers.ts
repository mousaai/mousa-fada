import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM, type Message } from "./_core/llm";
import { storagePut } from "./storage";
import {
  createProject, getUserProjects, getProjectById, updateProject, deleteProject,
  createAnalysis, getProjectAnalyses, getAnalysisById, getUserAnalyses
} from "./db";
import { nanoid } from "nanoid";

// ===== مساعد الذكاء الاصطناعي للتصميم الداخلي =====
async function analyzeInteriorDesign(imageUrl: string, style: string, spaceType: string, area: number) {
  const styleNames: Record<string, string> = {
    modern: "عصري حديث",
    gulf: "خليجي عربي أصيل",
    classic: "كلاسيكي فاخر",
    minimal: "مينيمال بسيط"
  };

  const systemPrompt = `أنتِ م. سارة، خبيرة التصميم الداخلي والمعماري المتخصصة في التصميم الخليجي والعربي. 
تحللين الصور والمخططات المعمارية وتقدمين توصيات تصميم داخلي احترافية.
ردودك دائماً باللغة العربية الفصحى بأسلوب احترافي وأنيق.
تقدمين مقترحات عملية وواقعية تناسب السوق الخليجي.`;

  const userPrompt = `حللي هذه الصورة/المخطط وقدمي توصيات تصميم داخلي شاملة.

المعطيات:
- نمط التصميم المطلوب: ${styleNames[style] || style}
- نوع الفضاء: ${spaceType}
- المساحة: ${area} متر مربع

المطلوب منك تقديم تقرير JSON منظم يحتوي على:
{
  "overview": "وصف عام للفضاء وتقييمه",
  "styleDescription": "وصف تفصيلي لكيفية تطبيق النمط المختار",
  "colorPalette": [
    {"name": "اسم اللون", "hex": "#XXXXXX", "usage": "استخدامه في الفضاء", "percentage": 30}
  ],
  "materials": [
    {"name": "اسم المادة", "type": "نوعها", "description": "وصفها وأماكن استخدامها", "priceRange": "رخيص/متوسط/فاخر"}
  ],
  "furniture": [
    {"name": "اسم القطعة", "description": "وصفها", "quantity": 1, "priceMin": 500, "priceMax": 2000, "priority": "أساسي/اختياري"}
  ],
  "lighting": "توصيات الإضاءة التفصيلية",
  "flooring": "توصيات الأرضيات",
  "walls": "توصيات الجدران والديكور",
  "ceiling": "توصيات الأسقف",
  "recommendations": ["توصية 1", "توصية 2", "توصية 3"],
  "costEstimate": {
    "furniture": {"min": 5000, "max": 15000},
    "materials": {"min": 3000, "max": 8000},
    "labor": {"min": 2000, "max": 5000},
    "total": {"min": 10000, "max": 28000}
  },
  "timelineWeeks": 8
}`;

  const userMsg: Message = {
    role: "user",
    content: [
      { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
      { type: "text", text: userPrompt }
    ]
  };

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      userMsg,
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
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserProjects(ctx.user.id);
    }),

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
        designStyle: z.enum(["modern", "gulf", "classic", "minimal"]).default("modern"),
        spaceType: z.string().optional(),
        area: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createProject({
          userId: ctx.user.id,
          name: input.name,
          description: input.description ?? null,
          designStyle: input.designStyle,
          spaceType: input.spaceType ?? null,
          area: input.area ?? null,
          status: "draft",
        });
        const projects = await getUserProjects(ctx.user.id);
        return projects[0];
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        designStyle: z.enum(["modern", "gulf", "classic", "minimal"]).optional(),
        spaceType: z.string().optional(),
        area: z.number().optional(),
        status: z.enum(["draft", "analyzed", "completed"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateProject(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteProject(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ===== التحليلات =====
  analyses: router({
    analyze: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        imageUrl: z.string(),
        imageKey: z.string().optional(),
        designStyle: z.enum(["modern", "gulf", "classic", "minimal"]).default("modern"),
        spaceType: z.string().default("غرفة معيشة"),
        area: z.number().default(30),
      }))
      .mutation(async ({ ctx, input }) => {
        // تحليل الصورة بالذكاء الاصطناعي
        const result = await analyzeInteriorDesign(
          input.imageUrl,
          input.designStyle,
          input.spaceType,
          input.area
        );

        // حفظ التحليل في قاعدة البيانات
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

        // تحديث حالة المشروع
        await updateProject(input.projectId, ctx.user.id, { status: "analyzed" });

        // إرجاع آخر تحليل
        const allAnalyses = await getProjectAnalyses(input.projectId, ctx.user.id);
        return allAnalyses[0];
      }),

    getByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        return getProjectAnalyses(input.projectId, ctx.user.id);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const analysis = await getAnalysisById(input.id, ctx.user.id);
        if (!analysis) throw new Error("التحليل غير موجود");
        return analysis;
      }),

    recent: protectedProcedure.query(async ({ ctx }) => {
      return getUserAnalyses(ctx.user.id);
    }),
  }),

  // ===== حساب التكاليف =====
  costs: router({
    calculate: protectedProcedure
      .input(z.object({
        area: z.number(),
        designStyle: z.enum(["modern", "gulf", "classic", "minimal"]),
        spaceType: z.string(),
        quality: z.enum(["budget", "mid", "luxury"]).default("mid"),
      }))
      .mutation(async ({ ctx, input }) => {
        const prompt = `أنتِ م. سارة خبيرة التصميم الداخلي. احسبي تقدير تكلفة تصميم داخلي للمعطيات التالية:
- المساحة: ${input.area} متر مربع
- نمط التصميم: ${input.designStyle}
- نوع الفضاء: ${input.spaceType}
- مستوى الجودة: ${input.quality === 'budget' ? 'اقتصادي' : input.quality === 'mid' ? 'متوسط' : 'فاخر'}

قدمي تقدير التكلفة بالريال السعودي بصيغة JSON:
{
  "breakdown": [
    {"category": "الأثاث", "min": 5000, "max": 15000, "notes": "ملاحظات"},
    {"category": "المواد والتشطيبات", "min": 3000, "max": 8000, "notes": "ملاحظات"},
    {"category": "الإضاءة", "min": 1000, "max": 3000, "notes": "ملاحظات"},
    {"category": "العمالة والتركيب", "min": 2000, "max": 5000, "notes": "ملاحظات"},
    {"category": "الستائر والمفروشات", "min": 1500, "max": 4000, "notes": "ملاحظات"},
    {"category": "الديكور والإكسسوار", "min": 500, "max": 2000, "notes": "ملاحظات"}
  ],
  "total": {"min": 13000, "max": 37000},
  "pricePerSqm": {"min": 400, "max": 1200},
  "timeline": "8-12 أسبوع",
  "tips": ["نصيحة للتوفير 1", "نصيحة 2"]
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "أنتِ م. سارة خبيرة التصميم الداخلي. ردودك دائماً باللغة العربية." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        });

        const rawContent2 = response.choices[0]?.message?.content;
        const content2 = typeof rawContent2 === 'string' ? rawContent2 : JSON.stringify(rawContent2) || "{}";
        try {
          return JSON.parse(content2);
        } catch {
          return { breakdown: [], total: { min: 0, max: 0 }, tips: [] };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;

/**
 * محرك تحليل المخططات المعمارية المتقدم
 * يستخدم Gemini 2.5 Pro لتحليل المخططات واستخراج الغرف والأبعاد والاتجاهات بدقة عالية
 * ثم يولّد أفكار تصميم دقيقة لكل غرفة مع صورة مولّدة
 */
import { invokeLLM, type ImageContent, type TextContent } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";

export type Room = {
  name: string;
  type: "living" | "bedroom" | "kitchen" | "bathroom" | "corridor" | "dining" | "office" | "other";
  width: number;
  length: number;
  area: number;
  windows: number;
  doors: number;
  notes: string;
  orientation?: string;
};

export type FloorPlanAnalysis = {
  projectType: "villa" | "apartment" | "office" | "shop" | "other";
  totalArea: number;
  rooms: Room[];
  floors: number;
  orientation: string;
  specialFeatures: string[];
  structuralNotes: string;
  designOpportunities: string[];
  challenges: string[];
  recommendedStyle: string;
  estimatedTotalCost: { min: number; max: number };
};

export type RoomDesignIdea = {
  roomName: string;
  roomType: string;
  designStyle: string;
  colorPalette: string;
  materials: string;
  furniture: string;
  lighting: string;
  specialFeatures: string;
  estimatedCost: { min: number; max: number };
  imageUrl?: string;
};

/**
 * تحليل المخطط المعماري بدقة عالية
 * يستخدم Gemini 2.5 Pro لقراءة المخطط واستخراج جميع التفاصيل
 */
export async function analyzeFloorPlanAdvanced(
  imageUrl: string
): Promise<FloorPlanAnalysis> {
  const systemPrompt = `أنتِ م. سارة، مهندسة معمارية متخصصة في قراءة وتحليل المخططات المعمارية.
تستطيعين قراءة أي مخطط معماري وتحديد الغرف والأبعاد والمساحات بدقة عالية.
ردودك باللغة العربية.`;

  const userPrompt = `حللي هذا المخطط المعماري واستخرجي جميع التفاصيل التالية بدقة:

**مطلوب:**
- نوع المشروع (فيلا/شقة/مكتب/محل)
- المساحة الإجمالية بالمتر المربع
- قائمة الغرف مع:
  * الاسم (صالة، غرفة نوم رئيسية، مطبخ، حمام، ممر، إلخ)
  * النوع (living/bedroom/kitchen/bathroom/corridor/dining/office/other)
  * العرض والطول بالمتر
  * المساحة بالمتر المربع
  * عدد النوافذ والأبواب
  * ملاحظات خاصة (إن وجدت)
  * الاتجاه (شمال/جنوب/شرق/غرب) إن أمكن
- عدد الطوابق
- الاتجاه الرئيسي للمبنى
- الميزات الخاصة (حديقة، مسبح، مدخل مزدوج، إلخ)
- ملاحظات إنشائية (أعمدة، جدران حاملة، إلخ)
- فرص تصميمية (مساحات يمكن استغلالها بشكل أفضل)
- تحديات (مساحات ضيقة، زوايا صعبة، إلخ)
- النمط الأنسب للمخطط
- تقدير التكلفة الإجمالية للتصميم الداخلي (حد أدنى وأقصى بالريال السعودي)

**ملاحظات:**
- استخرج الأبعاد بالمتر إن أمكن
- إذا لم تظهر الأبعاد بوضوح، قدّر بناءً على النسب المرئية والمقياس
- احسب المساحات بدقة (العرض × الطول)
- حدد الاتجاه الرئيسي للمبنى إن أمكن (شمال/جنوب/شرق/غرب)`;

  const response = await invokeLLM({
    model: "gemini-2.5-pro",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageUrl, detail: "high" } } as ImageContent,
          { type: "text", text: userPrompt } as TextContent,
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "floor_plan_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            projectType: {
              type: "string",
              enum: ["villa", "apartment", "office", "shop", "other"],
            },
            totalArea: { type: "number" },
            rooms: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: {
                    type: "string",
                    enum: [
                      "living",
                      "bedroom",
                      "kitchen",
                      "bathroom",
                      "corridor",
                      "dining",
                      "office",
                      "other",
                    ],
                  },
                  width: { type: "number" },
                  length: { type: "number" },
                  area: { type: "number" },
                  windows: { type: "number" },
                  doors: { type: "number" },
                  notes: { type: "string" },
                  orientation: { type: "string" },
                },
                required: [
                  "name",
                  "type",
                  "width",
                  "length",
                  "area",
                  "windows",
                  "doors",
                  "notes",
                ],
                additionalProperties: false,
              },
            },
            floors: { type: "number" },
            orientation: { type: "string" },
            specialFeatures: { type: "array", items: { type: "string" } },
            structuralNotes: { type: "string" },
            designOpportunities: { type: "array", items: { type: "string" } },
            challenges: { type: "array", items: { type: "string" } },
            recommendedStyle: { type: "string" },
            estimatedTotalCost: {
              type: "object",
              properties: {
                min: { type: "number" },
                max: { type: "number" },
              },
              required: ["min", "max"],
              additionalProperties: false,
            },
          },
          required: [
            "projectType",
            "totalArea",
            "rooms",
            "floors",
            "orientation",
            "specialFeatures",
            "structuralNotes",
            "designOpportunities",
            "challenges",
            "recommendedStyle",
            "estimatedTotalCost",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const rawContent = response.choices[0]?.message?.content;
  const content =
    typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent) || "{}";

  try {
    return JSON.parse(content) as FloorPlanAnalysis;
  } catch (err) {
    console.error("[analyzeFloorPlanAdvanced] JSON parse error:", err);
    throw new Error("فشل تحليل المخطط: الرد من Gemini غير صالح");
  }
}

/**
 * توليد أفكار تصميم دقيقة لغرفة معينة مع صورة مولّدة
 * يستخدم Gemini 2.5 Flash لتوليد الأفكار و Imagen 4 لتوليد الصورة
 */
export async function generateRoomDesignIdea(
  room: Room,
  overallStyle: string
): Promise<RoomDesignIdea> {
  const systemPrompt = `أنتِ م. سارة، مصممة داخلية متخصصة في تصميم الغرف بناءً على الأبعاد الفعلية.
تستطيعين تحليل أبعاد الغرفة وتوليد أفكار تصميم دقيقة تناسب المساحة والوظيفة.
ردودك باللغة العربية.`;

  const userPrompt = `ولّدي فكرة تصميم داخلي دقيقة لهذه الغرفة:

**معلومات الغرفة:**
- الاسم: ${room.name}
- النوع: ${room.type}
- الأبعاد: ${room.width}م × ${room.length}م
- المساحة: ${room.area}م²
- عدد النوافذ: ${room.windows}
- عدد الأبواب: ${room.doors}
- ملاحظات: ${room.notes}
- الاتجاه: ${room.orientation || "غير محدد"}

**النمط المطلوب:** ${overallStyle}

**مطلوب:**
- نمط التصميم الدقيق
- لوحة الألوان المناسبة
- المواد المقترحة (أرضيات، جدران، سقف)
- الأثاث المناسب للمساحة (مع الأبعاد التقريبية)
- نظام الإضاءة المقترح
- ميزات خاصة (إن وجدت)
- تقدير التكلفة (حد أدنى وأقصى بالريال السعودي)

**ملاحظات:**
- راعي الأبعاد الفعلية للغرفة
- اقترح أثاثاً يناسب المساحة المتاحة
- ركّز على الوظيفة والجمالية معاً`;

  const response = await invokeLLM({
    model: "gemini-2.5-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "room_design_idea",
        strict: true,
        schema: {
          type: "object",
          properties: {
            designStyle: { type: "string" },
            colorPalette: { type: "string" },
            materials: { type: "string" },
            furniture: { type: "string" },
            lighting: { type: "string" },
            specialFeatures: { type: "string" },
            estimatedCost: {
              type: "object",
              properties: {
                min: { type: "number" },
                max: { type: "number" },
              },
              required: ["min", "max"],
              additionalProperties: false,
            },
          },
          required: [
            "designStyle",
            "colorPalette",
            "materials",
            "furniture",
            "lighting",
            "specialFeatures",
            "estimatedCost",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const rawContent = response.choices[0]?.message?.content;
  const content =
    typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent) || "{}";

  let designIdea: Omit<RoomDesignIdea, "roomName" | "roomType">;
  try {
    designIdea = JSON.parse(content);
  } catch (err) {
    console.error("[generateRoomDesignIdea] JSON parse error:", err);
    throw new Error("فشل توليد فكرة التصميم: الرد من Gemini غير صالح");
  }

  // توليد صورة للغرفة بناءً على الفكرة
  const imagePrompt = `Photorealistic interior design render of a ${room.type} room (${room.name}). 
Room dimensions: ${room.width}m × ${room.length}m (${room.area}m²). 
Design style: ${designIdea.designStyle}. 
Color palette: ${designIdea.colorPalette}. 
Materials: ${designIdea.materials}. 
Furniture: ${designIdea.furniture}. 
Lighting: ${designIdea.lighting}. 
Special features: ${designIdea.specialFeatures}. 
Ultra-realistic, 8K resolution, architectural digest quality, cinematic lighting, natural shadows, no people, no text.`;

  let imageUrl: string | undefined;
  try {
    const imageResult = await generateImage({ prompt: imagePrompt });
    imageUrl = imageResult.url;
  } catch (err) {
    console.warn("[generateRoomDesignIdea] Image generation failed:", (err as Error).message);
    // الاستمرار بدون صورة
  }

  return {
    roomName: room.name,
    roomType: room.type,
    ...designIdea,
    imageUrl,
  };
}

/**
 * تحليل المخطط وتوليد أفكار تصميم لجميع الغرف
 * الدالة الرئيسية التي تجمع التحليل والتوليد
 */
export async function analyzeAndDesignFloorPlan(imageUrl: string): Promise<{
  analysis: FloorPlanAnalysis;
  roomDesigns: RoomDesignIdea[];
}> {
  // المرحلة الأولى: تحليل المخطط
  const analysis = await analyzeFloorPlanAdvanced(imageUrl);

  // المرحلة الثانية: توليد أفكار تصميم لكل غرفة (بالتوازي لتسريع العملية)
  const roomDesigns = await Promise.all(
    analysis.rooms.map((room) =>
      generateRoomDesignIdea(room, analysis.recommendedStyle)
    )
  );

  return { analysis, roomDesigns };
}

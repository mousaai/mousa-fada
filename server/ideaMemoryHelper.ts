/**
 * ideaMemoryHelper.ts
 * نظام ذاكرة الأفكار — يحفظ كل فكرة مولّدة ويمنع التكرار
 * ويتيح التعديل على أي فكرة سابقة بناءً على طلب المستخدم
 */

import { getDb } from "./db";
import { projectIdeas } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

// ===== hash الصورة =====
export function hashImageUrl(imageUrl: string): string {
  // نأخذ آخر 200 حرف من URL لتجنب الـ tokens المتغيرة
  const normalized = imageUrl.replace(/[?&].*$/, "").slice(-200);
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 32);
}

// ===== حفظ فكرة جديدة =====
export async function saveGeneratedIdea(params: {
  userId: number;
  imageUrl: string;
  projectId?: number;
  idea: {
    id?: string;
    title: string;
    style: string;
    styleLabel?: string;
    scenario?: string;
    palette?: Array<{ name: string; hex: string }>;
    materials?: string[];
    imagePrompt?: string;
    visualizationUrl?: string;
    costMin?: number;
    costMax?: number;
  };
  isRefinement?: boolean;
  parentIdeaId?: number;
  refinementRequest?: string;
}): Promise<number> {
  const imageHash = hashImageUrl(params.imageUrl);
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(projectIdeas).values({
    userId: params.userId,
    imageHash,
    projectId: params.projectId ?? null,
    ideaId: params.idea.id || crypto.randomUUID().slice(0, 16),
    title: params.idea.title,
    style: params.idea.style,
    styleLabel: params.idea.styleLabel ?? null,
    scenario: params.idea.scenario ?? null,
    paletteJson: params.idea.palette ?? null,
    materialsJson: params.idea.materials ?? null,
    imagePrompt: params.idea.imagePrompt ?? null,
    visualizationUrl: params.idea.visualizationUrl ?? null,
    costMin: params.idea.costMin ?? null,
    costMax: params.idea.costMax ?? null,
    isRefinement: params.isRefinement ?? false,
    parentIdeaId: params.parentIdeaId ?? null,
    refinementRequest: params.refinementRequest ?? null,
  });
  return (result as { insertId: number }).insertId;
}

// ===== جلب الأفكار السابقة لصورة معينة =====
export async function getPreviousIdeasForImage(params: {
  userId: number;
  imageUrl: string;
  limit?: number;
}): Promise<Array<{
  id: number;
  title: string;
  style: string;
  styleLabel: string | null;
  scenario: string | null;
  palette: Array<{ name: string; hex: string }> | null;
  materials: string[] | null;
  isRefinement: boolean;
  createdAt: Date;
}>> {
  const imageHash = hashImageUrl(params.imageUrl);
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: projectIdeas.id,
      title: projectIdeas.title,
      style: projectIdeas.style,
      styleLabel: projectIdeas.styleLabel,
      scenario: projectIdeas.scenario,
      paletteJson: projectIdeas.paletteJson,
      materialsJson: projectIdeas.materialsJson,
      isRefinement: projectIdeas.isRefinement,
      createdAt: projectIdeas.createdAt,
    })
    .from(projectIdeas)
    .where(
      and(
        eq(projectIdeas.userId, params.userId),
        eq(projectIdeas.imageHash, imageHash)
      )
    )
    .orderBy(desc(projectIdeas.createdAt))
    .limit(params.limit ?? 20);

  return rows.map((r: typeof rows[number]) => ({
    id: r.id,
    title: r.title,
    style: r.style,
    styleLabel: r.styleLabel,
    scenario: r.scenario,
    palette: r.paletteJson as Array<{ name: string; hex: string }> | null,
    materials: r.materialsJson as string[] | null,
    isRefinement: r.isRefinement,
    createdAt: r.createdAt,
  }));
}

// ===== جلب فكرة واحدة بالـ ID =====
export async function getIdeaById(ideaDbId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(projectIdeas)
    .where(eq(projectIdeas.id, ideaDbId))
    .limit(1);
  return row ?? null;
}

// ===== بناء نص "الأفكار المستخدمة" للـ AI =====
export function buildUsedStylesNote(
  previousIdeas: Array<{ title: string; style: string; styleLabel: string | null; scenario: string | null }>
): string {
  if (!previousIdeas.length) return "";

  const lines = previousIdeas.map((idea, i) => {
    const label = idea.styleLabel || idea.style;
    const scenario = idea.scenario ? ` (${idea.scenario})` : "";
    return `  ${i + 1}. "${idea.title}" — نمط: ${label}${scenario}`;
  });

  return `\n\n🚫 الأفكار المُولَّدة مسبقاً لهذه الصورة (يجب تجنب تكرارها تماماً):\n${lines.join("\n")}\n\n⚠️ قانون التنوع الإلزامي: كل فكرة جديدة يجب أن تكون مختلفة كلياً عن الأفكار أعلاه — نمط مختلف، لوحة ألوان مختلفة، مواد مختلفة، مفهوم مختلف. لا تكرر أي نمط أو مفهوم سبق تقديمه.`;
}

// ===== بناء تعليمات التعديل للـ AI =====
export function buildRefinementNote(params: {
  originalIdea: {
    title: string;
    style: string;
    styleLabel: string | null;
    palette: Array<{ name: string; hex: string }> | null;
    materials: string[] | null;
    imagePrompt: string | null;
  };
  refinementRequest: string;
}): string {
  const { originalIdea, refinementRequest } = params;
  const paletteStr = (originalIdea.palette || []).map((c) => `${c.name} (${c.hex})`).join(", ");
  const materialsStr = (originalIdea.materials || []).join(", ");

  return `\n\n🔧 طلب تعديل على فكرة موجودة:
الفكرة الأصلية: "${originalIdea.title}" — نمط: ${originalIdea.styleLabel || originalIdea.style}
الألوان الأصلية: ${paletteStr || "غير محددة"}
المواد الأصلية: ${materialsStr || "غير محددة"}
طلب التعديل من المستخدم: "${refinementRequest}"

⚠️ قانون التعديل: احتفظي بجوهر الفكرة الأصلية لكن طبّقي التعديل المطلوب بدقة. إذا طلب المستخدم تغيير لون → غيّري اللون فقط. إذا طلب تغيير مادة → غيّري المادة فقط. إذا طلب تغيير أسلوب → طبّقي الأسلوب الجديد على نفس الفضاء.`;
}

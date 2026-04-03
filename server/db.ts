import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, projects, analyses, designElements, perspectives, chatSessions,
  arScans, marketPrices, moodBoards, reports, designReferences,
  InsertProject, InsertAnalysis, InsertDesignElement, InsertPerspective, InsertChatSession,
  InsertArScan, InsertMarketPrice, InsertMoodBoard, InsertReport
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    // حقول المصادقة المستقلة
    const authFields = ["passwordHash", "passwordResetToken", "emailVerifyToken"] as const;
    for (const field of authFields) {
      if ((user as any)[field] !== undefined) {
        (values as any)[field] = (user as any)[field] ?? null;
        updateSet[field] = (user as any)[field] ?? null;
      }
    }
    if ((user as any).passwordResetExpiry !== undefined) {
      (values as any).passwordResetExpiry = (user as any).passwordResetExpiry ?? null;
      updateSet.passwordResetExpiry = (user as any).passwordResetExpiry ?? null;
    }
    if ((user as any).emailVerified !== undefined) {
      (values as any).emailVerified = (user as any).emailVerified;
      updateSet.emailVerified = (user as any).emailVerified;
    }
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.passwordResetToken, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== استعلامات المشاريع =====
export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(projects).values(data);
  const result = await db.select().from(projects).where(eq(projects.userId, data.userId)).orderBy(desc(projects.createdAt)).limit(1);
  return result[0];
}

export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, userId))).limit(1);
  return result[0] ?? null;
}

export async function updateProject(id: number, userId: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projects).set(data).where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

export async function deleteProject(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

// ===== استعلامات التحليلات =====
export async function createAnalysis(data: InsertAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(analyses).values(data);
  const result = await db.select().from(analyses).where(eq(analyses.userId, data.userId)).orderBy(desc(analyses.createdAt)).limit(1);
  return result[0];
}

export async function getProjectAnalyses(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(analyses).where(and(eq(analyses.projectId, projectId), eq(analyses.userId, userId))).orderBy(desc(analyses.createdAt));
}

export async function getAnalysisById(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(analyses).where(and(eq(analyses.id, id), eq(analyses.userId, userId))).limit(1);
  return result[0] ?? null;
}

export async function getUserAnalyses(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(analyses).where(eq(analyses.userId, userId)).orderBy(desc(analyses.createdAt)).limit(20);
}

// ===== استعلامات عناصر التصميم =====
export async function createDesignElement(data: InsertDesignElement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(designElements).values(data);
  const result = await db.select().from(designElements)
    .where(and(eq(designElements.projectId, data.projectId), eq(designElements.userId, data.userId)))
    .orderBy(desc(designElements.createdAt)).limit(1);
  return result[0];
}

export async function getProjectDesignElements(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(designElements)
    .where(and(eq(designElements.projectId, projectId), eq(designElements.userId, userId)))
    .orderBy(designElements.sortOrder, designElements.createdAt);
}

export async function updateDesignElement(id: number, userId: number, data: Partial<InsertDesignElement>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(designElements).set(data).where(and(eq(designElements.id, id), eq(designElements.userId, userId)));
}

export async function deleteDesignElement(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(designElements).where(and(eq(designElements.id, id), eq(designElements.userId, userId)));
}

// ===== استعلامات المناظير =====
export async function createPerspective(data: InsertPerspective) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(perspectives).values(data);
  const result = await db.select().from(perspectives)
    .where(and(eq(perspectives.projectId, data.projectId), eq(perspectives.userId, data.userId)))
    .orderBy(desc(perspectives.createdAt)).limit(1);
  return result[0];
}

export async function getProjectPerspectives(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(perspectives)
    .where(and(eq(perspectives.projectId, projectId), eq(perspectives.userId, userId)))
    .orderBy(desc(perspectives.createdAt));
}

// ===== استعلامات جلسات المحادثة =====
export async function createChatSession(data: InsertChatSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(chatSessions).values(data);
  const result = await db.select().from(chatSessions)
    .where(eq(chatSessions.userId, data.userId))
    .orderBy(desc(chatSessions.createdAt)).limit(1);
  return result[0];
}

export async function updateChatSession(id: number, userId: number, data: Partial<InsertChatSession>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(chatSessions).set(data).where(and(eq(chatSessions.id, id), eq(chatSessions.userId, userId)));
}

export async function getChatSession(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(chatSessions)
    .where(and(eq(chatSessions.id, id), eq(chatSessions.userId, userId))).limit(1);
  return result[0] ?? null;
}

export async function getUserChatSessions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.createdAt)).limit(10);
}

// ===== استعلامات مسح AR =====
export async function createArScan(data: InsertArScan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(arScans).values(data);
  const result = await db.select().from(arScans)
    .where(eq(arScans.scanId, data.scanId)).limit(1);
  return result[0];
}

export async function getArScanByScanId(scanId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(arScans)
    .where(eq(arScans.scanId, scanId)).limit(1);
  return result[0] ?? null;
}

export async function updateArScan(id: number, data: Partial<InsertArScan>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(arScans).set(data).where(eq(arScans.id, id));
}

export async function getUserArScans(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(arScans)
    .where(eq(arScans.userId, userId))
    .orderBy(desc(arScans.createdAt)).limit(20);
}

// ===== استعلامات أسعار السوق =====
export async function getMarketPrices(category?: string, quality?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let query = db.select().from(marketPrices).where(eq(marketPrices.isActive, true));
  return query.orderBy(marketPrices.category);
}

export async function seedMarketPrices() {
  const db = await getDb();
  if (!db) return;
  // بيانات أسعار السوق الخليجي الأساسية
  const pricesData: InsertMarketPrice[] = [
    { category: "flooring", subcategory: "سيراميك", itemName: "Ceramic Tiles Standard", itemNameAr: "بلاط سيراميك عادي", unit: "م²", priceMin: 35, priceMax: 120, quality: "standard", country: "SA" },
    { category: "flooring", subcategory: "رخام", itemName: "Marble Flooring", itemNameAr: "أرضية رخام", unit: "م²", priceMin: 200, priceMax: 800, quality: "premium", country: "SA" },
    { category: "flooring", subcategory: "خشب", itemName: "Engineered Wood", itemNameAr: "خشب هندسي", unit: "م²", priceMin: 150, priceMax: 450, quality: "standard", country: "SA" },
    { category: "flooring", subcategory: "باركيه", itemName: "Parquet Flooring", itemNameAr: "باركيه خشبي", unit: "م²", priceMin: 180, priceMax: 600, quality: "premium", country: "SA" },
    { category: "walls", subcategory: "دهان", itemName: "Premium Wall Paint", itemNameAr: "دهان جدران فاخر", unit: "م²", priceMin: 15, priceMax: 45, quality: "standard", country: "SA" },
    { category: "walls", subcategory: "ورق جدران", itemName: "Wallpaper", itemNameAr: "ورق جدران", unit: "م²", priceMin: 80, priceMax: 350, quality: "standard", country: "SA" },
    { category: "walls", subcategory: "جبس ديكور", itemName: "Decorative Gypsum", itemNameAr: "جبس ديكوري", unit: "م²", priceMin: 120, priceMax: 400, quality: "premium", country: "SA" },
    { category: "ceiling", subcategory: "جبس بورد", itemName: "Gypsum Board Ceiling", itemNameAr: "سقف جبس بورد", unit: "م²", priceMin: 120, priceMax: 350, quality: "standard", country: "SA" },
    { category: "ceiling", subcategory: "جبس مزخرف", itemName: "Ornate Gypsum Ceiling", itemNameAr: "سقف جبس مزخرف", unit: "م²", priceMin: 250, priceMax: 800, quality: "premium", country: "SA" },
    { category: "lighting", subcategory: "سبوت لايت", itemName: "LED Spotlight", itemNameAr: "سبوت لايت LED", unit: "قطعة", priceMin: 80, priceMax: 350, quality: "standard", country: "SA" },
    { category: "lighting", subcategory: "ثريا", itemName: "Chandelier", itemNameAr: "ثريا ديكورية", unit: "قطعة", priceMin: 500, priceMax: 15000, quality: "luxury", country: "SA" },
    { category: "furniture", subcategory: "كنب", itemName: "Sofa Set", itemNameAr: "طقم كنب", unit: "طقم", priceMin: 3000, priceMax: 25000, quality: "standard", country: "SA" },
    { category: "furniture", subcategory: "غرفة نوم", itemName: "Bedroom Set", itemNameAr: "طقم غرفة نوم", unit: "طقم", priceMin: 5000, priceMax: 40000, quality: "standard", country: "SA" },
    { category: "furniture", subcategory: "مطبخ", itemName: "Kitchen Cabinets", itemNameAr: "خزائن مطبخ", unit: "م.ط", priceMin: 1500, priceMax: 8000, quality: "standard", country: "SA" },
    { category: "labor", subcategory: "تركيب عام", itemName: "General Installation", itemNameAr: "تركيب عام", unit: "م²", priceMin: 50, priceMax: 150, quality: "standard", country: "SA" },
  ];
  
  try {
    for (const price of pricesData) {
      await db.insert(marketPrices).values(price).onDuplicateKeyUpdate({ set: { priceMin: price.priceMin, priceMax: price.priceMax } });
    }
  } catch (e) {
    console.warn("Market prices seed skipped:", e);
  }
}

// ===== استعلامات لوحات الإلهام =====
export async function createMoodBoard(data: InsertMoodBoard) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(moodBoards).values(data);
  const result = await db.select().from(moodBoards)
    .where(and(eq(moodBoards.projectId, data.projectId), eq(moodBoards.userId, data.userId)))
    .orderBy(desc(moodBoards.createdAt)).limit(1);
  return result[0];
}

export async function getProjectMoodBoards(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(moodBoards)
    .where(and(eq(moodBoards.projectId, projectId), eq(moodBoards.userId, userId)))
    .orderBy(desc(moodBoards.createdAt));
}

// ===== استعلامات التقارير =====
export async function createReport(data: InsertReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(reports).values(data);
  const result = await db.select().from(reports)
    .where(and(eq(reports.projectId, data.projectId), eq(reports.userId, data.userId)))
    .orderBy(desc(reports.createdAt)).limit(1);
  return result[0];
}

export async function updateReport(id: number, data: Partial<InsertReport>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reports).set(data).where(eq(reports.id, id));
}

export async function getProjectReports(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(reports)
    .where(and(eq(reports.projectId, projectId), eq(reports.userId, userId)))
    .orderBy(desc(reports.createdAt));
}

// ===== استعلامات مراجع التصميم =====
export async function createDesignReference(data: import("../drizzle/schema").InsertDesignReference) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(designReferences).values(data);
  const result = await db.select().from(designReferences)
    .where(eq(designReferences.userId, data.userId))
    .orderBy(desc(designReferences.createdAt)).limit(1);
  return result[0];
}

export async function getUserDesignReferences(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(designReferences)
    .where(eq(designReferences.userId, userId))
    .orderBy(desc(designReferences.createdAt));
}

export async function getDesignReferenceById(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(designReferences)
    .where(and(eq(designReferences.id, id), eq(designReferences.userId, userId)))
    .limit(1);
  return result[0] || null;
}

export async function deleteDesignReference(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(designReferences).where(and(eq(designReferences.id, id), eq(designReferences.userId, userId)));
}

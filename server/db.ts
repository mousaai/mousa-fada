import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, projects, analyses, designElements, perspectives, chatSessions,
  InsertProject, InsertAnalysis, InsertDesignElement, InsertPerspective, InsertChatSession
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

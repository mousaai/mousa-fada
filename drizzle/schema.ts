import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// جدول المشاريع
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  designStyle: mysqlEnum("designStyle", ["modern", "gulf", "classic", "minimal"]).default("modern").notNull(),
  spaceType: varchar("spaceType", { length: 100 }), // غرفة معيشة، غرفة نوم، مطبخ...
  area: float("area"), // المساحة بالمتر المربع
  status: mysqlEnum("status", ["draft", "analyzed", "completed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// جدول تحليلات الصور
export const analyses = mysqlTable("analyses", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 500 }),
  designStyle: mysqlEnum("designStyle", ["modern", "gulf", "classic", "minimal"]).default("modern").notNull(),
  spaceType: varchar("spaceType", { length: 100 }),
  area: float("area"),
  // نتائج التحليل
  analysisResult: json("analysisResult"), // التوصيات الكاملة من الذكاء الاصطناعي
  colorPalette: json("colorPalette"), // لوحة الألوان المقترحة
  materials: json("materials"), // المواد المقترحة
  furniture: json("furniture"), // الأثاث المقترح
  costEstimate: json("costEstimate"), // تقدير التكاليف
  totalCostMin: float("totalCostMin"),
  totalCostMax: float("totalCostMax"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = typeof analyses.$inferInsert;

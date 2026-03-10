import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, json, boolean } from "drizzle-orm/mysql-core";

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

// ===== جدول المشاريع الموسع =====
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  projectType: mysqlEnum("projectType", ["new", "renovation", "partial"]).default("new").notNull(),
  designStyle: varchar("designStyle", { length: 100 }).default("modern").notNull(), // موسّع لأنماط عالمية
  spaceType: varchar("spaceType", { length: 100 }),
  area: float("area"),
  status: mysqlEnum("status", ["draft", "analyzed", "designing", "completed"]).default("draft").notNull(),
  // بيانات المخطط المعماري
  floorPlanUrl: text("floorPlanUrl"),
  floorPlanKey: varchar("floorPlanKey", { length: 500 }),
  floorPlanData: json("floorPlanData"), // بيانات المخطط المستخرجة (أبعاد، غرف، مساحات)
  // بيانات الكاميرا
  cameraScans: json("cameraScans"), // صور الكاميرا الذكية
  // بيانات التصميم
  designElements: json("designElements"), // عناصر التصميم المكتملة
  totalCostMin: float("totalCostMin"),
  totalCostMax: float("totalCostMax"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ===== جدول تحليلات الصور =====
export const analyses = mysqlTable("analyses", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 500 }),
  designStyle: varchar("designStyle", { length: 100 }).default("modern").notNull(),
  spaceType: varchar("spaceType", { length: 100 }),
  area: float("area"),
  analysisResult: json("analysisResult"),
  colorPalette: json("colorPalette"),
  materials: json("materials"),
  furniture: json("furniture"),
  costEstimate: json("costEstimate"),
  totalCostMin: float("totalCostMin"),
  totalCostMax: float("totalCostMax"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = typeof analyses.$inferInsert;

// ===== جدول عناصر التصميم المعماري =====
export const designElements = mysqlTable("designElements", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  elementType: mysqlEnum("elementType", ["flooring", "walls", "ceiling", "windows", "doors", "lighting", "furniture", "perspective"]).notNull(),
  roomName: varchar("roomName", { length: 100 }).notNull(), // اسم الغرفة
  roomArea: float("roomArea"),
  // المواصفات التفصيلية
  specifications: json("specifications"), // المواد، الألوان، الأبعاد، الكميات
  imageUrl: text("imageUrl"), // صورة العنصر أو المنظور
  imageKey: varchar("imageKey", { length: 500 }),
  // التكاليف
  costMin: float("costMin"),
  costMax: float("costMax"),
  unit: varchar("unit", { length: 50 }), // م², قطعة، متر طولي
  quantity: float("quantity"),
  isCompleted: boolean("isCompleted").default(false),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DesignElement = typeof designElements.$inferSelect;
export type InsertDesignElement = typeof designElements.$inferInsert;

// ===== جدول مناظير المشروع =====
export const perspectives = mysqlTable("perspectives", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  roomName: varchar("roomName", { length: 100 }).notNull(),
  perspectiveType: mysqlEnum("perspectiveType", ["3d_render", "floor_plan", "elevation", "section", "detail"]).default("3d_render").notNull(),
  prompt: text("prompt"), // البرومبت المستخدم لتوليد الصورة
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 500 }),
  designStyle: varchar("designStyle", { length: 100 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Perspective = typeof perspectives.$inferSelect;
export type InsertPerspective = typeof perspectives.$inferInsert;

// ===== جدول جلسات المحادثة مع م. سارة =====
export const chatSessions = mysqlTable("chatSessions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId"),
  userId: int("userId").notNull(),
  messages: json("messages").notNull(), // سجل المحادثة الكاملة
  sessionType: mysqlEnum("sessionType", ["general", "floor_plan", "camera_scan", "element_design"]).default("general").notNull(),
  extractedData: json("extractedData"), // البيانات المستخرجة من المحادثة
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

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
  // MOUSA.AI integration
  mousaUserId: int("mousaUserId"),
  mousaBalance: int("mousaBalance").default(0),
  mousaLastSync: timestamp("mousaLastSync"),
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
  designStyle: varchar("designStyle", { length: 100 }).default("modern").notNull(),
  spaceType: varchar("spaceType", { length: 100 }),
  area: float("area"),
  status: mysqlEnum("status", ["draft", "analyzed", "designing", "completed"]).default("draft").notNull(),
  floorPlanUrl: text("floorPlanUrl"),
  floorPlanKey: varchar("floorPlanKey", { length: 500 }),
  floorPlanData: json("floorPlanData"),
  cameraScans: json("cameraScans"),
  designElements: json("designElements"),
  totalCostMin: float("totalCostMin"),
  totalCostMax: float("totalCostMax"),
  // بيانات مسح AR من أداة القياس
  arScanData: json("arScanData"),
  arScanId: varchar("arScanId", { length: 100 }),
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
  // درجة تناسق العناصر
  harmonyScore: float("harmonyScore"),
  harmonyNotes: json("harmonyNotes"),
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
  roomName: varchar("roomName", { length: 100 }).notNull(),
  roomArea: float("roomArea"),
  specifications: json("specifications"),
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 500 }),
  costMin: float("costMin"),
  costMax: float("costMax"),
  unit: varchar("unit", { length: 50 }),
  quantity: float("quantity"),
  isCompleted: boolean("isCompleted").default(false),
  sortOrder: int("sortOrder").default(0),
  // درجة التناسق مع العناصر الأخرى
  harmonyScore: float("harmonyScore"),
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
  perspectiveType: mysqlEnum("perspectiveType", ["3d_render", "floor_plan", "elevation", "section", "detail", "mood_board"]).default("3d_render").notNull(),
  prompt: text("prompt"),
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
  messages: json("messages").notNull(),
  sessionType: mysqlEnum("sessionType", ["general", "floor_plan", "camera_scan", "element_design"]).default("general").notNull(),
  extractedData: json("extractedData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

// ===== جدول بيانات مسح AR (أداة القياس) =====
export const arScans = mysqlTable("arScans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  scanId: varchar("scanId", { length: 100 }).notNull().unique(), // UUID من التطبيق
  scanDate: timestamp("scanDate").notNull(),
  projectType: mysqlEnum("projectType", ["room", "apartment", "villa", "office"]).default("room").notNull(),
  // بيانات الغرف المستخرجة من RoomPlan API
  rooms: json("rooms").notNull(), // مصفوفة الغرف مع الأبعاد
  totalArea: float("totalArea"),
  // ملفات المسح
  floorPlanImageUrl: text("floorPlanImageUrl"),
  modelUrl: text("modelUrl"), // USDZ 3D model
  // حالة المعالجة
  status: mysqlEnum("status", ["received", "processing", "completed", "error"]).default("received").notNull(),
  aiAnalysis: json("aiAnalysis"), // تحليل م. سارة للبيانات
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ArScan = typeof arScans.$inferSelect;
export type InsertArScan = typeof arScans.$inferInsert;

// ===== جدول قاعدة أسعار السوق الخليجي =====
export const marketPrices = mysqlTable("marketPrices", {
  id: int("id").autoincrement().primaryKey(),
  category: mysqlEnum("category", ["flooring", "walls", "ceiling", "windows", "doors", "lighting", "furniture", "labor"]).notNull(),
  subcategory: varchar("subcategory", { length: 100 }).notNull(), // رخام، سيراميك، خشب...
  itemName: varchar("itemName", { length: 255 }).notNull(),
  itemNameAr: varchar("itemNameAr", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 100 }),
  unit: varchar("unit", { length: 50 }).notNull(), // م², قطعة، متر طولي
  priceMin: float("priceMin").notNull(), // بالريال السعودي
  priceMax: float("priceMax").notNull(),
  quality: mysqlEnum("quality", ["economy", "standard", "premium", "luxury"]).default("standard").notNull(),
  country: varchar("country", { length: 50 }).default("SA").notNull(), // SA, AE, KW, QA
  isActive: boolean("isActive").default(true).notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MarketPrice = typeof marketPrices.$inferSelect;
export type InsertMarketPrice = typeof marketPrices.$inferInsert;

// ===== جدول لوحات الإلهام Mood Boards =====
export const moodBoards = mysqlTable("moodBoards", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  designStyle: varchar("designStyle", { length: 100 }).notNull(),
  colorPalette: json("colorPalette"), // الألوان المختارة
  materials: json("materials"), // المواد المختارة
  images: json("images"), // صور الإلهام المولّدة
  boardImageUrl: text("boardImageUrl"), // صورة اللوحة المجمّعة
  boardImageKey: varchar("boardImageKey", { length: 500 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MoodBoard = typeof moodBoards.$inferSelect;
export type InsertMoodBoard = typeof moodBoards.$inferInsert;

// ===== جدول تقارير PDF =====
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  reportType: mysqlEnum("reportType", ["full", "design_only", "cost_only", "boq"]).default("full").notNull(),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 500 }),
  fileName: varchar("fileName", { length: 255 }),
  fileSize: int("fileSize"),
  status: mysqlEnum("status", ["generating", "ready", "error"]).default("generating").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

// ===== جدول مراجع التصميم (صور الإلهام المحفوظة) =====
export const designReferences = mysqlTable("designReferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 500 }),
  title: varchar("title", { length: 255 }).notNull(),
  spaceType: varchar("spaceType", { length: 100 }),
  styleLabel: varchar("styleLabel", { length: 100 }),
  styleKey: varchar("styleKey", { length: 50 }),
  description: text("description"),
  colorMood: varchar("colorMood", { length: 100 }),
  palette: json("palette"),       // [{name, hex}]
  materials: json("materials"),   // string[]
  highlights: json("highlights"), // string[] — أبرز ما يميز الفضاء
  analysisData: json("analysisData"), // كامل بيانات التحليل
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DesignReference = typeof designReferences.$inferSelect;
export type InsertDesignReference = typeof designReferences.$inferInsert;

// ===== جدول سجلات استخدام AI (لحساب تعدد الجلسات والخصم التلقائي) =====
export const aiUsageLogs = mysqlTable("aiUsageLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  mousaUserId: int("mousaUserId").notNull(),
  operation: varchar("operation", { length: 50 }).notNull(),
  creditsDeducted: int("creditsDeducted").notNull(),
  sessionMultiplier: float("sessionMultiplier").default(1).notNull(),
  dailySessionCount: int("dailySessionCount").default(1).notNull(),
  success: boolean("success").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AiUsageLog = typeof aiUsageLogs.$inferSelect;
export type InsertAiUsageLog = typeof aiUsageLogs.$inferInsert;

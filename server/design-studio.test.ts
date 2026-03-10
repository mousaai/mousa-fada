import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database helpers
vi.mock("./db", () => ({
  getUserProjects: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      name: "فيلا الرياض",
      description: "فيلا خليجية فاخرة",
      projectType: "new",
      designStyle: "gulf",
      spaceType: "فيلا",
      area: 400,
      status: "draft",
      floorPlanUrl: null,
      floorPlanKey: null,
      floorPlanData: null,
      designElements: null,
      budgetMin: null,
      budgetMax: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getProjectById: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    name: "فيلا الرياض",
    description: "فيلا خليجية فاخرة",
    projectType: "new",
    designStyle: "gulf",
    spaceType: "فيلا",
    area: 400,
    status: "draft",
    floorPlanUrl: null,
    floorPlanKey: null,
    floorPlanData: null,
    designElements: null,
    budgetMin: null,
    budgetMax: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  createProject: vi.fn().mockResolvedValue({ id: 2, name: "مشروع جديد" }),
  updateProject: vi.fn().mockResolvedValue(undefined),
  deleteProject: vi.fn().mockResolvedValue(undefined),
  getProjectDesignElements: vi.fn().mockResolvedValue([]),
  createDesignElement: vi.fn().mockResolvedValue({
    id: 1,
    projectId: 1,
    userId: 1,
    elementType: "flooring",
    roomName: "غرفة المعيشة",
    roomArea: 30,
    specifications: null,
    costMin: null,
    costMax: null,
    isCompleted: false,
    imageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  updateDesignElement: vi.fn().mockResolvedValue(undefined),
  deleteDesignElement: vi.fn().mockResolvedValue(undefined),
  getProjectPerspectives: vi.fn().mockResolvedValue([]),
  createPerspective: vi.fn().mockResolvedValue({
    id: 1,
    projectId: 1,
    userId: 1,
    roomName: "غرفة المعيشة",
    imageUrl: null,
    designStyle: "gulf",
    description: null,
    perspectiveType: "3d_render",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getChatSessions: vi.fn().mockResolvedValue([]),
  createChatSession: vi.fn().mockResolvedValue({ id: 1, userId: 1, sessionType: "general", messages: "[]", projectId: null, createdAt: new Date(), updatedAt: new Date() }),
  updateChatSession: vi.fn().mockResolvedValue(undefined),
  getChatSessionById: vi.fn().mockResolvedValue(null),
  getUserAnalyses: vi.fn().mockResolvedValue([]),
  getProjectAnalyses: vi.fn().mockResolvedValue([]),
  getAnalysisById: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

// Mock LLM - returns flexible JSON matching different procedure responses
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockImplementation(({ messages }) => {
    const userMsg = messages?.find((m: { role: string }) => m.role === 'user')?.content || '';
    const isDesignElement = typeof userMsg === 'string' && userMsg.includes('عنصر');
    const isCosts = typeof userMsg === 'string' && userMsg.includes('تكلفة');
    const isCostCalc = typeof userMsg === 'string' && userMsg.includes('تقدير تكلفة');
    
    if (isCostCalc || isCosts) {
      return Promise.resolve({
        choices: [{ message: { content: JSON.stringify({
          breakdown: [
            { category: "الأثاث", min: 5000, max: 15000, notes: "أثاث خليجي" },
            { category: "المواد", min: 3000, max: 8000, notes: "رخام" },
          ],
          total: { min: 8000, max: 23000 },
          pricePerSqm: { min: 267, max: 767 },
          timeline: "8-12 أسبوع",
          tips: ["اشترِ من معارض التصفية"]
        }) } }]
      });
    }
    
    return Promise.resolve({
      choices: [{ message: { content: JSON.stringify({
        designConcept: "تصميم خليجي فاخر بلمسات عصرية",
        specifications: { "المادة": "رخام كرارا", "الحجم": "60×60 سم" },
        products: [{ name: "رخام كرارا", brand: "Porcelanosa", priceMin: 200, priceMax: 400, unit: "م²", quantity: 30 }],
        colorPalette: [{ hex: "#C9A84C", name: "ذهبي", role: "لون رئيسي" }],
        totalCostMin: 6000,
        totalCostMax: 12000,
        professionalNotes: "يُنصح باستخدام رخام عالي الجودة",
        alternativeOptions: [],
        installationSteps: ["تنظيف السطح", "وضع اللاصق", "تركيب الرخام"],
        maintenanceTips: ["التنظيف الدوري بمواد خاصة"],
        reply: "مرحباً! سأساعدك في تصميم غرفة معيشة خليجية رائعة.",
      }) } }]
    });
  }),
}));

// Mock image generation
vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({ url: "https://example.com/image.png" }),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/file.png", key: "test/file.png" }),
}));

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-123",
      email: "test@example.com",
      name: "مستخدم تجريبي",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("projects router", () => {
  it("should list user projects", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.projects.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("name");
  });

  it("should get project by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.projects.get({ id: 1 });
    expect(result).toHaveProperty("id", 1);
    expect(result).toHaveProperty("name", "فيلا الرياض");
  });

  it("should create a new project", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.projects.create({
      name: "مشروع جديد",
      description: "وصف المشروع",
      projectType: "renovation",
      designStyle: "modern",
    });
    expect(result).toHaveProperty("id");
  });
});

describe("designElements router", () => {
  it("should get design elements by project", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.designElements.getByProject({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should mark element as complete", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.designElements.markComplete({ id: 1, isCompleted: true });
    expect(result).toHaveProperty("success", true);
  });
});

describe("perspectives router", () => {
  it("should get perspectives by project", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.perspectives.getByProject({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("chat router", () => {
  it("should create a new chat session and return a reply", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.send({
      message: "أريد تصميم غرفة معيشة خليجية",
      sessionType: "general",
    });
    expect(result).toHaveProperty("reply");
    expect(result).toHaveProperty("sessionId");
    expect(typeof result.reply).toBe("string");
  });
});

describe("costs router", () => {
  it("should calculate costs for a space", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.costs.calculate({
      spaceType: "غرفة معيشة",
      area: 30,
      designStyle: "gulf",
      quality: "luxury",
    });
    expect(result).toHaveProperty("breakdown");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.breakdown)).toBe(true);
  });
});

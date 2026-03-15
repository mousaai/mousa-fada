import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock global fetch for Bonyan API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const mockBonyanResponse = {
  result: {
    data: {
      json: {
        items: [
          {
            id: 1,
            nameEn: "Modern Sofa",
            nameAr: "كنبة عصرية",
            slug: "modern-sofa",
            price: "2500",
            pricePerUnit: null,
            currency: "AED",
            imageUrl: "https://example.com/sofa.jpg",
            brand: "IKEA",
            material: "قماش",
            color: "رمادي",
            sourceType: "store",
            sourceName: "IKEA UAE",
            isVerified: true,
            categoryId: 1,
            width: 200,
            height: 85,
            depth: 90,
            dimensionUnit: "cm",
            supplierConfirmed: true,
            updatedAt: "2024-01-01T00:00:00Z",
          },
          {
            id: 2,
            nameEn: "Coffee Table",
            nameAr: "طاولة قهوة",
            slug: "coffee-table",
            price: "800",
            pricePerUnit: null,
            currency: "AED",
            imageUrl: "https://example.com/table.jpg",
            brand: "Pan Emirates",
            material: "خشب",
            color: "بني",
            sourceType: "store",
            sourceName: "Pan Emirates",
            isVerified: true,
            categoryId: 2,
            width: 120,
            height: 45,
            depth: 60,
            dimensionUnit: "cm",
            supplierConfirmed: false,
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
        total: 2,
        page: 1,
        limit: 12,
      },
    },
  },
};

describe("bonyan.searchProducts", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("returns products from Bonyan API", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBonyanResponse,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bonyan.searchProducts({
      page: 1,
      limit: 12,
      sortBy: "newest",
    });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.items[0].nameAr).toBe("كنبة عصرية");
    expect(result.items[0].currency).toBe("AED");
  });

  it("filters products by minimum price", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBonyanResponse,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bonyan.searchProducts({
      page: 1,
      limit: 12,
      sortBy: "newest",
      minPrice: 1000,
    });

    // Only the sofa (2500 AED) should pass the 1000 AED minimum filter
    expect(result.items).toHaveLength(1);
    expect(result.items[0].nameAr).toBe("كنبة عصرية");
  });

  it("filters products by maximum price", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBonyanResponse,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bonyan.searchProducts({
      page: 1,
      limit: 12,
      sortBy: "newest",
      maxPrice: 1000,
    });

    // Only the coffee table (800 AED) should pass the 1000 AED maximum filter
    expect(result.items).toHaveLength(1);
    expect(result.items[0].nameAr).toBe("طاولة قهوة");
  });

  it("sorts products by price ascending", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBonyanResponse,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bonyan.searchProducts({
      page: 1,
      limit: 12,
      sortBy: "price_asc",
    });

    expect(result.items[0].price).toBe("800");
    expect(result.items[1].price).toBe("2500");
  });

  it("sorts products by price descending", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBonyanResponse,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bonyan.searchProducts({
      page: 1,
      limit: 12,
      sortBy: "price_desc",
    });

    expect(result.items[0].price).toBe("2500");
    expect(result.items[1].price).toBe("800");
  });

  it("throws error when Bonyan API is unavailable", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.bonyan.searchProducts({ page: 1, limit: 12, sortBy: "newest" })
    ).rejects.toThrow("فشل الاتصال بمنصة بنيان");
  });
});

describe("bonyan.matchFurnitureToProducts", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("يبحث عن منتجات مطابقة لكل قطعة أثاث", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockBonyanResponse,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bonyan.matchFurnitureToProducts({
      furniturePieces: [
        {
          nameAr: "كنبة",
          nameEn: "sofa",
          description: "كنبة ثلاثية",
          searchKeyword: "sofa",
          priority: "أساسي",
        },
      ],
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].piece.nameAr).toBe("كنبة");
    expect(result.results[0].matches.length).toBeGreaterThan(0);
    expect(result.totalMatches).toBeGreaterThan(0);
  });

  it("يعود بنتائج فارغة عند فشل الاتصال ببنيان", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bonyan.matchFurnitureToProducts({
      furniturePieces: [
        {
          nameAr: "طاولة",
          nameEn: "table",
          description: "طاولة قهوة",
          searchKeyword: "coffee table",
          priority: "أساسي",
        },
      ],
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].matches).toHaveLength(0);
    expect(result.totalMatches).toBe(0);
  });

  it("يصفي المنتجات حسب الميزانية المحددة", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockBonyanResponse,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // ميزانية صغيرة جداً لاستبعاد كل المنتجات
    const result = await caller.bonyan.matchFurnitureToProducts({
      furniturePieces: [
        {
          nameAr: "كنبة",
          nameEn: "sofa",
          description: "كنبة",
          searchKeyword: "sofa",
          priority: "أساسي",
        },
      ],
      budgetMax: 100, // 100 درهم فقط — لن يمر أي منتج
    });

    // المنتجات بسعر 2500 و 800 درهم تتجاوز حد 150 درهم (100/1 * 1.5)
    expect(result.results[0].matches).toHaveLength(0);
    expect(result.totalMatches).toBe(0);
  });
});

// ===== اختبارات bonyan.smartFilter =====
describe("bonyan.smartFilter", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  // بيانات اختبار تحتوي على معلومات مادة ولون في الاسم
  const mockProductsWithDetails = {
    result: {
      data: {
        json: {
          items: [
            {
              id: 10,
              nameEn: "Velvet Sofa - Grey 3 Seater",
              nameAr: "كنبة مخمل رمادي 3 مقاعد",
              slug: "velvet-sofa-grey",
              price: "3500",
              pricePerUnit: null,
              currency: "AED",
              imageUrl: "https://example.com/velvet-sofa.jpg",
              brand: "Pan Home",
              material: null,
              color: null,
              sourceType: "store",
              sourceName: "Pan Home UAE",
              isVerified: true,
              categoryId: 1,
              width: 220,
              height: 85,
              depth: 95,
              dimensionUnit: "cm",
              supplierConfirmed: true,
              updatedAt: "2024-01-01T00:00:00Z",
            },
            {
              id: 11,
              nameEn: "Wooden Coffee Table - Oak",
              nameAr: "طاولة قهوة خشب بلوط",
              slug: "wooden-coffee-table",
              price: "1200",
              pricePerUnit: null,
              currency: "AED",
              imageUrl: "https://example.com/wood-table.jpg",
              brand: "IKEA",
              material: null,
              color: null,
              sourceType: "store",
              sourceName: "IKEA UAE",
              isVerified: true,
              categoryId: 2,
              width: 120,
              height: 45,
              depth: 60,
              dimensionUnit: "cm",
              supplierConfirmed: false,
              updatedAt: "2024-01-01T00:00:00Z",
            },
            {
              id: 12,
              nameEn: "Modern Leather Bed - White King",
              nameAr: "سرير جلد أبيض كينج عصري",
              slug: "leather-bed-white",
              price: "8000",
              pricePerUnit: null,
              currency: "AED",
              imageUrl: "https://example.com/leather-bed.jpg",
              brand: "Homes R Us",
              material: null,
              color: null,
              sourceType: "store",
              sourceName: "Homes R Us",
              isVerified: true,
              categoryId: 3,
              width: 200,
              height: 120,
              depth: 220,
              dimensionUnit: "cm",
              supplierConfirmed: true,
              updatedAt: "2024-01-01T00:00:00Z",
            },
          ],
          total: 3,
          page: 1,
          limit: 50,
        },
      },
    },
  };

  it("يُرجع منتجات بدون فلاتر (كل المنتجات)", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockProductsWithDetails,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bonyan.smartFilter({
      page: 1,
      pageSize: 20,
      sortBy: "newest",
    });

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
    expect(result).toHaveProperty("fetchedTotal");
  });

  it("يصفي حسب الخامة (velvet) من اسم المنتج", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockProductsWithDetails,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bonyan.smartFilter({
      materials: ["velvet"],
      page: 1,
      pageSize: 20,
      sortBy: "relevance",
    });

    // الكنبة المخملية يجب أن تظهر
    expect(result.items.length).toBeGreaterThan(0);
    const velvetItem = result.items.find(p => p.nameEn.toLowerCase().includes("velvet"));
    expect(velvetItem).toBeDefined();
  });

  it("يصفي حسب الخامة (wood) من اسم المنتج", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockProductsWithDetails,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bonyan.smartFilter({
      materials: ["wood"],
      page: 1,
      pageSize: 20,
      sortBy: "relevance",
    });

    // الطاولة الخشبية يجب أن تظهر
    expect(result.items.length).toBeGreaterThan(0);
    const woodItem = result.items.find(p => p.nameEn.toLowerCase().includes("wood") || p.nameEn.toLowerCase().includes("oak"));
    expect(woodItem).toBeDefined();
  });

  it("يصفي حسب اللون (grey) من اسم المنتج", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockProductsWithDetails,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bonyan.smartFilter({
      colors: ["grey"],
      page: 1,
      pageSize: 20,
      sortBy: "relevance",
    });

    // الكنبة الرمادية يجب أن تظهر
    expect(result.items.length).toBeGreaterThan(0);
    const greyItem = result.items.find(p => p.nameEn.toLowerCase().includes("grey"));
    expect(greyItem).toBeDefined();
  });

  it("يصفي حسب نطاق السعر (mid: 1000-4999)", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockProductsWithDetails,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bonyan.smartFilter({
      priceRange: "mid",
      page: 1,
      pageSize: 20,
      sortBy: "price_asc",
    });

    // الكنبة (3500) والطاولة (1200) ضمن النطاق، السرير (8000) خارجه
    result.items.forEach(item => {
      const price = parseFloat(item.price);
      expect(price).toBeGreaterThanOrEqual(1000);
      expect(price).toBeLessThanOrEqual(4999);
    });
  });

  it("يرتب حسب السعر تصاعدياً", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockProductsWithDetails,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bonyan.smartFilter({
      page: 1,
      pageSize: 20,
      sortBy: "price_asc",
    });

    if (result.items.length >= 2) {
      const prices = result.items.map(p => parseFloat(p.price));
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    }
  });

  it("يرتب حسب السعر تنازلياً", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockProductsWithDetails,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bonyan.smartFilter({
      page: 1,
      pageSize: 20,
      sortBy: "price_desc",
    });

    if (result.items.length >= 2) {
      const prices = result.items.map(p => parseFloat(p.price));
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
      }
    }
  });

  it("يدعم التصفح (pagination)", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockProductsWithDetails,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bonyan.smartFilter({
      page: 1,
      pageSize: 2,
      sortBy: "newest",
    });

    expect(result.items.length).toBeLessThanOrEqual(2);
    expect(result).toHaveProperty("hasMore");
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(2);
  });

  it("يُرجع كل المنتجات عند عدم تطابق الفلاتر (fallback)", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockProductsWithDetails,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // فلتر نادر جداً لن يطابق أي منتج
    const result = await caller.bonyan.smartFilter({
      materials: ["acrylic"],
      colors: ["pink"],
      page: 1,
      pageSize: 20,
      sortBy: "relevance",
    });

    // يجب أن يُرجع كل المنتجات كـ fallback بدلاً من صفر
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("يُرجع hasMore=false عند وجود صفحة واحدة فقط", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockProductsWithDetails,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bonyan.smartFilter({
      page: 1,
      pageSize: 100, // صفحة كبيرة تستوعب كل المنتجات
      sortBy: "newest",
    });

    expect(result.hasMore).toBe(false);
  });
});

// ===== اختبارات أولوية الموردين الموثوقين =====
describe("bonyan.smartFilter - source quality ranking", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  const mockMixedSources = {
    result: {
      data: {
        json: {
          items: [
            {
              id: 20,
              nameEn: "Sofa from Pan Home - lazy image",
              nameAr: "كنبة Pan Home بدون صورة",
              slug: "",
              price: "1500",
              pricePerUnit: null,
              currency: "AED",
              imageUrl: "https://panhome.com/static/version1/images/lazy.png",
              brand: "Pan Home",
              material: null,
              color: null,
              sourceType: "scraper",
              sourceName: "Pan Home",
              isVerified: false,
              categoryId: 1,
              width: null, height: null, depth: null,
              dimensionUnit: "cm",
              supplierConfirmed: false,
              updatedAt: "2024-01-01T00:00:00Z",
            },
            {
              id: 21,
              nameEn: "IKEA Sofa with real image",
              nameAr: "كنبة IKEA بصورة حقيقية",
              slug: "ikea-sofa",
              price: "2000",
              pricePerUnit: null,
              currency: "AED",
              imageUrl: "https://www.ikea.com/ae/en/images/products/sofa.jpg",
              brand: "IKEA",
              material: null,
              color: null,
              sourceType: "store",
              sourceName: "IKEA UAE",
              isVerified: true,
              categoryId: 1,
              width: 200, height: 85, depth: 90,
              dimensionUnit: "cm",
              supplierConfirmed: true,
              updatedAt: "2024-01-01T00:00:00Z",
            },
            {
              id: 22,
              nameEn: "Danube Home Sofa",
              nameAr: "كنبة دانوب هوم",
              slug: "danube-sofa",
              price: "1800",
              pricePerUnit: null,
              currency: "AED",
              imageUrl: "https://mp-sellers-files.danubehome.com/sellers/sofa.jpg",
              brand: "Danube",
              material: null,
              color: null,
              sourceType: "scraper",
              sourceName: "Danube Home",
              isVerified: true,
              categoryId: 1,
              width: 210, height: 80, depth: 88,
              dimensionUnit: "cm",
              supplierConfirmed: true,
              updatedAt: "2024-01-01T00:00:00Z",
            },
          ],
          total: 3,
          page: 1,
          limit: 50,
        },
      },
    },
  };

  it("يُخفي منتجات Pan Home التي لديها صورة lazy.png وهمية", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockMixedSources,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bonyan.smartFilter({
      page: 1,
      pageSize: 20,
      sortBy: "relevance",
    });

    // منتج Pan Home بصورة lazy.png يجب أن يُخفى
    const panHomeWithLazy = result.items.find(p => p.sourceName === "Pan Home" && p.imageUrl?.includes("lazy.png"));
    expect(panHomeWithLazy).toBeUndefined();
  });

  it("يُظهر IKEA وDanube Home لأن لديهم صور حقيقية", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockMixedSources,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bonyan.smartFilter({
      page: 1,
      pageSize: 20,
      sortBy: "relevance",
    });

    const ikeaItem = result.items.find(p => p.sourceName === "IKEA UAE");
    const danubeItem = result.items.find(p => p.sourceName === "Danube Home");
    expect(ikeaItem).toBeDefined();
    expect(danubeItem).toBeDefined();
  });

  it("يرتب IKEA وDanube Home قبل الموردين غير الموثوقين عند sortBy=relevance", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockMixedSources,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bonyan.smartFilter({
      page: 1,
      pageSize: 20,
      sortBy: "relevance",
    });

    // أول منتج يجب أن يكون من IKEA أو Danube (الأعلى ثقة)
    if (result.items.length > 0) {
      const firstSource = result.items[0].sourceName;
      expect(["IKEA UAE", "Danube Home"]).toContain(firstSource);
    }
  });
});

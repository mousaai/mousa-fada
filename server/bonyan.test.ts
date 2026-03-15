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

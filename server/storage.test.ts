import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock Supabase client
vi.mock("@supabase/supabase-js", () => {
  const mockGetPublicUrl = vi.fn().mockReturnValue({
    data: { publicUrl: "https://cgjnacnyvxzvpivaworx.supabase.co/storage/v1/object/public/sarah-files/test-key.png" },
  });

  const mockUpload = vi.fn().mockResolvedValue({ error: null });

  const mockFrom = vi.fn().mockReturnValue({
    upload: mockUpload,
    getPublicUrl: mockGetPublicUrl,
  });

  return {
    createClient: vi.fn().mockReturnValue({
      storage: {
        from: mockFrom,
      },
    }),
  };
});

describe("storage - Supabase integration", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://cgjnacnyvxzvpivaworx.supabase.co";
    process.env.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
  });

  it("storagePut: يرفع الملف ويعيد URL عام من Supabase", async () => {
    const { storagePut } = await import("./storage");
    const result = await storagePut("test-key.png", Buffer.from("test data"), "image/png");

    expect(result.key).toBe("test-key.png");
    expect(result.url).toContain("supabase.co");
    expect(result.url).toContain("sarah-files");
  });

  it("storagePut: يزيل الـ slash من بداية الـ key", async () => {
    const { storagePut } = await import("./storage");
    const result = await storagePut("/uploads/image.jpg", Buffer.from("data"), "image/jpeg");

    expect(result.key).toBe("uploads/image.jpg");
    expect(result.key).not.toMatch(/^\//);
  });

  it("storagePut: يقبل string كـ data", async () => {
    const { storagePut } = await import("./storage");
    const result = await storagePut("text-file.txt", "hello world", "text/plain");

    expect(result.key).toBe("text-file.txt");
    expect(result.url).toBeTruthy();
  });

  it("storagePut: يقبل Uint8Array كـ data", async () => {
    const { storagePut } = await import("./storage");
    const uint8 = new Uint8Array([72, 101, 108, 108, 111]);
    const result = await storagePut("uint8-file.bin", uint8, "application/octet-stream");

    expect(result.key).toBe("uint8-file.bin");
    expect(result.url).toBeTruthy();
  });

  it("storageGet: يعيد URL عام من Supabase", async () => {
    const { storageGet } = await import("./storage");
    const result = await storageGet("some/file.pdf");

    expect(result.key).toBe("some/file.pdf");
    expect(result.url).toContain("supabase.co");
  });

  it("storagePut: يستخدم data URL كـ fallback عند فشل Supabase", async () => {
    // Override mock to simulate failure
    const { createClient } = await import("@supabase/supabase-js");
    vi.mocked(createClient).mockReturnValueOnce({
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ error: { message: "Upload failed" } }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "" } }),
        }),
      },
    } as ReturnType<typeof createClient>);

    const { storagePut } = await import("./storage");
    const result = await storagePut("fallback-test.png", Buffer.from("test"), "image/png");

    // Should fall back to data URL
    expect(result.key).toBe("fallback-test.png");
    expect(result.url).toMatch(/^data:image\/png;base64,/);
  });
});

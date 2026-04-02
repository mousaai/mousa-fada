/**
 * اختبار صحة MOUSA_PLATFORM_API_KEY
 * يتحقق من أن المفتاح يعمل مع mousa.ai API
 */
import { describe, it, expect } from "vitest";
import { checkMousaBalance } from "./mousa";

describe("MOUSA_PLATFORM_API_KEY", () => {
  it("يجب أن يكون المفتاح صحيحاً ويعمل مع check-balance", async () => {
    // اختبار بسيط: فحص رصيد userId=1
    const result = await checkMousaBalance(1);
    
    // يجب أن يُعيد balance و upgradeUrl
    expect(result).toHaveProperty("balance");
    expect(result).toHaveProperty("upgradeUrl");
    expect(typeof result.balance).toBe("number");
    expect(result.balance).toBeGreaterThanOrEqual(0);
    expect(result.upgradeUrl).toContain("mousa.ai");
  }, 15000);
});

/**
 * webhook.ts — استقبال أحداث mousa.ai
 *
 * POST /api/internal/events
 *
 * الأحداث المدعومة:
 * - user.suspended   → إلغاء جلسة المستخدم فوراً
 * - user.reactivated → تحديث حالة المستخدم
 * - balance.updated  → تحديث الرصيد المحلي
 * - platform.pricing → تحديث أسعار الكريدت
 *
 * الأمان:
 * - يتحقق من MOUSA_WEBHOOK_SECRET (HMAC-SHA256) أو MOUSA_PLATFORM_API_KEY
 * - يرفض الطلبات بدون توقيع صالح
 */

import type { Express, Request, Response } from "express";
import crypto from "crypto";
import * as db from "../db";
import { ENV } from "./env";

// ===== أنواع الأحداث =====
interface WebhookEvent {
  event: string;
  timestamp: number;
  data: Record<string, unknown>;
}

// ===== التحقق من توقيع الـ Webhook =====
function verifyWebhookSignature(req: Request): boolean {
  const signature = req.headers["x-mousa-signature"] as string | undefined;
  const apiKey = req.headers["x-api-key"] as string | undefined;
  const platformKey = req.headers["authorization"] as string | undefined;

  // طريقة 1: HMAC-SHA256 signature
  const webhookSecret = process.env.MOUSA_WEBHOOK_SECRET;
  if (signature && webhookSecret) {
    try {
      const body = JSON.stringify(req.body);
      const expected = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");
      const expectedHeader = `sha256=${expected}`;
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedHeader)
      );
    } catch {
      return false;
    }
  }

  // طريقة 2: API Key مباشر
  const platformApiKey = process.env.PLATFORM_API_KEY || process.env.MOUSA_PLATFORM_API_KEY;
  if (apiKey && platformApiKey && apiKey === platformApiKey) {
    return true;
  }

  // طريقة 3: Bearer token
  if (platformKey && platformApiKey) {
    const token = platformKey.replace(/^Bearer\s+/i, "");
    return token === platformApiKey;
  }

  return false;
}

// ===== معالجة الأحداث =====
async function handleEvent(event: WebhookEvent): Promise<void> {
  const { event: eventType, data } = event;

  console.log(`[Webhook] 📨 Received event: ${eventType}`, data);

  switch (eventType) {
    // ===== تعليق المستخدم — إلغاء الجلسة فوراً =====
    case "user.suspended": {
      const openId = data.openId as string | undefined;
      const userId = data.userId as number | undefined;

      if (openId) {
        try {
          // تعليق المستخدم في قاعدة البيانات المحلية
          await db.upsertUser({
            openId,
            role: "suspended" as any,
            mousaLastSync: new Date(),
          } as any);
          console.log(`[Webhook] ✅ User ${openId} suspended`);
        } catch (err) {
          console.error(`[Webhook] Failed to suspend user ${openId}:`, err);
        }
      }
      break;
    }

    // ===== إعادة تفعيل المستخدم =====
    case "user.reactivated": {
      const openId = data.openId as string | undefined;
      if (openId) {
        try {
          await db.upsertUser({
            openId,
            role: "user",
            mousaLastSync: new Date(),
          } as any);
          console.log(`[Webhook] ✅ User ${openId} reactivated`);
        } catch (err) {
          console.error(`[Webhook] Failed to reactivate user ${openId}:`, err);
        }
      }
      break;
    }

    // ===== تحديث الرصيد =====
    case "balance.updated": {
      const openId = data.openId as string | undefined;
      const balance = data.balance as number | undefined;
      const userId = data.userId as number | undefined;

      if (openId && balance !== undefined) {
        try {
          await db.upsertUser({
            openId,
            mousaBalance: balance,
            mousaLastSync: new Date(),
          } as any);
          console.log(`[Webhook] ✅ Balance updated for ${openId}: ${balance}`);
        } catch (err) {
          console.error(`[Webhook] Failed to update balance for ${openId}:`, err);
        }
      }
      break;
    }

    // ===== تحديث أسعار الكريدت =====
    case "platform.pricing": {
      console.log(`[Webhook] 💰 Pricing update received:`, data);
      // يمكن تحديث CREDIT_COSTS ديناميكياً هنا إذا لزم الأمر
      break;
    }

    // ===== حذف المستخدم =====
    case "user.deleted": {
      const openId = data.openId as string | undefined;
      if (openId) {
        console.log(`[Webhook] 🗑️ User deletion requested for ${openId} — manual action required`);
        // لا نحذف البيانات تلقائياً — يتطلب مراجعة يدوية
      }
      break;
    }

    default:
      console.log(`[Webhook] ⚠️ Unknown event type: ${eventType}`);
  }
}

// ===== تسجيل Webhook Route =====
export function registerWebhookRoutes(app: Express) {
  /**
   * POST /api/internal/events
   *
   * يستقبل أحداث من mousa.ai ويعالجها.
   * يتحقق من التوقيع قبل المعالجة.
   */
  app.post("/api/internal/events", async (req: Request, res: Response) => {
    // التحقق من التوقيع
    if (!verifyWebhookSignature(req)) {
      console.warn("[Webhook] ❌ Invalid signature — rejected");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = req.body as WebhookEvent | undefined;

    if (!body || !body.event) {
      return res.status(400).json({ error: "Invalid event format" });
    }

    // الرد فوراً بـ 200 قبل المعالجة (لتجنب timeout في mousa.ai)
    res.status(200).json({ received: true, event: body.event });

    // معالجة الحدث بشكل غير متزامن
    handleEvent(body).catch(err => {
      console.error(`[Webhook] Error handling event ${body.event}:`, err);
    });
  });

  /**
   * GET /api/internal/health
   *
   * للتحقق من أن الـ webhook endpoint يعمل.
   */
  app.get("/api/internal/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      platform: "fada",
      timestamp: Date.now(),
    });
  });

  console.log("[Webhook] ✅ Webhook receiver registered at POST /api/internal/events");
}

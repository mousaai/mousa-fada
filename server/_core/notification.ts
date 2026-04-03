/**
 * نظام الإشعارات المستقل — Telegram Bot مباشر
 * أسرع وأكثر موثوقية من Manus Notifications
 * يتطلب: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID في متغيرات البيئة
 */
import { ENV } from "./env";

export type NotificationPayload = {
  title: string;
  content: string;
  emoji?: string;
};

// ===== Telegram Bot API مباشر =====
async function sendTelegramMessage(text: string): Promise<boolean> {
  const { telegramBotToken, telegramChatId } = ENV;

  if (!telegramBotToken || !telegramChatId) {
    return false; // Telegram غير مُعدّ — تجاهل بدون خطأ
  }

  try {
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[Telegram] فشل الإرسال:", err);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Telegram] خطأ في الاتصال:", error);
    return false;
  }
}

/**
 * إرسال إشعار لصاحبة المنصة عبر Telegram
 * تعمل بدون Manus — مستقلة بالكامل
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content, emoji = "🔔" } = payload;

  if (!title?.trim() || !content?.trim()) {
    console.warn("[Notification] عنوان أو محتوى فارغ");
    return false;
  }

  const timestamp = new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" });
  const message = `${emoji} <b>${title}</b>\n\n${content}\n\n<i>🕐 ${timestamp}</i>`;

  const telegramResult = await sendTelegramMessage(message);

  if (telegramResult) {
    console.log(`[Notification] ✅ أُرسل عبر Telegram: ${title}`);
    return true;
  }

  // إذا لم يُعدّ Telegram، سجّل في console فقط
  console.log(`[Notification] 📋 ${title}: ${content}`);
  return false;
}

// ===== إشعارات محددة للمنصة =====
export async function notifyNewUser(name: string, email: string): Promise<void> {
  await notifyOwner({ title: "مستخدم جديد 🎉", content: `الاسم: ${name}\nالبريد: ${email}`, emoji: "👤" });
}

export async function notifyNewProject(projectName: string, userName: string): Promise<void> {
  await notifyOwner({ title: "مشروع جديد", content: `المشروع: ${projectName}\nالمستخدم: ${userName}`, emoji: "🏗️" });
}

export async function notifyDesignGenerated(roomName: string, style: string): Promise<void> {
  await notifyOwner({ title: "تصميم جديد مُولَد", content: `الغرفة: ${roomName}\nالنمط: ${style}`, emoji: "🎨" });
}

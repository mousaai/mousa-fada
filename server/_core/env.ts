// مفتاح Google AI المعتمد من مشروع Mousa ai
// النموذج المدعوم: gemini-2.5-flash فقط (الوحيد المتاح للمستخدمين الجدد)
// ملاحظة: المفاتيح القديمة في .env مُبلَغ عنها ومحجوبة من Google
const MOUSA_AI_GEMINI_KEY = "AIzaSyA07yksSaqtSYAzqo2T1U1ANu1hByVLeK8";
const MY_GOOGLE_AI_KEY = MOUSA_AI_GEMINI_KEY;

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Manus Forge (غير مستخدم — محتفظ لتجنب أخطاء TypeScript في ملفات _core غير المستخدمة)
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // S3 Storage (مستقل — بدون Manus)
  s3Endpoint: process.env.S3_ENDPOINT ?? "",
  s3Bucket: process.env.S3_BUCKET ?? "",
  s3AccessKey: process.env.S3_ACCESS_KEY ?? "",
  s3SecretKey: process.env.S3_SECRET_KEY ?? "",
  s3Region: process.env.S3_REGION ?? "auto",
  s3PublicUrl: process.env.S3_PUBLIC_URL ?? "",
  // Google Gemini مباشرة عبر OpenAI-compatible API
  // إذا وُجد MY_GOOGLE_AI_KEY يستخدمه بدلاً من OPENAI_API_KEY الافتراضي
  openAiBaseUrl: process.env.OPENAI_BASE_URL ?? "",
  openAiApiKey: MY_GOOGLE_AI_KEY || (process.env.OPENAI_API_KEY ?? ""),
  // gemini-2.5-flash هو النموذج الوحيد المتاح للمستخدمين الجدد في هذا المفتاح
  openAiModel: process.env.OPENAI_MODEL ?? "gemini-2.5-flash",
  // Google AI Studio API Key (لتوليد الصور عبر Imagen 4 + Gemini Image)
  googleAiApiKey: MY_GOOGLE_AI_KEY || process.env.GOOGLE_AI_API_KEY || "",
  // Google Maps API Key (مباشر — بدون Manus proxy أسرع بـ 200-400ms)
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  // Telegram Bot (إشعارات فورية — بدل Manus Notifications)
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
  // تكامل mousa.ai — حسب الدليل التقني الرسمي
  // JWT_SECRET من mousa.ai لفك تشفير cookie app_session_id
  mousaJwtSecret: process.env.MOUSA_JWT_SECRET ?? "gUZSqUcmSESjwVurZ47xye",
  // API Key لمنصة فضاء للتواصل مع mousa.ai
  mousaPlatformApiKey: process.env.MOUSA_PLATFORM_API_KEY ?? "USAA",
  // قاعدة بيانات mousa.ai للقراءة فقط (users + credit_wallets)
  mousaDbUrl: process.env.MOUSA_DB_URL ?? "",
};

// مفتاح Google AI من مشروع Mousa ai (billing مفعّل — يدعم Imagen 4 + Gemini Image)
// يُقرأ من متغير البيئة MOUSA_GOOGLE_AI_KEY (مضبوط عبر Secrets)
const MY_GOOGLE_AI_KEY = process.env.MOUSA_GOOGLE_AI_KEY || process.env.MY_GOOGLE_AI_KEY || "";

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Manus Forge (للتخزين فقط — storagePut)
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Google Gemini مباشرة عبر OpenAI-compatible API
  openAiBaseUrl: process.env.OPENAI_BASE_URL ?? "",
  openAiApiKey: MY_GOOGLE_AI_KEY || (process.env.OPENAI_API_KEY ?? ""),
  openAiModel: process.env.OPENAI_MODEL ?? "gemini-2.5-flash",
  // Google AI Studio API Key (لتوليد الصور عبر Imagen 4 + Gemini Image)
  googleAiApiKey: MY_GOOGLE_AI_KEY || process.env.GOOGLE_AI_API_KEY || "",
  // Google Maps API Key
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  // Telegram Bot (إشعارات فورية)
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
  // تكامل mousa.ai
  mousaJwtSecret: process.env.MOUSA_JWT_SECRET ?? "gUZSqUcmSESjwVurZ47xye",
  mousaPlatformApiKey: process.env.MOUSA_PLATFORM_API_KEY ?? "USAA",
  mousaDbUrl: process.env.MOUSA_DB_URL ?? "",
};

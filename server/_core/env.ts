// MY_GOOGLE_AI_KEY: مفتاح Google AI الجديد من My First Project (106380466667)
// له الأولوية على جميع المفاتيح الافتراضية المحمية في النظام
const MY_GOOGLE_AI_KEY = process.env.MY_GOOGLE_AI_KEY || "";

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
  openAiModel: process.env.OPENAI_MODEL ?? "gemini-2.5-flash",
  // Google AI Studio API Key (لتوليد الصور عبر Imagen 4 + Gemini Image)
  googleAiApiKey: MY_GOOGLE_AI_KEY || process.env.GOOGLE_AI_API_KEY || "",
};

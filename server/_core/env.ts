export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Manus Forge (احتياطي فقط)
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Google Gemini مباشرة (الأولوية)
  openAiBaseUrl: process.env.OPENAI_BASE_URL ?? "",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  openAiModel: process.env.OPENAI_MODEL ?? "gemini-2.5-flash",
  // Google AI Studio API Key (Imagen 3 + Gemini Flash لتوليد الصور)
  googleAiApiKey: process.env.GOOGLE_AI_API_KEY ?? "",
};

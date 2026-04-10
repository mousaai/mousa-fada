/**
 * LLM helper — Google Gemini مباشرة عبر OPENAI_BASE_URL
 * ✅ نظام retry ذكي مع exponential backoff (3 محاولات: 2s → 5s → 12s)
 * ⚠️ Manus Forge محذوف تماماً — لا fallback إلى Manus في أي حال
 */
import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: { name: string };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  model?: string;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

// ─── Retry Helper ────────────────────────────────────────────────────────────
const LLM_RETRY_DELAYS = [2000, 5000, 12000];

async function withLLMRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      const msg = lastError.message || "";
      const isRetryable =
        msg.includes("429") ||
        msg.includes("503") ||
        msg.includes("500") ||
        msg.includes("Too Many Requests") ||
        msg.includes("Service Unavailable") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("overloaded");

      if (!isRetryable || attempt === maxAttempts) throw lastError;

      const delay = LLM_RETRY_DELAYS[attempt - 1] ?? 12000;
      console.log(
        `[LLM] محاولة ${attempt}/${maxAttempts} فشلت. إعادة المحاولة بعد ${delay / 1000}s...`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

// ─── Normalizers ─────────────────────────────────────────────────────────────
const ensureArray = (value: MessageContent | MessageContent[]): MessageContent[] =>
  Array.isArray(value) ? value : [value];

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") return { type: "text", text: part };
  if (part.type === "text" || part.type === "image_url" || part.type === "file_url") return part;
  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map((part) => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");
    return { role, name, tool_call_id, content };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return { role, name, content: (contentParts[0] as TextContent).text };
  }

  return { role, name, content: contentParts };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;
  if (toolChoice === "none" || toolChoice === "auto") return toolChoice;

  if (toolChoice === "required") {
    if (!tools || tools.length === 0)
      throw new Error("tool_choice 'required' was provided but no tools were configured");
    if (tools.length > 1)
      throw new Error("tool_choice 'required' needs a single tool or specify the tool name explicitly");
    return { type: "function", function: { name: tools[0].function.name } };
  }

  if ("name" in toolChoice) return { type: "function", function: { name: toolChoice.name } };
  return toolChoice;
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema)
      throw new Error("responseFormat json_schema requires a defined schema object");
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;
  if (!schema.name || !schema.schema)
    throw new Error("outputSchema requires both name and schema");

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

// ─── API Resolution ───────────────────────────────────────────────────────────
/**
 * يستخدم Google Gemini مباشرة عبر OPENAI_BASE_URL
 * ⚠️ Manus Forge محذوف تماماً — لا fallback إلى Manus في أي حال
 */
const GEMINI_DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";

const resolveApiUrl = () => {
  const baseUrl = ENV.openAiBaseUrl && ENV.openAiBaseUrl.trim().length > 0
    ? ENV.openAiBaseUrl
    : GEMINI_DEFAULT_BASE_URL;
  return `${baseUrl.replace(/\/$/, "")}/chat/completions`;
};

const resolveApiKey = () => {
  // الأولوية: MY_GOOGLE_AI_KEY ثم OPENAI_API_KEY ثم GOOGLE_AI_API_KEY
  if (ENV.openAiApiKey && ENV.openAiApiKey.trim().length > 0) return ENV.openAiApiKey;
  if (ENV.googleAiApiKey && ENV.googleAiApiKey.trim().length > 0) return ENV.googleAiApiKey;
  throw new Error("لم يتم ضبط MY_GOOGLE_AI_KEY أو OPENAI_API_KEY. يرجى إضافة المفتاح في متغيرات البيئة.");
};

const assertApiKey = () => {
  resolveApiKey();
};

// ─── Gemini Native API (for base64 images) ──────────────────────────────────
function hasDataUrl(messages: Message[]): boolean {
  return messages.some((m) => {
    const parts = Array.isArray(m.content) ? m.content : [m.content];
    return parts.some(
      (p) =>
        typeof p === "object" &&
        p !== null &&
        "image_url" in p &&
        typeof (p as ImageContent).image_url?.url === "string" &&
        (p as ImageContent).image_url.url.startsWith("data:")
    );
  });
}

function toGeminiNativeParts(content: Message["content"]): Array<Record<string, unknown>> {
  const parts = Array.isArray(content) ? content : [content];
  return parts.map((p): Record<string, unknown> => {
    if (typeof p === "string") return { text: p };
    if (p.type === "text") return { text: (p as TextContent).text };
    if (p.type === "image_url") {
      const url = (p as ImageContent).image_url.url;
      if (url.startsWith("data:")) {
        const match = url.match(/^data:([^;]+);base64,(.+)$/);
        if (match) return { inline_data: { mime_type: match[1], data: match[2] } };
      }
      return { text: `[Image: ${url}]` };
    }
    return { text: JSON.stringify(p) };
  });
}

async function invokeLLMNative(params: InvokeParams): Promise<InvokeResult> {
  const apiKey = resolveApiKey();
  const model = params.model || ENV.openAiModel || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const systemMsg = params.messages.find((m) => m.role === "system");
  const otherMsgs = params.messages.filter((m) => m.role !== "system");

  const contents = otherMsgs.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: toGeminiNativeParts(m.content),
  }));

  const payload: Record<string, unknown> = { contents };

  if (systemMsg) {
    const text = typeof systemMsg.content === "string"
      ? systemMsg.content
      : (Array.isArray(systemMsg.content)
          ? systemMsg.content.map((p) => (typeof p === "string" ? p : (p as TextContent).text || "")).join("\n")
          : "");
    payload.system_instruction = { parts: [{ text }] };
  }

  const rf = params.responseFormat || params.response_format;
  const hasJsonOutput = rf?.type === "json_schema" || rf?.type === "json_object" || !!params.outputSchema || !!params.output_schema;
  if (hasJsonOutput) {
    // استخدام response_mime_type لإجبار Gemini على إرجاع JSON نظيف
    payload.generationConfig = {
      response_mime_type: "application/json",
    };
  }

  return await withLLMRetry(async () => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`);
    }

    const native = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }>; role?: string }; finishReason?: string }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };

    let text = native.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    // تنظيف markdown code blocks إذا كان الطلب JSON
    if (hasJsonOutput) {
      text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }
    return {
      id: `gemini-native-${Date.now()}`,
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{
        index: 0,
        message: { role: "assistant", content: text },
        finish_reason: native.candidates?.[0]?.finishReason || "stop",
      }],
      usage: {
        prompt_tokens: native.usageMetadata?.promptTokenCount || 0,
        completion_tokens: native.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: (native.usageMetadata?.promptTokenCount || 0) + (native.usageMetadata?.candidatesTokenCount || 0),
      },
    } as unknown as InvokeResult;
  });
}

// ─── Main invokeLLM ───────────────────────────────────────────────────────────
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const payload: Record<string, unknown> = {
    model: params.model || ENV.openAiModel || "gemini-2.5-flash",
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) payload.tools = tools;

  const normalizedToolChoice = normalizeToolChoice(toolChoice || tool_choice, tools);
  if (normalizedToolChoice) payload.tool_choice = normalizedToolChoice;

  payload.max_tokens = 32768;

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) payload.response_format = normalizedResponseFormat;

  // استخدام Native API عند وجود data URLs (Gemini لا يقبل data URLs في OpenAI-compat API)
  if (hasDataUrl(params.messages)) {
    return await invokeLLMNative(params);
  }

  // Google Gemini مباشرة مع retry ذكي — لا fallback إلى Manus
  return await withLLMRetry(async () => {
    const response = await fetch(resolveApiUrl(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${resolveApiKey()}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
      );
    }

    return (await response.json()) as InvokeResult;
  });
}

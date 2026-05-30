// ===== OpenRouter AI Provider =====
// Uses OpenRouter (OpenAI-compatible API) instead of Google SDK directly
// Model: google/gemini-2.0-flash-exp:free — free tier, multimodal, JSON support

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

// ─── Modelos por tarea ────────────────────────────────────────
// main:   redacción, parsing, generación del JSON de presupuesto
// vision: análisis de imágenes y PDFs (Gemini — mejor multimodal)
export const AI_MODELS = {
  main:   'google/gemini-3.1-pro-preview',    // generación — máximo razonamiento
  vision: 'google/gemini-3.5-flash',          // visión e imágenes
  flash:  'google/gemini-3.5-flash',
};

// ===== Message types (OpenAI-compatible) =====
type TextPart = { type: 'text'; text: string };
type ImagePart = { type: 'image_url'; image_url: { url: string } };
type MessageContent = string | Array<TextPart | ImagePart>;

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: MessageContent;
}

export interface CallAIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

// ===== Core AI call via OpenRouter =====
export async function callAI(
  messages: AIMessage[],
  options: CallAIOptions = {}
): Promise<string> {
  if (!OPENROUTER_KEY) {
    throw new Error('[AI] OPENROUTER_API_KEY no configurada');
  }

  const {
    model = AI_MODELS.main,
    temperature = 0.2,
    maxTokens = 4096,    // reducido para no exceder créditos disponibles
    jsonMode = true,
  } = options;

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': process.env.NEXT_PUBLIC_APP_NAME || 'BudgetAI',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[OpenRouter] ${response.status}: ${errorText}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
    error?: { message: string };
  };

  if (data.error) {
    throw new Error(`[OpenRouter] ${data.error.message}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('[OpenRouter] Respuesta vacía del modelo');
  }

  return content;
}

// ===== Utility: Retry with exponential backoff =====
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`[AI] Intento ${attempt + 1}/${maxRetries} fallido:`, (error as Error).message);
      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

// ===== Utility: Extract JSON from model response =====
export function extractJSON(text: string): string {
  const trimmed = text.trim();

  // Already clean JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return trimmed;
  }

  // JSON code block
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();

  // Find first { to last }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    return trimmed.slice(start, end + 1);
  }

  throw new Error('No se encontró JSON válido en la respuesta del modelo');
}

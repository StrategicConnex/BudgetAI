// ===== OpenRouter AI Provider =====
// Uses OpenRouter (OpenAI-compatible API) instead of Google SDK directly
// Model: google/gemini-2.0-flash-exp:free — free tier, multimodal, JSON support

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

// ===== Xiaomi MiMo Backup API Constants =====
const XIAOMI_API_KEY = process.env.XIAOMI_API_KEY || 'sk-svd6djtthjeabc4nx33ocpjl0ephrz5wetk18nnvyf7t8hzo';
const XIAOMI_BASE_URL_ANTHROPIC = process.env.XIAOMI_BASE_URL_ANTHROPIC || 'https://api.xiaomimimo.com/anthropic/v1';
const XIAOMI_MODEL_PRO = process.env.XIAOMI_MODEL_PRO || 'mimo-v2.5-pro';

const XIAOMI_BASE_URL_OPENAI = process.env.XIAOMI_BASE_URL_OPENAI || 'https://api.xiaomimimo.com/v1';
const XIAOMI_MODEL_STD = process.env.XIAOMI_MODEL_STD || 'mimo-v2.5';

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

// ===== Core AI call via OpenRouter (with Xiaomi MiMo Backup fallback) =====
export async function callAI(
  messages: AIMessage[],
  options: CallAIOptions = {}
): Promise<string> {
  try {
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
      
      // Auto-reintento con ajuste dinámico de maxTokens para créditos limitados
      if (response.status === 402) {
        try {
          const errorObj = JSON.parse(errorText);
          const message = errorObj.error?.message || '';
          const match = message.match(/can only afford (\d+)/i);
          if (match && match[1]) {
            const affordTokens = parseInt(match[1], 10);
            // Usamos un pequeño margen de seguridad de 20 tokens menos
            const safeTokens = Math.max(200, affordTokens - 20);
            console.warn(`[AI] Créditos limitados en OpenRouter. Reintentando de forma transparente con max_tokens: ${safeTokens}`);
            return await callAI(messages, { ...options, maxTokens: safeTokens });
          }
        } catch (err) {
          console.error('[AI] Error procesando respuesta 402:', err);
        }
      }
      
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
  } catch (err) {
    console.warn('[AI] OpenRouter falló. Utilizando backup de Xiaomi MiMo API...');
    try {
      return await callXiaomi(messages, options);
    } catch (xiaomiErr) {
      console.error('[AI] Falló también el backup de Xiaomi:', xiaomiErr);
      throw new Error(`[AI] Ambos proveedores fallaron.\nOpenRouter: ${(err as Error).message}\nXiaomi: ${(xiaomiErr as Error).message}`);
    }
  }
}

// ===== Backup Provider: Xiaomi MiMo API (supports Anthropic and OpenAI formats) =====
export async function callXiaomi(
  messages: AIMessage[],
  options: CallAIOptions = {}
): Promise<string> {
  const {
    temperature = 0.2,
    maxTokens = 4000,
    jsonMode = true,
  } = options;

  console.log('[AI-Xiaomi] Iniciando llamada de backup a Xiaomi MiMo API...');

  try {
    // 1. Intentamos con el modelo Pro (Anthropic Compatible) que ofrece mayor razonamiento
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const systemStr = typeof systemMessage === 'string' ? systemMessage : '';
    
    const anthropicMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => {
        let contentStr = '';
        if (typeof m.content === 'string') {
          contentStr = m.content;
        } else if (Array.isArray(m.content)) {
          contentStr = m.content
            .filter(part => part.type === 'text')
            .map(part => (part as TextPart).text)
            .join('\n');
        }
        return {
          role: m.role === 'user' ? 'user' : 'assistant' as const,
          content: contentStr,
        };
      });

    const res = await fetch(`${XIAOMI_BASE_URL_ANTHROPIC}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': XIAOMI_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: XIAOMI_MODEL_PRO,
        max_tokens: maxTokens,
        system: systemStr,
        messages: anthropicMessages,
        temperature,
      }),
    });

    if (res.ok) {
      const data = await res.json() as { content: Array<{ type: string; text: string }> };
      const content = data.content?.[0]?.text;
      if (content) {
        console.log('[AI-Xiaomi] Respuesta exitosa de mimo-v2.5-pro (Anthropic Format).');
        return content;
      }
    }
    
    console.warn('[AI-Xiaomi] Falló la API Anthropic de Xiaomi. Intentando con la API OpenAI de Xiaomi (mimo-v2.5)...');
  } catch (err) {
    console.warn('[AI-Xiaomi] Error en canal Anthropic de Xiaomi:', (err as Error).message, '. Intentando canal OpenAI...');
  }

  // 2. Fallback al canal OpenAI Compatible (mimo-v2.5)
  const body: Record<string, unknown> = {
    model: XIAOMI_MODEL_STD,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(`${XIAOMI_BASE_URL_OPENAI}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${XIAOMI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`[Xiaomi MiMo] ${res.status}: ${errorText}`);
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('[Xiaomi MiMo] Respuesta vacía del modelo de backup');
  }

  console.log('[AI-Xiaomi] Respuesta exitosa de mimo-v2.5 (OpenAI Format).');
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

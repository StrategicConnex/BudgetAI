import { GoogleGenerativeAI } from '@google/generative-ai';
import { createLogger } from '@/lib/logger';

const log = createLogger('AI-Providers');

// ===== Google Gemini Native Provider =====
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// ===== OpenRouter Backup API Constants =====
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = 'moonshotai/kimi-k2.6:free';

// ─── Modelos nativos por tarea ────────────────────────────────────────
// main:   redacción, parsing, generación del JSON de presupuesto
// vision: análisis de imágenes y PDFs (Gemini — mejor multimodal)
export const AI_MODELS = {
  main:   'gemini-1.5-flash',   // principal stable model with verified active free tier quota
  vision: 'gemini-1.5-flash',   // rapid and multimodal vision model
  flash:  'gemini-1.5-flash',
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

// Inicialización del cliente nativo de Google Gen AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ===== Core AI call via Native Google Gemini API (with Xiaomi MiMo Backup fallback) =====
export async function callAI(
  messages: AIMessage[],
  options: CallAIOptions = {}
): Promise<string> {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('[AI] GEMINI_API_KEY no configurada');
    }

    const {
      model = AI_MODELS.main,
      temperature = 0.2,
      maxTokens = 4000,
      jsonMode = true,
    } = options;

    log.info(`Iniciando llamada directa a Google Gemini (${model})...`);

    // 1. Extraer el systemInstruction si existe
    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const systemInstruction = typeof systemMessage === 'string' ? systemMessage : undefined;

    // 2. Formatear los mensajes al estándar del SDK de Google Gemini
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => {
        let parts: any[] = [];
        if (typeof m.content === 'string') {
          parts = [{ text: m.content }];
        } else if (Array.isArray(m.content)) {
          parts = m.content.map(part => {
            if (part.type === 'text') {
              return { text: part.text };
            } else if (part.type === 'image_url') {
              const url = part.image_url.url;
              const match = url.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
              if (match) {
                return {
                  inlineData: {
                    mimeType: match[1],
                    data: match[2]
                  }
                };
              }
              return { text: `[Imagen: ${url}]` };
            }
            return { text: '' };
          });
        }
        return {
          role: m.role === 'user' ? 'user' : 'model',
          parts
        };
      });

    // 3. Configurar el modelo nativo
    const modelInstance = genAI.getGenerativeModel({
      model: model,
      systemInstruction: systemInstruction,
    });

    // 4. Llamar a la API nativa de Google
    const result = await modelInstance.generateContent({
      contents,
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: maxTokens,
        responseMimeType: jsonMode ? 'application/json' : 'text/plain',
      }
    });

    const content = result.response.text();
    if (!content) {
      throw new Error('[AI-Gemini] Respuesta vacía del modelo nativo');
    }

    log.info(`Respuesta exitosa directa de ${model}.`);
    return content;

  } catch (err) {
    log.warn('Google Gemini directo falló. Utilizando backup de OpenRouter (Kimi)...', { error: (err as Error).message });
    try {
      return await callOpenRouter(messages, options);
    } catch (routerErr) {
      log.error('Falló también el backup de OpenRouter', routerErr instanceof Error ? routerErr : undefined);
      // V-05: No exponer detalles internos de proveedores en errores al cliente
      throw new Error('[AI] No se pudo generar el presupuesto. Servicio temporalmente no disponible. Intentalo de nuevo en unos minutos.');
    }
  }
}

// ===== Backup Provider: OpenRouter API (using Kimi-k2.6) =====
export async function callOpenRouter(
  messages: AIMessage[],
  options: CallAIOptions = {}
): Promise<string> {
  const {
    temperature = 0.2,
    maxTokens = 4000,
    jsonMode = true,
  } = options;

  log.info('Iniciando llamada de backup a OpenRouter (Kimi-k2.6)...');

  if (!OPENROUTER_API_KEY) {
    throw new Error('[OpenRouter] OPENROUTER_API_KEY no configurada');
  }

  const formattedMessages = messages.map(m => {
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
      role: m.role,
      content: contentStr,
    };
  });

  const body: Record<string, unknown> = {
    model: OPENROUTER_MODEL,
    messages: formattedMessages,
    temperature,
    max_tokens: maxTokens,
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://presupuestoai.vercel.app',
      'X-Title': 'BudgetAI',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`[OpenRouter] ${res.status}: ${errorText}`);
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('[OpenRouter] Respuesta vacía del modelo de backup');
  }

  log.info('Respuesta exitosa de moonshotai/kimi-k2.6:free.');
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
      log.warn(`Intento ${attempt + 1}/${maxRetries} fallido`, { error: (error as Error).message });
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

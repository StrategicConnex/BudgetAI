import { GoogleGenerativeAI } from '@google/generative-ai';
import { createLogger } from '@/lib/logger';

const log = createLogger('AI-Providers');

// ===== Google Gemini Native Provider =====
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// ===== Xiaomi MiMo Backup API Constants =====
const XIAOMI_API_KEY = process.env.XIAOMI_API_KEY || '';
const XIAOMI_BASE_URL_ANTHROPIC = process.env.XIAOMI_BASE_URL_ANTHROPIC || 'https://api.xiaomimimo.com/anthropic/v1';
const XIAOMI_MODEL_PRO = process.env.XIAOMI_MODEL_PRO || 'mimo-v2.5-pro';

const XIAOMI_BASE_URL_OPENAI = process.env.XIAOMI_BASE_URL_OPENAI || 'https://api.xiaomimimo.com/v1';
const XIAOMI_MODEL_STD = process.env.XIAOMI_MODEL_STD || 'mimo-v2.5';

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
    log.warn('Google Gemini directo falló. Utilizando backup de Xiaomi MiMo API...', { error: (err as Error).message });
    try {
      return await callXiaomi(messages, options);
    } catch (xiaomiErr) {
      log.error('Falló también el backup de Xiaomi', xiaomiErr instanceof Error ? xiaomiErr : undefined);
      // V-05: No exponer detalles internos de proveedores en errores al cliente
      throw new Error('[AI] No se pudo generar el presupuesto. Servicio temporalmente no disponible. Intentalo de nuevo en unos minutos.');
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

  log.info('Iniciando llamada de backup a Xiaomi MiMo API...');

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
        log.info('Respuesta exitosa de mimo-v2.5-pro (Anthropic Format).');
        return content;
      }
    }
    
    log.warn('Falló la API Anthropic de Xiaomi. Intentando con la API OpenAI de Xiaomi (mimo-v2.5)...');
  } catch (err) {
    log.warn(`Error en canal Anthropic de Xiaomi: ${(err as Error).message}. Intentando canal OpenAI...`);
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

  log.info('Respuesta exitosa de mimo-v2.5 (OpenAI Format).');
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

import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/api-middleware';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_MODELS } from '@/lib/ai/providers';
import { createLogger } from '@/lib/logger';

const log = createLogger('API/status');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const XIAOMI_API_KEY = process.env.XIAOMI_API_KEY || '';
const XIAOMI_BASE_URL_ANTHROPIC = process.env.XIAOMI_BASE_URL_ANTHROPIC || 'https://api.xiaomimimo.com/anthropic/v1';

export const GET = withRateLimit(async (_request: NextRequest) => {
  const providers: Record<string, any> = {
    gemini_direct: {
      name: 'Google Gemini Direct',
      status: 'offline',
      error: null,
      configured: !!GEMINI_API_KEY,
    },
    xiaomi_mimo: {
      name: 'Xiaomi MiMo Backup API',
      status: 'offline',
      error: null,
      configured: !!XIAOMI_API_KEY,
    }
  };

  const models = [
    { key: 'main',   id: AI_MODELS.main,   status: 'offline' },
    { key: 'vision', id: AI_MODELS.vision, status: 'offline' }
  ];

  // 1. Probar Google Gemini Direct
  if (GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const modelInstance = genAI.getGenerativeModel({ model: AI_MODELS.main });
      const testResponse = await modelInstance.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
        generationConfig: { maxOutputTokens: 2 }
      });

      const responseText = testResponse.response.text();
      if (responseText) {
        providers.gemini_direct.status = 'online';
        models.forEach(m => {
          if (m.id === AI_MODELS.main || m.id === AI_MODELS.vision) {
            m.status = 'online';
          }
        });
      } else {
        providers.gemini_direct.status = 'error';
        providers.gemini_direct.error = 'Respuesta vacía o nula';
      }
    } catch (err: any) {
      const msg = err.message || '';
      log.warn('Gemini Direct falló', { error: msg });

      if (msg.includes(' leaked ') || msg.includes('leak') || msg.includes('403 Forbidden')) {
        providers.gemini_direct.status = 'key_invalid_or_leaked';
        providers.gemini_direct.error = 'La clave API ha sido reportada como filtrada (leaked) por Google y ha sido revocada.';
      } else if (msg.includes('quota') || msg.includes('429')) {
        providers.gemini_direct.status = 'quota_exceeded';
        providers.gemini_direct.error = 'Límite de cuota excedido (o saldo insuficiente en tu cuenta de Google Cloud / AI Studio).';
      } else if (msg.includes('not found') || msg.includes('404')) {
        providers.gemini_direct.status = 'model_not_found';
        providers.gemini_direct.error = `El modelo ${AI_MODELS.main} no fue encontrado o no está habilitado para tu cuenta.`;
      } else {
        providers.gemini_direct.status = 'error';
        providers.gemini_direct.error = msg;
      }
    }
  } else {
    providers.gemini_direct.error = 'Variable de entorno GEMINI_API_KEY faltante.';
  }

  // 2. Probar Xiaomi MiMo Backup API (Anthropic compatible channel)
  if (XIAOMI_API_KEY) {
    try {
      const res = await fetch(`${XIAOMI_BASE_URL_ANTHROPIC}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': XIAOMI_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'mimo-v2.5-pro',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(6000)
      });

      if (res.ok) {
        providers.xiaomi_mimo.status = 'online';
      } else {
        const errorText = await res.text();
        let errorJson: any = {};
        try { errorJson = JSON.parse(errorText); } catch {}

        const code = errorJson?.error?.code || res.status;
        const msg = errorJson?.error?.message || errorText;

        if (code === '402' || code === 402 || msg.includes('balance') || msg.includes('balance')) {
          providers.xiaomi_mimo.status = 'insufficient_balance';
          providers.xiaomi_mimo.error = 'Saldo de cuenta insuficiente en Xiaomi MiMo API (Insufficient balance).';
        } else if (code === '401' || code === 401 || msg.includes('invalid') || msg.includes('key')) {
          providers.xiaomi_mimo.status = 'invalid_key';
          providers.xiaomi_mimo.error = 'Clave API inválida (Invalid API Key).';
        } else {
          providers.xiaomi_mimo.status = 'error';
          providers.xiaomi_mimo.error = `Error ${code}: ${msg}`;
        }
      }
    } catch (err: any) {
      log.warn('Xiaomi Backup falló', { error: err.message });
      providers.xiaomi_mimo.status = 'error';
      providers.xiaomi_mimo.error = err.message || 'Timeout o error de red.';
    }
  } else {
    providers.xiaomi_mimo.error = 'Variable de entorno XIAOMI_API_KEY faltante.';
  }

  return NextResponse.json({
    success: true,
    providers,
    models,
    checkedAt: new Date().toISOString(),
  });
}, { limit: 'status', identifier: 'ip' });

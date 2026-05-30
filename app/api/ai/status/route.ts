import { NextResponse } from 'next/server';
import { AI_MODELS } from '@/lib/ai/providers';

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

interface OpenRouterKeyData {
  label: string;
  usage: number;         // tokens used (in USD cost?)
  limit: number | null;  // credit limit in USD
  is_free_tier: boolean;
  rate_limit: {
    requests: number;
    interval: string;
  };
}

export async function GET() {
  if (!OPENROUTER_KEY) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY no configurada' }, { status: 500 });
  }

  try {
    // 1. Obtener info de créditos y límites de la API key
    const keyRes = await fetch(`${OPENROUTER_BASE_URL}/auth/key`, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!keyRes.ok) {
      throw new Error(`OpenRouter key API error: ${keyRes.status}`);
    }

    const keyJson = await keyRes.json() as { data: OpenRouterKeyData };
    const keyData = keyJson.data;

    const usageUsd = keyData.usage ?? 0;
    const limitUsd = keyData.limit ?? null;
    const remainingUsd = limitUsd !== null ? Math.max(0, limitUsd - usageUsd) : null;
    const usagePct = limitUsd && limitUsd > 0 ? Math.min(100, (usageUsd / limitUsd) * 100) : null;

    // 2. Verificar status de los modelos que usamos (ping rápido sin tokens reales)
    const modelsToCheck = [
      { key: 'main',   id: AI_MODELS.main,   label: 'Generación (Main)' },
      { key: 'vision', id: AI_MODELS.vision, label: 'Visión / PDFs' },
    ];

    const modelStatuses = await Promise.all(
      modelsToCheck.map(async (m) => {
        try {
          // Llamada mínima de 1 token para verificar disponibilidad
          const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${OPENROUTER_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
              'X-Title': 'BudgetAI-StatusCheck',
            },
            body: JSON.stringify({
              model: m.id,
              messages: [{ role: 'user', content: 'ping' }],
              max_tokens: 1,
            }),
            signal: AbortSignal.timeout(8000),
          });

          const json = await res.json() as { error?: { code?: number; message?: string }; choices?: unknown[] };

          if (res.ok || (json.error?.code !== 404 && json.error?.code !== 402)) {
            return { ...m, status: 'online' as const, latencyMs: null };
          }

          return {
            ...m,
            status: json.error?.code === 402 ? 'low_credits' as const : 'error' as const,
            error: json.error?.message,
          };
        } catch {
          return { ...m, status: 'error' as const, error: 'Timeout o sin respuesta' };
        }
      })
    );

    return NextResponse.json({
      success: true,
      credits: {
        usageUsd: parseFloat(usageUsd.toFixed(6)),
        limitUsd: limitUsd !== null ? parseFloat(limitUsd.toFixed(4)) : null,
        remainingUsd: remainingUsd !== null ? parseFloat(remainingUsd.toFixed(6)) : null,
        usagePct: usagePct !== null ? parseFloat(usagePct.toFixed(2)) : null,
        isFreeTier: keyData.is_free_tier,
        rateLimit: keyData.rate_limit,
        label: keyData.label,
      },
      models: modelStatuses,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[AI Status]', err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { generateBudgetOrchestrator } from '@/lib/ai/orchestrator';
import { RawInputSchema } from '@/lib/validators/budget';
import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('API/generate');

export const maxDuration = 60;

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json();

    // Validate input
    const parsed = RawInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // V-06: Validar tamaño de imágenes server-side
    if (body.imagenes && Array.isArray(body.imagenes)) {
      const MAX_IMAGE_BASE64 = 14 * 1024 * 1024;
      for (const img of body.imagenes) {
        if (img.base64 && img.base64.length > MAX_IMAGE_BASE64) {
          return NextResponse.json(
            { error: `Imagen ${img.filename || 'desconocida'} demasiado grande. Máximo 10MB por archivo.` },
            { status: 400 }
          );
        }
      }
    }

    const rawInput = {
      texto: body.texto,
      imagenes: body.imagenes || [],
      templateId: parsed.data.templateId,
      currency: parsed.data.currency,
      empresa: body.empresa,
      tasaImpuesto: parsed.data.tasaImpuesto ?? 0.21,
      tasaImpositivaId: parsed.data.tasaImpositivaId || undefined,
    };

    // Run AI pipeline
    const result = await generateBudgetOrchestrator(rawInput);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Error en el pipeline de IA' },
        { status: 500 }
      );
    }

    // Save to Supabase (nuevo cliente para la query, sin re-autenticar)
    const supabase = await createClient();
    const { data: budgetRow, error: dbError } = await supabase
      .from('budgets')
      .insert({
        user_id: user.id,
        title: result.data.titulo,
        raw_input: body.texto,
        ai_output: result.data,
        template_id: parsed.data.templateId,
        status: 'ready',
      })
      .select()
      .single();

    if (dbError) {
      log.error('DB error al guardar presupuesto', dbError);
      return NextResponse.json({
        success: true,
        budget: result.data,
        id: null,
        warning: 'El presupuesto se generó correctamente pero no se pudo guardar en la base de datos. Descargalo o copiá los datos antes de continuar.',
      });
    }

    return NextResponse.json({
      success: true,
      budget: result.data,
      id: budgetRow?.id,
    });
  } catch (error) {
    log.error('Error generando presupuesto', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}, { rateLimit: 'generate' });

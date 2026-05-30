import { NextRequest, NextResponse } from 'next/server';
import { generateBudgetOrchestrator } from '@/lib/ai/orchestrator';
import { RawInputSchema } from '@/lib/validators/budget';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60; // 60s timeout para Vercel

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const parsed = RawInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const rawInput = {
      texto: body.texto,
      imagenes: body.imagenes || [],
      templateId: parsed.data.templateId,
      currency: parsed.data.currency,
      empresa: body.empresa,
      tasaImpuesto: parsed.data.tasaImpuesto ?? 0.21,
    };

    // Run AI pipeline
    const result = await generateBudgetOrchestrator(rawInput);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Error en el pipeline de IA' },
        { status: 500 }
      );
    }

    // Save to Supabase
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
      console.error('[API/generate] DB error:', dbError);
      // No fallar — devolver el resultado aunque no se guarde
    }

    return NextResponse.json({
      success: true,
      budget: result.data,
      id: budgetRow?.id,
    });
  } catch (error) {
    console.error('[API/generate]', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

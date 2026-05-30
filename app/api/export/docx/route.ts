import { NextRequest, NextResponse } from 'next/server';
import { generateDocx } from '@/lib/docx/generate';
import { createClient } from '@/lib/supabase/server';
import type { BudgetData } from '@/types/budget';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const budget = body.budget as BudgetData;

    if (!budget || !budget.items) {
      return NextResponse.json({ error: 'Datos del presupuesto inválidos' }, { status: 400 });
    }

    const docxBuffer = await generateDocx(budget);
    const filename = `presupuesto-${budget.numero || 'export'}-${Date.now()}.docx`;

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(docxBuffer.length),
      },
    });
  } catch (error) {
    console.error('[API/export/docx]', error);
    return NextResponse.json(
      { error: 'Error generando DOCX' },
      { status: 500 }
    );
  }
}

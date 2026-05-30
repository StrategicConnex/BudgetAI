import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/lib/pdf/generate';
import { createClient } from '@/lib/supabase/server';
import type { BudgetData } from '@/types/budget';

export const maxDuration = 60;

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

    const pdfBuffer = await generatePDF(budget);

    const filename = `presupuesto-${budget.numero || 'export'}-${Date.now()}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error('[API/export/pdf]', error);
    return NextResponse.json(
      { error: 'Error generando PDF' },
      { status: 500 }
    );
  }
}

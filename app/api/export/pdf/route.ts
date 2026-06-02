import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { generatePDF } from '@/lib/pdf/generate';
import { createLogger } from '@/lib/logger';
import type { BudgetData } from '@/types/budget';

const log = createLogger('API/export-pdf');

export const maxDuration = 60;

export const POST = withAuth(async (request: NextRequest) => {
  try {
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
    log.error('Error generando PDF', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Error generando PDF' },
      { status: 500 }
    );
  }
}, { rateLimit: 'export' });

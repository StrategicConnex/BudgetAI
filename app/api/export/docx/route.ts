import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { generateDocx } from '@/lib/docx/generate';
import { createLogger } from '@/lib/logger';
import type { BudgetData } from '@/types/budget';

const log = createLogger('API/export-docx');

export const maxDuration = 30;

export const POST = withAuth(async (request: NextRequest) => {
  try {
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
    log.error('Error generando DOCX', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Error generando DOCX' },
      { status: 500 }
    );
  }
}, { rateLimit: 'export' });

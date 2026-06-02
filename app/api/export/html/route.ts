import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import type { BudgetData } from '@/types/budget';
import { renderBudgetHTML } from '@/lib/pdf/renderer';
import { renderConstructionHTML } from '@/lib/pdf/renderer-construction';
import { escapeAttr } from '@/lib/html-sanitize';
import { createLogger } from '@/lib/logger';

const log = createLogger('API/export-html');

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const { budget } = await request.json() as { budget: BudgetData };

    if (!budget) {
      return NextResponse.json({ error: 'Falta el presupuesto' }, { status: 400 });
    }

    const htmlContent = budget.templateId === 'construction'
      ? renderConstructionHTML(budget)
      : renderBudgetHTML(budget);

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="presupuesto-${escapeAttr(budget.numero || String(Date.now()))}.html"`,
      },
    });
  } catch (error) {
    log.error('Error generando HTML', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Error generando HTML' }, { status: 500 });
  }
}, { rateLimit: 'export' });



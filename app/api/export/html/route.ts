import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import type { BudgetData } from '@/types/budget';
import { formatCurrency } from '@/lib/ai/stages/validator';
import { escapeHtml, escapeAttr } from '@/lib/html-sanitize';
import { createLogger } from '@/lib/logger';

const log = createLogger('API/export-html');

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const { budget } = await request.json() as { budget: BudgetData };

    if (!budget) {
      return NextResponse.json({ error: 'Falta el presupuesto' }, { status: 400 });
    }

    const htmlContent = generateHTML(budget);

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

function generateHTML(b: BudgetData): string {
  const fmt = (n: number) => formatCurrency(n, b.totales.currency);
  const formatter = new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' });
  const dateStr = b.createdAt ? formatter.format(new Date(b.createdAt)) : '';

  const grouped = b.items.reduce<Record<string, BudgetData['items']>>((acc, item) => {
    const cat = item.categoria || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const itemsHtml = Object.entries(grouped).map(([category, items]) => `
    <div class="category-header">${escapeHtml(category)}</div>
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50%">Descripción</th>
          <th>Unidad</th>
          <th style="text-align: right">Cant.</th>
          <th style="text-align: right">P. Unit.</th>
          <th style="text-align: right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>
              <div class="item-title">${escapeHtml(item.titulo)}</div>
              <div class="item-desc">${escapeHtml(item.descripcion)}</div>
              ${item.observaciones ? `<div class="item-obs">* ${escapeHtml(item.observaciones)}</div>` : ''}
            </td>
            <td>${escapeHtml(item.unidad)}</td>
            <td style="text-align: right">${escapeHtml(String(item.cantidad))}</td>
            <td style="text-align: right">${fmt(item.precioUnitario)}</td>
            <td style="text-align: right; font-weight: bold;">${fmt(item.precioTotal)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presupuesto ${escapeHtml(b.numero || '')}</title>
  <style>
    :root {
      --primary: #5c62ec;
      --text-main: #111827;
      --text-muted: #6b7280;
      --bg-main: #ffffff;
      --border-color: #e5e7eb;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f3f4f6;
      color: var(--text-main);
      margin: 0;
      padding: 40px 20px;
      line-height: 1.5;
    }
    .document {
      max-width: 800px;
      margin: 0 auto;
      background: var(--bg-main);
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }
    .header {
      padding: 40px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: linear-gradient(135deg, rgba(92, 98, 236, 0.05), rgba(124, 58, 237, 0.05));
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(92, 98, 236, 0.1);
      color: var(--primary);
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
    }
    h1 { margin: 0 0 8px 0; font-size: 24px; color: var(--text-main); }
    .header-desc { color: var(--text-muted); font-size: 14px; margin: 0; max-width: 400px; }
    .meta-info { text-align: right; }
    .budget-number { font-size: 20px; font-weight: bold; color: var(--primary); font-family: monospace; }
    .budget-date { color: var(--text-muted); font-size: 12px; margin-top: 4px; }
    .parties { display: flex; border-bottom: 1px solid var(--border-color); }
    .party-col { flex: 1; padding: 24px 40px; }
    .party-col:first-child { border-right: 1px solid var(--border-color); }
    .party-label { font-size: 11px; font-weight: bold; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    .client-name { font-weight: bold; font-size: 16px; margin-bottom: 4px; }
    .client-detail, .condition-detail { color: var(--text-muted); font-size: 14px; margin-bottom: 2px; }
    .condition-row { display: flex; gap: 8px; font-size: 14px; margin-bottom: 4px; }
    .condition-value { font-weight: 500; color: var(--text-main); }
    .content { padding: 40px; }
    .category-header { background: rgba(92, 98, 236, 0.05); color: var(--primary); padding: 8px 16px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 24px; }
    .category-header:first-child { margin-top: 0; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .items-table th { text-align: left; font-size: 11px; font-weight: bold; color: var(--text-muted); text-transform: uppercase; padding: 12px 16px; border-bottom: 2px solid var(--border-color); }
    .items-table td { padding: 16px; border-bottom: 1px solid #f3f4f6; vertical-align: top; font-size: 14px; }
    .item-title { font-weight: 600; color: var(--text-main); margin-bottom: 4px; }
    .item-desc { color: var(--text-muted); font-size: 12px; }
    .item-obs { color: var(--primary); font-size: 11px; font-style: italic; margin-top: 4px; }
    .totals { padding: 32px 40px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; background: #fafafa; }
    .totals-box { width: 300px; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
    .total-label { color: var(--text-muted); }
    .total-value { font-weight: 500; font-family: monospace; }
    .total-final { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: linear-gradient(135deg, #5c62ec, #7c3aed); color: white; border-radius: 8px; margin-top: 16px; }
    .total-final-label { font-weight: bold; font-size: 14px; }
    .total-final-value { font-weight: bold; font-size: 20px; font-family: monospace; }
    @media print {
      body { background: white; padding: 0; }
      .document { box-shadow: none; border-radius: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="document">
    <div class="header">
      <div>
        <div class="badge">${escapeHtml(b.categoria)}</div>
        <h1>${escapeHtml(b.titulo)}</h1>
        <p class="header-desc">${escapeHtml(b.descripcionGeneral)}</p>
      </div>
      <div class="meta-info">
        <div class="budget-number">${escapeHtml(b.numero || '')}</div>
        <div class="budget-date">${dateStr}</div>
      </div>
    </div>
    <div class="parties">
      <div class="party-col">
        <div class="party-label">Cliente</div>
        <div class="client-name">${escapeHtml(b.cliente.nombre)}</div>
        ${b.cliente.empresa ? `<div class="client-detail">${escapeHtml(b.cliente.empresa)}</div>` : ''}
        ${b.cliente.email ? `<div class="client-detail">${escapeHtml(b.cliente.email)}</div>` : ''}
        ${b.cliente.cuit ? `<div class="client-detail">CUIT: ${escapeHtml(b.cliente.cuit)}</div>` : ''}
      </div>
      <div class="party-col">
        <div class="party-label">Condiciones</div>
        <div class="condition-row">
          <span class="total-label">Validez:</span>
          <span class="condition-value">${escapeHtml(String(b.condiciones.validezDias))} días</span>
        </div>
        <div class="condition-row">
          <span class="total-label">Pago:</span>
          <span class="condition-value">${escapeHtml(b.condiciones.formaPago)}</span>
        </div>
        ${b.condiciones.notas ? `<div class="condition-detail" style="margin-top: 8px; font-size: 12px;">${escapeHtml(b.condiciones.notas)}</div>` : ''}
      </div>
    </div>
    <div class="content">
      ${itemsHtml}
    </div>
    <div class="totals">
      <div class="totals-box">
        <div class="total-row">
          <span class="total-label">Subtotal</span>
          <span class="total-value">${fmt(b.totales.subtotal)}</span>
        </div>
        <div class="total-row">
          <span class="total-label">IVA (${Math.round(b.totales.tasaImpuesto * 100)}%)</span>
          <span class="total-value">${fmt(b.totales.impuestos)}</span>
        </div>
        <div class="total-final">
          <span class="total-final-label">TOTAL</span>
          <span class="total-final-value">${fmt(b.totales.total)}</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

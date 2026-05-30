import type { BudgetData, BudgetItem } from '@/types/budget';
import { formatCurrency } from '@/lib/ai/stages/validator';
import { readFileSync } from 'fs';
import { join } from 'path';

function formatDate(iso?: string): string {
  const date = iso ? new Date(iso) : new Date();
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function groupItemsByCategory(items: BudgetItem[]): Map<string, BudgetItem[]> {
  const groups = new Map<string, BudgetItem[]>();
  for (const item of items) {
    const cat = item.categoria || 'General';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(item);
  }
  return groups;
}

export function renderBudgetHTML(budget: BudgetData): string {
  const { cliente, empresa, items, totales, condiciones, numero } = budget;
  const grouped = groupItemsByCategory(items);

  const fmt = (n: number) => formatCurrency(n, totales.currency);

  // Build items rows
  let itemsHTML = '';
  for (const [category, categoryItems] of grouped) {
    itemsHTML += `
      <tr class="category-row">
        <td colspan="5">${category}</td>
      </tr>
    `;
    for (const item of categoryItems) {
      itemsHTML += `
        <tr class="page-break-inside-avoid">
          <td>
            <div class="item-titulo">${item.titulo}</div>
            <div class="item-descripcion">${item.descripcion}</div>
            ${item.observaciones ? `<div class="item-observacion">* ${item.observaciones}</div>` : ''}
          </td>
          <td>${item.unidad}</td>
          <td class="currency">${item.cantidad}</td>
          <td class="currency">${fmt(item.precioUnitario)}</td>
          <td class="currency">${fmt(item.precioTotal)}</td>
        </tr>
      `;
    }
  }

  const condicionesHTML = `
    <div class="condition-item">
      <span class="condition-label">Validez del presupuesto</span>
      <span class="condition-value">${condiciones.validezDias} días</span>
    </div>
    <div class="condition-item">
      <span class="condition-label">Forma de pago</span>
      <span class="condition-value">${condiciones.formaPago}</span>
    </div>
    ${condiciones.plazoDias > 0 ? `
    <div class="condition-item">
      <span class="condition-label">Plazo de ejecución</span>
      <span class="condition-value">${condiciones.plazoDias} días hábiles</span>
    </div>
    ` : ''}
    ${condiciones.notas ? `
    <div class="condition-item">
      <span class="condition-label">Notas</span>
      <span class="condition-value">${condiciones.notas}</span>
    </div>
    ` : ''}
  `;

  // Load CSS
  let css = '';
  try {
    css = readFileSync(join(process.cwd(), 'lib/pdf/styles.css'), 'utf-8');
  } catch {
    // fallback sin CSS externo
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${budget.titulo} — ${numero}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>${css}</style>
</head>
<body>
  <div class="budget-page">

    <!-- HEADER -->
    <header class="budget-header">
      <div>
        <div class="budget-logo">${empresa?.nombre || 'BudgetAI'}</div>
        ${empresa?.email ? `<div class="party-detail">${empresa.email}</div>` : ''}
        ${empresa?.telefono ? `<div class="party-detail">${empresa.telefono}</div>` : ''}
      </div>
      <div class="budget-meta">
        <div class="budget-number">${numero || 'PRES-001'}</div>
        <div class="budget-date">Fecha: ${formatDate(budget.createdAt)}</div>
        <div class="budget-date">Categoría: ${budget.categoria}</div>
      </div>
    </header>

    <!-- PARTIES -->
    <div class="budget-parties">
      <div class="party-block">
        <div class="party-label">Presupuesto para</div>
        <div class="party-name">${cliente.nombre}</div>
        <div class="party-detail">
          ${cliente.empresa ? `${cliente.empresa}<br>` : ''}
          ${cliente.email ? `${cliente.email}<br>` : ''}
          ${cliente.telefono ? `Tel: ${cliente.telefono}<br>` : ''}
          ${cliente.direccion ? cliente.direccion : ''}
          ${cliente.cuit ? `<br>CUIT: ${cliente.cuit}` : ''}
        </div>
      </div>
      <div class="party-block">
        <div class="party-label">Proveedor</div>
        <div class="party-name">${empresa?.nombre || 'BudgetAI'}</div>
        <div class="party-detail">
          ${empresa?.email ? `${empresa.email}<br>` : ''}
          ${empresa?.telefono ? `Tel: ${empresa.telefono}<br>` : ''}
          ${empresa?.direccion ? empresa.direccion : ''}
          ${empresa?.cuit ? `<br>CUIT: ${empresa.cuit}` : ''}
        </div>
      </div>
    </div>

    <!-- DESCRIPTION -->
    <div class="budget-description">
      <p>${budget.descripcionGeneral}</p>
    </div>

    <!-- ITEMS TABLE -->
    <div class="items-section">
      <div class="section-title">Detalle de trabajos</div>
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 45%">Descripción</th>
            <th style="width: 8%">Unidad</th>
            <th style="width: 8%">Cant.</th>
            <th style="width: 17%">Precio Unit.</th>
            <th style="width: 17%">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
    </div>

    <!-- TOTALS -->
    <div class="totals-section">
      <div class="totals-table">
        <div class="totals-row">
          <span class="totals-label">Subtotal</span>
          <span class="totals-value currency">${fmt(totales.subtotal)}</span>
        </div>
        <div class="totals-row">
          <span class="totals-label">IVA (${Math.round(totales.tasaImpuesto * 100)}%)</span>
          <span class="totals-value currency">${fmt(totales.impuestos)}</span>
        </div>
        <div class="total-final">
          <span class="totals-label">TOTAL</span>
          <span class="totals-value currency">${fmt(totales.total)}</span>
        </div>
      </div>
    </div>

    <!-- CONDITIONS -->
    <div class="section-title">Condiciones</div>
    <div class="conditions-section">
      ${condicionesHTML}
    </div>

    <!-- OBSERVATIONS -->
    ${budget.observaciones ? `
    <div class="observations-section">
      <div class="section-title">Observaciones</div>
      <p class="observations-text">${budget.observaciones}</p>
    </div>
    ` : ''}

    <!-- FOOTER -->
    <footer class="budget-footer">
      <div>
        <div>${empresa?.nombre || 'BudgetAI'}</div>
        ${empresa?.cuit ? `<div>CUIT: ${empresa.cuit}</div>` : ''}
      </div>
      <div class="footer-signature">
        <div class="signature-line"></div>
        <div>Firma y sello</div>
      </div>
    </footer>

  </div>
</body>
</html>`;
}

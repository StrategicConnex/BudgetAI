import type { BudgetData, BudgetItem } from '@/types/budget';
import { formatCurrency } from '@/lib/ai/stages/validator';
import { escapeHtml } from '@/lib/html-sanitize';
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

function renderItemImages(imagenes?: string[]): string {
  if (!imagenes || imagenes.length === 0) return '';
  return `
    <div class="item-images" style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; margin-bottom: 4px;">
      ${imagenes.map(img => {
        const src = img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`;
        return `<img src="${src}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px; border: 1px solid #d0d9ec;" />`;
      }).join('')}
    </div>
  `;
}

export function renderBudgetHTML(budget: BudgetData): string {
  const { cliente, empresa, items, totales, condiciones, numero } = budget;
  const grouped = groupItemsByCategory(items);

  const empNombre = empresa?.nombre || 'Rubén Curruhuinca';
  const empEmail = empresa?.email || 'rcurihuincaYPYoil@gmail.com';
  const empTelefono = empresa?.telefono || '299 410 7681';
  const empDireccion = empresa?.direccion || '';
  const empCuit = empresa?.cuit || '';

  const fmt = (n: number) => formatCurrency(n, totales.currency);

  // Build items rows
  let itemsHTML = '';
  for (const [category, categoryItems] of grouped) {
    itemsHTML += `
      <tr class="category-row">
        <td colspan="5">${escapeHtml(category)}</td>
      </tr>
    `;
    for (const item of categoryItems) {
      itemsHTML += `
        <tr class="page-break-inside-avoid">
          <td>
            <div class="item-titulo">${escapeHtml(item.titulo)}</div>
            <div class="item-descripcion">${escapeHtml(item.descripcion)}</div>
            ${renderItemImages(item.imagenes)}
            ${item.observaciones ? `<div class="item-observacion">* ${escapeHtml(item.observaciones)}</div>` : ''}
          </td>
          <td>${escapeHtml(item.unidad)}</td>
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
      <span class="condition-value">${escapeHtml(String(condiciones.validezDias))} días</span>
    </div>
    <div class="condition-item">
      <span class="condition-label">Forma de pago</span>
      <span class="condition-value">${escapeHtml(condiciones.formaPago)}</span>
    </div>
    ${condiciones.plazoDias > 0 ? `
    <div class="condition-item">
      <span class="condition-label">Plazo de ejecución</span>
      <span class="condition-value">${escapeHtml(String(condiciones.plazoDias))} días hábiles</span>
    </div>
    ` : ''}
    ${condiciones.notas ? `
    <div class="condition-item">
      <span class="condition-label">Notas</span>
      <span class="condition-value">${escapeHtml(condiciones.notas)}</span>
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
  <title>${escapeHtml(budget.titulo)} — ${escapeHtml(numero || '')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>${css}</style>
</head>
<body>
  <div class="budget-page">

    <!-- HEADER -->
    <header class="budget-header">
      <div>
        <div class="budget-logo">${escapeHtml(empNombre)}</div>
        ${empEmail ? `<div class="party-detail">${escapeHtml(empEmail)}</div>` : ''}
        ${empTelefono ? `<div class="party-detail">${escapeHtml(empTelefono)}</div>` : ''}
      </div>
      <div class="budget-meta">
        <div class="budget-number">${escapeHtml(numero || 'PRES-001')}</div>
        <div class="budget-date">Fecha: ${escapeHtml(formatDate(budget.createdAt))}</div>
        <div class="budget-date">Categoría: ${escapeHtml(budget.categoria)}</div>
      </div>
    </header>

    <!-- PARTIES -->
    <div class="budget-parties">
      <div class="party-block">
        <div class="party-label">Presupuesto para</div>
        <div class="party-name">${escapeHtml(cliente.nombre)}</div>
        <div class="party-detail">
          ${cliente.empresa ? `${escapeHtml(cliente.empresa)}<br>` : ''}
          ${cliente.email ? `${escapeHtml(cliente.email)}<br>` : ''}
          ${cliente.telefono ? `Tel: ${escapeHtml(cliente.telefono)}<br>` : ''}
          ${cliente.direccion ? escapeHtml(cliente.direccion) : ''}
          ${cliente.cuit ? `<br>CUIT: ${escapeHtml(cliente.cuit)}` : ''}
        </div>
      </div>
      <div class="party-block">
        <div class="party-label">Proveedor</div>
        <div class="party-name">${escapeHtml(empNombre)}</div>
        <div class="party-detail">
          ${empEmail ? `${escapeHtml(empEmail)}<br>` : ''}
          ${empTelefono ? `Tel: ${escapeHtml(empTelefono)}<br>` : ''}
          ${empDireccion ? escapeHtml(empDireccion) : ''}
          ${empCuit ? `<br>CUIT: ${escapeHtml(empCuit)}` : ''}
        </div>
      </div>
    </div>

    <!-- DESCRIPTION -->
    <div class="budget-description">
      <p>${escapeHtml(budget.descripcionGeneral)}</p>
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
      <p class="observations-text">${escapeHtml(budget.observaciones)}</p>
    </div>
    ` : ''}

    <!-- FOOTER -->
    <footer class="budget-footer">
      <div>
        <div>${escapeHtml(empNombre)}</div>
        ${empCuit ? `<div>CUIT: ${escapeHtml(empCuit)}</div>` : ''}
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

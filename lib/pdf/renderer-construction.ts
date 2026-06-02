import type { BudgetData, BudgetItem } from '@/types/budget';
import { formatCurrency } from '@/lib/ai/stages/validator';
import { escapeHtml } from '@/lib/html-sanitize';
import { readFileSync } from 'fs';
import { join } from 'path';

// ─────────────────────────────────────────────────────────────
// Theme: YPY Construcciones — azul acero + blanco
// Layout: fiel al PDF de referencia
// ─────────────────────────────────────────────────────────────

const PRIMARY = '#2d5fa6';       // azul header principal
const PRIMARY_LIGHT = '#e8eef8'; // celeste filas alternas
const PRIMARY_MID = '#3a6fc7';   // azul fila encabezado tabla
const HEADER_DARK = '#1e3f78';   // azul encabezado etiquetas
const GOLD = '#e2b84e';          // dorado línea decorativa
const WHITE = '#ffffff';
const TEXT = '#1a1a1a';
const TEXT_MED = '#333333';
const TOTAL_BG = '#fdf8e8';      // fondo crema total final

function formatDateES(iso?: string): string {
  const date = iso ? new Date(iso) : new Date();
  return date.toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  }).toUpperCase();
}

function getHeaderImageBase64(): string {
  try {
    const imgPath = join(process.cwd(), 'public', 'YPY_Construcciones.png');
    const bytes = readFileSync(imgPath);
    return `data:image/png;base64,${bytes.toString('base64')}`;
  } catch {
    return '';
  }
}

function renderItemImages(imagenes?: string[]): string {
  if (!imagenes || imagenes.length === 0) return '';
  return `
    <div class="item-images" style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; margin-bottom: 4px;">
      ${imagenes.map(img => {
        const src = img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`;
        return `<img src="${src}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px; border: 1px solid #c5cfe8;" />`;
      }).join('')}
    </div>
  `;
}

function buildItemRows(items: BudgetItem[], fmt: (n: number) => string): string {
  let rows = '';
  let alternate = false;
  for (const item of items) {
    const bg = alternate ? PRIMARY_LIGHT : WHITE;
    rows += `
      <tr style="background:${bg};">
        <td style="padding:12px 14px;font-size:10pt;color:${TEXT_MED};vertical-align:top;border-bottom:1px solid #d0d9ec;">
          <div style="font-weight:700;color:${TEXT};margin-bottom:4px;">${escapeHtml(item.titulo)}</div>
          ${item.descripcion ? `<div style="font-size:9pt;color:#555;margin-bottom:4px;line-height:1.4;">${escapeHtml(item.descripcion)}</div>` : ''}
          ${renderItemImages(item.imagenes)}
          ${item.observaciones ? `<div style="font-size:8.5pt;color:${PRIMARY};font-style:italic;margin-top:4px;">* ${escapeHtml(item.observaciones)}</div>` : ''}
        </td>
        <td style="padding:12px 14px;font-size:10.5pt;font-weight:700;color:${TEXT};vertical-align:top;border-bottom:1px solid #d0d9ec;white-space:nowrap;">
          ${fmt(item.precioTotal)}
        </td>
      </tr>`;
    alternate = !alternate;
  }
  return rows;
}

export function renderConstructionHTML(budget: BudgetData): string {
  const { cliente, empresa, items, totales, condiciones } = budget;
  const fmt = (n: number) => formatCurrency(n, totales.currency);
  const headerImg = getHeaderImageBase64();

  const empresaNombre = empresa?.nombre || 'YPY Construcciones';
  const empresaTelefono = empresa?.telefono || '';
  const empresaEmail = empresa?.email || '';

  const itemRows = buildItemRows(items, fmt);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presupuesto — ${escapeHtml(cliente.nombre)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Calibri:wght@400;700&family=Arial:wght@400;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, 'Helvetica Neue', sans-serif;
      font-size: 10.5pt;
      color: ${TEXT};
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      max-width: 794px;
      margin: 0 auto;
      padding: 0 0 40px 0;
    }
    /* ── HEADER IMAGE ── */
    .header-img {
      width: 100%;
      display: block;
      margin-bottom: 28px;
    }
    /* ── BODY CONTENT ── */
    .content {
      padding: 0 38px;
    }
    /* ── TITLE ── */
    .presupuesto-title {
      text-align: center;
      font-size: 14pt;
      font-weight: 700;
      color: ${TEXT};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .title-underline {
      width: 100%;
      height: 2px;
      background: ${GOLD};
      margin-bottom: 22px;
    }
    /* ── INFO TABLE (cliente / fecha / categoría) ── */
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    .info-table td {
      padding: 9px 14px;
      border: 1px solid #c5cfe8;
      font-size: 10.5pt;
    }
    .info-table .info-label {
      background: ${HEADER_DARK};
      color: ${WHITE};
      font-weight: 700;
      text-transform: uppercase;
      width: 28%;
      letter-spacing: 0.5px;
    }
    .info-table .info-value {
      background: ${WHITE};
      color: ${TEXT};
    }
    .info-table tr:nth-child(even) .info-value {
      background: ${PRIMARY_LIGHT};
    }
    /* ── ITEMS TABLE ── */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4px;
    }
    .items-table thead tr {
      background: ${PRIMARY_MID};
    }
    .items-table thead th {
      padding: 10px 14px;
      color: ${WHITE};
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 10pt;
      text-align: left;
      border: none;
    }
    .items-table thead th:last-child {
      text-align: left;
    }
    .items-table tbody tr td {
    }
    /* ── EMPTY ROW ── */
    .empty-row td {
      height: 30px;
      background: ${WHITE};
      border-bottom: 1px solid #d0d9ec;
    }
    /* ── TOTAL ROW ── */
    .total-row {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0;
    }
    .total-row td {
      padding: 14px 18px;
      background: ${TOTAL_BG};
      border: 1px solid #d4c87a;
    }
    .total-label {
      font-weight: 700;
      font-size: 11.5pt;
      color: ${TEXT};
      text-transform: uppercase;
      text-align: right;
    }
    .total-value {
      font-weight: 700;
      font-size: 13pt;
      color: ${PRIMARY};
      text-align: right;
      white-space: nowrap;
    }
    /* ── CONDITIONS TABLE ── */
    .section-gap { height: 32px; }
    .cond-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    .cond-table thead tr {
      background: ${PRIMARY_MID};
    }
    .cond-table thead th {
      padding: 10px 14px;
      color: ${WHITE};
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10pt;
      letter-spacing: 0.5px;
      text-align: left;
    }
    .cond-table tbody td {
      padding: 9px 14px;
      border: 1px solid #c5cfe8;
      font-size: 10.5pt;
    }
    .cond-table tbody .cond-label {
      background: ${PRIMARY_LIGHT};
      font-weight: 700;
      color: ${TEXT};
      width: 38%;
    }
    .cond-table tbody .cond-value {
      background: ${WHITE};
      color: ${TEXT_MED};
    }
    /* ── CONTACT TABLE ── */
    .contact-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    .contact-table thead tr {
      background: ${PRIMARY_MID};
    }
    .contact-table thead th {
      padding: 10px 14px;
      color: ${WHITE};
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10pt;
      letter-spacing: 0.5px;
      text-align: left;
    }
    .contact-table tbody td {
      padding: 9px 14px;
      border: 1px solid #c5cfe8;
      font-size: 10.5pt;
    }
    .contact-table tbody .contact-label {
      background: ${PRIMARY_LIGHT};
      font-weight: 700;
      color: ${TEXT};
      width: 38%;
    }
    .contact-table tbody .contact-value {
      background: ${WHITE};
      color: ${TEXT_MED};
    }
    /* ── FOOTER ── */
    .budget-footer {
      margin-top: 28px;
      padding-top: 12px;
      border-top: 1px solid #ccc;
      text-align: center;
      font-size: 8.5pt;
      color: #888;
      font-style: italic;
    }
    @media print {
      tr { page-break-inside: avoid; }
      thead { display: table-header-group; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- HEADER IMAGE -->
  ${headerImg
    ? `<img src="${headerImg}" alt="YPY Construcciones" class="header-img" />`
    : `<div style="background:${PRIMARY};padding:40px 38px;margin-bottom:28px;">
         <span style="color:white;font-size:28pt;font-weight:700;text-transform:uppercase;">${escapeHtml(empresaNombre)}</span>
       </div>`
  }

  <div class="content">

    <!-- TITLE -->
    <div class="presupuesto-title">PRESUPUESTO DE MANO DE OBRA</div>
    <div class="title-underline"></div>

    <!-- INFO TABLE -->
    <table class="info-table">
      <tbody>
        <tr>
          <td class="info-label">CLIENTE</td>
          <td class="info-value">${escapeHtml(cliente.nombre)}${cliente.empresa ? ` — ${escapeHtml(cliente.empresa)}` : ''}</td>
        </tr>
        <tr>
          <td class="info-label">FECHA</td>
          <td class="info-value">${escapeHtml(formatDateES(budget.createdAt))}</td>
        </tr>
        <tr>
          <td class="info-label">CATEGORÍA</td>
          <td class="info-value">${escapeHtml(budget.descripcionGeneral)}</td>
        </tr>
        ${cliente.direccion ? `
        <tr>
          <td class="info-label">DIRECCIÓN</td>
          <td class="info-value">${escapeHtml(cliente.direccion)}</td>
        </tr>` : ''}
      </tbody>
    </table>

    <!-- ITEMS TABLE -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width:62%">TRABAJO A REALIZAR</th>
          <th style="width:38%">COTIZACIÓN</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr class="empty-row"><td></td><td></td></tr>
      </tbody>
    </table>

    <!-- TOTAL -->
    <table class="total-row">
      <tbody>
        <tr>
          <td class="total-label" style="width:62%">VALOR TOTAL DE LA COTIZACIÓN:</td>
          <td class="total-value" style="width:38%">${fmt(totales.total)}</td>
        </tr>
      </tbody>
    </table>

    <div class="section-gap"></div>

    <!-- CONDICIONES COMERCIALES -->
    <table class="cond-table">
      <thead>
        <tr><th colspan="2">CONDICIONES COMERCIALES</th></tr>
      </thead>
      <tbody>
        ${condiciones.formaPago ? `
        <tr>
          <td class="cond-label">Anticipo para inicio de obra</td>
          <td class="cond-value">${escapeHtml(condiciones.formaPago)}</td>
        </tr>` : ''}
        ${condiciones.plazoDias > 0 ? `
        <tr>
          <td class="cond-label">Plazo de ejecución</td>
          <td class="cond-value">${escapeHtml(String(condiciones.plazoDias))} días hábiles</td>
        </tr>` : ''}
        <tr>
          <td class="cond-label">Validez de la oferta</td>
          <td class="cond-value">${escapeHtml(String(condiciones.validezDias))} días hábiles desde la fecha de emisión</td>
        </tr>
        ${condiciones.notas ? `
        <tr>
          <td class="cond-label">Observaciones</td>
          <td class="cond-value">${escapeHtml(condiciones.notas)}</td>
        </tr>` : ''}
        ${budget.observaciones ? `
        <tr>
          <td class="cond-label">Notas adicionales</td>
          <td class="cond-value">${escapeHtml(budget.observaciones)}</td>
        </tr>` : ''}
      </tbody>
    </table>

    <!-- DATOS DE CONTACTO -->
    <table class="contact-table">
      <thead>
        <tr><th colspan="2">DATOS DE CONTACTO</th></tr>
      </thead>
      <tbody>
        ${empresa?.nombre ? `
        <tr>
          <td class="contact-label">Responsable</td>
          <td class="contact-value">${escapeHtml(empresa.nombre)}</td>
        </tr>` : ''}
        ${empresaTelefono ? `
        <tr>
          <td class="contact-label">Teléfono</td>
          <td class="contact-value">${escapeHtml(empresaTelefono)}</td>
        </tr>` : ''}
        ${empresaEmail ? `
        <tr>
          <td class="contact-label">Correo electrónico</td>
          <td class="contact-value">${escapeHtml(empresaEmail)}</td>
        </tr>` : ''}
      </tbody>
    </table>

    <!-- FOOTER -->
    <div class="budget-footer">
      ${escapeHtml(empresaNombre)} — Innovative Energy Solutions
    </div>

  </div>
</div>
</body>
</html>`;
}

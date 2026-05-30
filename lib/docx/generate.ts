import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  ShadingType,
  WidthType,
  Footer,
  PageNumber,
  ImageRun,
  HeadingLevel,
} from 'docx';
import type { BudgetData, BudgetItem } from '@/types/budget';
import { formatCurrency } from '@/lib/ai/stages/validator';
import { readFileSync } from 'fs';
import { join } from 'path';

// ─── Colores YPY Construcciones ───────────────────────────────
const BLUE_DARK  = '1E3F78';   // azul encabezado etiquetas
const BLUE_MID   = '3A6FC7';   // azul cabecera de tablas
const BLUE_LIGHT = 'E8EEF8';   // celeste filas alternas
const GOLD       = 'E2B84E';   // dorado línea titulo
const WHITE      = 'FFFFFF';
const TEXT_DARK  = '1A1A1A';
const TEXT_MED   = '444444';
const CREAM_BG   = 'FDF8E8';   // fondo total final

function formatDateES(iso?: string): string {
  const date = iso ? new Date(iso) : new Date();
  return date.toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  }).toUpperCase();
}

// ─── Cargar imagen de encabezado ──────────────────────────────
function getHeaderImageBuffer(): Buffer | null {
  try {
    return readFileSync(join(process.cwd(), 'public', 'YPY_Construcciones.png'));
  } catch {
    return null;
  }
}

// ─── Celda con fondo de encabezado (azul oscuro, texto blanco) ─
function headerCell(text: string, widthDxa: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 20, color: WHITE, font: 'Arial' })],
        alignment: AlignmentType.LEFT,
      }),
    ],
    shading: { type: ShadingType.SOLID, color: BLUE_DARK, fill: BLUE_DARK },
    width: { size: widthDxa, type: WidthType.DXA },
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 1, color: BLUE_MID },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: BLUE_MID },
      left:   { style: BorderStyle.SINGLE, size: 1, color: BLUE_MID },
      right:  { style: BorderStyle.SINGLE, size: 1, color: BLUE_MID },
    },
  });
}

// ─── Celda de datos ────────────────────────────────────────────
function dataCell(text: string, widthDxa: number, fill: string = WHITE, bold = false): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 20, bold, color: bold ? TEXT_DARK : TEXT_MED, font: 'Arial' })],
      }),
    ],
    shading: { type: ShadingType.SOLID, color: fill, fill },
    width: { size: widthDxa, type: WidthType.DXA },
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 1, color: 'C5CFE8' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'C5CFE8' },
      left:   { style: BorderStyle.SINGLE, size: 1, color: 'C5CFE8' },
      right:  { style: BorderStyle.SINGLE, size: 1, color: 'C5CFE8' },
    },
  });
}

// ─── Cabecera de sección tipo tabla azul media ─────────────────
function sectionHeaderRow(label: string, colSpan = 2): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: label, bold: true, size: 21, color: WHITE, font: 'Arial' })],
          }),
        ],
        shading: { type: ShadingType.SOLID, color: BLUE_MID, fill: BLUE_MID },
        columnSpan: colSpan,
        margins: { top: 100, bottom: 100, left: 140, right: 140 },
        borders: {
          top:    { style: BorderStyle.SINGLE, size: 1, color: BLUE_MID },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: BLUE_MID },
          left:   { style: BorderStyle.SINGLE, size: 1, color: BLUE_MID },
          right:  { style: BorderStyle.SINGLE, size: 1, color: BLUE_MID },
        },
      }),
    ],
  });
}

// ─── Tabla de ítems ────────────────────────────────────────────
function buildItemsTable(items: BudgetItem[], currency: BudgetData['totales']['currency']): Table {
  const fmt = (n: number) => formatCurrency(n, currency);

  const headerRow = new TableRow({
    children: [
      headerCell('TRABAJO A REALIZAR', 5670),
      headerCell('COTIZACIÓN', 3330),
    ],
    tableHeader: true,
  });

  const dataRows = items.map((item, idx) => {
    const fill = idx % 2 === 0 ? WHITE : BLUE_LIGHT;
    return new TableRow({
      children: [
        dataCell(item.titulo, 5670, fill),
        dataCell(fmt(item.precioTotal), 3330, fill, true),
      ],
    });
  });

  // Fila vacía al final
  const emptyRow = new TableRow({
    children: [
      dataCell('', 5670, WHITE),
      dataCell('', 3330, WHITE),
    ],
  });

  return new Table({
    rows: [headerRow, ...dataRows, emptyRow],
    width: { size: 9000, type: WidthType.DXA },
  });
}

// ─── Tabla de total ────────────────────────────────────────────
function buildTotalTable(total: string): Table {
  return new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'VALOR TOTAL DE LA COTIZACIÓN:', bold: true, size: 22, color: TEXT_DARK, font: 'Arial' })],
                alignment: AlignmentType.RIGHT,
              }),
            ],
            shading: { type: ShadingType.SOLID, color: CREAM_BG, fill: CREAM_BG },
            width: { size: 5670, type: WidthType.DXA },
            margins: { top: 120, bottom: 120, left: 140, right: 200 },
            borders: {
              top:    { style: BorderStyle.SINGLE, size: 2, color: 'D4C87A' },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: 'D4C87A' },
              left:   { style: BorderStyle.SINGLE, size: 2, color: 'D4C87A' },
              right:  { style: BorderStyle.NONE,   size: 0, color: 'D4C87A' },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: total, bold: true, size: 26, color: BLUE_MID, font: 'Arial' })],
                alignment: AlignmentType.RIGHT,
              }),
            ],
            shading: { type: ShadingType.SOLID, color: CREAM_BG, fill: CREAM_BG },
            width: { size: 3330, type: WidthType.DXA },
            margins: { top: 120, bottom: 120, left: 140, right: 140 },
            borders: {
              top:    { style: BorderStyle.SINGLE, size: 2, color: 'D4C87A' },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: 'D4C87A' },
              left:   { style: BorderStyle.NONE,   size: 0, color: 'D4C87A' },
              right:  { style: BorderStyle.SINGLE, size: 2, color: 'D4C87A' },
            },
          }),
        ],
      }),
    ],
    width: { size: 9000, type: WidthType.DXA },
  });
}

// ─── Tabla condiciones / contacto ─────────────────────────────
function buildTwoColTable(title: string, rows: Array<[string, string]>): Table {
  const header = sectionHeaderRow(title, 2);

  const dataRows = rows.map(([label, value], idx) => {
    const fill = idx % 2 === 0 ? BLUE_LIGHT : WHITE;
    return new TableRow({
      children: [
        dataCell(label, 3420, fill, true),
        dataCell(value, 5580, fill),
      ],
    });
  });

  return new Table({
    rows: [header, ...dataRows],
    width: { size: 9000, type: WidthType.DXA },
  });
}

// ─── Helper: párrafo espaciador ───────────────────────────────
function spacer(pts = 200): Paragraph {
  return new Paragraph({ children: [], spacing: { before: pts, after: 0 } });
}

// ─── Línea dorada bajo el título ──────────────────────────────
function goldRule(): Paragraph {
  return new Paragraph({
    children: [],
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 10, color: GOLD, space: 1 },
    },
    spacing: { before: 80, after: 200 },
  });
}

// ─────────────────────────────────────────────────────────────
// EXPORT PRINCIPAL
// ─────────────────────────────────────────────────────────────
export async function generateDocx(budget: BudgetData): Promise<Buffer> {
  if (budget.templateId === 'construction') {
    return generateConstructionDocx(budget);
  }
  return generateMinimalDocx(budget);
}

// ─── Formato YPY Construcciones ───────────────────────────────
async function generateConstructionDocx(budget: BudgetData): Promise<Buffer> {
  const { cliente, empresa, items, totales, condiciones } = budget;
  const fmt = (n: number) => formatCurrency(n, totales.currency);

  const headerImgBuffer = getHeaderImageBuffer();

  // Condiciones comerciales
  const condRows: Array<[string, string]> = [];
  if (condiciones.formaPago) condRows.push(['Anticipo para inicio de obra', condiciones.formaPago]);
  if (condiciones.plazoDias > 0) condRows.push(['Certificaciones parciales', `Cada ${condiciones.plazoDias} días`]);
  condRows.push(['Validez de la oferta', `${condiciones.validezDias} días hábiles desde la fecha de emisión`]);
  if (condiciones.notas) condRows.push(['Observaciones', condiciones.notas]);
  if (budget.observaciones) condRows.push(['Notas adicionales', budget.observaciones]);

  // Datos de contacto
  const contactRows: Array<[string, string]> = [];
  if (empresa?.nombre) contactRows.push(['Responsable', empresa.nombre]);
  if (empresa?.telefono) contactRows.push(['Teléfono', empresa.telefono]);
  if (empresa?.email) contactRows.push(['Correo electrónico', empresa.email]);

  const children: (Paragraph | Table | ImageRun)[] = [];

  // Header image
  if (headerImgBuffer) {
    children.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: headerImgBuffer,
            transformation: { width: 680, height: 120 },
            type: 'png',
          }),
        ],
        spacing: { before: 0, after: 280 },
      })
    );
  } else {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: empresa?.nombre || 'YPY Construcciones', bold: true, size: 48, color: BLUE_MID, font: 'Arial' })],
        spacing: { after: 280 },
      })
    );
  }

  // Título
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'PRESUPUESTO DE MANO DE OBRA', bold: true, size: 28, color: TEXT_DARK, font: 'Arial' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
    }),
    goldRule()
  );

  // Tabla info cliente
  children.push(
    new Table({
      rows: [
        new TableRow({
          children: [
            headerCell('CLIENTE', 2520),
            dataCell(`${cliente.nombre}${cliente.empresa ? ` — ${cliente.empresa}` : ''}`, 6480),
          ],
        }),
        new TableRow({
          children: [
            headerCell('FECHA', 2520),
            dataCell(formatDateES(budget.createdAt), 6480, BLUE_LIGHT),
          ],
        }),
        new TableRow({
          children: [
            headerCell('CATEGORÍA', 2520),
            dataCell(budget.descripcionGeneral, 6480),
          ],
        }),
        ...(cliente.direccion ? [new TableRow({
          children: [
            headerCell('DIRECCIÓN', 2520),
            dataCell(cliente.direccion, 6480, BLUE_LIGHT),
          ],
        })] : []),
      ],
      width: { size: 9000, type: WidthType.DXA },
    }),
    spacer(320)
  );

  // Tabla ítems
  children.push(buildItemsTable(items, totales.currency));
  children.push(spacer(0));
  children.push(buildTotalTable(fmt(totales.total)));
  children.push(spacer(400));

  // Condiciones
  if (condRows.length > 0) {
    children.push(buildTwoColTable('CONDICIONES COMERCIALES', condRows));
    children.push(spacer(320));
  }

  // Contacto
  if (contactRows.length > 0) {
    children.push(buildTwoColTable('DATOS DE CONTACTO', contactRows));
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 20, color: TEXT_DARK } },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${empresa?.nombre || 'YPY Construcciones'} — Innovative Energy Solutions    |    Pág. `,
                    size: 16, color: '999999', font: 'Arial',
                  }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '999999', font: 'Arial' }),
                  new TextRun({ text: ' de ', size: 16, color: '999999', font: 'Arial' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '999999', font: 'Arial' }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: children as Paragraph[],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

// ─── Formato Minimal genérico ─────────────────────────────────
async function generateMinimalDocx(budget: BudgetData): Promise<Buffer> {
  const { cliente, empresa, items, totales, condiciones, numero } = budget;
  const fmt = (n: number) => formatCurrency(n, totales.currency);
  const PRIMARY = '4F46E5';

  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Descripción', bold: true, size: 18, color: WHITE, font: 'Calibri' })] })],
        shading: { type: ShadingType.SOLID, color: PRIMARY, fill: PRIMARY },
        width: { size: 4500, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Unidad', bold: true, size: 18, color: WHITE, font: 'Calibri' })] })],
        shading: { type: ShadingType.SOLID, color: PRIMARY, fill: PRIMARY },
        width: { size: 1000, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Cant.', bold: true, size: 18, color: WHITE, font: 'Calibri' })] })],
        shading: { type: ShadingType.SOLID, color: PRIMARY, fill: PRIMARY },
        width: { size: 1000, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'P. Unit.', bold: true, size: 18, color: WHITE, font: 'Calibri' })] })],
        shading: { type: ShadingType.SOLID, color: PRIMARY, fill: PRIMARY },
        width: { size: 1500, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Total', bold: true, size: 18, color: WHITE, font: 'Calibri' })] })],
        shading: { type: ShadingType.SOLID, color: PRIMARY, fill: PRIMARY },
        width: { size: 1500, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
      }),
    ],
    tableHeader: true,
  });

  const dataRows = items.map(item => new TableRow({
    children: [
      new TableCell({
        children: [
          new Paragraph({ children: [new TextRun({ text: item.titulo, bold: true, size: 20, font: 'Calibri' })] }),
          new Paragraph({ children: [new TextRun({ text: item.descripcion, size: 18, color: '6B7280', font: 'Calibri' })] }),
        ],
        width: { size: 4500, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
      }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.unidad, size: 20, font: 'Calibri' })] })], width: { size: 1000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(item.cantidad), size: 20, font: 'Calibri' })] })], width: { size: 1000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fmt(item.precioUnitario), size: 20, font: 'Calibri' })] })], width: { size: 1500, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fmt(item.precioTotal), size: 20, font: 'Calibri' })] })], width: { size: 1500, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 } }),
    ],
  }));

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22, color: '111827' } } },
    },
    sections: [{
      children: [
        new Paragraph({ children: [new TextRun({ text: budget.titulo, bold: true, size: 36, color: PRIMARY, font: 'Calibri' })], spacing: { after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: `N° ${numero || ''}   •   Fecha: ${new Date(budget.createdAt || Date.now()).toLocaleDateString('es-AR')}`, size: 20, color: '6B7280', font: 'Calibri' })], spacing: { after: 360 } }),
        new Paragraph({ children: [new TextRun({ text: 'CLIENTE', bold: true, size: 22, color: PRIMARY, font: 'Calibri' })], heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 120 } }),
        new Paragraph({ children: [new TextRun({ text: cliente.nombre, bold: true, font: 'Calibri' })], spacing: { after: 360 } }),
        new Paragraph({ children: [new TextRun({ text: 'DETALLE DE TRABAJOS', bold: true, size: 22, color: PRIMARY, font: 'Calibri' })], heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 200 } }),
        new Table({ rows: [headerRow, ...dataRows], width: { size: 9500, type: WidthType.DXA } }),
        new Paragraph({ children: [], spacing: { after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: `TOTAL: ${fmt(totales.total)}`, bold: true, size: 28, color: PRIMARY, font: 'Calibri' })], alignment: AlignmentType.RIGHT, spacing: { before: 120, after: 400 } }),
        new Paragraph({ children: [new TextRun({ text: 'CONDICIONES', bold: true, size: 22, color: PRIMARY, font: 'Calibri' })], heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 120 } }),
        new Paragraph({ children: [new TextRun({ text: `Validez: ${condiciones.validezDias} días   •   Forma de pago: ${condiciones.formaPago}`, size: 20, font: 'Calibri' })] }),
        ...(condiciones.notas ? [new Paragraph({ children: [new TextRun({ text: condiciones.notas, size: 20, color: '6B7280', font: 'Calibri' })] })] : []),
      ],
    }],
  });

  return Packer.toBuffer(doc);
}

import type { AIBudgetOutputType } from '@/lib/validators/budget';
import type { BudgetData, BudgetItem, BudgetTotals, Currency } from '@/types/budget';

interface ValidatorInput {
  aiOutput: AIBudgetOutputType;
  currency: Currency;
  tasaImpuesto: number;
  templateId: 'construction' | 'minimal-white';
  empresa?: BudgetData['empresa'];
}

export function validateAndFinalize(input: ValidatorInput): BudgetData {
  const { aiOutput, currency, tasaImpuesto, templateId, empresa } = input;

  // 1. Eliminar duplicados por título
  const seenTitles = new Set<string>();
  const uniqueItems = aiOutput.items.filter(item => {
    const key = item.titulo.toLowerCase().trim();
    if (seenTitles.has(key)) return false;
    seenTitles.add(key);
    return true;
  });

  // 2. Calcular totales por ítem y totales generales
  const items: BudgetItem[] = uniqueItems.map(item => {
    const cantidad = Number(item.cantidad) || 0;
    const precioUnitario = Number(item.precioUnitario) || 0;
    const precioTotal = cantidad * precioUnitario;

    return {
      id: crypto.randomUUID(),
      titulo: item.titulo,
      descripcion: item.descripcion,
      unidad: item.unidad || 'unidad',
      cantidad,
      precioUnitario,
      precioTotal,
      categoria: item.categoria || 'General',
      imagenes: [],
      observaciones: item.observaciones || undefined,
    };
  });

  const subtotal = items.reduce((acc, item) => acc + item.precioTotal, 0);
  const impuestos = subtotal * tasaImpuesto;
  const total = subtotal + impuestos;

  const totales: BudgetTotals = {
    subtotal,
    impuestos,
    tasaImpuesto,
    total,
    currency,
  };

  // 3. Generar número de presupuesto
  const numero = generateBudgetNumber();

  // 4. Construir objeto final
  const budget: BudgetData = {
    numero,
    titulo: aiOutput.titulo || 'Presupuesto',
    cliente: {
      nombre: aiOutput.cliente?.nombre || 'Sin especificar',
      empresa: aiOutput.cliente?.empresa || undefined,
      email: aiOutput.cliente?.email || undefined,
      telefono: aiOutput.cliente?.telefono || undefined,
      direccion: aiOutput.cliente?.direccion || undefined,
      cuit: aiOutput.cliente?.cuit || undefined,
    },
    empresa,
    categoria: aiOutput.categoria || 'Construcción',
    descripcionGeneral: aiOutput.descripcionGeneral || '',
    items,
    totales,
    condiciones: {
      validezDias: aiOutput.condiciones?.validezDias || 30,
      formaPago: aiOutput.condiciones?.formaPago || 'A convenir',
      plazoDias: aiOutput.condiciones?.plazoDias || 0,
      notas: aiOutput.condiciones?.notas || undefined,
    },
    observaciones: aiOutput.observaciones || undefined,
    createdAt: new Date().toISOString(),
    templateId,
  };

  return budget;
}

function generateBudgetNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `PRES-${year}-${random}`;
}

// Formatea valores de moneda para display
export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);
}

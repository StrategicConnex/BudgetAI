import { callAI, withRetry, extractJSON, AI_MODELS } from '../providers';
import { SYSTEM_PROMPT } from '../prompts/system';
import { AIBudgetOutputSchema } from '@/lib/validators/budget';
import { createLogger } from '@/lib/logger';
import type { ParsedInput, RawInput } from '@/types/budget';

const log = createLogger('GeneratorStage');

interface GeneratorInput {
  parsedInput: ParsedInput;
  rawInput: RawInput;
  visionSummary?: string;
}

export async function generateBudget(input: GeneratorInput) {
  const { parsedInput, rawInput, visionSummary } = input;

  const prompt = buildGeneratorPrompt(parsedInput, rawInput, visionSummary);

  if (!process.env.OPENROUTER_API_KEY) {
    log.warn('Usando mock — no hay API key de OpenRouter');
    return getMockBudget(parsedInput, rawInput);
  }

  return withRetry(async () => {
    const text = await callAI([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ], {
      model: AI_MODELS.main,
      jsonMode: true,
      temperature: 0.2
    });

    const json = extractJSON(text);
    const raw = JSON.parse(json);

    // Validar con Zod (permisivo)
    const validated = AIBudgetOutputSchema.parse(raw);
    return validated;
  });
}

function buildGeneratorPrompt(
  parsed: ParsedInput,
  raw: RawInput,
  visionSummary?: string
): string {
  const clienteInfo = parsed.clienteInfo?.nombre
    ? `Nombre: ${parsed.clienteInfo.nombre}${parsed.clienteInfo.empresa ? `\nEmpresa: ${parsed.clienteInfo.empresa}` : ''}`
    : 'No especificado';

  return `GENERAR PRESUPUESTO PROFESIONAL

INFORMACIÓN DEL CLIENTE:
${clienteInfo}

DESCRIPCIÓN DEL TRABAJO:
${parsed.descripcionRaw || raw.texto}

TRABAJOS DETECTADOS:
${parsed.trabajosDetectados.map(t => `- ${t}`).join('\n')}

${visionSummary ? `ANÁLISIS VISUAL:\n${visionSummary}\n` : ''}
MONEDA: ${raw.currency}
CATEGORÍA: ${parsed.categoriaSugerida || 'Construcción'}

INSTRUCCIONES:
- Genera ítems de presupuesto detallados y profesionales
- Cada ítem debe tener precio unitario realista (mercado Argentina ${new Date().getFullYear()})
- Si no tienes referencia de precio, usa 0
- Mínimo 3 ítems, máximo 15
- Agrupa trabajos similares
- Usa unidades correctas (m², ml, unidad, hora, etc.)
- Condiciones: validez 30 días, forma de pago a convenir

Devuelve SOLO el JSON estructurado.`;
}

function getMockBudget(parsed: ParsedInput, raw: RawInput) {
  const isUSD = raw.currency === 'USD';
  const factor = isUSD ? 1 : 1000;

  return {
    titulo: `Presupuesto — ${parsed.categoriaSugerida || 'Construcción'}`,
    cliente: {
      nombre: parsed.clienteInfo?.nombre || 'Cliente',
      empresa: parsed.clienteInfo?.empresa || undefined,
      email: undefined,
      telefono: undefined,
      direccion: undefined,
      cuit: undefined,
    },
    categoria: parsed.categoriaSugerida || 'Construcción',
    descripcionGeneral: parsed.descripcionRaw || 'Trabajos de construcción y reparación según relevamiento',
    items: [
      {
        titulo: 'Reparación de revoque',
        descripcion: 'Picado de revoque deteriorado, limpieza, aplicación de base hidrófuga y revoque grueso/fino terminado.',
        unidad: 'm²',
        cantidad: 20,
        precioUnitario: 15 * factor,
        categoria: 'Albañilería',
        observaciones: undefined,
      },
      {
        titulo: 'Tratamiento antihumedad',
        descripcion: 'Aplicación de membrana impermeabilizante en superficie afectada, 2 manos, incluye imprimación.',
        unidad: 'm²',
        cantidad: 20,
        precioUnitario: 8 * factor,
        categoria: 'Impermeabilización',
        observaciones: undefined,
      },
      {
        titulo: 'Pintura final interior',
        descripcion: 'Aplicación de pintura látex interior premium, 2 manos. Incluye enduido previo y lija.',
        unidad: 'm²',
        cantidad: 20,
        precioUnitario: 6 * factor,
        categoria: 'Pintura',
        observaciones: undefined,
      },
    ],
    condiciones: {
      validezDias: 30,
      formaPago: 'Transferencia bancaria o efectivo',
      plazoDias: 0,
      notas: 'Precios sujetos a variación según materiales.',
    },
    observaciones: undefined,
  };
}

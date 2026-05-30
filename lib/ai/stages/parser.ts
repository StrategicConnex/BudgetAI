import { callAI, withRetry, extractJSON, AI_MODELS } from '../providers';
import { NORMALIZER_SYSTEM_PROMPT } from '../prompts/system';
import type { ParsedInput } from '@/types/budget';

const PARSER_MOCK: ParsedInput = {
  clienteInfo: { nombre: 'Cliente Demo', empresa: '' },
  descripcionRaw: 'Reparación general de humedad y grietas en paredes interiores',
  trabajosDetectados: [
    'Reparación de humedad',
    'Sellado de grietas',
    'Revoque fino',
    'Pintura final',
  ],
  categoriaSugerida: 'Construcción',
};

interface ParserInput {
  texto: string;
  visionSummary?: string;
}

export async function parseInput({ texto, visionSummary }: ParserInput): Promise<ParsedInput> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('[ParserStage] Usando mock — no hay OPENROUTER_API_KEY configurada');
    return PARSER_MOCK;
  }

  const userPrompt = `TEXTO DEL CLIENTE:\n${texto}${visionSummary ? `\n\nANÁLISIS DE IMÁGENES:\n${visionSummary}` : ''}\n\nExtrae y estructura la información. Devuelve solo JSON.`;

  return withRetry(async () => {
    const content = await callAI(
      [
        { role: 'system', content: NORMALIZER_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      {
        model: AI_MODELS.flash,
        temperature: 0.1,
        maxTokens: 2048,
        jsonMode: true,
      }
    );

    const json = extractJSON(content);
    const parsed = JSON.parse(json) as ParsedInput;

    if (!parsed.trabajosDetectados) parsed.trabajosDetectados = [];
    if (!parsed.clienteInfo) parsed.clienteInfo = {};

    return parsed;
  });
}

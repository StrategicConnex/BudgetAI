import { callAI, withRetry, extractJSON, AI_MODELS } from '../providers';
import { VISION_SYSTEM_PROMPT } from '../prompts/system';
import { createLogger } from '@/lib/logger';
import type { ImageInput, VisionAnalysis } from '@/types/budget';

const log = createLogger('VisionStage');

// Mock para cuando no hay API key
const VISION_MOCK: VisionAnalysis = {
  descripcion: 'Superficie con daños visibles que requieren atención',
  elementos: ['pared', 'revoque'],
  condicion: 'deteriorado',
  trabajosSugeridos: ['Reparación de revoque', 'Impermeabilización', 'Pintura final'],
  materiales: ['cemento', 'arena', 'pintura impermeabilizante'],
  riesgo: 'medio',
};

export async function analyzeImage(image: ImageInput): Promise<VisionAnalysis> {
  if (!process.env.OPENROUTER_API_KEY) {
    log.warn('Usando mock — no hay OPENROUTER_API_KEY configurada');
    return VISION_MOCK;
  }

  return withRetry(async () => {
    const content = await callAI(
      [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${image.mimeType};base64,${image.base64}` },
            },
            {
              type: 'text',
              text: VISION_SYSTEM_PROMPT + '\n\nAnaliza esta imagen y devuelve solo JSON.',
            },
          ],
        },
      ],
      {
        model: AI_MODELS.vision,
        temperature: 0.1,
        maxTokens: 4096,
        jsonMode: true,
      }
    );

    const json = extractJSON(content);
    const parsed = JSON.parse(json) as VisionAnalysis;

    if (!parsed.descripcion || !parsed.trabajosSugeridos) {
      throw new Error('Respuesta de visión incompleta');
    }

    return parsed;
  });
}

export async function analyzeImages(images: ImageInput[]): Promise<VisionAnalysis[]> {
  if (!images.length) return [];

  const results = await Promise.allSettled(
    images.map(img => analyzeImage(img))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<VisionAnalysis> => r.status === 'fulfilled')
    .map(r => r.value);
}

export function buildVisionSummary(analyses: VisionAnalysis[]): string {
  if (!analyses.length) return '';

  const allTrabajosSet = new Set<string>();
  const allMaterialesSet = new Set<string>();

  analyses.forEach(a => {
    a.trabajosSugeridos.forEach(t => allTrabajosSet.add(t));
    a.materiales.forEach(m => allMaterialesSet.add(m));
  });

  return `
ANÁLISIS DE IMÁGENES (${analyses.length} imagen${analyses.length > 1 ? 'es' : ''}):
${analyses.map((a, i) => `
Imagen ${i + 1}:
- Descripción: ${a.descripcion}
- Condición: ${a.condicion}
- Riesgo: ${a.riesgo}
- Elementos: ${a.elementos.join(', ')}
`).join('')}
TRABAJOS SUGERIDOS POR IMÁGENES:
${Array.from(allTrabajosSet).map(t => `- ${t}`).join('\n')}

MATERIALES POSIBLES:
${Array.from(allMaterialesSet).map(m => `- ${m}`).join('\n')}
  `.trim();
}

import { analyzeImages, buildVisionSummary } from './stages/vision';
import { parseInput } from './stages/parser';
import { generateBudget } from './stages/generator';
import { validateAndFinalize } from './stages/validator';
import type { RawInput, BudgetData } from '@/types/budget';

export type PipelineStage =
  | 'vision'
  | 'parsing'
  | 'generation'
  | 'validation'
  | 'complete';

export interface PipelineProgress {
  stage: PipelineStage;
  message: string;
  progress: number; // 0-100
}

export type ProgressCallback = (progress: PipelineProgress) => void;

export interface OrchestratorResult {
  success: boolean;
  data?: BudgetData;
  error?: string;
  stage?: PipelineStage;
}

export async function generateBudgetOrchestrator(
  rawInput: RawInput,
  onProgress?: ProgressCallback
): Promise<OrchestratorResult> {
  try {
    // ===== STAGE 1: VISION (análisis de imágenes) =====
    onProgress?.({
      stage: 'vision',
      message: 'Analizando imágenes con Gemini Vision...',
      progress: 10,
    });

    let visionSummary = '';
    if (rawInput.imagenes && rawInput.imagenes.length > 0) {
      try {
        const visionAnalyses = await analyzeImages(rawInput.imagenes);
        visionSummary = buildVisionSummary(visionAnalyses);
      } catch (err) {
        console.warn('[Orchestrator] Vision falló, continuando sin análisis de imágenes:', err);
      }
    }

    // ===== STAGE 2: PARSING =====
    onProgress?.({
      stage: 'parsing',
      message: 'Extrayendo información del texto...',
      progress: 30,
    });

    const parsedInput = await parseInput({
      texto: rawInput.texto,
      visionSummary,
    });

    // ===== STAGE 3: GENERATION =====
    onProgress?.({
      stage: 'generation',
      message: 'Generando presupuesto profesional con IA...',
      progress: 55,
    });

    const aiOutput = await generateBudget({
      parsedInput,
      rawInput,
      visionSummary,
    });

    // ===== STAGE 4: VALIDATION =====
    onProgress?.({
      stage: 'validation',
      message: 'Validando y calculando totales...',
      progress: 80,
    });

    const finalBudget = validateAndFinalize({
      aiOutput,
      currency: rawInput.currency,
      tasaImpuesto: rawInput.tasaImpuesto ?? 0.21,
      templateId: rawInput.templateId,
      empresa: rawInput.empresa,
    });

    // ===== COMPLETE =====
    onProgress?.({
      stage: 'complete',
      message: '¡Presupuesto generado exitosamente!',
      progress: 100,
    });

    return {
      success: true,
      data: finalBudget,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido en el pipeline';
    console.error('[Orchestrator] Error:', error);

    return {
      success: false,
      error: message,
    };
  }
}

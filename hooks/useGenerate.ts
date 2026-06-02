'use client';

import { useState, useCallback, useRef } from 'react';
import { useBudgetStore } from '@/store/budget.store';
import { trackAICall } from '@/components/dashboard/AICostMonitor';
import type { PipelineStage } from '@/lib/ai/orchestrator';
import type { ImageInput, TemplateId, Currency } from '@/types/budget';

interface GenerateOptions {
  rawText: string;
  images: ImageInput[];
  templateId: TemplateId;
  currency: Currency;
  tasaImpuesto: number;
  clienteNombre?: string;
  clienteEmpresa?: string;
}

interface GenerateReturn {
  isGenerating: boolean;
  error: string | null;
  generate: (options: GenerateOptions) => Promise<void>;
  cancelGeneration: () => void;
}

const PROGRESS_STEPS: Array<{ stage: PipelineStage; message: string; progress: number }> = [
  {
    stage: 'vision',
    message: 'Analizando imágenes con Gemini Vision...',
    progress: 15,
  },
  {
    stage: 'parsing',
    message: 'Extrayendo información del texto...',
    progress: 35,
  },
  {
    stage: 'generation',
    message: 'Generando presupuesto profesional...',
    progress: 65,
  },
  {
    stage: 'validation',
    message: 'Validando y calculando totales...',
    progress: 85,
  },
];

const POLL_INTERVAL_MS = 2500;

/**
 * Hook that manages the AI budget generation pipeline.
 * Extracted from AIInputArea.tsx for reusability.
 */
export function useGenerate(): GenerateReturn {
  const store = useBudgetStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  const cancelGeneration = useCallback(() => {
    cancelledRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsGenerating(false);
    store.setPipelineProgress(null);
    store.setCurrentStep('input');
  }, [store]);

  const simulateProgress = useCallback(
    (hasImages: boolean) => {
      const steps = PROGRESS_STEPS.map((s, i) => ({
        ...s,
        message:
          i === 0 && !hasImages
            ? 'Procesando documentos...'
            : s.message,
      }));

      let stepIdx = 0;
      intervalRef.current = setInterval(() => {
        if (stepIdx < steps.length && !cancelledRef.current) {
          store.setPipelineProgress(steps[stepIdx]);
          stepIdx++;
        }
      }, POLL_INTERVAL_MS);
    },
    [store]
  );

  const generate = useCallback(
    async (options: GenerateOptions) => {
      const { rawText, images, templateId, currency, tasaImpuesto, clienteNombre, clienteEmpresa } = options;

      if (!rawText.trim() || rawText.length < 10) {
        setError('Describí el trabajo con al menos 10 caracteres');
        return;
      }

      cancelledRef.current = false;
      setError(null);
      setIsGenerating(true);
      store.setIsGenerating(true);
      store.setCurrentStep('generating');
      store.setPipelineProgress({
        stage: 'vision',
        message: 'Iniciando pipeline...',
        progress: 5,
      });

      // Append PDF text to the main text
      const pdfTexts = images
        .filter(img => img.isPDF && img.pdfText)
        .map(img => `[PDF: ${img.filename}]\n${img.pdfText}`)
        .join('\n\n');

      const textoCompleto = pdfTexts
        ? `${rawText}\n\n--- Contenido de PDFs adjuntos ---\n${pdfTexts}`
        : rawText;

      const hasImages = images.some(i => !i.isPDF);
      simulateProgress(hasImages);

      try {
        const response = await fetch('/api/budgets/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            texto: textoCompleto,
            imagenes: images.filter(img => !img.isPDF),
            templateId,
            currency,
            tasaImpuesto,
            clienteNombre: clienteNombre || undefined,
            clienteEmpresa: clienteEmpresa || undefined,
          }),
        });

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Error generando el presupuesto');
        }

        if (cancelledRef.current) return;

        store.setPipelineProgress({
          stage: 'complete',
          message: '¡Presupuesto generado!',
          progress: 100,
        });

        await new Promise(resolve => setTimeout(resolve, 800));

        store.setBudget(data.budget, data.id);
        store.setCurrentStep('preview');
        trackAICall();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        setError(msg);
        store.setError(msg);
        store.setCurrentStep('input');
      } finally {
        setIsGenerating(false);
        store.setIsGenerating(false);
        store.setPipelineProgress(null);
      }
    },
    [store, simulateProgress]
  );

  return {
    isGenerating,
    error,
    generate,
    cancelGeneration,
  };
}

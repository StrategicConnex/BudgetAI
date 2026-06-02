'use client';

import { useState, useCallback } from 'react';
import type { BudgetData } from '@/types/budget';

type ExportFormat = 'pdf' | 'docx' | 'html';

interface UseExportOptions {
  budget: BudgetData | null;
  onSuccess?: (format: ExportFormat) => void;
}

interface UseExportReturn {
  isExportingPDF: boolean;
  isExportingDOCX: boolean;
  isExportingHTML: boolean;
  exportError: string | null;
  exportPDF: () => Promise<void>;
  exportDOCX: () => Promise<void>;
  exportHTML: () => Promise<void>;
}

/**
 * Hook that manages budget export to PDF, DOCX, and HTML.
 * Extracted from BudgetPreview.tsx for reusability.
 */
export function useExport({ budget, onSuccess }: UseExportOptions): UseExportReturn {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingDOCX, setIsExportingDOCX] = useState(false);
  const [isExportingHTML, setIsExportingHTML] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const doExport = useCallback(
    async (format: ExportFormat, endpoint: string, filename: string) => {
      if (!budget) return;

      const setLoading =
        format === 'pdf'
          ? setIsExportingPDF
          : format === 'docx'
            ? setIsExportingDOCX
            : setIsExportingHTML;

      setLoading(true);
      setExportError(null);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ budget }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Error generando ${format.toUpperCase()}`);
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        onSuccess?.(format);
      } catch (err) {
        setExportError(
          err instanceof Error ? err.message : `Error exportando ${format.toUpperCase()}`
        );
      } finally {
        setLoading(false);
      }
    },
    [budget, onSuccess]
  );

  const exportPDF = useCallback(async () => {
    const numero = budget?.numero || Date.now();
    await doExport('pdf', '/api/export/pdf', `presupuesto-${numero}.pdf`);
  }, [doExport, budget]);

  const exportDOCX = useCallback(async () => {
    const numero = budget?.numero || Date.now();
    await doExport('docx', '/api/export/docx', `presupuesto-${numero}.docx`);
  }, [doExport, budget]);

  const exportHTML = useCallback(async () => {
    const numero = budget?.numero || Date.now();
    await doExport('html', '/api/export/html', `presupuesto-${numero}.html`);
  }, [doExport, budget]);

  return {
    isExportingPDF,
    isExportingDOCX,
    isExportingHTML,
    exportError,
    exportPDF,
    exportDOCX,
    exportHTML,
  };
}

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
    if (!budget) return;
    setIsExportingPDF(true);
    setExportError(null);
    try {
      const res = await fetch('/api/export/html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget }),
      });

      if (!res.ok) {
        throw new Error('No se pudo generar el formato de impresión');
      }

      const htmlContent = await res.text();
      const printWindow = window.open('', '_blank');

      if (printWindow) {
        // Inyectar controles de impresión premium flotantes y estilos print
        const injectedHtml = htmlContent.replace('<body>', `
          <body>
          <style>
            @media print {
              .no-print { display: none !important; }
              body { background: white !important; padding: 0 !important; }
              .document { box-shadow: none !important; border-radius: 0 !important; margin: 0 !important; max-width: 100% !important; }
            }
            .no-print-btn:hover {
              transform: translateY(-1px);
              opacity: 0.95;
            }
            .no-print-btn:active {
              transform: translateY(0);
            }
          </style>
          <div class="no-print" style="position: fixed; top: 20px; right: 20px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(8px); padding: 14px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1); border: 1px solid rgba(229, 231, 235, 0.5); display: flex; gap: 10px; z-index: 9999; font-family: system-ui, -apple-system, sans-serif;">
            <button class="no-print-btn" onclick="window.print()" style="background: linear-gradient(135deg, #5c62ec, #7c3aed); color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 13px; box-shadow: 0 4px 14px rgba(92, 98, 236, 0.3); display: flex; align-items: center; gap: 8px; transition: all 0.15s ease;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect width="12" height="8" x="6" y="14" rx="1"/></svg>
              Imprimir / Guardar PDF
            </button>
            <button class="no-print-btn" onclick="window.close()" style="background: #ffffff; color: #4b5563; border: 1px solid #e5e7eb; padding: 10px 16px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 13px; transition: all 0.15s ease;">
              Cerrar Vista Previa
            </button>
          </div>
        `);

        printWindow.document.write(injectedHtml);
        printWindow.document.close();
      }

      onSuccess?.('pdf');
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Error al abrir la vista previa de impresión');
    } finally {
      setIsExportingPDF(false);
    }
  }, [budget, onSuccess]);

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

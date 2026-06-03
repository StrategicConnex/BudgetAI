'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import type { ImageInput } from '@/types/budget';

interface UseFileUploadOptions {
  maxFiles?: number;
  maxSizeBytes?: number;
  disabled?: boolean;
  existingImages: ImageInput[];
  onAddImage: (image: ImageInput) => void;
  onRemoveImage: (index: number) => void;
  onError?: (error: string) => void;
}

interface UseFileUploadReturn {
  getRootProps: ReturnType<typeof useDropzone>['getRootProps'];
  getInputProps: ReturnType<typeof useDropzone>['getInputProps'];
  isDragActive: boolean;
  isProcessing: boolean;
  processingCount: number;
  imageCount: number;
  pdfCount: number;
  totalCount: number;
}

/**
 * Hook that manages file drag & drop, image/PDF upload, and PDF text extraction.
 * Extracted from AIInputArea.tsx for reusability.
 */
export function useFileUpload({
  maxFiles = 20,
  maxSizeBytes = 10 * 1024 * 1024,
  disabled = false,
  existingImages,
  onAddImage,
  onRemoveImage,
  onError,
}: UseFileUploadOptions): UseFileUploadReturn {
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(new Set());

  const imageCount = existingImages.filter(i => !i.isPDF).length;
  const pdfCount = existingImages.filter(i => i.isPDF).length;
  const totalCount = existingImages.length;
  const isProcessing = processingFiles.size > 0;

  /**
   * Extract text from a PDF via server-side API.
   */
  const extractPDFText = useCallback(async (base64: string, filename: string): Promise<string> => {
    try {
      const res = await fetch('/api/ocr/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, filename }),
      });
      const data = await res.json();
      return data.success ? data.text : '';
    } catch {
      return '';
    }
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const remaining = maxFiles - existingImages.length;
      const toProcess = acceptedFiles.slice(0, remaining);

      for (const file of toProcess) {
        const key = `${file.name}-${file.size}`;
        setProcessingFiles(prev => new Set(prev).add(key));

        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          const isPDF = file.type === 'application/pdf';

          let base64: string;
          if (isPDF) {
            base64 = dataUrl.split(',')[1];
          } else {
            try {
              const compressedFile = await imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
              });
              const compressedDataUrl = await new Promise<string>((resolve, reject) => {
                const r = new FileReader();
                r.onload = (ev) => resolve(ev.target?.result as string);
                r.onerror = reject;
                r.readAsDataURL(compressedFile);
              });
              base64 = compressedDataUrl.split(',')[1];
            } catch {
              base64 = dataUrl.split(',')[1];
            }
          }

          let pdfText: string | undefined;
          if (isPDF) {
            try {
              const { PDFParse } = await import('pdf-parse');
              // Configurar worker de pdfjs-dist
              PDFParse.setWorker('https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs');
              
              const arrayBuffer = await file.arrayBuffer();
              const parser = new PDFParse({ data: arrayBuffer });
              const result = await parser.getText();
              await parser.destroy();
              if (result && result.text) {
                pdfText = result.text.trim();
              }
            } catch (err) {
              console.error('Error al extraer texto del PDF en cliente, reintentando en servidor:', err);
              pdfText = await extractPDFText(base64, file.name);
            }
          }

          onAddImage({
            base64,
            mimeType: file.type,
            filename: file.name,
            isPDF,
            pdfText,
          });

          setProcessingFiles(prev => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        };
        reader.readAsDataURL(file);
      }
    },
    [extractPDFText, maxFiles, existingImages.length, onAddImage]
  );

  const dropzone = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'],
      'application/pdf': ['.pdf'],
    },
    maxFiles,
    maxSize: maxSizeBytes,
    onDropRejected: (rejections) => {
      const tooLarge = rejections.some(r =>
        r.errors.some(e => e.code === 'file-too-large')
      );
      if (tooLarge) {
        onError?.(`Archivos demasiado grandes. El tamaño máximo es ${maxSizeBytes / (1024 * 1024)}MB por archivo.`);
      }
    },
    disabled: totalCount >= maxFiles || disabled,
  });

  return {
    getRootProps: dropzone.getRootProps,
    getInputProps: dropzone.getInputProps,
    isDragActive: dropzone.isDragActive,
    isProcessing,
    processingCount: processingFiles.size,
    imageCount,
    pdfCount,
    totalCount,
  };
}

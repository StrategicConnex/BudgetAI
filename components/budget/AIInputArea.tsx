'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useBudgetStore } from '@/store/budget.store';
import {
  Sparkles, Upload, X, ImageIcon, AlertCircle, Brain,
  Zap, Eye, CheckCircle2, FileText, FileImage,
} from 'lucide-react';
import type { PipelineStage } from '@/lib/ai/orchestrator';

const MAX_FILES = 20;

const STAGE_INFO: Record<PipelineStage, { label: string; icon: typeof Brain; color: string }> = {
  vision:     { label: 'Analizando imágenes y PDFs...', icon: Eye,          color: 'text-violet-400' },
  parsing:    { label: 'Extrayendo información...',     icon: Brain,         color: 'text-blue-400'   },
  generation: { label: 'Generando presupuesto...',      icon: Sparkles,      color: 'text-primary'    },
  validation: { label: 'Validando y calculando...',     icon: CheckCircle2,  color: 'text-emerald-400'},
  complete:   { label: '¡Listo!',                       icon: CheckCircle2,  color: 'text-emerald-400'},
};

export default function AIInputArea() {
  const {
    rawText, setRawText,
    images, addImage, removeImage,
    templateId, setTemplateId,
    currency, setCurrency,
    clienteNombre, setClienteNombre,
    clienteEmpresa, setClienteEmpresa,
    tasaImpuesto,
    isGenerating, setIsGenerating,
    pipelineProgress, setPipelineProgress,
    error, setError,
    setBudget, setCurrentStep,
  } = useBudgetStore();

  const [charCount, setCharCount] = useState(0);
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(new Set());

  // ───────────────────────────────────────────────
  // Extraer texto de PDF via API server-side
  // ───────────────────────────────────────────────
  async function extractPDFText(base64: string, filename: string): Promise<string> {
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
  }

  // ───────────────────────────────────────────────
  // Dropzone — imágenes + PDFs, hasta 20 archivos
  // ───────────────────────────────────────────────
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const remaining = MAX_FILES - images.length;
    const toProcess = acceptedFiles.slice(0, remaining);

    for (const file of toProcess) {
      const key = `${file.name}-${file.size}`;
      setProcessingFiles(prev => new Set(prev).add(key));

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        const base64 = dataUrl.split(',')[1];
        const isPDF = file.type === 'application/pdf';

        let pdfText: string | undefined;
        if (isPDF) {
          pdfText = await extractPDFText(base64, file.name);
        }

        addImage({
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
  }, [addImage, images.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*':           ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'],
      'application/pdf':   ['.pdf'],
    },
    maxFiles: MAX_FILES,
    disabled: images.length >= MAX_FILES || isGenerating,
  });

  // ───────────────────────────────────────────────
  // Generate
  // ───────────────────────────────────────────────
  async function handleGenerate() {
    if (!rawText.trim() || rawText.length < 10) {
      setError('Describí el trabajo con al menos 10 caracteres');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setCurrentStep('generating');
    setPipelineProgress({ stage: 'vision', message: 'Iniciando pipeline...', progress: 5 });

    // Agregar texto extraído de PDFs al rawText enviado
    const pdfTexts = images
      .filter(img => img.isPDF && img.pdfText)
      .map(img => `[PDF: ${img.filename}]\n${img.pdfText}`)
      .join('\n\n');

    const textoCompleto = pdfTexts
      ? `${rawText}\n\n--- Contenido de PDFs adjuntos ---\n${pdfTexts}`
      : rawText;

    try {
      const response = await fetch('/api/budgets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texto: textoCompleto,
          imagenes: images.filter(img => !img.isPDF), // solo imágenes para vision
          templateId,
          currency,
          tasaImpuesto,
          clienteNombre: clienteNombre || undefined,
          clienteEmpresa: clienteEmpresa || undefined,
        }),
      });

      const progressSteps: Array<{ stage: PipelineStage; message: string; progress: number }> = [
        { stage: 'vision',      message: images.some(i => !i.isPDF) ? 'Analizando imágenes con Gemini Vision...' : 'Procesando documentos...', progress: 15 },
        { stage: 'parsing',     message: 'Extrayendo información del texto...', progress: 35 },
        { stage: 'generation',  message: 'Generando presupuesto profesional...', progress: 65 },
        { stage: 'validation',  message: 'Validando y calculando totales...', progress: 85 },
      ];

      let stepIdx = 0;
      const interval = setInterval(() => {
        if (stepIdx < progressSteps.length) {
          setPipelineProgress(progressSteps[stepIdx]);
          stepIdx++;
        }
      }, 2500);

      const data = await response.json();
      clearInterval(interval);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error generando el presupuesto');
      }

      setPipelineProgress({ stage: 'complete', message: '¡Presupuesto generado!', progress: 100 });
      await new Promise(resolve => setTimeout(resolve, 800));

      setBudget(data.budget, data.id);
      setCurrentStep('preview');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      setCurrentStep('input');
    } finally {
      setIsGenerating(false);
      setPipelineProgress(null);
    }
  }

  // ───────────────────────────────────────────────
  // Loading state
  // ───────────────────────────────────────────────
  if (isGenerating && pipelineProgress) {
    const info = STAGE_INFO[pipelineProgress.stage];
    const Icon = info.icon;

    return (
      <div className="glass-card p-12 text-center animate-fade-in">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(239 84% 67% / 0.2), hsl(262 80% 65% / 0.2))' }}
            >
              <Icon className={`w-10 h-10 ${info.color} animate-pulse`} />
            </div>
            <div className="absolute -inset-2 rounded-3xl opacity-30 blur-xl animate-pulse-slow"
              style={{ background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 80% 65%))' }} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">{info.label}</h2>
            <p className="text-muted-foreground text-sm">{pipelineProgress.message}</p>
          </div>

          <div className="w-full max-w-sm">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Pipeline AI</span>
              <span>{pipelineProgress.progress}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pipelineProgress.progress}%`,
                  background: 'linear-gradient(90deg, hsl(239 84% 67%), hsl(262 80% 65%))',
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {(['vision', 'parsing', 'generation', 'validation'] as PipelineStage[]).map((stage, idx) => {
              const stages: PipelineStage[] = ['vision', 'parsing', 'generation', 'validation', 'complete'];
              const currentIdx = stages.indexOf(pipelineProgress.stage);
              const stageIdx = stages.indexOf(stage);
              const isDone = stageIdx < currentIdx;
              const isActive = stage === pipelineProgress.stage;

              return (
                <div key={stage} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    isDone ? 'bg-emerald-400' : isActive ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'
                  }`} />
                  {idx < 3 && <div className={`w-8 h-px ${isDone ? 'bg-emerald-400/50' : 'bg-border'}`} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────
  // Counts
  // ───────────────────────────────────────────────
  const imageCount = images.filter(i => !i.isPDF).length;
  const pdfCount = images.filter(i => i.isPDF).length;
  const totalCount = images.length;
  const isProcessing = processingFiles.size > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-slide-up">
      {/* Left: Main input */}
      <div className="lg:col-span-3 space-y-5">
        {/* Client info */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
              <span className="text-[10px] text-primary font-bold">1</span>
            </div>
            Información del cliente
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nombre del cliente</label>
              <input
                type="text"
                value={clienteNombre}
                onChange={e => setClienteNombre(e.target.value)}
                placeholder="Ej: Juan Pérez"
                disabled={isGenerating}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Empresa (opcional)</label>
              <input
                type="text"
                value={clienteEmpresa}
                onChange={e => setClienteEmpresa(e.target.value)}
                placeholder="Ej: Constructora SA"
                disabled={isGenerating}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
              <span className="text-[10px] text-primary font-bold">2</span>
            </div>
            Descripción del trabajo
            <span className="ml-auto text-xs text-muted-foreground">{charCount} caracteres</span>
          </h2>
          <textarea
            value={rawText}
            onChange={e => {
              setRawText(e.target.value);
              setCharCount(e.target.value.length);
              if (error) setError(null);
            }}
            placeholder={`Describí el trabajo a presupuestar con todos los detalles...

Ejemplo:
- Reparación de humedad en pared norte del living (aprox 8m²)
- Grietas superficiales en el cielorraso del baño
- Pintura general de 2 habitaciones

También podés subir fotos y PDFs con planos o especificaciones técnicas.`}
            rows={10}
            disabled={isGenerating}
            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none leading-relaxed"
          />
          {error && (
            <div className="mt-3 flex items-center gap-2 text-destructive text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Files (images + PDFs) */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
              <span className="text-[10px] text-primary font-bold">3</span>
            </div>
            Fotos y documentos
            <span className="ml-auto text-xs text-muted-foreground">{totalCount}/{MAX_FILES} archivos</span>
          </h2>
          {(imageCount > 0 || pdfCount > 0) && (
            <p className="text-xs text-muted-foreground mb-4">
              {imageCount > 0 && <span className="mr-3"><FileImage className="w-3 h-3 inline mr-1" />{imageCount} imagen{imageCount !== 1 ? 'es' : ''}</span>}
              {pdfCount > 0 && <span><FileText className="w-3 h-3 inline mr-1" />{pdfCount} PDF{pdfCount !== 1 ? 's' : ''}</span>}
            </p>
          )}

          {/* Dropzone */}
          {totalCount < MAX_FILES && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150 mb-4 ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
              } ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <input {...getInputProps()} />
              {isProcessing ? (
                <>
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Procesando archivos...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isDragActive ? 'Soltá los archivos aquí' : 'Arrastrá archivos o hacé click para seleccionar'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Imágenes (JPG, PNG, WEBP) · PDFs — hasta {MAX_FILES} archivos
                  </p>
                </>
              )}
            </div>
          )}

          {/* Thumbnails */}
          {totalCount > 0 && (
            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative group">
                  {img.isPDF ? (
                    /* PDF tile */
                    <div className="w-20 h-20 rounded-lg border border-border bg-secondary flex flex-col items-center justify-center gap-1 p-2">
                      <FileText className="w-7 h-7 text-red-400" />
                      <span className="text-[9px] text-muted-foreground text-center leading-tight truncate w-full text-center">
                        {img.filename.length > 12 ? img.filename.substring(0, 10) + '…' : img.filename}
                      </span>
                      {img.pdfText && (
                        <span className="text-[8px] text-emerald-400">✓ texto</span>
                      )}
                    </div>
                  ) : (
                    /* Image tile */
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-border bg-secondary">
                      <img
                        src={`data:${img.mimeType};base64,${img.base64}`}
                        alt={img.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <button
                    onClick={() => removeImage(idx)}
                    disabled={isGenerating}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  {!img.isPDF && (
                    <div className="absolute bottom-0 inset-x-0 rounded-b-lg flex items-center justify-center p-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Settings + Generate */}
      <div className="lg:col-span-2 space-y-5">
        {/* Settings */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Configuración</h2>

          {/* Template */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-muted-foreground mb-2">Template</label>
            <div className="space-y-2">
              {[
                { id: 'construction', label: 'Construcción', desc: 'YPY — para obras y reparaciones' },
                { id: 'minimal-white', label: 'Minimal', desc: 'Diseño limpio y profesional' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id as typeof templateId)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                    templateId === t.id
                      ? 'bg-primary/10 border-primary/40 text-foreground'
                      : 'bg-secondary border-border text-muted-foreground hover:border-primary/20'
                  }`}
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Moneda</label>
            <div className="flex gap-2">
              {(['ARS', 'USD'] as const).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                    currency === c
                      ? 'bg-primary/10 border-primary/40 text-primary'
                      : 'bg-secondary border-border text-muted-foreground hover:border-primary/20'
                  }`}
                >
                  {c === 'ARS' ? '$ ARS' : 'USD'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI info */}
        <div
          className="rounded-xl p-4 text-xs space-y-2"
          style={{
            background: 'linear-gradient(135deg, hsl(239 84% 67% / 0.08), hsl(262 80% 65% / 0.08))',
            border: '1px solid hsl(239 84% 67% / 0.2)',
          }}
        >
          <div className="flex items-center gap-2 text-primary font-semibold mb-3">
            <Zap className="w-3.5 h-3.5" />
            Pipeline AI en 4 etapas
          </div>
          {[
            { stage: 'Visión',     desc: 'Análisis de imágenes y PDFs' },
            { stage: 'Parsing',    desc: 'Extracción de datos' },
            { stage: 'Generación', desc: 'Redacción profesional' },
            { stage: 'Validación', desc: 'Cálculo de totales' },
          ].map((s, i) => (
            <div key={s.stage} className="flex items-center gap-2 text-muted-foreground">
              <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                {i + 1}
              </span>
              <span className="font-medium text-foreground">{s.stage}</span>
              <span>— {s.desc}</span>
            </div>
          ))}
        </div>

        {/* Generate button */}
        <button
          id="btn-generate-budget"
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || rawText.length < 10}
          className="w-full py-4 rounded-xl text-white font-bold text-base transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 80% 65%))',
            boxShadow: '0 8px 32px hsl(239 84% 67% / 0.35)',
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            Generar presupuesto con IA
          </span>
        </button>

        {rawText.length > 0 && rawText.length < 10 && (
          <p className="text-xs text-muted-foreground text-center">
            Escribí al menos 10 caracteres para continuar
          </p>
        )}
      </div>
    </div>
  );
}

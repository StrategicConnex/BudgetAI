'use client';

import { useState } from 'react';
import { useBudgetStore } from '@/store/budget.store';
import { useGenerate } from '@/hooks/useGenerate';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar, StepIndicator } from '@/components/ui/ProgressBar';
import {
  Sparkles, Upload, X, ImageIcon, AlertCircle,
  Zap, FileText, FileImage, Brain, Eye, CheckCircle2,
} from 'lucide-react';
import TextTemplateSelector from '@/components/budget/TextTemplateSelector';
import CompanySettings from '@/components/budget/CompanySettings';
import { trackAICall } from '@/components/dashboard/AICostMonitor';
import { TASAS_IMPOSITIVAS } from '@/types/budget';
import type { PipelineStage } from '@/lib/ai/orchestrator';

const MAX_FILES = 20;

const STAGE_INFO: Record<PipelineStage, { label: string; icon: typeof Brain; color: string }> = {
  vision:     { label: 'Analizando imágenes y PDFs...', icon: Eye,          color: 'text-violet-400' },
  parsing:    { label: 'Extrayendo información...',     icon: Brain,         color: 'text-blue-400'   },
  generation: { label: 'Generando presupuesto...',      icon: Sparkles,      color: 'text-primary'    },
  validation: { label: 'Validando y calculando...',     icon: CheckCircle2,  color: 'text-emerald-400'},
  complete:   { label: '¡Listo!',                       icon: CheckCircle2,  color: 'text-emerald-400'},
};

const PIPELINE_STAGES: PipelineStage[] = ['vision', 'parsing', 'generation', 'validation', 'complete'];

export default function AIInputArea() {
  const {
    rawText, setRawText,
    images, addImage, removeImage,
    templateId, setTemplateId,
    currency, setCurrency,
    clienteNombre, setClienteNombre,
    clienteEmpresa, setClienteEmpresa,
    tasaImpuesto,
    tasaImpositivaId,
    setTasaImpositivaId,
    isGenerating: storeIsGenerating,
    pipelineProgress,
    error: storeError, setError: setStoreError,
  } = useBudgetStore();

  const [charCount, setCharCount] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  const { generate, cancelGeneration } = useGenerate();

  const {
    getRootProps, getInputProps, isDragActive,
    isProcessing, imageCount, pdfCount, totalCount,
  } = useFileUpload({
    maxFiles: MAX_FILES,
    existingImages: images,
    onAddImage: addImage,
    onRemoveImage: removeImage,
    onError: setLocalError,
    disabled: storeIsGenerating,
  });

  const error = localError || storeError;
  const showPipeline = storeIsGenerating && pipelineProgress;

  // ───────────────────────────────────────────────
  // Handle generate
  // ───────────────────────────────────────────────
  async function handleGenerate() {
    if (!rawText.trim() || rawText.length < 10) {
      setLocalError('Describí el trabajo con al menos 10 caracteres');
      return;
    }

    setLocalError(null);
    setStoreError(null);

    await generate({
      rawText,
      images,
      templateId,
      currency,
      tasaImpuesto,
      tasaImpositivaId,
      clienteNombre,
      clienteEmpresa,
    });
  }

  // ───────────────────────────────────────────────
  // Loading state
  // ───────────────────────────────────────────────
  if (showPipeline) {
    const info = STAGE_INFO[pipelineProgress.stage];
    const Icon = info.icon;

    return (
      <Card padding="xl" className="text-center animate-fade-in">
        <div className="flex flex-col items-center gap-6">
          {/* Animated icon */}
          <div className="relative">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(239 84% 67% / 0.2), hsl(262 80% 65% / 0.2))' }}
            >
              <Icon className={`w-10 h-10 ${info.color} animate-pulse`} />
            </div>
            <div
              className="absolute -inset-2 rounded-3xl opacity-30 blur-xl animate-pulse-slow"
              style={{ background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 80% 65%))' }}
            />
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">{info.label}</h2>
            <p className="text-muted-foreground text-sm">{pipelineProgress.message}</p>
          </div>

          <ProgressBar
            value={pipelineProgress.progress}
            label="Pipeline AI"
            showLabel
            className="max-w-sm"
          />

          <StepIndicator
            steps={PIPELINE_STAGES.map(s => ({ key: s, label: s }))}
            currentStep={pipelineProgress.stage}
          />

          <Button variant="ghost" size="sm" onClick={cancelGeneration}>
            Cancelar
          </Button>
        </div>
      </Card>
    );
  }

  // ───────────────────────────────────────────────
  // Input form
  // ───────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-slide-up">
      {/* Left: Main input */}
      <div className="lg:col-span-3 space-y-5">
        {/* Client info */}
        <Card padding="lg">
          <CardHeader>
            <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
              <span className="text-[10px] text-primary font-bold">1</span>
            </div>
            <CardTitle>Información del cliente</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre del cliente"
              value={clienteNombre}
              onChange={e => setClienteNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
              disabled={storeIsGenerating}
            />
            <Input
              label="Empresa (opcional)"
              value={clienteEmpresa}
              onChange={e => setClienteEmpresa(e.target.value)}
              placeholder="Ej: Constructora SA"
              disabled={storeIsGenerating}
            />
          </div>
        </Card>

        {/* Description */}
        <Card padding="lg">
          <CardHeader>
            <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
              <span className="text-[10px] text-primary font-bold">2</span>
            </div>
            <CardTitle>Descripción del trabajo</CardTitle>
            <span className="ml-auto text-xs text-muted-foreground">{charCount} caracteres</span>
          </CardHeader>
          <Textarea
            value={rawText}
            onChange={e => {
              setRawText(e.target.value);
              setCharCount(e.target.value.length);
              if (error) setLocalError(null);
            }}
            placeholder={`Describí el trabajo a presupuestar con todos los detalles...\n\nEjemplo:\n- Reparación de humedad en pared norte del living (aprox 8m²)\n- Grietas superficiales en el cielorraso del baño\n- Pintura general de 2 habitaciones\n\nTambién podés subir fotos y PDFs con planos o especificaciones técnicas.`}
            rows={10}
            disabled={storeIsGenerating}
            error={error || undefined}
          />
          {error && (
            <div className="mt-3 flex items-center gap-2 text-destructive text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </Card>

        {/* Text Templates */}
        <TextTemplateSelector
          onSelect={(desc) => {
            const newText = rawText ? `${rawText}\n\n${desc}` : desc;
            setRawText(newText);
            setCharCount(newText.length);
          }}
          disabled={storeIsGenerating}
        />

        {/* Files */}
        <Card padding="lg">
          <CardHeader>
            <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
              <span className="text-[10px] text-primary font-bold">3</span>
            </div>
            <CardTitle>Fotos y documentos</CardTitle>
            <span className="ml-auto text-xs text-muted-foreground">{totalCount}/{MAX_FILES} archivos</span>
          </CardHeader>

          {(imageCount > 0 || pdfCount > 0) && (
            <p className="text-xs text-muted-foreground mb-4">
              {imageCount > 0 && (
                <span className="mr-3">
                  <FileImage className="w-3 h-3 inline mr-1" />
                  {imageCount} imagen{imageCount !== 1 ? 'es' : ''}
                </span>
              )}
              {pdfCount > 0 && (
                <span>
                  <FileText className="w-3 h-3 inline mr-1" />
                  {pdfCount} PDF{pdfCount !== 1 ? 's' : ''}
                </span>
              )}
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
                    <div className="w-20 h-20 rounded-lg border border-border bg-secondary flex flex-col items-center justify-center gap-1 p-2">
                      <FileText className="w-7 h-7 text-red-400" />
                      <span className="text-[9px] text-muted-foreground text-center leading-tight truncate w-full">
                        {img.filename.length > 12 ? img.filename.substring(0, 10) + '…' : img.filename}
                      </span>
                      {img.pdfText && (
                        <span className="text-[8px] text-emerald-400">✓ texto</span>
                      )}
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-border bg-secondary">
                      <img
                        src={`data:${img.mimeType};base64,${img.base64}`}
                        alt={img.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <button
                    onClick={() => {
                      removeImage(idx);
                      setLocalError(null);
                    }}
                    disabled={storeIsGenerating}
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
        </Card>
      </div>

      {/* Right: Settings + Generate */}
      <div className="lg:col-span-2 space-y-5">
        {/* Settings */}
        <Card padding="lg">
          <CardTitle className="mb-4">Configuración</CardTitle>

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
          <div className="mb-5">
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

          {/* Tax Rate */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">IVA</label>
            <div className="space-y-1.5">
              {TASAS_IMPOSITIVAS.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTasaImpositivaId(t.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                    tasaImpositivaId === t.id
                      ? 'bg-primary/10 border-primary/40 text-foreground'
                      : 'bg-secondary border-border text-muted-foreground hover:border-primary/20'
                  }`}
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{t.descripcion}</div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Company Settings */}
        <CompanySettings disabled={storeIsGenerating} />

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
            { stage: 'Visión', desc: 'Análisis de imágenes y PDFs' },
            { stage: 'Parsing', desc: 'Extracción de datos' },
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
        <Button
          id="btn-generate-budget"
          variant="gradient"
          size="lg"
          onClick={handleGenerate}
          disabled={storeIsGenerating || rawText.length < 10}
          icon={<Sparkles className="w-5 h-5" />}
          className="w-full"
        >
          Generar presupuesto con IA
        </Button>

        {rawText.length > 0 && rawText.length < 10 && (
          <p className="text-xs text-muted-foreground text-center">
            Escribí al menos 10 caracteres para continuar
          </p>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBudgetStore } from '@/store/budget.store';
import DuplicateBudgetButton from '@/components/budget/DuplicateBudgetButton';
import { useExport } from '@/hooks/useExport';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pencil } from 'lucide-react';
import { formatCurrency } from '@/lib/ai/stages/validator';
import { TASAS_IMPOSITIVAS } from '@/types/budget';
import {
  ArrowLeft, FileDown, FileText, FileCode, Eye, Printer,
  Download, User, Package,
} from 'lucide-react';
import { toast } from 'sonner';
import type { BudgetData, BudgetItem, BudgetStatus } from '@/types/budget';

interface BudgetDetailClientProps {
  budget: BudgetData;
  budgetId: string;
  createdAt: string;
  status: string;
}

export default function BudgetDetailClient({
  budget, budgetId, createdAt, status,
}: BudgetDetailClientProps) {
  const [showPreview, setShowPreview] = useState(false);

  const {
    isExportingPDF, isExportingDOCX, isExportingHTML,
    exportError, exportPDF, exportDOCX, exportHTML,
  } = useExport({ budget });

  const b = budget;
  const fmt = (n: number) => formatCurrency(n, b.totales.currency);

  const grouped = b.items.reduce<Record<string, BudgetItem[]>>((acc, item) => {
    const cat = item.categoria || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const tasaInfo = TASAS_IMPOSITIVAS.find(t => t.id === b.totales.tasaImpositivaId);

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/dashboard/budgets"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a presupuestos
        </Link>
        <div className="flex items-center gap-3">
          {exportError && (
            <span className="text-xs text-destructive">{exportError}</span>
          )}
          <Button
            variant="secondary" size="sm"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => setShowPreview(true)}
          >
            Previsualizar
          </Button>
          <Button
            id="btn-export-docx"
            variant="secondary" size="sm"
            loading={isExportingDOCX}
            icon={<FileText className="w-4 h-4" />}
            onClick={exportDOCX}
          >
            Word
          </Button>
          <Button
            id="btn-export-html"
            variant="secondary" size="sm"
            loading={isExportingHTML}
            icon={<FileCode className="w-4 h-4" />}
            onClick={exportHTML}
          >
            HTML
          </Button>
          <Button
            id="btn-export-pdf-detail"
            variant="gradient" size="sm"
            loading={isExportingPDF}
            icon={<FileDown className="w-4 h-4" />}
            onClick={exportPDF}
          >
            PDF
          </Button>
        </div>
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-white/5 bg-card/80 backdrop-blur-sm overflow-hidden shadow-lg">
        {/* Header */}
        <div
          className="px-8 py-6 border-b border-border"
          style={{ background: 'linear-gradient(135deg, hsl(239 84% 67% / 0.08), hsl(262 80% 65% / 0.08))' }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-12">
              <Badge variant="premium" className="mb-3">{b.categoria}</Badge>
              <h1 className="text-2xl font-bold text-foreground mb-1">{b.titulo}</h1>
              <p className="text-muted-foreground text-sm">{b.descripcionGeneral}</p>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg font-bold text-primary">{b.numero}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(createdAt).toLocaleDateString('es-AR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </div>
              <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full border ${
                status === 'ready' || status === 'exported'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-muted border-border text-muted-foreground'
              }`}>
                {status === 'ready' ? 'Listo' : status === 'exported' ? 'Exportado' : status}
              </span>
            </div>
          </div>
        </div>

        {/* Client + Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-border">
          <div className="px-8 py-5 border-b md:border-b-0 md:border-r border-border">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wide mb-3">
              <User className="w-3.5 h-3.5" />
              Cliente
            </div>
            <div className="font-semibold text-foreground">{b.cliente.nombre}</div>
            {b.cliente.empresa && <div className="text-sm text-muted-foreground">{b.cliente.empresa}</div>}
            {b.cliente.email && <div className="text-xs text-muted-foreground">{b.cliente.email}</div>}
            {b.cliente.cuit && <div className="text-xs text-muted-foreground font-mono">CUIT: {b.cliente.cuit}</div>}
          </div>
          <div className="px-8 py-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wide mb-3">
              <Package className="w-3.5 h-3.5" />
              Condiciones
            </div>
            <div className="space-y-1 text-sm">
              <div><span className="text-muted-foreground">Validez:</span> <span className="text-foreground font-medium">{b.condiciones.validezDias} días</span></div>
              <div><span className="text-muted-foreground">Pago:</span> <span className="text-foreground font-medium">{b.condiciones.formaPago}</span></div>
              {b.condiciones.notas && <div className="text-xs text-muted-foreground mt-1">{b.condiciones.notas}</div>}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="px-8 py-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-5">
            <Package className="w-4 h-4 text-primary" />
            Detalle de trabajos
            <span className="ml-auto text-xs text-muted-foreground font-normal">
              {b.items.length} ítem{b.items.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div
            className="grid grid-cols-12 gap-2 px-4 py-2 rounded-lg mb-1 text-xs font-semibold text-white uppercase tracking-wide"
            style={{ background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 80% 65%))' }}
          >
            <span className="col-span-5">Descripción</span>
            <span className="col-span-2">Unidad</span>
            <span className="col-span-1 text-right">Cant.</span>
            <span className="col-span-2 text-right">P. Unit.</span>
            <span className="col-span-2 text-right">Total</span>
          </div>

          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-4">
              <div
                className="px-4 py-1.5 text-xs font-semibold text-primary uppercase tracking-wide rounded-md mb-1"
                style={{ background: 'hsl(239 84% 67% / 0.07)' }}
              >
                {category}
              </div>
              <div className="divide-y divide-border/20">
                {items.map(item => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/50">
                    <div className="col-span-5">
                      <div className="text-sm font-medium text-foreground">{item.titulo}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.descripcion}</div>
                      {item.observaciones && <div className="text-[10px] text-primary mt-1 italic">* {item.observaciones}</div>}
                    </div>
                    <div className="col-span-2 text-xs text-muted-foreground">{item.unidad}</div>
                    <div className="col-span-1 text-xs text-right font-mono text-foreground">{item.cantidad}</div>
                    <div className="col-span-2 text-xs text-right font-mono text-foreground">{fmt(item.precioUnitario)}</div>
                    <div className="col-span-2 text-xs text-right font-mono font-semibold text-foreground">{fmt(item.precioTotal)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="px-8 py-6 border-t border-border">
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono font-medium text-foreground">{fmt(b.totales.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  IVA {tasaInfo ? `(${tasaInfo.label})` : `(${Math.round(b.totales.tasaImpuesto * 100)}%)`}
                </span>
                <span className="font-mono font-medium text-foreground">{fmt(b.totales.impuestos)}</span>
              </div>
              <div
                className="flex justify-between items-center px-4 py-3 rounded-xl mt-3 text-white font-bold"
                style={{ background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 80% 65%))' }}
              >
                <span>TOTAL</span>
                <span className="font-mono text-xl">{fmt(b.totales.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
        <EditButton budget={budget} budgetId={budgetId} />
        <DuplicateBudgetButton budget={budget} />
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Vista Previa</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary" size="sm"
                  icon={<Printer className="w-4 h-4" />}
                  onClick={() => window.print()}
                >
                  Imprimir
                </Button>
                <Button
                  variant="ghost" size="sm"
                  icon={<Download className="w-4 h-4" />}
                  onClick={() => setShowPreview(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-secondary/10 flex justify-center">
              <div className="w-full max-w-3xl bg-card border border-border rounded-xl shadow-lg p-8 md:p-12 text-foreground">
                <div className="flex justify-between items-start pb-6 border-b border-border">
                  <div>
                    <Badge variant="premium">{b.categoria}</Badge>
                    <h2 className="text-xl font-bold text-foreground mt-3">{b.titulo}</h2>
                    <p className="text-xs text-muted-foreground mt-1">{b.descripcionGeneral}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-primary font-mono">{b.numero}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {new Date(createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8 py-6 border-b border-border text-xs">
                  <div>
                    <h4 className="font-bold text-primary uppercase tracking-wider mb-2 text-[9px]">Cliente</h4>
                    <div className="font-semibold text-foreground">{b.cliente.nombre}</div>
                    {b.cliente.empresa && <div className="text-muted-foreground">{b.cliente.empresa}</div>}
                    {b.cliente.email && <div className="text-muted-foreground">{b.cliente.email}</div>}
                  </div>
                  <div>
                    <h4 className="font-bold text-primary uppercase tracking-wider mb-2 text-[9px]">Condiciones</h4>
                    <div><span className="text-muted-foreground">Validez:</span> {b.condiciones.validezDias} días</div>
                    <div><span className="text-muted-foreground">Pago:</span> {b.condiciones.formaPago}</div>
                  </div>
                </div>
                <div className="py-6">
                  <h4 className="font-bold text-foreground uppercase tracking-wider mb-4 text-[10px]">Detalle de Trabajos</h4>
                  <div className="grid grid-cols-12 gap-2 pb-2 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                    <span className="col-span-5">Descripción</span>
                    <span className="col-span-2">Unidad</span>
                    <span className="col-span-1 text-right">Cant.</span>
                    <span className="col-span-2 text-right">P. Unit</span>
                    <span className="col-span-2 text-right">Total</span>
                  </div>
                  {Object.entries(grouped).map(([category, items]) => (
                    <div key={category} className="py-2">
                      <div className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/5 py-1 px-3 rounded mb-1">{category}</div>
                      {items.map(item => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 py-3 text-xs">
                          <div className="col-span-5">
                            <div className="font-semibold text-foreground">{item.titulo}</div>
                            <div className="text-[11px] text-muted-foreground">{item.descripcion}</div>
                          </div>
                          <div className="col-span-2 text-muted-foreground">{item.unidad}</div>
                          <div className="col-span-1 text-right font-mono text-foreground">{item.cantidad}</div>
                          <div className="col-span-2 text-right font-mono text-foreground">{fmt(item.precioUnitario)}</div>
                          <div className="col-span-2 text-right font-mono font-semibold text-foreground">{fmt(item.precioTotal)}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-border flex justify-end">
                  <div className="w-64 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-mono font-medium text-foreground">{fmt(b.totales.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IVA {tasaInfo ? `(${tasaInfo.label})` : ''}</span>
                      <span className="font-mono font-medium text-foreground">{fmt(b.totales.impuestos)}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-sm mt-2">
                      <span>TOTAL</span>
                      <span className="font-mono text-base">{fmt(b.totales.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Edit button: loads budget into the store and navigates to the editor ──
function EditButton({ budget, budgetId }: { budget: BudgetData; budgetId: string }) {
  const router = useRouter();
  const { setBudget, setCurrentStep } = useBudgetStore();

  function handleEdit() {
    setBudget(budget, budgetId);
    setCurrentStep('preview');
    router.push('/dashboard/budgets/new');
    toast.success('Presupuesto cargado — podés editarlo inline');
  }

  return (
    <Button
      variant="secondary"
      icon={<Pencil className="w-4 h-4" />}
      onClick={handleEdit}
    >
      Editar
    </Button>
  );
}

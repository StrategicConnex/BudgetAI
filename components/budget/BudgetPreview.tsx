'use client';

import { useBudgetStore } from '@/store/budget.store';
import { formatCurrency } from '@/lib/ai/stages/validator';
import {
  FileDown, FileText, FileCode, ArrowLeft, Pencil, Check, X,
  Building2, User, Calendar, Hash, Package
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { BudgetItem } from '@/types/budget';

export default function BudgetPreview() {
  const {
    budget, currency,
    isExportingPDF, isExportingDOCX, isExportingHTML,
    setIsExportingPDF, setIsExportingDOCX, setIsExportingHTML,
    setExportError, exportError,
    setCurrentStep, updateBudgetItem,
    reset,
  } = useBudgetStore();

  if (!budget) return null;

  // After the guard, TS knows budget is non-null
  const b = budget;
  const fmt = (n: number) => formatCurrency(n, b.totales.currency);

  async function handleExportPDF() {
    setIsExportingPDF(true);
    setExportError(null);
    try {
      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget }),
      });
      if (!res.ok) throw new Error('Error generando PDF');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presupuesto-${b.numero || Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setCurrentStep('exported');
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Error exportando PDF');
    } finally {
      setIsExportingPDF(false);
    }
  }

  async function handleExportDOCX() {
    setIsExportingDOCX(true);
    setExportError(null);
    try {
      const res = await fetch('/api/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget }),
      });
      if (!res.ok) throw new Error('Error generando DOCX');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presupuesto-${b.numero || Date.now()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Error exportando DOCX');
    } finally {
      setIsExportingDOCX(false);
    }
  }

  async function handleExportHTML() {
    setIsExportingHTML(true);
    setExportError(null);
    try {
      const res = await fetch('/api/export/html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget }),
      });
      if (!res.ok) throw new Error('Error generando HTML');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presupuesto-${b.numero || Date.now()}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Error exportando HTML');
    } finally {
      setIsExportingHTML(false);
    }
  }

  // Group items by category
  const grouped = b.items.reduce<Record<string, BudgetItem[]>>((acc, item) => {
    const cat = item.categoria || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep('input')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a editar
        </button>
        <div className="flex items-center gap-3">
          {exportError && (
            <span className="text-xs text-destructive">{exportError}</span>
          )}
          <button
            id="btn-export-docx"
            onClick={handleExportDOCX}
            disabled={isExportingDOCX}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-all disabled:opacity-50"
          >
            {isExportingDOCX ? (
              <span className="w-4 h-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Exportar Word
          </button>
          <button
            id="btn-export-html"
            onClick={handleExportHTML}
            disabled={isExportingHTML}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-all disabled:opacity-50"
          >
            {isExportingHTML ? (
              <span className="w-4 h-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
            ) : (
              <FileCode className="w-4 h-4" />
            )}
            Exportar HTML
          </button>
          <button
            id="btn-export-pdf"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 80% 65%))',
              boxShadow: '0 4px 20px hsl(239 84% 67% / 0.3)',
            }}
          >
            {isExportingPDF ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Budget preview card */}
      <div className="glass-card overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border"
          style={{ background: 'linear-gradient(135deg, hsl(239 84% 67% / 0.08), hsl(262 80% 65% / 0.08))' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="badge-premium mb-3 w-fit">{b.categoria}</div>
              <h1 className="text-2xl font-bold text-foreground mb-1">{b.titulo}</h1>
              <p className="text-muted-foreground text-sm">{b.descripcionGeneral}</p>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg font-bold text-primary">{b.numero}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {b.createdAt ? new Date(b.createdAt).toLocaleDateString('es-AR', {
                  day: '2-digit', month: 'long', year: 'numeric'
                }) : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-0 border-b border-border">
          <div className="px-8 py-5 border-r border-border">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wide mb-3">
              <User className="w-3.5 h-3.5" />
              Cliente
            </div>
            <div className="font-semibold text-foreground">{b.cliente.nombre}</div>
            {b.cliente.empresa && <div className="text-sm text-muted-foreground">{b.cliente.empresa}</div>}
            {b.cliente.email && <div className="text-xs text-muted-foreground">{b.cliente.email}</div>}
            {b.cliente.cuit && <div className="text-xs text-muted-foreground">CUIT: {b.cliente.cuit}</div>}
          </div>
          <div className="px-8 py-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wide mb-3">
              <Building2 className="w-3.5 h-3.5" />
              Condiciones
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex gap-2">
                <span className="text-muted-foreground">Validez:</span>
                <span className="text-foreground font-medium">{b.condiciones.validezDias} días</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">Pago:</span>
                <span className="text-foreground font-medium">{b.condiciones.formaPago}</span>
              </div>
              {b.condiciones.notas && (
                <div className="text-xs text-muted-foreground mt-1">{b.condiciones.notas}</div>
              )}
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

          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 rounded-lg mb-1"
            style={{ background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 80% 65%))' }}>
            <div className="col-span-5 text-xs font-semibold text-white uppercase tracking-wide">Descripción</div>
            <div className="col-span-2 text-xs font-semibold text-white uppercase tracking-wide">Unidad</div>
            <div className="col-span-1 text-xs font-semibold text-white uppercase tracking-wide text-right">Cant.</div>
            <div className="col-span-2 text-xs font-semibold text-white uppercase tracking-wide text-right">P. Unit.</div>
            <div className="col-span-2 text-xs font-semibold text-white uppercase tracking-wide text-right">Total</div>
          </div>

          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-2">
              <div className="px-4 py-1.5 text-xs font-semibold text-primary uppercase tracking-wide"
                style={{ background: 'hsl(239 84% 67% / 0.07)' }}>
                {category}
              </div>
              {items.map(item => (
                <EditableItemRow key={item.id} item={item} fmt={fmt} onUpdate={updateBudgetItem} />
              ))}
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
                <span className="text-muted-foreground">IVA ({Math.round(b.totales.tasaImpuesto * 100)}%)</span>
                <span className="font-mono font-medium text-foreground">{fmt(b.totales.impuestos)}</span>
              </div>
              <div
                className="flex justify-between items-center px-4 py-3 rounded-xl mt-3"
                style={{ background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 80% 65%))' }}
              >
                <span className="text-white font-bold">TOTAL</span>
                <span className="font-mono text-xl font-bold text-white">{fmt(b.totales.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New budget button */}
      <div className="text-center">
        <button
          onClick={reset}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
        >
          Generar nuevo presupuesto
        </button>
      </div>
    </div>
  );
}

// Inline editable item row
function EditableItemRow({
  item,
  fmt,
  onUpdate,
}: {
  item: BudgetItem;
  fmt: (n: number) => string;
  onUpdate: (id: string, updates: Partial<BudgetItem>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(item);

  // Sync with store updates when not actively editing
  useEffect(() => {
    if (!editing) setEditData(item);
  }, [item, editing]);

  function saveEdit() {
    onUpdate(item.id, editData);
    setEditing(false);
  }

  function cancelEdit() {
    setEditData(item);
    setEditing(false);
  }

  return (
    <div className="group grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/50 hover:bg-secondary/30 transition-colors items-start">
      {editing ? (
        <>
          <div className="col-span-5">
            <input
              className="w-full px-2 py-1 rounded bg-secondary border border-primary/30 text-xs text-foreground focus:outline-none"
              value={editData.titulo}
              onChange={e => setEditData(d => ({ ...d, titulo: e.target.value }))}
            />
            <textarea
              className="w-full px-2 py-1 rounded bg-secondary border border-border text-xs text-muted-foreground focus:outline-none mt-1 resize-none"
              rows={2}
              value={editData.descripcion}
              onChange={e => setEditData(d => ({ ...d, descripcion: e.target.value }))}
            />
          </div>
          <div className="col-span-2">
            <input
              className="w-full px-2 py-1 rounded bg-secondary border border-border text-xs text-foreground focus:outline-none"
              value={editData.unidad}
              onChange={e => setEditData(d => ({ ...d, unidad: e.target.value }))}
            />
          </div>
          <div className="col-span-1">
            <input
              type="number"
              className="w-full px-2 py-1 rounded bg-secondary border border-border text-xs text-foreground focus:outline-none text-right"
              value={editData.cantidad}
              onChange={e => setEditData(d => ({ ...d, cantidad: Number(e.target.value) }))}
            />
          </div>
          <div className="col-span-2">
            <input
              type="number"
              className="w-full px-2 py-1 rounded bg-secondary border border-border text-xs text-foreground focus:outline-none text-right"
              value={editData.precioUnitario}
              onChange={e => setEditData(d => ({ ...d, precioUnitario: Number(e.target.value) }))}
            />
          </div>
          <div className="col-span-2 flex items-center justify-end gap-1">
            <button onClick={saveEdit} className="p-1 rounded text-emerald-400 hover:bg-emerald-400/10">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={cancelEdit} className="p-1 rounded text-muted-foreground hover:bg-secondary">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="col-span-5">
            <div className="text-sm font-medium text-foreground">{item.titulo}</div>
            <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.descripcion}</div>
            {item.observaciones && (
              <div className="text-[10px] text-primary mt-1 italic">* {item.observaciones}</div>
            )}
          </div>
          <div className="col-span-2 text-xs text-muted-foreground">{item.unidad}</div>
          <div className="col-span-1 text-xs text-right font-mono text-foreground">{item.cantidad}</div>
          <div className="col-span-2 text-xs text-right font-mono text-foreground">{fmt(item.precioUnitario)}</div>
          <div className="col-span-2 flex items-center justify-end gap-1">
            <span className="text-xs font-mono font-semibold text-foreground">{fmt(item.precioTotal)}</span>
            <button
              onClick={() => setEditing(true)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all ml-1"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

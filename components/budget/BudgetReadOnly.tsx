'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/ai/stages/validator';
import { FileText, User, Package, Clock, CreditCard, Download, FileCode } from 'lucide-react';
import type { BudgetData, BudgetItem } from '@/types/budget';

/**
 * F7: Read-only budget preview for public sharing.
 * No edit capabilities, no auth required.
 */
interface BudgetReadOnlyProps {
  budget: BudgetData;
  budgetId?: string;
  expiresAt?: string;
}

export default function BudgetReadOnly({ budget, budgetId, expiresAt }: BudgetReadOnlyProps) {
  const [downloading, setDownloading] = useState<'pdf' | 'html' | null>(null);

  async function handleExport(format: 'pdf' | 'html') {
    if (!budgetId) return;
    setDownloading(format);
    try {
      const res = await fetch(`/api/share/${budgetId}/export?format=${format}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const ext = format === 'pdf' ? 'pdf' : 'html';
      const filename = `presupuesto-${budget.numero || budget.titulo || 'export'}.${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error descargando presupuesto:', err);
    } finally {
      setDownloading(null);
    }
  }
  const b = budget;
  const fmt = (n: number) => formatCurrency(n, b.totales.currency);
  const formatter = new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' });
  const dateStr = b.createdAt ? formatter.format(new Date(b.createdAt)) : '';

  // Group items by category
  const grouped = b.items.reduce<Record<string, BudgetItem[]>>((acc, item) => {
    const cat = item.categoria || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-surface-0 py-8 px-4">
      {/* Export toolbar */}
      {budgetId && (
        <div className="max-w-4xl mx-auto mb-4 flex justify-end gap-2">
          <button
            onClick={() => handleExport('html')}
            disabled={downloading !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all disabled:opacity-50"
          >
            <FileCode className="w-3.5 h-3.5" />
            {downloading === 'html' ? 'Descargando...' : 'Descargar HTML'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={downloading !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-primary/30 text-primary hover:bg-primary/10 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading === 'pdf' ? 'Descargando...' : 'Descargar PDF'}
          </button>
        </div>
      )}

      {/* Branding header */}
      <div className="max-w-4xl mx-auto mb-6 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 80% 65%))' }}
          >
            B
          </div>
          <span className="text-lg font-bold text-foreground">BudgetAI</span>
        </div>
        <p className="text-xs text-muted-foreground">Presupuesto generado con inteligencia artificial</p>
      </div>

      {/* Main card */}
      <div className="max-w-4xl mx-auto relative">
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
                <div className="font-mono text-lg font-bold text-primary">{b.numero || '—'}</div>
                {dateStr && (
                  <div className="text-xs text-muted-foreground mt-1">{dateStr}</div>
                )}
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
              <div className="space-y-1">
                <div className="font-semibold text-foreground">{b.cliente.nombre}</div>
                {b.cliente.empresa && <div className="text-sm text-muted-foreground">{b.cliente.empresa}</div>}
                {b.cliente.email && <div className="text-xs text-muted-foreground">{b.cliente.email}</div>}
                {b.cliente.cuit && <div className="text-xs text-muted-foreground font-mono">CUIT: {b.cliente.cuit}</div>}
              </div>
            </div>
            <div className="px-8 py-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wide mb-3">
                <Package className="w-3.5 h-3.5" />
                Condiciones
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Validez:</span>
                  <span className="text-foreground font-medium">{b.condiciones.validezDias} días</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
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
                        {item.imagenes && item.imagenes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.imagenes.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt={`Foto ${i + 1}`}
                                className="w-8 h-8 object-cover rounded border border-border/50 hover:scale-105 transition-transform cursor-pointer"
                                onClick={() => {
                                  const win = window.open();
                                  win?.document.write(`<img src="${img}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                                }}
                              />
                            ))}
                          </div>
                        )}
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

          {/* Watermark */}
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          >
            <span
              className="text-[120px] font-black uppercase tracking-widest whitespace-nowrap"
              style={{
                color: 'hsl(239 84% 67% / 0.03)',
                transform: 'rotate(-35deg)',
                userSelect: 'none',
              }}
            >
              BudgetAI
            </span>
          </div>

          {/* Totals */}
          <div className="px-8 py-6 border-t border-border relative">
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

        {/* Footer branding */}
        <div className="text-center mt-6 text-xs text-muted-foreground">
          <p>Generado con <span className="font-semibold text-primary">BudgetAI</span></p>
        </div>

        {/* Expiration notice */}
        {expiresAt && (
          <div className="mt-3 text-center text-[10px] text-muted-foreground/60">
            Este enlace vence el {new Date(expiresAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        )}
      </div>
    </div>
  );
}

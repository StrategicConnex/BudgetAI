'use client';

import { useState, useEffect } from 'react';
import { useBudgetStore } from '@/store/budget.store';
import { useExport } from '@/hooks/useExport';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/ai/stages/validator';
import {
  FileDown, FileText, FileCode, ArrowLeft,
  Pencil, Check, X, User, Package, Plus, Copy,
  Eye, Printer, Download
} from 'lucide-react';
import { toast } from 'sonner';
import ShareBudgetButton from '@/components/budget/ShareBudgetButton';
import VersionHistory from '@/components/budget/VersionHistory';
import { saveBudgetVersion } from '@/lib/save-version';
import type { BudgetItem, BudgetData, BudgetCliente, BudgetCondiciones } from '@/types/budget';

// ── Form types (replacing any) ────────────────────────
interface HeaderForm {
  titulo: string;
  descripcionGeneral: string;
  categoria: string;
  numero: string;
}

interface ClientForm {
  nombre: string;
  empresa: string;
  email: string;
  cuit: string;
}

interface ConditionsForm {
  validezDias: number;
  formaPago: string;
  notas: string;
}

function copyBudgetSummary(budget: BudgetData): string {
  const fmt = (n: number) => formatCurrency(n, budget.totales.currency);
  const lines = [
    `📋 ${budget.titulo}`,
    `N° ${budget.numero || '—'}  •  ${budget.categoria}`,
    `\n👤 Cliente: ${budget.cliente.nombre}${budget.cliente.empresa ? ` (${budget.cliente.empresa})` : ''}`,
    `\n📝 ${budget.descripcionGeneral}`,
    '\n━━━ DETALLE ━━━',
    ...budget.items.map(item => `• ${item.titulo}: ${fmt(item.precioTotal)}`),
    '\n━━━━━━━━━━━━━━',
    `💰 TOTAL: ${fmt(budget.totales.total)}`,
    `\n📅 Validez: ${budget.condiciones.validezDias} días`,
    `💳 Pago: ${budget.condiciones.formaPago}`,
  ];
  if (budget.condiciones.notas) lines.push(`📌 ${budget.condiciones.notas}`);
  return lines.join('\n');
}

export default function BudgetPreview() {
  const {
    budget, budgetId, currency,
    setCurrentStep, updateBudgetItem,
    updateBudgetGeneral, updateBudgetCliente, updateBudgetCondiciones,
    addBudgetItem, deleteBudgetItem,
    reset,
  } = useBudgetStore();

  const {
    isExportingPDF, isExportingDOCX, isExportingHTML,
    exportError,
    exportPDF, exportDOCX, exportHTML,
  } = useExport({
    budget,
    onSuccess: () => setCurrentStep('exported'),
  });

  if (!budget) return null;

  const b = budget;
  const fmt = (n: number) => formatCurrency(n, b.totales.currency);

  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // ── Edit state ─────────────────────────────────
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState({
    titulo: b.titulo,
    descripcionGeneral: b.descripcionGeneral,
    categoria: b.categoria,
    numero: b.numero || '',
  });

  const [editingClient, setEditingClient] = useState(false);
  const [clientForm, setClientForm] = useState({
    nombre: b.cliente.nombre,
    empresa: b.cliente.empresa || '',
    email: b.cliente.email || '',
    cuit: b.cliente.cuit || '',
  });

  const [editingConditions, setEditingConditions] = useState(false);
  const [conditionsForm, setConditionsForm] = useState({
    validezDias: b.condiciones.validezDias,
    formaPago: b.condiciones.formaPago,
    notas: b.condiciones.notas || '',
  });

  useEffect(() => {
    setHeaderForm({
      titulo: b.titulo,
      descripcionGeneral: b.descripcionGeneral,
      categoria: b.categoria,
      numero: b.numero || '',
    });
  }, [b.titulo, b.descripcionGeneral, b.categoria, b.numero]);

  useEffect(() => {
    setClientForm({
      nombre: b.cliente.nombre,
      empresa: b.cliente.empresa || '',
      email: b.cliente.email || '',
      cuit: b.cliente.cuit || '',
    });
  }, [b.cliente]);

  useEffect(() => {
    setConditionsForm({
      validezDias: b.condiciones.validezDias,
      formaPago: b.condiciones.formaPago,
      notas: b.condiciones.notas || '',
    });
  }, [b.condiciones]);

  // Group items
  const grouped = b.items.reduce<Record<string, BudgetItem[]>>((acc, item) => {
    const cat = item.categoria || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep('input')}>
          <ArrowLeft className="w-4 h-4" />
          Volver a editar
        </Button>
        <div className="flex items-center gap-3">
          {exportError && (
            <span className="text-xs text-destructive">{exportError}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={<Copy className="w-4 h-4" />}
            onClick={() => {
              navigator.clipboard.writeText(copyBudgetSummary(b));
              toast.success('Resumen copiado al portapapeles');
            }}
          >
            Copiar resumen
          </Button>
          <ShareBudgetButton
            budgetId={budgetId || undefined}
            budgetTitle={b.titulo}
            budgetData={b}
          />
          <Button
            variant="secondary"
            size="sm"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => setShowPreviewModal(true)}
          >
            Previsualizar
          </Button>
          <Button
            id="btn-export-docx"
            variant="secondary"
            size="sm"
            loading={isExportingDOCX}
            icon={<FileText className="w-4 h-4" />}
            onClick={exportDOCX}
          >
            Exportar Word
          </Button>
          <Button
            id="btn-export-html"
            variant="secondary"
            size="sm"
            loading={isExportingHTML}
            icon={<FileCode className="w-4 h-4" />}
            onClick={exportHTML}
          >
            Exportar HTML
          </Button>
          <Button
            id="btn-export-pdf"
            variant="gradient"
            size="sm"
            loading={isExportingPDF}
            icon={<FileDown className="w-4 h-4" />}
            onClick={exportPDF}
          >
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Version history */}
      {budgetId && (
        <VersionHistory
          budgetId={budgetId}
          onRestore={(snapshot) => {
            useBudgetStore.getState().setBudget(snapshot, budgetId);
            toast.success('Version restaurada');
          }}
        />
      )}

      {/* Budget preview card */}
      <Card padding="none" className="overflow-hidden">
        {/* ── HEADER ── */}
        <div
          className="group/header relative px-8 py-6 border-b border-border"
          style={{ background: 'linear-gradient(135deg, hsl(239 84% 67% / 0.08), hsl(262 80% 65% / 0.08))' }}
        >
          {editingHeader ? (
            <HeaderEditForm
              headerForm={headerForm}
              setHeaderForm={setHeaderForm}
              onSave={() => { updateBudgetGeneral(headerForm); if (budgetId) saveBudgetVersion(budgetId, useBudgetStore.getState().budget!, ['header']); setEditingHeader(false); }}
              onCancel={() => {
                setHeaderForm({ titulo: b.titulo, descripcionGeneral: b.descripcionGeneral, categoria: b.categoria, numero: b.numero || '' });
                setEditingHeader(false);
              }}
            />
          ) : (
            <HeaderDisplay
              budget={b}
              onEdit={() => setEditingHeader(true)}
            />
          )}
        </div>

        {/* ── PARTIES (Client + Conditions) ── */}
        <div className="grid grid-cols-2 gap-0 border-b border-border">
          {/* Client */}
          <div className="group/client relative px-8 py-5 border-r border-border">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wide mb-3">
              <User className="w-3.5 h-3.5" />
              Cliente
            </div>
            {editingClient ? (
              <ClientEditForm
                clientForm={clientForm}
                setClientForm={setClientForm}
                onSave={() => { updateBudgetCliente(clientForm); if (budgetId) saveBudgetVersion(budgetId, useBudgetStore.getState().budget!, ['cliente']); setEditingClient(false); }}
                onCancel={() => {
                  setClientForm({ nombre: b.cliente.nombre, empresa: b.cliente.empresa || '', email: b.cliente.email || '', cuit: b.cliente.cuit || '' });
                  setEditingClient(false);
                }}
              />
            ) : (
              <ClientDisplay cliente={b.cliente} onEdit={() => setEditingClient(true)} />
            )}
          </div>

          {/* Conditions */}
          <div className="group/conditions relative px-8 py-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wide mb-3">
              <Package className="w-3.5 h-3.5" />
              Condiciones
            </div>
            {editingConditions ? (
              <ConditionsEditForm
                conditionsForm={conditionsForm}
                setConditionsForm={setConditionsForm}
                onSave={() => { updateBudgetCondiciones(conditionsForm); if (budgetId) saveBudgetVersion(budgetId, useBudgetStore.getState().budget!, ['condiciones']); setEditingConditions(false); }}
                onCancel={() => {
                  setConditionsForm({ validezDias: b.condiciones.validezDias, formaPago: b.condiciones.formaPago, notas: b.condiciones.notas || '' });
                  setEditingConditions(false);
                }}
              />
            ) : (
              <ConditionsDisplay condiciones={b.condiciones} onEdit={() => setEditingConditions(true)} />
            )}
          </div>
        </div>

        {/* ── ITEMS ── */}
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
                  <EditableItemRow
                    key={item.id}
                    item={item}
                    fmt={fmt}
                    onUpdate={updateBudgetItem}
                    onDelete={(id) => { deleteBudgetItem(id); if (budgetId) saveBudgetVersion(budgetId, useBudgetStore.getState().budget!, ['items']); }}
                    budgetId={budgetId}
                  />
                ))}
              </div>
              <div className="flex justify-end mt-2 px-4">
                <Button variant="ghost" size="sm" onClick={() => { addBudgetItem(category); if (budgetId) saveBudgetVersion(budgetId, useBudgetStore.getState().budget!, ['items']); }}>
                  <Plus className="w-3.5 h-3.5" />
                  Agregar trabajo
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* ── TOTALS ── */}
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
                className="flex justify-between items-center px-4 py-3 rounded-xl mt-3 text-white font-bold"
                style={{ background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 80% 65%))' }}
              >
                <span>TOTAL</span>
                <span className="font-mono text-xl">{fmt(b.totales.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* New budget */}
      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={reset}>
          Generar nuevo presupuesto
        </Button>
      </div>

      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Vista Previa del Documento</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Printer className="w-4 h-4" />}
                  onClick={() => {
                    const printContents = document.getElementById('printable-budget-preview')?.innerHTML;
                    if (printContents) {
                      const printWindow = window.open('', '_blank');
                      printWindow?.document.write(`
                        <html>
                          <head>
                            <title>Presupuesto - ${b.titulo}</title>
                            <style>
                              body { font-family: system-ui, sans-serif; color: #111827; padding: 40px; background: #fff; }
                              .border-b { border-bottom: 1px solid #e5e7eb; }
                              .border-r { border-right: 1px solid #e5e7eb; }
                              .text-right { text-align: right; }
                              .grid { display: grid; }
                              .grid-cols-2 { grid-template-columns: 1fr 1fr; }
                              .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
                              .col-span-5 { grid-column: span 5 / span 5; }
                              .col-span-2 { grid-column: span 2 / span 2; }
                              .col-span-1 { grid-column: span 1 / span 1; }
                              .font-mono { font-family: monospace; }
                              .font-bold { font-weight: bold; }
                              .text-sm { font-size: 14px; }
                              .text-xs { font-size: 12px; }
                              .text-xl { font-size: 20px; }
                              .mb-4 { margin-bottom: 16px; }
                              .py-2 { padding-top: 8px; padding-bottom: 8px; }
                              .px-4 { padding-left: 16px; padding-right: 16px; }
                              .rounded-lg { border-radius: 8px; }
                              .text-white { color: #fff; }
                              .bg-primary { background-color: #4f46e5; }
                              .text-primary { color: #4f46e5; }
                              .text-muted { color: #6b7280; }
                              .mt-4 { margin-top: 16px; }
                              .flex { display: flex; }
                              .justify-between { justify-content: space-between; }
                              .justify-end { justify-content: flex-end; }
                              .w-72 { width: 288px; }
                              .space-y-2 > * + * { margin-top: 8px; }
                              .gap-2 { gap: 8px; }
                              .gap-4 { gap: 16px; }
                              .thumbnail-gallery { display: flex; gap: 8px; margin-top: 8px; }
                              .thumbnail { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #d1d5db; }
                            </style>
                          </head>
                          <body>
                            ${printContents}
                          </body>
                        </html>
                      `);
                      printWindow?.document.close();
                      printWindow?.focus();
                      printWindow?.print();
                    }
                  }}
                >
                  Imprimir
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<X className="w-4 h-4" />}
                  onClick={() => setShowPreviewModal(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>

            {/* Modal Body / Sheet View */}
            <div className="flex-1 overflow-y-auto p-6 bg-secondary/10 flex justify-center">
              <div
                id="printable-budget-preview"
                className="w-full max-w-3xl bg-card border border-border rounded-xl shadow-lg p-8 md:p-12 relative text-foreground"
              >
                {/* Header Letterhead */}
                <div className="flex justify-between items-start pb-6 border-b border-border">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">{b.categoria}</span>
                    <h2 className="text-xl font-bold text-foreground mt-3">{b.titulo}</h2>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">{b.descripcionGeneral}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-primary font-mono">{b.numero || 'Nº —'}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-8 py-6 border-b border-border text-xs">
                  <div>
                    <h4 className="font-bold text-primary uppercase tracking-wider mb-2 text-[9px]">Cliente</h4>
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground">{b.cliente.nombre}</div>
                      {b.cliente.empresa && <div className="text-muted-foreground">{b.cliente.empresa}</div>}
                      {b.cliente.email && <div className="text-muted-foreground">{b.cliente.email}</div>}
                      {b.cliente.cuit && <div className="text-muted-foreground font-mono">CUIT: {b.cliente.cuit}</div>}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-primary uppercase tracking-wider mb-2 text-[9px]">Condiciones</h4>
                    <div className="space-y-1">
                      <div><span className="text-muted-foreground">Validez de oferta:</span> <span className="font-medium text-foreground">{b.condiciones.validezDias} días</span></div>
                      <div><span className="text-muted-foreground">Forma de pago:</span> <span className="font-medium text-foreground">{b.condiciones.formaPago}</span></div>
                      {b.condiciones.notas && <div className="text-muted-foreground/80 mt-1 italic">"{b.condiciones.notas}"</div>}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="py-6">
                  <h4 className="font-bold text-foreground uppercase tracking-wider mb-4 text-[10px]">Detalle de Trabajos</h4>
                  
                  {/* Table headers */}
                  <div className="grid grid-cols-12 gap-2 pb-2 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                    <span className="col-span-5">Descripción</span>
                    <span className="col-span-2">Unidad</span>
                    <span className="col-span-1 text-right">Cant.</span>
                    <span className="col-span-2 text-right">P. Unit</span>
                    <span className="col-span-2 text-right">Total</span>
                  </div>

                  {/* List grouped */}
                  <div className="divide-y divide-border/30">
                    {Object.entries(grouped).map(([category, items]) => (
                      <div key={category} className="py-2">
                        <div className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/5 py-1 px-3 rounded mb-1">{category}</div>
                        {items.map(item => (
                          <div key={item.id} className="grid grid-cols-12 gap-2 py-3 text-xs">
                            <div className="col-span-5 space-y-1">
                              <div className="font-semibold text-foreground">{item.titulo}</div>
                              <div className="text-[11px] text-muted-foreground leading-relaxed">{item.descripcion}</div>
                              {/* Item images */}
                              {item.imagenes && item.imagenes.length > 0 && (
                                <div className="thumbnail-gallery flex flex-wrap gap-1.5 mt-2">
                                  {item.imagenes.map((img, i) => (
                                    <img
                                      key={i}
                                      src={img}
                                      alt={`Imágen ${i+1}`}
                                      className="thumbnail w-12 h-12 object-cover rounded border border-border/50"
                                    />
                                  ))}
                                </div>
                              )}
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
                </div>

                {/* Totals */}
                <div className="pt-6 border-t border-border flex justify-end">
                  <div className="w-64 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-mono font-medium text-foreground">{fmt(b.totales.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IVA ({Math.round(b.totales.tasaImpuesto * 100)}%)</span>
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

// ── Sub-components ──────────────────────────────────────

function HeaderDisplay({ budget, onEdit }: { budget: BudgetData; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1 pr-12">
        <Badge variant="premium" className="mb-3">{budget.categoria}</Badge>
        <h1 className="text-2xl font-bold text-foreground mb-1">{budget.titulo}</h1>
        <p className="text-muted-foreground text-sm">{budget.descripcionGeneral}</p>
      </div>
      <div className="text-right flex flex-col items-end">
        <div className="font-mono text-lg font-bold text-primary">{budget.numero}</div>
        {budget.createdAt && (
          <div className="text-xs text-muted-foreground mt-1">
            {new Date(budget.createdAt).toLocaleDateString('es-AR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </div>
        )}
      </div>
      <button
        onClick={onEdit}
        className="absolute top-4 right-4 opacity-0 group-hover/header:opacity-100 p-2 rounded-lg bg-secondary/80 border border-border text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
        title="Editar cabecera"
      >
        <Pencil className="w-4 h-4" />
      </button>
    </div>
  );
}

function HeaderEditForm({
  headerForm, setHeaderForm, onSave, onCancel,
}: {
  headerForm: HeaderForm;
  setHeaderForm: React.Dispatch<React.SetStateAction<HeaderForm>>;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="w-1/2">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Categoría</label>
          <input className="w-full px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50" value={headerForm.categoria} onChange={e => setHeaderForm(f => ({ ...f, categoria: e.target.value }))} />
        </div>
        <div className="w-1/2">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Nº Presupuesto</label>
          <input className="w-full px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 font-mono" value={headerForm.numero} onChange={e => setHeaderForm(f => ({ ...f, numero: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Título</label>
        <input className="w-full px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 font-bold" value={headerForm.titulo} onChange={e => setHeaderForm(f => ({ ...f, titulo: e.target.value }))} />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Descripción</label>
        <textarea className="w-full px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" rows={2} value={headerForm.descripcionGeneral} onChange={e => setHeaderForm(f => ({ ...f, descripcionGeneral: e.target.value }))} />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold border border-emerald-500/30 transition-all cursor-pointer">
          <Check className="w-3.5 h-3.5" /> Guardar
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-lg text-xs font-semibold border border-border transition-all cursor-pointer">
          <X className="w-3.5 h-3.5" /> Cancelar
        </button>
      </div>
    </div>
  );
}

function ClientDisplay({ cliente, onEdit }: { cliente: BudgetCliente; onEdit: () => void }) {
  return (
    <>
      <div className="font-semibold text-foreground">{cliente.nombre}</div>
      {cliente.empresa && <div className="text-sm text-muted-foreground">{cliente.empresa}</div>}
      {cliente.email && <div className="text-xs text-muted-foreground">{cliente.email}</div>}
      {cliente.cuit && <div className="text-xs text-muted-foreground font-mono">CUIT: {cliente.cuit}</div>}
      <button onClick={onEdit} className="absolute top-4 right-4 opacity-0 group-hover/client:opacity-100 p-1.5 rounded bg-secondary/80 border border-border text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer" title="Editar cliente">
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </>
  );
}

function ClientEditForm({
  clientForm, setClientForm, onSave, onCancel,
}: {
  clientForm: ClientForm;
  setClientForm: React.Dispatch<React.SetStateAction<ClientForm>>;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3 animate-fade-in">
      <div>
        <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold block mb-0.5">Nombre</label>
        <input className="w-full px-2 py-1 rounded bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary/50" value={clientForm.nombre} onChange={e => setClientForm(f => ({ ...f, nombre: e.target.value }))} />
      </div>
      <div>
        <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold block mb-0.5">Empresa</label>
        <input className="w-full px-2 py-1 rounded bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary/50" value={clientForm.empresa} onChange={e => setClientForm(f => ({ ...f, empresa: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold block mb-0.5">Email</label>
          <input className="w-full px-2 py-1 rounded bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary/50" value={clientForm.email} onChange={e => setClientForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold block mb-0.5">CUIT</label>
          <input className="w-full px-2 py-1 rounded bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary/50 font-mono" value={clientForm.cuit} onChange={e => setClientForm(f => ({ ...f, cuit: e.target.value }))} />
        </div>
      </div>
      <div className="flex justify-end gap-1 pt-1">
        <button onClick={onSave} className="p-1 rounded text-emerald-400 hover:bg-emerald-400/10 cursor-pointer"><Check className="w-3.5 h-3.5" /></button>
        <button onClick={onCancel} className="p-1 rounded text-muted-foreground hover:bg-secondary cursor-pointer"><X className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

function ConditionsDisplay({ condiciones, onEdit }: { condiciones: BudgetCondiciones; onEdit: () => void }) {
  return (
    <>
      <div className="space-y-1 text-sm">
        <div className="flex gap-2">
          <span className="text-muted-foreground">Validez:</span>
          <span className="text-foreground font-medium">{condiciones.validezDias} días</span>
        </div>
        <div className="flex gap-2">
          <span className="text-muted-foreground">Pago:</span>
          <span className="text-foreground font-medium">{condiciones.formaPago}</span>
        </div>
        {condiciones.notas && (
          <div className="text-xs text-muted-foreground mt-1">{condiciones.notas}</div>
        )}
      </div>
      <button onClick={onEdit} className="absolute top-4 right-4 opacity-0 group-hover/conditions:opacity-100 p-1.5 rounded bg-secondary/80 border border-border text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer" title="Editar condiciones">
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </>
  );
}

function ConditionsEditForm({
  conditionsForm, setConditionsForm, onSave, onCancel,
}: {
  conditionsForm: ConditionsForm;
  setConditionsForm: React.Dispatch<React.SetStateAction<ConditionsForm>>;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold block mb-0.5">Validez (días)</label>
          <input type="number" className="w-full px-2 py-1 rounded bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary/50" value={conditionsForm.validezDias} onChange={e => setConditionsForm(f => ({ ...f, validezDias: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold block mb-0.5">Forma de Pago</label>
          <input className="w-full px-2 py-1 rounded bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary/50" value={conditionsForm.formaPago} onChange={e => setConditionsForm(f => ({ ...f, formaPago: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold block mb-0.5">Notas</label>
        <textarea className="w-full px-2 py-1 rounded bg-secondary border border-border text-xs text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" rows={2} value={conditionsForm.notas} onChange={e => setConditionsForm(f => ({ ...f, notas: e.target.value }))} />
      </div>
      <div className="flex justify-end gap-1 pt-1">
        <button onClick={onSave} className="p-1 rounded text-emerald-400 hover:bg-emerald-400/10 cursor-pointer"><Check className="w-3.5 h-3.5" /></button>
        <button onClick={onCancel} className="p-1 rounded text-muted-foreground hover:bg-secondary cursor-pointer"><X className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

// ── Inline editable item row ─────────────────────────────
function EditableItemRow({
  item, fmt, onUpdate, onDelete, budgetId,
}: {
  item: BudgetItem;
  fmt: (n: number) => string;
  onUpdate: (id: string, updates: Partial<BudgetItem>) => void;
  onDelete: (id: string) => void;
  budgetId?: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(item);

  useEffect(() => {
    if (!editing) setEditData(item);
  }, [item, editing]);

  function saveEdit() {
    onUpdate(item.id, editData);
    if (budgetId) saveBudgetVersion(budgetId, useBudgetStore.getState().budget!, ['items']);
    setEditing(false);
  }

  return (
    <div className="group grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/50 hover:bg-secondary/30 transition-colors items-start">
      {editing ? (
        <>
          <div className="col-span-5">
            <input className="w-full px-2 py-1 rounded bg-secondary border border-primary/30 text-xs text-foreground focus:outline-none" value={editData.titulo} onChange={e => setEditData(d => ({ ...d, titulo: e.target.value }))} />
            <textarea className="w-full px-2 py-1 rounded bg-secondary border border-border text-xs text-muted-foreground focus:outline-none mt-1 resize-none" rows={2} value={editData.descripcion} onChange={e => setEditData(d => ({ ...d, descripcion: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <input className="w-full px-2 py-1 rounded bg-secondary border border-border text-xs text-foreground focus:outline-none" value={editData.unidad} onChange={e => setEditData(d => ({ ...d, unidad: e.target.value }))} />
          </div>
          <div className="col-span-1">
            <input type="number" className="w-full px-2 py-1 rounded bg-secondary border border-border text-xs text-foreground focus:outline-none text-right" value={editData.cantidad} onChange={e => setEditData(d => ({ ...d, cantidad: Number(e.target.value) }))} />
          </div>
          <div className="col-span-2">
            <input type="number" className="w-full px-2 py-1 rounded bg-secondary border border-border text-xs text-foreground focus:outline-none text-right" value={editData.precioUnitario} onChange={e => setEditData(d => ({ ...d, precioUnitario: Number(e.target.value) }))} />
          </div>
          <div className="col-span-2 flex items-center justify-end gap-1">
            <button onClick={saveEdit} className="p-1 rounded text-emerald-400 hover:bg-emerald-400/10 cursor-pointer"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => { setEditData(item); setEditing(false); }} className="p-1 rounded text-muted-foreground hover:bg-secondary cursor-pointer"><X className="w-3.5 h-3.5" /></button>
          </div>
        </>
      ) : (
        <>
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
          <div className="col-span-2 flex items-center justify-end gap-1">
            <span className="text-xs font-mono font-semibold text-foreground">{fmt(item.precioTotal)}</span>
            <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all ml-1 cursor-pointer"><Pencil className="w-3 h-3" /></button>
            <button onClick={() => onDelete(item.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
          </div>
        </>
      )}
    </div>
  );
}

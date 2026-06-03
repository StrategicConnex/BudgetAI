'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Sparkles, FileDown, FileCode, Trash2, Calendar, ArrowUpDown, ArrowUp, ArrowDown, CheckSquare, Square, Download, AlertTriangle, LayoutGrid, Table, Pencil, Check, X } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import FilterBar from '@/components/ui/FilterBar';
import DuplicateBudgetButton from '@/components/budget/DuplicateBudgetButton';
import { toast } from 'sonner';
import type { BudgetFilter } from '@/components/ui/FilterBar';
import type { BudgetData } from '@/types/budget';

interface BudgetRow {
  id: string;
  title: string;
  status: string;
  created_at: string;
  ai_output: BudgetData | null;
}

interface BudgetsListClientProps {
  budgets: BudgetRow[];
}

export default function BudgetsListClient({ budgets }: BudgetsListClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<BudgetFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [isBatchExporting, setIsBatchExporting] = useState<'pdf' | 'html' | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: budgets.length };
    for (const b of budgets) {
      const key = b.status === 'ready' || b.status === 'exported' ? b.status : 'draft';
      result[key] = (result[key] || 0) + 1;
    }
    return result;
  }, [budgets]);

  const { filtered, sorted } = useMemo(() => {
    const f = budgets.filter(b => {
      if (filter !== 'all') {
        if (filter === 'draft' && !['ready', 'exported'].includes(b.status)) {
          // pass
        } else if (b.status !== filter) {
          return false;
        }
      }
      if (search) {
        const q = search.toLowerCase();
        const title = (b.title || '').toLowerCase();
        const cliente = b.ai_output?.cliente?.nombre?.toLowerCase() || '';
        const categoria = b.ai_output?.categoria?.toLowerCase() || '';
        const numero = b.ai_output?.numero?.toLowerCase() || '';
        if (!title.includes(q) && !cliente.includes(q) && !categoria.includes(q) && !numero.includes(q)) {
          return false;
        }
      }
      // Date range filter
      if (dateFrom) {
        const created = new Date(b.created_at);
        const from = new Date(dateFrom + 'T00:00:00');
        if (created < from) return false;
      }
      if (dateTo) {
        const created = new Date(b.created_at);
        const to = new Date(dateTo + 'T23:59:59');
        if (created > to) return false;
      }
      return true;
    });

    const s = [...f].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'title') {
        cmp = (a.title || '').localeCompare(b.title || '', 'es', { sensitivity: 'base' });
      } else if (sortBy === 'amount') {
        const ta = a.ai_output?.totales?.total ?? 0;
        const tb = b.ai_output?.totales?.total ?? 0;
        cmp = ta - tb;
      }
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    return { filtered: f, sorted: s };
  }, [budgets, search, filter, dateFrom, dateTo, sortBy, sortOrder]);

  async function handleDelete(id: string) {
    if (!confirm('Eliminar este presupuesto permanentemente?')) return;
    setDeletingId(id);
    try {
      const res = await fetch('/api/budgets/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Error al eliminar');
      toast.success('Presupuesto eliminado');
      router.refresh();
    } catch {
      toast.error('Error al eliminar el presupuesto');
    } finally {
      setDeletingId(null);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === sorted.length && sorted.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sorted.map(b => b.id)));
    }
  }

  async function handleBatchExport(format: 'pdf' | 'html') {
    setIsBatchExporting(format);
    let success = 0;
    let failed = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch('/api/share/' + id + '/export?format=' + format);
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'presupuesto-' + id.slice(0, 8) + '.' + format;
        a.click();
        URL.revokeObjectURL(a.href);
        success++;
      } catch {
        failed++;
      }
    }
    setIsBatchExporting(null);
    if (success > 0) toast.success(success + ' presupuesto' + (success > 1 ? 's' : '') + ' exportado' + (success > 1 ? 's' : ''));
    if (failed > 0) toast.error(failed + ' presupuesto' + (failed > 1 ? 's' : '') + ' fallaron');
  }

  async function handleBatchDelete() {
    if (!confirm('Eliminar ' + selectedIds.size + ' presupuesto' + (selectedIds.size > 1 ? 's' : '') + ' permanentemente?')) return;
    setIsBatchDeleting(true);
    let success = 0;
    let failed = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch('/api/budgets/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error();
        success++;
      } catch {
        failed++;
      }
    }
    setIsBatchDeleting(false);
    if (success > 0) toast.success(success + ' presupuesto' + (success > 1 ? 's' : '') + ' eliminado' + (success > 1 ? 's' : ''));
    if (failed > 0) toast.error(failed + ' presupuesto' + (failed > 1 ? 's' : '') + ' fallaron');
    setSelectedIds(new Set());
    router.refresh();
  }

  async function handleInlineEdit(id: string, newTitle: string) {
    if (!newTitle.trim()) return;
    try {
      const budgetRow = budgets.find(b => b.id === id);
      if (!budgetRow?.ai_output) return;
      const updatedBudget = { ...budgetRow.ai_output, titulo: newTitle.trim() };
      const res = await fetch('/api/budgets/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, budget: updatedBudget }),
      });
      if (!res.ok) throw new Error();
      toast.success('Título actualizado');
      router.refresh();
    } catch {
      toast.error('Error al actualizar el título');
    }
  }

  function startEditing(id: string, currentTitle: string) {
    setEditingId(id);
    setEditingValue(currentTitle);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingValue('');
  }

  async function saveEditing(id: string) {
    await handleInlineEdit(id, editingValue);
    setEditingId(null);
    setEditingValue('');
  }

  async function handleQuickExport(id: string, format: 'pdf' | 'html') {
    try {
      const res = await fetch('/api/share/' + id + '/export?format=' + format);
      if (!res.ok) throw new Error('Error al exportar');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'presupuesto-' + id.slice(0, 8) + '.' + format;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(format.toUpperCase() + ' descargado');
    } catch {
      toast.error('Error al descargar ' + format.toUpperCase());
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Presupuestos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {budgets.length} presupuesto{budgets.length !== 1 ? 's' : ''} generado{budgets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/budgets/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 80% 65%))',
            boxShadow: '0 4px 20px hsl(239 84% 67% / 0.3)',
          }}
        >
          <Plus className="w-4 h-4" />
          Nuevo presupuesto
        </Link>
        {/* View toggle */}
        <div className="flex items-center gap-1 ml-3 p-0.5 rounded-lg border border-border bg-secondary/50">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'cards' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            title="Vista tarjetas"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            title="Vista tabla"
          >
            <Table className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por titulo, cliente, categoria..."
          className="flex-1 min-w-[200px]"
        />
        <FilterBar active={filter} onChange={setFilter} counts={counts} />
      </div>

      {/* Date range filter */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="date-from" className="text-muted-foreground text-xs">Desde</label>
          <input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>
        <span className="text-muted-foreground text-xs">—</span>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="date-to" className="text-muted-foreground text-xs">Hasta</label>
          <input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Limpiar fechas
          </button>
        )}
      </div>

      {/* Batch actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm animate-fade-in">
          <CheckSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => handleBatchExport('pdf')}
            disabled={isBatchExporting !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:text-primary hover:bg-primary/10 border border-border hover:border-primary/30 transition-all disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" />
            {isBatchExporting === 'pdf' ? 'Exportando...' : 'Exportar PDF'}
          </button>
          <button
            onClick={() => handleBatchExport('html')}
            disabled={isBatchExporting !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:text-primary hover:bg-primary/10 border border-border hover:border-primary/30 transition-all disabled:opacity-50"
          >
            <FileCode className="w-3.5 h-3.5" />
            {isBatchExporting === 'html' ? 'Exportando...' : 'Exportar HTML'}
          </button>
          <button
            onClick={handleBatchDelete}
            disabled={isBatchDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 border border-destructive/30 transition-all disabled:opacity-50"
          >
            {isBatchDeleting ? (
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            {isBatchDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Deseleccionar
          </button>
        </div>
      )}

      {/* Sort controls */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ordenar por</span>
        {(['date', 'title', 'amount'] as const).map(col => (
          <button
            key={col}
            onClick={() => {
              if (sortBy === col) {
                setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy(col);
                setSortOrder(col === 'date' ? 'desc' : 'asc');
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sortBy === col
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent'
            }`}
          >
            {col === 'date' ? 'Fecha' : col === 'title' ? 'Título' : 'Monto'}
            {sortBy === col ? (
              sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-40" />
            )}
          </button>
        ))}
        <div className="flex-1" />
        {sorted.length > 0 && (
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent transition-all"
          >
            {selectedIds.size === sorted.length ? (
              <><Square className="w-3.5 h-3.5" /> Deseleccionar todo</>
            ) : (
              <><CheckSquare className="w-3.5 h-3.5" /> Seleccionar todo</>
            )}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {search || filter !== 'all' ? 'Sin resultados' : 'Sin presupuestos todavia'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {search || filter !== 'all'
              ? 'No se encontraron presupuestos con los filtros aplicados.'
              : 'Crea tu primer presupuesto con inteligencia artificial'}
          </p>
          {!search && filter === 'all' && (
            <Link
              href="/dashboard/budgets/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium"
              style={{ background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 80% 65%))' }}
            >
              <Sparkles className="w-4 h-4" />
              Generar presupuesto
            </Link>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <BudgetsTableView
          budgets={sorted}
          selectedIds={selectedIds}
          toggleSelect={toggleSelect}
          handleQuickExport={handleQuickExport}
          handleDelete={handleDelete}
          deletingId={deletingId}
          editingId={editingId}
          editingValue={editingValue}
          startEditing={startEditing}
          cancelEditing={cancelEditing}
          saveEditing={saveEditing}
          onEditingValueChange={setEditingValue}
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((budget) => {
            const aiOutput = budget.ai_output;
            const total = aiOutput?.totales?.total;
            const currency = aiOutput?.totales?.currency || 'ARS';

            return (
              <div
                key={budget.id}
                className={`group relative glass-card p-5 transition-all duration-150 ${
                  selectedIds.has(budget.id)
                    ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                    : 'hover:border-primary/20'
                }`}
              >
                <div className="flex items-center gap-5">
                  {/* Selection checkbox */}
                  <button
                    onClick={() => toggleSelect(budget.id)}
                    className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    title={selectedIds.has(budget.id) ? 'Deseleccionar' : 'Seleccionar'}
                  >
                    {selectedIds.has(budget.id) ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                  <Link
                    href={'/dashboard/budgets/' + budget.id}
                    className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/20 transition-colors"
                  >
                    <FileText className="w-6 h-6 text-primary" />
                  </Link>
                  <Link
                    href={'/dashboard/budgets/' + budget.id}
                    className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{budget.title}</h3>
                      <span className={'text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ' + (
                        budget.status === 'ready' || budget.status === 'exported'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-muted border-border text-muted-foreground'
                      )}>
                        {budget.status === 'ready' ? 'Listo' : budget.status === 'exported' ? 'Exportado' : budget.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{new Date(budget.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}</span>
                      {aiOutput?.categoria && <span> - {aiOutput.categoria}</span>}
                      {aiOutput?.cliente?.nombre && <span> - {aiOutput.cliente.nombre}</span>}
                    </div>
                  </Link>
                  {total !== undefined && (
                    <Link
                      href={'/dashboard/budgets/' + budget.id}
                      className="text-right flex-shrink-0 hover:opacity-80 transition-opacity"
                    >
                      <div className="font-mono font-bold text-foreground text-lg">
                        {new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-AR', {
                          style: 'currency', currency, maximumFractionDigits: 0,
                        }).format(total)}
                      </div>
                      <div className="text-xs text-muted-foreground">{currency}</div>
                    </Link>
                  )}
                  <div className="flex-shrink-0 flex items-center gap-1">
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleQuickExport(budget.id, 'pdf')}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Descargar PDF"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleQuickExport(budget.id, 'html')}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Descargar HTML"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {aiOutput && (
                      <DuplicateBudgetButton budget={aiOutput} />
                    )}
                    <button
                      onClick={() => handleDelete(budget.id)}
                      disabled={deletingId === budget.id}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Eliminar presupuesto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Table view ────────────────────────────────────────
interface BudgetsTableViewProps {
  budgets: BudgetRow[];
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  handleQuickExport: (id: string, format: 'pdf' | 'html') => void;
  handleDelete: (id: string) => void;
  deletingId: string | null;
  editingId: string | null;
  editingValue: string;
  startEditing: (id: string, title: string) => void;
  cancelEditing: () => void;
  saveEditing: (id: string) => void;
  onEditingValueChange: (value: string) => void;
}

function BudgetsTableView({
  budgets,
  selectedIds,
  toggleSelect,
  handleQuickExport,
  handleDelete,
  deletingId,
  editingId,
  editingValue,
  startEditing,
  cancelEditing,
  saveEditing,
  onEditingValueChange,
}: BudgetsTableViewProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card/80 backdrop-blur-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/30">
            <th className="w-10 px-3 py-3 text-left">
              <button
                onClick={() => {
                  if (selectedIds.size === budgets.length) {
                    budgets.forEach(b => {
                      if (selectedIds.has(b.id)) toggleSelect(b.id);
                    });
                  } else {
                    budgets.forEach(b => {
                      if (!selectedIds.has(b.id)) toggleSelect(b.id);
                    });
                  }
                }}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {selectedIds.size === budgets.length && budgets.length > 0 ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            </th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Título</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
            <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monto</th>
            <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
            <th className="w-28 px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {budgets.map(budget => {
            const aiOutput = budget.ai_output;
            const total = aiOutput?.totales?.total;
            const currency = aiOutput?.totales?.currency || 'ARS';
            const isSelected = selectedIds.has(budget.id);

            return (
              <tr
                key={budget.id}
                className={`group transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-secondary/20'}`}
              >
                {/* Checkbox */}
                <td className="px-3 py-3">
                  <button
                    onClick={() => toggleSelect(budget.id)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                </td>

                {/* Title - editável inline */}
                <td className="px-3 py-3">
                  {editingId === budget.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingValue}
                        onChange={e => onEditingValueChange(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEditing(budget.id);
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        className="flex-1 px-2 py-1 rounded border border-primary/40 bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                        autoFocus
                      />
                      <button
                        onClick={() => saveEditing(budget.id)}
                        className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        title="Guardar"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <Link
                      href={'/dashboard/budgets/' + budget.id}
                      className="group/title flex items-center gap-1.5"
                    >
                      <span className="font-medium text-foreground truncate max-w-[200px] block hover:text-primary transition-colors">
                        {budget.title}
                      </span>
                      <button
                        onClick={e => {
                          e.preventDefault();
                          startEditing(budget.id, budget.title);
                        }}
                        className="p-0.5 rounded text-muted-foreground opacity-0 group-hover/title:opacity-100 hover:text-primary transition-all"
                        title="Editar título"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </Link>
                  )}
                </td>

                {/* Client */}
                <td className="px-3 py-3 text-xs text-muted-foreground">
                  {aiOutput?.cliente?.nombre || '—'}
                </td>

                {/* Date */}
                <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(budget.created_at).toLocaleDateString('es-AR', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </td>

                {/* Amount */}
                <td className="px-3 py-3 text-right">
                  {total !== undefined ? (
                    <span className="font-mono font-semibold text-foreground text-xs">
                      {new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-AR', {
                        style: 'currency', currency, maximumFractionDigits: 0,
                      }).format(total)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-3 py-3 text-center">
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                    budget.status === 'ready' || budget.status === 'exported'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-muted border-border text-muted-foreground'
                  }`}>
                    {budget.status === 'ready' ? 'Listo' : budget.status === 'exported' ? 'Exportado' : budget.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    <button
                      onClick={() => handleQuickExport(budget.id, 'pdf')}
                      className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Descargar PDF"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleQuickExport(budget.id, 'html')}
                      className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Descargar HTML"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                    </button>
                    {aiOutput && (
                      <DuplicateBudgetButton budget={aiOutput} />
                    )}
                    <button
                      onClick={() => handleDelete(budget.id)}
                      disabled={deletingId === budget.id}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

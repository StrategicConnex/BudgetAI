'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Plus, LayoutDashboard, Settings, Sparkles, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CommandItem {
  id: string;
  label: string;
  icon: typeof Search;
  action: () => void;
  section: string;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const items: CommandItem[] = [
    { id: 'new', label: 'Nuevo presupuesto', icon: Plus, action: () => router.push('/dashboard/budgets/new'), section: 'Acciones' },
    { id: 'dash', label: 'Ir al Dashboard', icon: LayoutDashboard, action: () => router.push('/dashboard'), section: 'Navegar' },
    { id: 'budgets', label: 'Ver presupuestos', icon: FileText, action: () => router.push('/dashboard/budgets'), section: 'Navegar' },
    { id: 'generate', label: 'Generar con IA', icon: Sparkles, action: () => router.push('/dashboard/budgets/new'), section: 'Acciones' },
    { id: 'logout', label: 'Cerrar sesion', icon: LogOut, action: async () => { await supabase.auth.signOut(); router.push('/login'); }, section: 'Cuenta' },
  ];

  const filtered = query
    ? items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setOpen(prev => !prev);
    }
    if (e.key === 'Escape') setOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar comandos... (Cmd+K)"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {Object.entries(grouped).map(([section, sectionItems]) => (
            <div key={section} className="mb-2">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section}
              </div>
              {sectionItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => { item.action(); setOpen(false); setQuery(''); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Sin resultados para "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

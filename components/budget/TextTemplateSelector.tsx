'use client';

import { useState } from 'react';
import { Search, FileText, ChevronRight } from 'lucide-react';
import { getTemplatesByCategory, searchTemplates, type TextTemplate } from '@/lib/templates';

interface TextTemplateSelectorProps {
  onSelect: (description: string) => void;
  disabled?: boolean;
}

export default function TextTemplateSelector({ onSelect, disabled }: TextTemplateSelectorProps) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);

  const grouped = query ? { 'Resultados': searchTemplates(query) } : getTemplatesByCategory();
  const hasResults = Object.values(grouped).some(t => t.length > 0);

  return (
    <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        disabled={disabled}
      >
        <FileText className="w-4 h-4 text-primary" />
        <span>Usar plantilla de texto frecuente</span>
        <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-border">
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar plantilla..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto px-2 pb-2">
            {hasResults ? (
              Object.entries(grouped).map(([cat, templates]) => (
                templates.length > 0 && (
                  <div key={cat} className="mb-2">
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {cat}
                    </div>
                    {templates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { onSelect(t.description); setExpanded(false); setQuery(''); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all group"
                      >
                        <div className="font-medium text-foreground group-hover:text-primary">{t.label}</div>
                        <div className="text-muted-foreground mt-0.5 line-clamp-2">{t.description}</div>
                      </button>
                    ))}
                  </div>
                )
              ))
            ) : (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                No se encontraron plantillas
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

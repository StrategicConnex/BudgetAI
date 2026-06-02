'use client';

import { Badge } from '@/components/ui/Badge';

/**
 * F3: Filter bar with selectable badges for budget status.
 */
export type BudgetFilter = 'all' | 'ready' | 'exported' | 'draft';

interface FilterBarProps {
  active: BudgetFilter;
  onChange: (filter: BudgetFilter) => void;
  counts?: Partial<Record<BudgetFilter, number>>;
}

const FILTERS: Array<{ value: BudgetFilter; label: string; variant: 'default' | 'success' | 'primary' | 'warning' }> = [
  { value: 'all', label: 'Todos', variant: 'default' },
  { value: 'ready', label: 'Listos', variant: 'success' },
  { value: 'exported', label: 'Exportados', variant: 'primary' },
  { value: 'draft', label: 'Borradores', variant: 'warning' },
];

export default function FilterBar({ active, onChange, counts }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {FILTERS.map(f => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className="transition-all"
        >
          <Badge variant={active === f.value ? f.variant : 'default'} className="cursor-pointer hover:opacity-80">
            {f.label}
            {counts?.[f.value] !== undefined && (
              <span className="ml-1 opacity-70">{counts[f.value]}</span>
            )}
          </Badge>
        </button>
      ))}
    </div>
  );
}

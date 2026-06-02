'use client';

import { useState, useEffect } from 'react';
import { Settings, Building2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

/**
 * F5: Persistent company data settings.
 * Stores company info in localStorage so it auto-fills in new budgets.
 */
export interface CompanyData {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  cuit: string;
}

const STORAGE_KEY = 'budgetai-company-data';

export function getCompanyData(): CompanyData {
  if (typeof window === 'undefined') return getDefaultCompany();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...getDefaultCompany(), ...JSON.parse(stored) } : getDefaultCompany();
  } catch {
    return getDefaultCompany();
  }
}

export function saveCompanyData(data: CompanyData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getDefaultCompany(): CompanyData {
  return {
    nombre: 'Rubén Curruhuinca',
    email: 'rcurihuincaYPYoil@gmail.com',
    telefono: '299 410 7681',
    direccion: '',
    cuit: ''
  };
}

export default function CompanySettings({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<CompanyData>(getDefaultCompany);

  useEffect(() => { setData(getCompanyData()); }, []);

  function handleSave() {
    saveCompanyData(data);
    toast.success('Datos de empresa guardados');
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-all"
      >
        <Building2 className="w-3.5 h-3.5" />
        Configurar empresa
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Building2 className="w-4 h-4 text-primary" />
          Datos de mi empresa
        </div>
        <button onClick={() => setOpen(false)} className="p-1 rounded text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {([
          ['nombre', 'Nombre de la empresa'],
          ['email', 'Email'],
          ['telefono', 'Telefono'],
          ['direccion', 'Direccion'],
          ['cuit', 'CUIT'],
        ] as const).map(([key, label]) => (
          <div key={key} className={key === 'nombre' || key === 'direccion' ? 'col-span-2' : ''}>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-0.5">{label}</label>
            <input
              className="w-full px-2 py-1.5 rounded bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary/50"
              value={data[key]}
              onChange={e => setData(d => ({ ...d, [key]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-xs font-semibold border border-primary/30 transition-all"
        >
          <Save className="w-3.5 h-3.5" /> Guardar
        </button>
      </div>
    </div>
  );
}

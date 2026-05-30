'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  FileText,
  Plus,
  LogOut,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/budgets', icon: FileText, label: 'Presupuestos' },
  { href: '/dashboard/budgets/new', icon: Plus, label: 'Nuevo presupuesto' },
];

interface SidebarProps {
  userEmail: string;
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col border-r border-border bg-sidebar-background">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-base flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 80% 65%))' }}
          >
            B
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">BudgetAI</div>
            <div className="text-xs text-muted-foreground">AI Document Platform</div>
          </div>
        </div>
      </div>

      {/* Quick action */}
      <div className="px-4 pt-4">
        <Link
          href="/dashboard/budgets/new"
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 80% 65%))',
          }}
        >
          <Sparkles className="w-4 h-4" />
          Generar presupuesto
          <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pt-6 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-3">
          Menú
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-sm font-semibold flex-shrink-0">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-foreground truncate">{userEmail}</div>
            <div className="text-[10px] text-muted-foreground">Plan gratuito</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

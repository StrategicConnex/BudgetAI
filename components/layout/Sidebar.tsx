'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  FileText,
  Plus,
  LogOut,
  Sparkles,
  Menu,
  X,
  Search,
} from 'lucide-react';
import ThemeToggle from '@/components/dashboard/ThemeToggle';

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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  // Mobile hamburger button (rendered outside sidebar)
  const mobileToggle = (
    <button
      onClick={() => setMobileOpen(true)}
      className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card/90 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
      title="Menú"
    >
      <Menu className="w-5 h-5" />
    </button>
  );

  const sidebarContent = (
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
          <svg className="w-3.5 h-3.5 ml-auto opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
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
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all duration-150 ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Theme + Keyboard hint */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <ThemeToggle />
        <kbd className="text-[9px] text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded border border-border hidden lg:inline-flex items-center gap-1">
          <Search className="w-2.5 h-2.5" /> Ctrl+K
        </kbd>
      </div>

      {/* User */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-sm font-semibold flex-shrink-0">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-foreground truncate">{userEmail}</div>
            <div className="text-[10px] text-muted-foreground"> usuario</div>
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

  return (
    <>
      {mobileToggle}
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        {sidebarContent}
      </div>
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 animate-slide-in-left">
            <div className="relative">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-5 right-5 z-50 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

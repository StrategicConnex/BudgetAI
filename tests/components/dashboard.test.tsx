// @vitest-environment jsdom
// Dashboard component tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockUsePathname = vi.fn(() => '/dashboard');
vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname,
  useRouter: vi.fn(() => ({ push: mockPush, refresh: mockRefresh })),
}));

const mockSignOut = vi.fn().mockResolvedValue({ error: null });
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({ auth: { signOut: mockSignOut } })),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({ auth: { signOut: mockSignOut } })),
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: any) => React.createElement('div', { 'data-testid': 'card', className }, children),
  CardTitle: ({ children }: any) => React.createElement('div', { 'data-testid': 'card-title' }, children),
  CardHeader: ({ children }: any) => React.createElement('div', {}, children),
}));
vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, variant }: any) => React.createElement('span', { 'data-testid': 'badge', 'data-variant': variant }, children),
}));
vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: ({ className }: any) => React.createElement('div', { 'data-testid': 'skeleton', className }),
  default: ({ className }: any) => React.createElement('div', { 'data-testid': 'skeleton', className }),
}));
vi.mock('next/link', () => ({
  default: ({ children, href, className }: any) => React.createElement('a', { href, className, 'data-testid': 'nav-link' }, children),
}));
vi.mock('lucide-react', () => ({
  Brain: (p: any) => React.createElement('svg', { 'data-testid': 'icon-brain', ...p }),
  CreditCard: (p: any) => React.createElement('svg', { 'data-testid': 'icon-credit', ...p }),
  LayoutDashboard: (p: any) => React.createElement('svg', { 'data-testid': 'icon-layout', ...p }),
  FileText: (p: any) => React.createElement('svg', { 'data-testid': 'icon-file', ...p }),
  Plus: (p: any) => React.createElement('svg', { 'data-testid': 'icon-plus', ...p }),
  LogOut: (p: any) => React.createElement('svg', { 'data-testid': 'icon-logout', ...p }),
  Sparkles: (p: any) => React.createElement('svg', { 'data-testid': 'icon-sparkles', ...p }),
  Wifi: (p: any) => React.createElement('svg', { 'data-testid': 'icon-wifi', ...p }),
  BarChart3: (p: any) => React.createElement('svg', { 'data-testid': 'icon-chart', ...p }),
  AlertTriangle: (p: any) => React.createElement('svg', { 'data-testid': 'icon-alert', ...p }),
  RefreshCw: (p: any) => React.createElement('svg', { 'data-testid': 'icon-refresh', ...p }),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('Dashboard Components', () => {
  beforeEach(() => { vi.clearAllMocks(); mockFetch.mockReset(); mockUsePathname.mockReturnValue('/dashboard'); });

  describe('AIStatusCards', () => {
    it('loading state shows skeletons', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));
      const { default: AIStatusCards } = await import('@/components/dashboard/AIStatusCards');
      render(React.createElement(AIStatusCards));
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });

    it('renders data from fetch', async () => {
      const mockData = { success: true, credits: { usageUsd: 0.12, limitUsd: 5, remainingUsd: 4.88, usagePct: 2.4, isFreeTier: false, label: 'test', rateLimit: { requests: 10, interval: 'minute' } }, models: [{ key: 'a', id: 'b', label: 'Gemini', status: 'online' as const }, { key: 'c', id: 'd', label: 'Xiaomi', status: 'low_credits' as const }], checkedAt: new Date().toISOString() };
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve(mockData) });
      const { default: AIStatusCards } = await import('@/components/dashboard/AIStatusCards');
      render(React.createElement(AIStatusCards));
      await waitFor(() => expect(screen.getByText('Online')).toBeTruthy());
      expect(screen.getByText('$4.8800')).toBeTruthy();
      expect(screen.getByText('Sin cr\u00e9ditos')).toBeTruthy();
    });

    it('handles fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('err'));
      const { default: AIStatusCards } = await import('@/components/dashboard/AIStatusCards');
      render(React.createElement(AIStatusCards));
      await waitFor(() => expect(screen.getAllByTestId('card').length).toBe(3));
    });
  });

  describe('Sidebar', () => {
    it('renders branding', async () => {
      const { default: Sidebar } = await import('@/components/layout/Sidebar');
      render(React.createElement(Sidebar, { userEmail: 'test@test.com' }));
      expect(screen.getByText('BudgetAI')).toBeTruthy();
      expect(screen.getByText('AI Document Platform')).toBeTruthy();
    });

    it('renders nav items', async () => {
      const { default: Sidebar } = await import('@/components/layout/Sidebar');
      render(React.createElement(Sidebar, { userEmail: 'test@test.com' }));
      expect(screen.getByText('Dashboard')).toBeTruthy();
      expect(screen.getByText('Presupuestos')).toBeTruthy();
      expect(screen.getByText('Nuevo presupuesto')).toBeTruthy();
    });

    it('highlights active nav', async () => {
      mockUsePathname.mockReturnValue('/dashboard/budgets');
      const { default: Sidebar } = await import('@/components/layout/Sidebar');
      render(React.createElement(Sidebar, { userEmail: 'test@test.com' }));
      const links = screen.getAllByTestId('nav-link');
      const activeLink = links.find(x => x.textContent?.includes('Presupuestos'));
      expect(activeLink?.className).toContain('bg-primary');
    });

    it('quick action button', async () => {
      const { default: Sidebar } = await import('@/components/layout/Sidebar');
      render(React.createElement(Sidebar, { userEmail: 'test@test.com' }));
      expect(screen.getByText('Generar presupuesto')).toBeTruthy();
    });

    it('shows user info', async () => {
      const { default: Sidebar } = await import('@/components/layout/Sidebar');
      render(React.createElement(Sidebar, { userEmail: 'juan@test.com' }));
      expect(screen.getByText('juan@test.com')).toBeTruthy();
      expect(screen.getByText('J')).toBeTruthy();
      expect(screen.getByText('Plan gratuito')).toBeTruthy();
    });

    it('logout calls signOut and redirects', async () => {
      const { default: Sidebar } = await import('@/components/layout/Sidebar');
      render(React.createElement(Sidebar, { userEmail: 'test@test.com' }));
      fireEvent.click(screen.getByTitle('Cerrar sesi\u00f3n'));
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/login');
        expect(mockRefresh).toHaveBeenCalledTimes(1);
      });
    });

    it('nav links have correct hrefs', async () => {
      mockUsePathname.mockReturnValue('/dashboard');
      const { default: Sidebar } = await import('@/components/layout/Sidebar');
      render(React.createElement(Sidebar, { userEmail: 'test@test.com' }));
      const links = screen.getAllByTestId('nav-link');
      expect(links.length).toBeGreaterThanOrEqual(3);
      const dashboardLink = links.find(x => x.textContent?.includes('Dashboard'));
      expect(dashboardLink?.getAttribute('href')).toBe('/dashboard');
    });
  });
});

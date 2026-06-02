// @vitest-environment jsdom
// BudgetPreview component tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ── Mocks ──────────────────────────────────────────────
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard/budgets/new'),
  useRouter: vi.fn(() => ({ push: mockPush, refresh: mockRefresh })),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
  })),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  })),
}));

const mockSaveBudgetVersion = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/save-version', () => ({
  saveBudgetVersion: (...args: any[]) => mockSaveBudgetVersion(...args),
}));

vi.mock('@/hooks/useExport', () => ({
  useExport: vi.fn(() => ({
    isExportingPDF: false,
    isExportingDOCX: false,
    isExportingHTML: false,
    exportError: null,
    exportPDF: vi.fn(),
    exportDOCX: vi.fn(),
    exportHTML: vi.fn(),
  })),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

function createIconMock(name: string) {
  return (p: any) => React.createElement('svg', { 'data-testid': `icon-${name}`, ...p });
}
vi.mock('lucide-react', () => ({
  ArrowLeft: createIconMock('ArrowLeft'),
  FileDown: createIconMock('FileDown'),
  FileText: createIconMock('FileText'),
  FileCode: createIconMock('FileCode'),
  Pencil: createIconMock('Pencil'),
  Check: createIconMock('Check'),
  X: createIconMock('X'),
  User: createIconMock('User'),
  Package: createIconMock('Package'),
  Plus: createIconMock('Plus'),
  Copy: createIconMock('Copy'),
  History: createIconMock('History'),
  Trash2: createIconMock('Trash2'),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, className }: any) =>
    React.createElement('a', { href, className }, children),
}));

const mockShareBudgetButton = vi.fn(({ budgetId, budgetTitle }: any) =>
  React.createElement(
    'button',
    { 'data-testid': 'share-button', 'data-budget-id': budgetId || '' },
    `Share: ${budgetTitle}`
  )
);
vi.mock('@/components/budget/ShareBudgetButton', () => ({
  default: (props: any) => mockShareBudgetButton(props),
}));

const mockVersionHistory = vi.fn(({ budgetId }: any) =>
  React.createElement(
    'div',
    { 'data-testid': 'version-history', 'data-budget-id': budgetId },
    'Version History'
  )
);
vi.mock('@/components/budget/VersionHistory', () => ({
  default: (props: any) => mockVersionHistory(props),
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, variant, size, loading, id, className, ...props }: any) =>
    React.createElement(
      'button',
      {
        'data-testid': id || `btn-${variant || 'default'}`,
        onClick,
        disabled: loading,
        className,
        ...props,
      },
      loading ? 'Loading...' : children
    ),
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, className, padding }: any) =>
    React.createElement(
      'div',
      { 'data-testid': 'card', className, 'data-padding': padding },
      children
    ),
  CardHeader: ({ children }: any) =>
    React.createElement('div', { 'data-testid': 'card-header' }, children),
  CardTitle: ({ children }: any) =>
    React.createElement('div', { 'data-testid': 'card-title' }, children),
}));

vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, variant }: any) =>
    React.createElement(
      'span',
      { 'data-testid': 'badge', 'data-variant': variant },
      children
    ),
}));

vi.mock('@/components/ui/Input', () => ({
  Input: ({ label, ...props }: any) =>
    React.createElement(
      'div',
      null,
      label && React.createElement('label', null, label),
      React.createElement('input', { 'data-testid': `input-${label || 'default'}`, ...props })
    ),
  Textarea: ({ label, ...props }: any) =>
    React.createElement(
      'div',
      null,
      label && React.createElement('label', null, label),
      React.createElement('textarea', { 'data-testid': `textarea-${label || 'default'}`, ...props })
    ),
}));

vi.mock('@/components/ui/ProgressBar', () => ({
  ProgressBar: () => React.createElement('div', { 'data-testid': 'progress-bar' }),
  StepIndicator: () => React.createElement('div', { 'data-testid': 'step-indicator' }),
}));

vi.mock('@/components/ui/ThemeScript', () => ({
  default: () => null,
}));

vi.mock('@/components/ui/Toaster', () => ({
  Toaster: () => null,
}));

vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => children,
}));

vi.mock('@/components/budget/TextTemplateSelector', () => ({
  default: () => React.createElement('div', { 'data-testid': 'text-templates' }),
}));

vi.mock('@/components/budget/CompanySettings', () => ({
  default: () => React.createElement('div', { 'data-testid': 'company-settings' }),
}));

// ── Mock Budget Data ──────────────────────────────────
const mockBudget = {
  titulo: 'Presupuesto de prueba',
  descripcionGeneral: 'Descripcion de prueba para el presupuesto',
  categoria: 'Construccion',
  numero: 'PRES-001',
  createdAt: '2026-01-15T10:00:00Z',
  cliente: {
    nombre: 'Juan Perez',
    empresa: 'Constructora SA',
    email: 'juan@test.com',
    cuit: '30-12345678-9',
  },
  items: [
    {
      id: 'item-1',
      titulo: 'Pintura interior',
      descripcion: 'Pintura de paredes',
      unidad: 'm2',
      cantidad: 50,
      precioUnitario: 1500,
      precioTotal: 75000,
      categoria: 'Construccion',
      imagenes: [],
    },
    {
      id: 'item-2',
      titulo: 'Reparacion de humedad',
      descripcion: 'Tratamiento contra humedad',
      unidad: 'u',
      cantidad: 1,
      precioUnitario: 25000,
      precioTotal: 25000,
      categoria: 'Construccion',
      imagenes: [],
      observaciones: 'Incluye materiales',
    },
  ],
  totales: {
    subtotal: 100000,
    impuestos: 21000,
    tasaImpuesto: 0.21,
    total: 121000,
    currency: 'ARS' as const,
  },
  condiciones: {
    validezDias: 30,
    formaPago: 'Transferencia bancaria',
    plazoDias: 0,
    notas: 'Presupuesto sujeto a disponibilidad de materiales',
  },
  templateId: 'construction' as const,
};

// ── Store Mock ─────────────────────────────────────────
function createFreshStoreState() {
  return {
    budget: {
      ...mockBudget,
      items: mockBudget.items.map((i) => ({ ...i })),
      cliente: { ...mockBudget.cliente },
      condiciones: { ...mockBudget.condiciones },
    },
    budgetId: 'budget-123' as string | null,
    currency: 'ARS' as const,
    setCurrentStep: vi.fn(),
    updateBudgetItem: vi.fn(),
    updateBudgetGeneral: vi.fn(),
    updateBudgetCliente: vi.fn(),
    updateBudgetCondiciones: vi.fn(),
    addBudgetItem: vi.fn(),
    deleteBudgetItem: vi.fn(),
    reset: vi.fn(),
    setBudget: vi.fn(),
  };
}

let mockStoreState = createFreshStoreState();

vi.mock('@/store/budget.store', () => ({
  useBudgetStore: Object.assign(
    vi.fn(() => mockStoreState),
    {
      getState: vi.fn(() => mockStoreState),
    }
  ),
}));

// ── Tests ──────────────────────────────────────────────
let BudgetPreview: React.ComponentType;

beforeEach(async () => {
  // Reset store state without clearing mock implementations
  mockStoreState = createFreshStoreState();
  mockSaveBudgetVersion.mockClear();
  mockShareBudgetButton.mockClear();
  mockVersionHistory.mockClear();
  // Clear sonner toast calls
  const { toast } = await import('sonner');
  (toast.success as any).mockClear();
  (toast.error as any).mockClear();
  (toast.info as any).mockClear();

  const mod = await import('@/components/budget/BudgetPreview');
  BudgetPreview = mod.default;
});

describe('BudgetPreview', () => {
  // ── Rendering ──────────────────────────────────────
  describe('rendering', () => {
    it('renders the budget title and description', () => {
      render(<BudgetPreview />);
      expect(screen.getByText('Presupuesto de prueba')).toBeTruthy();
      expect(
        screen.getByText('Descripcion de prueba para el presupuesto')
      ).toBeTruthy();
    });

    it('renders the budget number', () => {
      render(<BudgetPreview />);
      expect(screen.getByText('PRES-001')).toBeTruthy();
    });

    it('renders the client name and company', () => {
      render(<BudgetPreview />);
      expect(screen.getByText('Juan Perez')).toBeTruthy();
      expect(screen.getByText('Constructora SA')).toBeTruthy();
    });

    it('renders the conditions', () => {
      render(<BudgetPreview />);
      expect(screen.getByText(/30 días/)).toBeTruthy();
      expect(
        screen.getByText('Transferencia bancaria')
      ).toBeTruthy();
    });

    it('renders item details', () => {
      render(<BudgetPreview />);
      expect(screen.getByText('Pintura interior')).toBeTruthy();
      expect(screen.getByText('Pintura de paredes')).toBeTruthy();
      expect(screen.getByText('Reparacion de humedad')).toBeTruthy();
    });

    it('renders totals section', () => {
      render(<BudgetPreview />);
      expect(screen.getByText('TOTAL')).toBeTruthy();
    });

    it('renders the observations note', () => {
      render(<BudgetPreview />);
      expect(screen.getByText('* Incluye materiales')).toBeTruthy();
    });
  });

  // ── ShareBudgetButton ──────────────────────────────
  describe('ShareBudgetButton', () => {
    it('renders ShareBudgetButton in toolbar', () => {
      render(<BudgetPreview />);
      const shareBtn = screen.getByTestId('share-button');
      expect(shareBtn).toBeTruthy();
    });

    it('passes budgetId to ShareBudgetButton', () => {
      render(<BudgetPreview />);
      const shareBtn = screen.getByTestId('share-button');
      expect(shareBtn.getAttribute('data-budget-id')).toBe('budget-123');
    });

    it('passes budgetTitle to ShareBudgetButton', () => {
      render(<BudgetPreview />);
      expect(mockShareBudgetButton).toHaveBeenCalledWith(
        expect.objectContaining({
          budgetTitle: 'Presupuesto de prueba',
        })
      );
    });

    it('does not render ShareBudgetButton when no budget', () => {
      mockStoreState = { ...createFreshStoreState(), budget: null } as any;
      const { container } = render(<BudgetPreview />);
      expect(container.innerHTML).toBe('');
    });
  });

  // ── VersionHistory ─────────────────────────────────
  describe('VersionHistory', () => {
    it('renders VersionHistory when budgetId exists', () => {
      render(<BudgetPreview />);
      const vh = screen.getByTestId('version-history');
      expect(vh).toBeTruthy();
    });

    it('passes budgetId to VersionHistory', () => {
      render(<BudgetPreview />);
      expect(mockVersionHistory).toHaveBeenCalledWith(
        expect.objectContaining({ budgetId: 'budget-123' })
      );
    });

    it('does not render VersionHistory when budgetId is null', () => {
      mockStoreState = { ...createFreshStoreState(), budgetId: null };
      render(<BudgetPreview />);
      expect(screen.queryByTestId('version-history')).toBeNull();
    });
  });

  // ── Copy clipboard ─────────────────────────────────
  describe('copy to clipboard', () => {
    let writeTextMock: any;

    beforeEach(() => {
      writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });
    });

    it('shows toast when copying summary', async () => {
      const { toast } = await import('sonner');
      render(<BudgetPreview />);
      const copyBtn = screen.getByText('Copiar resumen');
      fireEvent.click(copyBtn);

      expect(writeTextMock).toHaveBeenCalledTimes(1);
      const copiedText = writeTextMock.mock.calls[0][0];
      expect(copiedText).toContain('Presupuesto de prueba');
      expect(copiedText).toContain('PRES-001');
      expect(copiedText).toContain('Juan Perez');
      expect(toast.success).toHaveBeenCalledWith(
        'Resumen copiado al portapapeles'
      );
    });

    it('copied text includes all items', async () => {
      render(<BudgetPreview />);
      const copyBtn = screen.getByText('Copiar resumen');
      fireEvent.click(copyBtn);

      const copiedText = writeTextMock.mock.calls[0][0];
      expect(copiedText).toContain('Pintura interior');
      expect(copiedText).toContain('Reparacion de humedad');
    });
  });

  // ── Inline editing ─────────────────────────────────
  describe('inline editing', () => {
    it('opens header edit mode when pencil is clicked', () => {
      render(<BudgetPreview />);
      // The pencil button for header has title "Editar cabecera"
      const editBtn = screen.getByTitle('Editar cabecera');
      fireEvent.click(editBtn);

      // Should show save/cancel buttons and input fields
      expect(screen.getByText('Guardar')).toBeTruthy();
      expect(screen.getByText('Cancelar')).toBeTruthy();
    });

    it('calls updateBudgetGeneral when header save is clicked', () => {
      render(<BudgetPreview />);
      const editBtn = screen.getByTitle('Editar cabecera');
      fireEvent.click(editBtn);

      const saveBtn = screen.getByText('Guardar');
      fireEvent.click(saveBtn);

      expect(mockStoreState.updateBudgetGeneral).toHaveBeenCalledTimes(1);
    });

    it('calls saveBudgetVersion when header is saved with budgetId', () => {
      render(<BudgetPreview />);
      const editBtn = screen.getByTitle('Editar cabecera');
      fireEvent.click(editBtn);

      const saveBtn = screen.getByText('Guardar');
      fireEvent.click(saveBtn);

      expect(mockSaveBudgetVersion).toHaveBeenCalledWith(
        'budget-123',
        expect.anything(),
        ['header']
      );
    });

    it('cancels header editing without saving', () => {
      render(<BudgetPreview />);
      const editBtn = screen.getByTitle('Editar cabecera');
      fireEvent.click(editBtn);

      const cancelBtn = screen.getByText('Cancelar');
      fireEvent.click(cancelBtn);

      expect(mockStoreState.updateBudgetGeneral).not.toHaveBeenCalled();
    });

    it('opens client edit mode', () => {
      render(<BudgetPreview />);
      const editBtn = screen.getByTitle('Editar cliente');
      fireEvent.click(editBtn);

      // Client/conditions forms use icon-only save/cancel (Check/X icons)
      expect(screen.getAllByTestId('icon-Check').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByTestId('icon-X').length).toBeGreaterThanOrEqual(1);
    });

    it('calls updateBudgetCliente when client save is clicked', () => {
      render(<BudgetPreview />);
      const editBtn = screen.getByTitle('Editar cliente');
      fireEvent.click(editBtn);

      // Client save button is the parent of the Check icon
      const checkIcons = screen.getAllByTestId('icon-Check');
      const saveBtn = checkIcons[checkIcons.length - 1].closest('button')!;
      fireEvent.click(saveBtn);

      expect(mockStoreState.updateBudgetCliente).toHaveBeenCalledTimes(1);
    });

    it('calls saveBudgetVersion with cliente fields when client is saved', () => {
      render(<BudgetPreview />);
      const editBtn = screen.getByTitle('Editar cliente');
      fireEvent.click(editBtn);

      const checkIcons = screen.getAllByTestId('icon-Check');
      const saveBtn = checkIcons[checkIcons.length - 1].closest('button')!;
      fireEvent.click(saveBtn);

      expect(mockSaveBudgetVersion).toHaveBeenCalledWith(
        'budget-123',
        expect.anything(),
        ['cliente']
      );
    });

    it('opens conditions edit mode', () => {
      render(<BudgetPreview />);
      const editBtn = screen.getByTitle('Editar condiciones');
      fireEvent.click(editBtn);

      // Conditions form uses icon-only save/cancel buttons
      expect(screen.getAllByTestId('icon-Check').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByTestId('icon-X').length).toBeGreaterThanOrEqual(1);
    });

    it('calls updateBudgetCondiciones when conditions save is clicked', () => {
      render(<BudgetPreview />);
      const editBtn = screen.getByTitle('Editar condiciones');
      fireEvent.click(editBtn);

      const checkIcons = screen.getAllByTestId('icon-Check');
      const saveBtn = checkIcons[checkIcons.length - 1].closest('button')!;
      fireEvent.click(saveBtn);

      expect(mockStoreState.updateBudgetCondiciones).toHaveBeenCalledTimes(1);
    });

    it('calls saveBudgetVersion with condiciones fields when conditions are saved', () => {
      render(<BudgetPreview />);
      const editBtn = screen.getByTitle('Editar condiciones');
      fireEvent.click(editBtn);

      const checkIcons = screen.getAllByTestId('icon-Check');
      const saveBtn = checkIcons[checkIcons.length - 1].closest('button')!;
      fireEvent.click(saveBtn);

      expect(mockSaveBudgetVersion).toHaveBeenCalledWith(
        'budget-123',
        expect.anything(),
        ['condiciones']
      );
    });
  });

  // ── Navigation ─────────────────────────────────────
  describe('navigation', () => {
    it('calls setCurrentStep with input when "Volver a editar" is clicked', () => {
      render(<BudgetPreview />);
      const backBtn = screen.getByText('Volver a editar');
      fireEvent.click(backBtn);

      expect(mockStoreState.setCurrentStep).toHaveBeenCalledWith('input');
    });

    it('calls reset when "Generar nuevo presupuesto" is clicked', () => {
      render(<BudgetPreview />);
      const newBtn = screen.getByText('Generar nuevo presupuesto');
      fireEvent.click(newBtn);

      expect(mockStoreState.reset).toHaveBeenCalledTimes(1);
    });
  });

  // ── Export buttons ─────────────────────────────────
  describe('export buttons', () => {
    it('renders all three export buttons', () => {
      render(<BudgetPreview />);
      expect(screen.getByText('Exportar PDF')).toBeTruthy();
      expect(screen.getByText('Exportar Word')).toBeTruthy();
      expect(screen.getByText('Exportar HTML')).toBeTruthy();
    });
  });
});

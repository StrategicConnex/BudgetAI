// F11: Internationalization (i18n) basic support.
// Currently supports es (Spanish) and en (English).

export type Locale = 'es' | 'en';

const translations: Record<Locale, Record<string, string>> = {
  es: {
    'app.name': 'BudgetAI',
    'app.tagline': 'Generador de Presupuestos Inteligente',
    'nav.dashboard': 'Dashboard',
    'nav.budgets': 'Presupuestos',
    'nav.new': 'Nuevo presupuesto',
    'auth.login': 'Iniciar sesion',
    'auth.register': 'Crear cuenta',
    'auth.logout': 'Cerrar sesion',
    'auth.welcome': 'Bienvenido de vuelta',
    'auth.no_account': 'No tenes cuenta? Registrate gratis',
    'auth.has_account': 'Ya tenes cuenta? Inicia sesion',
    'budget.title': 'Presupuesto',
    'budget.client': 'Cliente',
    'budget.conditions': 'Condiciones',
    'budget.items': 'Detalle de trabajos',
    'budget.total': 'TOTAL',
    'budget.subtotal': 'Subtotal',
    'budget.tax': 'IVA',
    'budget.validity': 'Validez',
    'budget.payment': 'Forma de pago',
    'budget.generate': 'Generar presupuesto con IA',
    'budget.generating': 'Generando...',
    'budget.copy': 'Copiar resumen',
    'budget.share': 'Compartir',
    'budget.duplicate': 'Duplicar',
    'budget.export_pdf': 'Exportar PDF',
    'budget.export_docx': 'Exportar Word',
    'budget.export_html': 'Exportar HTML',
    'budget.back': 'Volver a editar',
    'budget.new_budget': 'Generar nuevo presupuesto',
    'budget.add_item': 'Agregar trabajo',
    'budget.empty': 'Sin presupuestos aun',
    'budget.empty_desc': 'Genera tu primer presupuesto con inteligencia artificial',
    'budget.create_first': 'Crear primer presupuesto',
    'dashboard.welcome': 'Bienvenido',
    'dashboard.subtitle': 'Genera presupuestos profesionales con IA en segundos',
    'dashboard.recent': 'Presupuestos recientes',
    'dashboard.view_all': 'Ver todos',
    'dashboard.stats.generated': 'Presupuestos generados',
    'dashboard.stats.exported': 'Exportaciones',
    'dashboard.stats.this_month': 'Este mes',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.search': 'Buscar...',
    'common.filter': 'Filtrar',
    'common.all': 'Todos',
  },
  en: {
    'app.name': 'BudgetAI',
    'app.tagline': 'Smart Budget Generator',
    'nav.dashboard': 'Dashboard',
    'nav.budgets': 'Budgets',
    'nav.new': 'New budget',
    'auth.login': 'Sign in',
    'auth.register': 'Create account',
    'auth.logout': 'Sign out',
    'auth.welcome': 'Welcome back',
    'auth.no_account': "Don't have an account? Sign up free",
    'auth.has_account': 'Already have an account? Sign in',
    'budget.title': 'Budget',
    'budget.client': 'Client',
    'budget.conditions': 'Conditions',
    'budget.items': 'Work details',
    'budget.total': 'TOTAL',
    'budget.subtotal': 'Subtotal',
    'budget.tax': 'Tax',
    'budget.validity': 'Validity',
    'budget.payment': 'Payment method',
    'budget.generate': 'Generate budget with AI',
    'budget.generating': 'Generating...',
    'budget.copy': 'Copy summary',
    'budget.share': 'Share',
    'budget.duplicate': 'Duplicate',
    'budget.export_pdf': 'Export PDF',
    'budget.export_docx': 'Export Word',
    'budget.export_html': 'Export HTML',
    'budget.back': 'Back to edit',
    'budget.new_budget': 'Generate new budget',
    'budget.add_item': 'Add work item',
    'budget.empty': 'No budgets yet',
    'budget.empty_desc': 'Generate your first budget with AI',
    'budget.create_first': 'Create first budget',
    'dashboard.welcome': 'Welcome',
    'dashboard.subtitle': 'Generate professional budgets with AI in seconds',
    'dashboard.recent': 'Recent budgets',
    'dashboard.view_all': 'View all',
    'dashboard.stats.generated': 'Budgets generated',
    'dashboard.stats.exported': 'Exports',
    'dashboard.stats.this_month': 'This month',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.search': 'Search...',
    'common.filter': 'Filter',
    'common.all': 'All',
  },
};

let currentLocale: Locale = 'es';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  if (typeof window !== 'undefined') {
    localStorage.setItem('budgetai-locale', locale);
  }
}

export function getLocale(): Locale {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('budgetai-locale') as Locale | null;
    if (stored) currentLocale = stored;
  }
  return currentLocale;
}

export function t(key: string, locale?: Locale): string {
  const loc = locale || currentLocale;
  return translations[loc]?.[key] || translations['es']?.[key] || key;
}

export function useTranslation() {
  return { t, locale: getLocale(), setLocale };
}

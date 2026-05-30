// ===== BUDGET TYPES =====

export type Currency = 'ARS' | 'USD';

export type BudgetStatus = 'draft' | 'generating' | 'ready' | 'exported';

export type TemplateId = 'construction' | 'minimal-white';

export interface BudgetItem {
  id: string;
  titulo: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
  categoria: string;
  imagenes: string[];
  observaciones?: string;
}

export interface BudgetTotals {
  subtotal: number;
  impuestos: number;
  tasaImpuesto: number; // 0.21 = 21%
  total: number;
  currency: Currency;
}

export interface BudgetCondiciones {
  validezDias: number;
  formaPago: string;
  plazoDias: number;
  garantia?: string;
  notas?: string;
}

export interface BudgetCliente {
  nombre: string;
  empresa?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  cuit?: string;
}

export interface BudgetEmpresa {
  nombre: string;
  logo?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  cuit?: string;
  colorPrimario?: string;
}

export interface BudgetData {
  id?: string;
  numero?: string;
  titulo: string;
  cliente: BudgetCliente;
  empresa?: BudgetEmpresa;
  categoria: string;
  descripcionGeneral: string;
  items: BudgetItem[];
  totales: BudgetTotals;
  condiciones: BudgetCondiciones;
  observaciones?: string;
  createdAt?: string;
  templateId: TemplateId;
}

// ===== AI PIPELINE TYPES =====

export interface RawInput {
  texto: string;
  imagenes?: ImageInput[];
  templateId: TemplateId;
  currency: Currency;
  empresa?: BudgetEmpresa;
  tasaImpuesto?: number; // Fracción: 0.21 = 21%. Default: 0.21
}

export interface ImageInput {
  base64: string;
  mimeType: string;
  filename: string;
  isPDF?: boolean;        // true si el archivo es un PDF
  pdfText?: string;      // texto extraído del PDF
}

export interface VisionAnalysis {
  descripcion: string;
  elementos: string[];
  condicion: string;
  trabajosSugeridos: string[];
  materiales: string[];
  riesgo: 'bajo' | 'medio' | 'alto';
}

export interface ParsedInput {
  clienteInfo: Partial<BudgetCliente>;
  descripcionRaw: string;
  trabajosDetectados: string[];
  categoriaSugerida: string;
  visionAnalysis?: VisionAnalysis[];
}

export interface NormalizedInput {
  cliente: BudgetCliente;
  categoria: string;
  trabajos: Array<{
    tipo: string;
    descripcionRaw: string;
    cantidad?: number;
    unidad?: string;
    riesgo?: 'bajo' | 'medio' | 'alto';
  }>;
}

// ===== AI STAGE RESULT =====
export type StageResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ===== EXPORT TYPES =====
export interface ExportRecord {
  id: string;
  budgetId: string;
  tipo: 'pdf' | 'docx';
  url: string;
  createdAt: string;
}

// ===== DB TYPES =====
export interface BudgetRow {
  id: string;
  user_id: string;
  title: string;
  raw_input: string;
  ai_output: BudgetData | null;
  template_id: TemplateId;
  status: BudgetStatus;
  created_at: string;
  updated_at: string;
}

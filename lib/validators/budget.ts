import { z } from 'zod';

// ===== ITEM SCHEMA =====
export const BudgetItemSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  titulo: z.string().min(1, 'El título es requerido'),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  unidad: z.string().default('unidad'),
  cantidad: z.number().positive('La cantidad debe ser positiva'),
  precioUnitario: z.number().nonnegative('El precio unitario no puede ser negativo'),
  precioTotal: z.number().nonnegative(),
  categoria: z.string().default('General'),
  imagenes: z.array(z.string()).default([]),
  observaciones: z.string().optional(),
});

// ===== TOTALS SCHEMA =====
export const BudgetTotalsSchema = z.object({
  subtotal: z.number().nonnegative(),
  impuestos: z.number().nonnegative(),
  tasaImpuesto: z.number().min(0).max(1).default(0.21),
  tasaImpositivaId: z.enum(['exento', 'reducido', 'general', 'diferencial']).optional(),
  total: z.number().nonnegative(),
  currency: z.enum(['ARS', 'USD']).default('ARS'),
});

// ===== CLIENT SCHEMA =====
export const BudgetClienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre del cliente es requerido'),
  empresa: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  cuit: z.string().optional(),
});

// ===== CONDITIONS SCHEMA =====
export const BudgetCondicionesSchema = z.object({
  validezDias: z.number().int().positive().default(30),
  formaPago: z.string().default('Transferencia bancaria'),
  plazoDias: z.number().int().nonnegative().default(0),
  garantia: z.string().optional(),
  notas: z.string().optional(),
});

// ===== EMPRESA SCHEMA =====
export const BudgetEmpresaSchema = z.object({
  nombre: z.string().min(1),
  logo: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  cuit: z.string().optional(),
  colorPrimario: z.string().optional(),
});

// ===== MAIN BUDGET SCHEMA =====
export const BudgetSchema = z.object({
  id: z.string().optional(),
  numero: z.string().optional(),
  titulo: z.string().min(1, 'El título del presupuesto es requerido'),
  cliente: BudgetClienteSchema,
  empresa: BudgetEmpresaSchema.optional(),
  categoria: z.string().min(1),
  descripcionGeneral: z.string().min(1),
  items: z.array(BudgetItemSchema).min(1, 'Se requiere al menos un ítem'),
  totales: BudgetTotalsSchema,
  condiciones: BudgetCondicionesSchema,
  observaciones: z.string().optional(),
  createdAt: z.string().optional(),
  templateId: z.enum(['construction', 'minimal-white']).default('construction'),
});

// ===== AI OUTPUT SCHEMA (más permisivo para validar la respuesta de Gemini) =====
export const AIBudgetOutputSchema = z.object({
  titulo: z.string(),
  cliente: z.object({
    nombre: z.string(),
    empresa: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    telefono: z.string().nullable().optional(),
    direccion: z.string().nullable().optional(),
    cuit: z.string().nullable().optional(),
  }),
  categoria: z.string(),
  descripcionGeneral: z.string(),
  items: z.array(z.object({
    titulo: z.string(),
    descripcion: z.string(),
    unidad: z.string().default('unidad').nullable().optional(),
    cantidad: z.number().or(z.string().transform(Number)),
    precioUnitario: z.number().or(z.string().transform(Number)),
    categoria: z.string().default('General').nullable().optional(),
    observaciones: z.string().nullable().optional(),
  })),
  condiciones: z.object({
    validezDias: z.number().nullable().optional().default(30),
    formaPago: z.string().nullable().optional().default('Transferencia bancaria'),
    plazoDias: z.number().nullable().optional().default(0),
    notas: z.string().nullable().optional(),
  }).nullable().optional(),
  observaciones: z.string().nullable().optional(),
});

// ===== RAW INPUT SCHEMA (form validation) =====
export const RawInputSchema = z.object({
  texto: z.string().min(10, 'Describe el trabajo con al menos 10 caracteres'),
  templateId: z.enum(['construction', 'minimal-white']).default('construction'),
  currency: z.enum(['ARS', 'USD']).default('ARS'),
  clienteNombre: z.string().optional(),
  clienteEmpresa: z.string().optional(),
  tasaImpuesto: z.number().min(0).max(1).default(0.21),
  tasaImpositivaId: z.enum(['exento', 'reducido', 'general', 'diferencial']).optional(),
});

// ===== TYPES =====
export type BudgetSchemaType = z.infer<typeof BudgetSchema>;
export type AIBudgetOutputType = z.infer<typeof AIBudgetOutputSchema>;
export type RawInputSchemaType = z.infer<typeof RawInputSchema>;

import type { ImageInput, TemplateId, Currency, TasaImpositivaId } from '@/types/budget';
import { TASAS_IMPOSITIVAS } from '@/types/budget';

// ── State ───────────────────────────────────────────
export interface FormSlice {
  rawText: string;
  images: ImageInput[];
  templateId: TemplateId;
  currency: Currency;
  clienteNombre: string;
  clienteEmpresa: string;
  tasaImpuesto: number;
  tasaImpositivaId: TasaImpositivaId;

  setRawText: (text: string) => void;
  addImage: (image: ImageInput) => void;
  removeImage: (index: number) => void;
  setTemplateId: (id: TemplateId) => void;
  setCurrency: (currency: Currency) => void;
  setClienteNombre: (name: string) => void;
  setClienteEmpresa: (empresa: string) => void;
  setTasaImpuesto: (tasa: number) => void;
  setTasaImpositivaId: (id: TasaImpositivaId) => void;
}

export const FORM_INITIAL_STATE = {
  rawText: '',
  images: [] as ImageInput[],
  templateId: 'construction' as TemplateId,
  currency: 'ARS' as Currency,
  clienteNombre: '',
  clienteEmpresa: '',
  tasaImpuesto: 0.21,
  tasaImpositivaId: 'general' as TasaImpositivaId,
};

export const createFormSlice = (set: any): FormSlice => ({
  ...FORM_INITIAL_STATE,

  setRawText: (text) => set((state: any) => { state.rawText = text; }),
  addImage: (image) => set((state: any) => { state.images.push(image); }),
  removeImage: (index) => set((state: any) => { state.images.splice(index, 1); }),
  setTemplateId: (id) => set((state: any) => { state.templateId = id; }),
  setCurrency: (currency) => set((state: any) => { state.currency = currency; }),
  setClienteNombre: (name) => set((state: any) => { state.clienteNombre = name; }),
  setClienteEmpresa: (empresa) => set((state: any) => { state.clienteEmpresa = empresa; }),
  setTasaImpuesto: (tasa) => set((state: any) => {
    state.tasaImpuesto = tasa;
    // Sync tasaImpositivaId based on the tasa value
    const match = TASAS_IMPOSITIVAS.find(t => t.valor === tasa);
    if (match) state.tasaImpositivaId = match.id;
  }),
  setTasaImpositivaId: (id) => set((state: any) => {
    state.tasaImpositivaId = id;
    const tasa = TASAS_IMPOSITIVAS.find(t => t.id === id);
    if (tasa) state.tasaImpuesto = tasa.valor;
  }),
});

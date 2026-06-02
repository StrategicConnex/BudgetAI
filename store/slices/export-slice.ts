// ── State ───────────────────────────────────────────
export interface ExportSlice {
  isExportingPDF: boolean;
  isExportingDOCX: boolean;
  isExportingHTML: boolean;
  exportError: string | null;

  setIsExportingPDF: (loading: boolean) => void;
  setIsExportingDOCX: (loading: boolean) => void;
  setIsExportingHTML: (loading: boolean) => void;
  setExportError: (error: string | null) => void;
}

export const EXPORT_INITIAL_STATE = {
  isExportingPDF: false,
  isExportingDOCX: false,
  isExportingHTML: false,
  exportError: null as string | null,
};

export const createExportSlice = (set: any): ExportSlice => ({
  ...EXPORT_INITIAL_STATE,

  setIsExportingPDF: (loading) => set((state: any) => { state.isExportingPDF = loading; }),
  setIsExportingDOCX: (loading) => set((state: any) => { state.isExportingDOCX = loading; }),
  setIsExportingHTML: (loading) => set((state: any) => { state.isExportingHTML = loading; }),
  setExportError: (error) => set((state: any) => { state.exportError = error; }),
});

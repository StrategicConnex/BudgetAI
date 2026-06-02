import type { PipelineStage } from '@/lib/ai/orchestrator';

// ── Types ───────────────────────────────────────────
export interface StageProgress {
  stage: PipelineStage;
  message: string;
  progress: number;
}

// ── State ───────────────────────────────────────────
export interface PipelineSlice {
  isGenerating: boolean;
  pipelineProgress: StageProgress | null;
  error: string | null;

  setIsGenerating: (loading: boolean) => void;
  setPipelineProgress: (progress: StageProgress | null) => void;
  setError: (error: string | null) => void;
}

export const PIPELINE_INITIAL_STATE = {
  isGenerating: false,
  pipelineProgress: null as StageProgress | null,
  error: null as string | null,
};

export const createPipelineSlice = (set: any): PipelineSlice => ({
  ...PIPELINE_INITIAL_STATE,

  setIsGenerating: (loading) => set((state: any) => { state.isGenerating = loading; }),
  setPipelineProgress: (progress) => set((state: any) => { state.pipelineProgress = progress; }),
  setError: (error) => set((state: any) => { state.error = error; }),
});

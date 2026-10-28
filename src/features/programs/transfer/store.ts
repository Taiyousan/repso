import { create } from 'zustand';

import type { ProgramFileProgram } from './format';
import { defaultResolution, type ImportRef, type Resolution } from './plan';

type ImportDraft = {
  program: ProgramFileProgram;
  refs: ImportRef[];
  resolutions: Record<string, Resolution>;
};

type ImportState = {
  /** Analysed file waiting for confirmation, shared with the exercise replacement screen. */
  draft: ImportDraft | null;
  start: (program: ProgramFileProgram, refs: ImportRef[]) => void;
  resolve: (key: string, resolution: Resolution) => void;
  reset: () => void;
};

export const useImportStore = create<ImportState>((set) => ({
  draft: null,
  start: (program, refs) =>
    set({
      draft: {
        program,
        refs,
        resolutions: Object.fromEntries(refs.map((ref) => [ref.key, defaultResolution(ref.match)])),
      },
    }),
  resolve: (key, resolution) =>
    set(({ draft }) =>
      draft
        ? { draft: { ...draft, resolutions: { ...draft.resolutions, [key]: resolution } } }
        : {},
    ),
  reset: () => set({ draft: null }),
}));

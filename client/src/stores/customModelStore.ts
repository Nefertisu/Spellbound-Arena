import { create } from 'zustand';
import {
  CUSTOM_MODEL_MAX_BYTES,
  deleteCustomModelFile,
  isCustomModelFile,
  loadCustomModelFile,
  saveCustomModelFile,
} from '../utils/customModelStorage';

interface CustomModelState {
  objectUrl: string | null;
  fileName: string | null;
  scale: number;
  isLoading: boolean;
  error: string | null;
  loadForUser: (userId: string) => Promise<void>;
  uploadFile: (userId: string, file: File) => Promise<void>;
  clearModel: (userId: string) => Promise<void>;
  setScale: (scale: number) => void;
  revokeObjectUrl: () => void;
}

function revokeUrl(url: string | null) {
  if (url) URL.revokeObjectURL(url);
}

export const useCustomModelStore = create<CustomModelState>((set, get) => ({
  objectUrl: null,
  fileName: null,
  scale: 1,
  isLoading: false,
  error: null,

  revokeObjectUrl: () => {
    revokeUrl(get().objectUrl);
    set({ objectUrl: null });
  },

  setScale: (scale) => set({ scale: Math.max(0.5, Math.min(2, scale)) }),

  loadForUser: async (userId) => {
    set({ isLoading: true, error: null });
    get().revokeObjectUrl();

    try {
      const stored = await loadCustomModelFile(userId);
      if (!stored) {
        set({ fileName: null, isLoading: false });
        return;
      }

      const objectUrl = URL.createObjectURL(stored.blob);
      set({
        objectUrl,
        fileName: stored.fileName,
        isLoading: false,
        error: null,
      });
    } catch {
      set({
        isLoading: false,
        error: 'Could not load saved custom model.',
      });
    }
  },

  uploadFile: async (userId, file) => {
    if (!isCustomModelFile(file)) {
      set({ error: 'Only .glb and .gltf files are supported.' });
      return;
    }

    if (file.size > CUSTOM_MODEL_MAX_BYTES) {
      set({ error: 'Model file is too large (max 15 MB).' });
      return;
    }

    set({ isLoading: true, error: null });
    get().revokeObjectUrl();

    try {
      await saveCustomModelFile(userId, file);
      const objectUrl = URL.createObjectURL(file);
      set({
        objectUrl,
        fileName: file.name,
        isLoading: false,
        error: null,
      });
    } catch {
      set({
        isLoading: false,
        error: 'Failed to upload model.',
      });
    }
  },

  clearModel: async (userId) => {
    get().revokeObjectUrl();
    try {
      await deleteCustomModelFile(userId);
    } catch {
      // ignore storage delete errors — preview is already cleared
    }
    set({ fileName: null, error: null, isLoading: false });
  },
}));

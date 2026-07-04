import { create } from 'zustand';
import {
  fetchPlayerRating,
  type FetchPlayerRatingResult,
  type PlayerRatingSnapshot,
} from '@spellbound/shared';

type RatingStatus = 'idle' | 'loading' | 'ready' | 'error';

interface RatingState {
  status: RatingStatus;
  data: PlayerRatingSnapshot | null;
  error: string | null;
  lastFetchedUserId: string | null;
  loadRating: (userId: string, token?: string) => Promise<FetchPlayerRatingResult>;
  clearRating: () => void;
}

export const useRatingStore = create<RatingState>((set, get) => ({
  status: 'idle',
  data: null,
  error: null,
  lastFetchedUserId: null,

  loadRating: async (userId, token) => {
    set({ status: 'loading', error: null });

    const result = await fetchPlayerRating({ userId, token });

    if (!result.success) {
      set({
        status: 'error',
        error: result.error.message,
        data: null,
      });
      return result;
    }

    set({
      status: 'ready',
      data: result.data,
      error: null,
      lastFetchedUserId: userId,
    });
    return result;
  },

  clearRating: () => {
    set({
      status: 'idle',
      data: null,
      error: null,
      lastFetchedUserId: null,
    });
  },
}));

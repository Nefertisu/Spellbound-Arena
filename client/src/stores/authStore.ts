import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAuthToken } from '../api';
import type { AuthUser } from '../types/auth';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => {
        setAuthToken(user.token);
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        setAuthToken(null);
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'spellbound-auth',
      onRehydrateStorage: () => (state) => {
        setAuthToken(state?.user?.token ?? null);
      },
    },
  ),
);
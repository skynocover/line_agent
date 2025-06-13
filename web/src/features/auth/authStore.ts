// web/src/features/auth/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initLiff, handleLogin, handleLogout } from '@/features/line/liff';
import type { ILiffProfile } from '@/features/line/liff';

interface AuthState {
  profile: ILiffProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (profile: ILiffProfile, accessToken: string) => void;
  clearAuth: () => void;
  checkAuth: () => Promise<boolean>;
  login: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      profile: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (profile, accessToken) => {
        set({ profile, accessToken, isAuthenticated: true });
      },
      clearAuth: () => {
        set({ profile: null, accessToken: null, isAuthenticated: false });
      },
      checkAuth: async () => {
        try {
          await initLiff();
          const { profile, accessToken } = await handleLogin();

          if (profile && accessToken) {
            get().setAuth(profile, accessToken);
            return true;
          }
          return false;
        } catch (error) {
          console.error('Auth check failed:', error);
          get().clearAuth();
          return false;
        }
      },
      login: async () => {
        try {
          await initLiff();
          const { profile, accessToken } = await handleLogin();
          if (profile && accessToken) {
            get().setAuth(profile, accessToken);
          }
        } catch (error) {
          console.error('Login failed:', error);
          get().clearAuth();
        }
      },
      logout: () => {
        handleLogout();
        get().clearAuth();
      },
    }),
    {
      name: 'auth-storage', // 存儲在 localStorage 中的 key
    },
  ),
);

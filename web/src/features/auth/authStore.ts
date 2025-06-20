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
  checkAuthWithoutLogin: () => void;
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
        const currentState = get();

        // 如果已經有認證資訊，直接返回 true
        if (currentState.isAuthenticated && currentState.profile && currentState.accessToken) {
          return true;
        }

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
      checkAuthWithoutLogin: () => {
        const currentState = get();
        // 確保狀態是最新的，如果有認證資料但 isAuthenticated 為 false，則更新狀態
        if (!currentState.isAuthenticated && currentState.profile && currentState.accessToken) {
          set({ isAuthenticated: true });
        }
        // 如果沒有認證資料但 isAuthenticated 為 true，則清除狀態
        if (currentState.isAuthenticated && (!currentState.profile || !currentState.accessToken)) {
          set({ isAuthenticated: false });
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
        try {
          // 先執行 LINE 登出
          handleLogout();
          // 清除應用狀態
          get().clearAuth();
          // 清除 localStorage 中的持久化資料
          localStorage.removeItem('auth-storage');
          // 重新載入頁面以確保狀態完全重置
          window.location.reload();
        } catch (error) {
          console.error('Logout failed:', error);
          // 即使出錯也要清除本地狀態
          get().clearAuth();
          localStorage.removeItem('auth-storage');
          window.location.reload();
        }
      },
    }),
    {
      name: 'auth-storage', // 存儲在 localStorage 中的 key
    },
  ),
);

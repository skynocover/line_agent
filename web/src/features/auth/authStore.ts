// web/src/features/auth/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  handleLogin,
  handleLogout,
  checkLoginStatus,
  closeLiffWindow,
  isInLineApp,
} from '@/features/line/liff';
import type { ILiffProfile } from '@/features/line/liff';

interface AuthState {
  profile: ILiffProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAuth: (profile: ILiffProfile, accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Auth methods
  checkAuth: () => Promise<boolean>;
  checkAuthWithoutLogin: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;

  // Utility methods
  refreshAuthState: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      profile: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setAuth: (profile, accessToken) => {
        set({
          profile,
          accessToken,
          isAuthenticated: true,
          error: null,
          isLoading: false,
        });
      },

      clearAuth: () => {
        set({
          profile: null,
          accessToken: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setError: (error) => {
        set({ error, isLoading: false });
      },

      checkAuth: async () => {
        const currentState = get();

        // 如果已經有有效的認證資訊，直接返回 true
        if (currentState.isAuthenticated && currentState.profile && currentState.accessToken) {
          return true;
        }

        set({ isLoading: true, error: null });

        try {
          const result = await handleLogin();

          if (result?.profile && result?.accessToken) {
            get().setAuth(result.profile, result.accessToken);
            return true;
          }

          get().setError('登入失敗：無法獲取用戶資訊');
          return false;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '登入過程發生錯誤';
          console.error('Auth check failed:', error);

          // 如果是需要重定向的錯誤，不視為錯誤狀態
          if (errorMessage === 'Login redirect required') {
            set({ isLoading: false });
            return false;
          }

          get().setError(errorMessage);
          get().clearAuth();
          return false;
        }
      },

      checkAuthWithoutLogin: async () => {
        const currentState = get();

        // 如果本地已有認證資料，驗證其有效性
        if (currentState.profile && currentState.accessToken) {
          try {
            const result = await checkLoginStatus();

            if (result && result.profile.userId === currentState.profile.userId) {
              // 更新認證狀態為已認證
              if (!currentState.isAuthenticated) {
                set({ isAuthenticated: true, error: null });
              }
              return;
            }
          } catch (error) {
            console.warn('Failed to verify stored auth data:', error);
          }
        }

        // 嘗試從 LIFF 獲取當前登入狀態
        try {
          const result = await checkLoginStatus();

          if (result?.profile && result?.accessToken) {
            get().setAuth(result.profile, result.accessToken);
          } else {
            // 如果本地有資料但 LIFF 沒有登入狀態，清除本地資料
            if (currentState.profile || currentState.accessToken) {
              get().clearAuth();
            }
          }
        } catch (error) {
          console.warn('Failed to check LIFF login status:', error);
          // 檢查失敗時，如果本地狀態不一致，進行清理
          if (currentState.isAuthenticated) {
            set({ isAuthenticated: false });
          }
        }
      },

      login: async () => {
        set({ isLoading: true, error: null });

        try {
          const result = await handleLogin();

          if (result?.profile && result?.accessToken) {
            get().setAuth(result.profile, result.accessToken);
          } else {
            throw new Error('登入失敗：無法獲取用戶資訊');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '登入過程發生錯誤';
          console.error('Login failed:', error);

          // 如果是需要重定向的錯誤，不視為錯誤狀態
          if (errorMessage === 'Login redirect required') {
            set({ isLoading: false });
            return;
          }

          get().setError(errorMessage);
          get().clearAuth();
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          // 執行 LIFF 登出
          handleLogout();

          // 清除本地狀態
          get().clearAuth();

          // 如果在 LINE 內，可以選擇關閉視窗
          if (isInLineApp()) {
            // 給用戶一些時間看到登出成功的反饋
            setTimeout(() => {
              closeLiffWindow();
            }, 1000);
          }

          // 清除持久化儲存
          localStorage.removeItem('auth-storage');
        } catch (error) {
          console.error('Logout failed:', error);
          // 即使登出失敗，也要清除本地狀態
          get().clearAuth();
          localStorage.removeItem('auth-storage');
        }
      },

      refreshAuthState: async () => {
        await get().checkAuthWithoutLogin();
      },
    }),
    {
      name: 'auth-storage',
      // 只持久化必要的資料
      partialize: (state) => ({
        profile: state.profile,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // 從儲存恢復時的處理
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 恢復後重置暫時狀態
          state.isLoading = false;
          state.error = null;
        }
      },
    },
  ),
);

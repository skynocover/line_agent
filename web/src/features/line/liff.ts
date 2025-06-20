import liff from '@line/liff';
import { useAuthStore } from '../auth/authStore';

const liffId = import.meta.env.VITE_LIFF_ID;

interface ILiffProfile {
  displayName: string;
  userId: string;
  pictureUrl?: string;
}

// 初始化 LIFF
const initLiff = async (): Promise<void> => {
  try {
    await liff.init({ liffId });
  } catch (error) {
    console.error('LIFF initialization failed:', error);
    throw error;
  }
};

// 處理登入
const handleLogin = async (): Promise<{ profile: ILiffProfile; accessToken: string }> => {
  try {
    if (!liff.isLoggedIn()) {
      liff.login();
    }

    const profile = await liff.getProfile();
    const accessToken = liff.getAccessToken() || '';
    return { profile, accessToken };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

// 登出
const handleLogout = (): void => {
  liff.logout();
};

const getAuthHeaders = () => {
  const accessToken = useAuthStore.getState().accessToken;
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

export { initLiff, handleLogin, handleLogout, getAuthHeaders };
export type { ILiffProfile };

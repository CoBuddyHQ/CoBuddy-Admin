import axiosInstance, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { StaffUser } from '@/types/role.types';

const axios = axiosInstance.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise: Promise<string> | null = null;
type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };
const publicAuthPaths = new Set([
  '/auth/login',
  '/auth/verify-2fa',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
]);
const isPublicAuthPath = (path: string) =>
  publicAuthPaths.has(path) || /^\/employees\/[^/]+\/accept-invite$/.test(path);

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_refresh_token');
  window.dispatchEvent(new Event('auth-expired'));
}

axios.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    const path = (config?.url ?? '').split('?')[0];
    if (error.response?.status !== 401 || !config || isPublicAuthPath(path)) {
      return Promise.reject(error);
    }
    if (config._retry) {
      clearAuthSession();
      return Promise.reject(error);
    }

    const refreshToken =
      typeof window !== 'undefined' ? localStorage.getItem('admin_refresh_token') : null;
    if (!refreshToken) {
      clearAuthSession();
      return Promise.reject(error);
    }
    config._retry = true;
    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post('/auth/refresh', { refreshToken })
          .then((response) => {
            const session = response.data.data;
            // A completed logout or a new login must not be undone by a late refresh.
            if (localStorage.getItem('admin_refresh_token') !== refreshToken) {
              throw new Error('The session changed while refreshing.');
            }
            if (typeof session?.accessToken !== 'string' || !session.accessToken) {
              throw new Error('The server returned an invalid session.');
            }
            localStorage.setItem('admin_token', session.accessToken);
            if (session.refreshToken)
              localStorage.setItem('admin_refresh_token', session.refreshToken);
            return session.accessToken as string;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const accessToken = await refreshPromise;
      config.headers.Authorization = 'Bearer ' + accessToken;
      if (path === '/auth/logout') {
        config.data = { refreshToken: localStorage.getItem('admin_refresh_token') };
      }
      return axios(config);
    } catch (refreshError) {
      // A network outage is retryable; only a rejected refresh ends this session.
      if (
        axiosInstance.isAxiosError(refreshError) &&
        refreshError.response?.status === 401 &&
        localStorage.getItem('admin_refresh_token') === refreshToken
      ) {
        clearAuthSession();
      }
      return Promise.reject(refreshError);
    }
  },
);

export default axios;

type StaffProfile = Omit<StaffUser, 'cityScope'> & { cityScopeIds?: string[] };

export const authApi = {
  login: (email: string, password: string) =>
    axios.post('/auth/login', { email: email.trim().toLowerCase(), password }),
  forgotPassword: (email: string) =>
    axios.post('/auth/forgot-password', { email: email.trim().toLowerCase() }),
  resetPassword: (token: string, password: string) =>
    axios.post('/auth/reset-password', { token, password }),
  verify2FA: (mfaToken: string, otp: string) => axios.post('/auth/verify-2fa', { mfaToken, otp }),
  logout: (refreshToken: string | null) => axios.post('/auth/logout', { refreshToken }),
  logoutAll: () => axios.delete('/auth/sessions'),
  setup2FA: () =>
    axios.post<{ data: { qrcodeDataUrl: string; otpauthUrl: string } }>('/auth/2fa/setup'),
  confirm2FA: (otp: string) => axios.post('/auth/2fa/confirm', { otp }),
  remove2FA: (password: string) => axios.post('/auth/2fa/remove', { password }),
  me: async (): Promise<StaffUser> => {
    const response = await axios.get<{ data: StaffProfile }>('/auth/me');
    const profile = response.data.data;
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      roles: profile.roles,
      cityScope: profile.cityScopeIds,
      twoFactorEnabled: profile.twoFactorEnabled,
    };
  },
};

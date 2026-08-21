import { ApiResponse } from '../../types';

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'https://elfishawy-cafe-server.vercel.app';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ef_access_token',
  REFRESH_TOKEN: 'ef_refresh_token',
  ACTIVE_USER: 'ef_active_user',
};

export class ApiClient {
  public static getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  public static getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  public static setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  public static clearTokens() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
  }

  public static async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${BASE_URL}${endpoint}`;
    const token = ApiClient.getAccessToken();

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // BACKEND RULE: Send raw token with NO 'Bearer ' prefix
    if (token && !headers['authorization']) {
      headers['authorization'] = token;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // 401 Unauthorized -> Attempt token refresh
      if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refreshToken') {
        const refreshed = await ApiClient.tryRefreshToken();
        if (refreshed) {
          headers['authorization'] = ApiClient.getAccessToken() || '';
          const retryRes = await fetch(url, { ...options, headers });
          const retryData = await retryRes.json();
          if (!retryRes.ok) throw retryData;
          return retryData;
        } else {
          ApiClient.clearTokens();
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          throw { success: false, message: 'Unauthorized' };
        }
      }

      const data = await response.json();
      if (!response.ok) {
        throw data;
      }
      return data;
    } catch (networkError: any) {
      console.error('API Request Error:', networkError);
      throw networkError;
    }
  }

  private static async tryRefreshToken(): Promise<boolean> {
    const refreshToken = ApiClient.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${BASE_URL}/auth/refreshToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await res.json();
      if (res.ok && data.accessToken) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

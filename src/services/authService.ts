import { ApiResponse, User } from '../types';
import { ApiClient, API_BASE_URL } from './api/apiClient';

export const authService = {
  login: (email: string, password: string): Promise<ApiResponse<User>> => {
    return ApiClient.request<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  refreshToken: (refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> => {
    return ApiClient.request<{ accessToken: string }>('/auth/refreshToken', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  logout: async (): Promise<void> => {
    // هات الـ refresh token قبل المسح عشان نبعتله للسيرفر
    const refreshToken = ApiClient.getRefreshToken();

    // 1) امسح كل بيانات الجلسة من المتصفح فوراً (توكنات + كاش اليوزر)
    //    ده بيضمن إن الخروج محلياً لحظي مهما كانت حالة الشبكة
    ApiClient.clearTokens();

    // 2) في الخلفية: بلّغ السيرفر لإبطال التوكنات
    //    (عشان أي متصفح تاني مفتوح بنفس الحساب يخرج برضه)
    //    لو endpoint الـ logout مش متضاف على السيرفر بعد، الخطأ بيتجاهل بصمت
    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // تجاهل أخطاء الشبكة — المسح المحلي اتم بالفعل
      }
    }
  },
};

export const userService = {
  getMe: (): Promise<ApiResponse<User>> => {
    return ApiClient.request<User>('/users/me', {
      method: 'GET',
    });
  },

  updateMe: (data: { userName?: string; phone?: string; address?: string }): Promise<ApiResponse<User>> => {
    return ApiClient.request<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

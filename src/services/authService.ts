import { ApiClient } from './api/apiClient';
import { ApiResponse, User } from '../types';

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

  logout: () => {
    ApiClient.clearTokens();
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

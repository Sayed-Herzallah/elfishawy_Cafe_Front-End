import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, UserRole } from '../types';
import { ApiClient } from '../services/api/apiClient';
import { authService, userService } from '../services/authService';
import { useNotification } from './NotificationContext';

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCashier: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUserProfile: () => Promise<void>;
  updateProfile: (data: { userName?: string; phone?: string; address?: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast, showError } = useNotification();

  const loadCurrentUser = useCallback(async () => {
    const token = ApiClient.getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await userService.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch {
      ApiClient.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();

    const handleUnauthorized = () => {
      setUser(null);
      showToast('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً', 'error');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [loadCurrentUser, showToast]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await authService.login(email, password);
      if (res.success && res.tokens) {
        ApiClient.setTokens(res.tokens.accessToken, res.tokens.refreshToken);
        if (res.data) {
          setUser(res.data);
        } else {
          await loadCurrentUser();
        }
        showToast('تم تسجيل الدخول بنجاح');
        return true;
      }
      return false;
    } catch (err: any) {
      showError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    showToast('تم تسجيل الخروج بنجاح', 'info');
  };

  const refreshUserProfile = async () => {
    try {
      const res = await userService.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch (err) {
      console.error('Failed to refresh profile', err);
    }
  };

  const updateProfile = async (data: { userName?: string; phone?: string; address?: string }): Promise<boolean> => {
    try {
      const res = await userService.updateMe(data);
      if (res.success && res.data) {
        setUser(res.data);
        showToast('تم تحديث البيانات بنجاح');
        return true;
      }
      return false;
    } catch (err: any) {
      showError(err);
      return false;
    }
  };

  const isAdmin = user?.roleType === 'admin';
  const isCashier = user?.roleType === 'cashier';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.roleType || null,
        isAuthenticated,
        isAdmin,
        isCashier,
        isLoading,
        login,
        logout,
        refreshUserProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import { useCallback } from 'react';

export interface AuthUser {
  id: number;
  username: string;
  realName?: string;
  role: 'admin' | 'user';
}

export function useAuth() {
  const getToken = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }, []);

  const getUser = useCallback((): AuthUser | null => {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }, []);

  const isAuthenticated = useCallback((): boolean => {
    return !!getToken();
  }, [getToken]);

  const isAdmin = useCallback((): boolean => {
    const user = getUser();
    return user?.role === 'admin';
  }, [getUser]);

  const setAuth = useCallback((token: string, user: AuthUser) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const getAuthHeaders = useCallback((): HeadersInit => {
    const token = getToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [getToken]);

  return {
    getToken,
    getUser,
    isAuthenticated,
    isAdmin,
    setAuth,
    clearAuth,
    getAuthHeaders
  };
}
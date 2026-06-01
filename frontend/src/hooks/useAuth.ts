import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { ApiResponse, User } from '@/types';

interface AuthPayload {
  user: User;
  token: string;
}

interface AuthError {
  message: string;
}

export const useAuth = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  const clearError = () => setError(null);

  // ── Register ───────────────────────────────────────────
  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post<ApiResponse<AuthPayload>>(
        '/api/auth/register',
        { email, password, name }
      );

      if (data.data) {
        setUser(data.data.user, data.data.token);
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: AuthError } }).response?.data?.message ||
        'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Login ──────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post<ApiResponse<AuthPayload>>(
        '/api/auth/login',
        { email, password }
      );

      if (data.data) {
        setUser(data.data.user, data.data.token);
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: AuthError } }).response?.data?.message ||
        'Login failed. Check your credentials.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Logout ─────────────────────────────────────────────
  const logout = () => {
    storeLogout();
    navigate('/login');
  };

  return { register, login, logout, error, isLoading, clearError };
};

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await api.get<{ success: boolean; user: User }>('/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ success: boolean; user: User; accessToken?: string }>('/auth/login', { email, password });
    if (res.success && res.user) {
      if (res.accessToken) localStorage.setItem('mailmint_token', res.accessToken);
      setUser(res.user);
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await api.post<{ success: boolean; user: User; accessToken?: string }>('/auth/register', { email, password, name });
    if (res.success && res.user) {
      if (res.accessToken) localStorage.setItem('mailmint_token', res.accessToken);
      setUser(res.user);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('mailmint_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        refreshUser,
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

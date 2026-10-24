'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from './api';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'patient' | 'professional' | 'admin';
  phone?: string;
  is_active?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithAadhaarToken: (res: any) => User;
  register: (payload: any) => Promise<User>;
  logout: () => void;
  quickDemoLogin: (role: 'patient' | 'professional' | 'admin') => Promise<User>;
  unreadNotifsCount: number;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_CREDENTIALS = {
  patient: { email: 'asha@example.com', password: 'Patient@SehatSetu2026', label: 'Patient (Asha Patel)' },
  professional: { email: 'dr.rajesh@sehatsetu.demo', password: 'Doctor@SehatSetu2026', label: 'Doctor (Dr. Rajesh Kumar)' },
  admin: { email: 'admin@sehatsetu.gov.in', password: 'Admin@SehatSetu2026', label: 'Admin (CMO Manisha)' }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);

  const fetchProfile = async () => {
    try {
      const res = await apiRequest<User>('/auth/me');
      setUser(res);
      // Fetch unread notifications
      try {
        const notifs = await apiRequest<any[]>('/care-continuity/notifications');
        const unread = notifs.filter(n => !n.is_read).length;
        setUnreadNotifsCount(unread);
      } catch {
        // ignore
      }
    } catch {
      localStorage.removeItem('sehatsetu_token');
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('sehatsetu_token');
    if (savedToken) {
      setToken(savedToken);
      fetchProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiRequest<{ access_token: string; role: any; user_id: number; full_name: string; email: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('sehatsetu_token', res.access_token);
    setToken(res.access_token);
    const loggedUser: User = {
      id: res.user_id,
      email: res.email,
      full_name: res.full_name,
      role: res.role,
    };
    setUser(loggedUser);
    // refresh notifs
    try {
      const notifs = await apiRequest<any[]>('/care-continuity/notifications');
      setUnreadNotifsCount(notifs.filter(n => !n.is_read).length);
    } catch {
      // ignore
    }
    return loggedUser;
  };

  const register = async (payload: any): Promise<User> => {
    const res = await apiRequest<{ access_token: string; role: any; user_id: number; full_name: string; email: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    localStorage.setItem('sehatsetu_token', res.access_token);
    setToken(res.access_token);
    const registeredUser: User = {
      id: res.user_id,
      email: res.email,
      full_name: res.full_name,
      role: res.role,
    };
    setUser(registeredUser);
    return registeredUser;
  };

  const logout = () => {
    localStorage.removeItem('sehatsetu_token');
    setToken(null);
    setUser(null);
    setUnreadNotifsCount(0);
  };

  const quickDemoLogin = async (role: 'patient' | 'professional' | 'admin'): Promise<User> => {
    const creds = DEMO_CREDENTIALS[role];
    return await login(creds.email, creds.password);
  };

  const loginWithAadhaarToken = (res: { access_token: string; role: any; user_id: number; full_name: string; email: string }): User => {
    localStorage.setItem('sehatsetu_token', res.access_token);
    setToken(res.access_token);
    const loggedUser: User = {
      id: res.user_id,
      email: res.email,
      full_name: res.full_name,
      role: res.role,
    };
    setUser(loggedUser);
    return loggedUser;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      loginWithAadhaarToken,
      register,
      logout,
      quickDemoLogin,
      unreadNotifsCount,
      refreshUser: fetchProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

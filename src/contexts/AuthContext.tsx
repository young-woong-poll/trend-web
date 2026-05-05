'use client';

import { createContext, useContext } from 'react';

export interface User {
  id: number;
  nickname: string | null;
  profileColor: string;
  lastNicknameChangedAt: string | null;
}

export interface LoginResponse {
  user?: User;
  shouldSignup: boolean;
  signupToken?: string;
}

export type LoginTrigger = 'header' | 'bundle' | 'my' | 'compare' | 'ask' | 'default';

export interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  requireLogin: (trigger: LoginTrigger) => void;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

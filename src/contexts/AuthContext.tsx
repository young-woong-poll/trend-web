'use client';

import { createContext, useContext } from 'react';

export interface User {
  id: number;
  nickname: string | null;
  profileImageUrl: string | null;
}

export interface LoginResponse {
  user: User;
  isSignUp: boolean;
  /** TODO : BE 확정 후 마이그레이션 플로우 구현 예정 */
  needsMigration?: boolean;
}

export type LoginTrigger = 'comment' | 'like' | 'default';

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

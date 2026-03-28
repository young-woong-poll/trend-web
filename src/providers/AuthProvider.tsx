'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';

import LoginModal from '@/components/features/Auth/LoginModal';
import { AuthContext, type LoginTrigger, type User } from '@/contexts/AuthContext';
import { getMe, postLogout } from '@/hooks/api/useAuthApi';

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginModal, setLoginModal] = useState<{ isOpen: boolean; trigger: LoginTrigger }>({
    isOpen: false,
    trigger: 'default',
  });

  const isLoggedIn = user !== null;

  // 앱 마운트 시 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const me = await getMe();
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    void checkAuth();
  }, []);

  // 401 interceptor에서 보낸 로그아웃 이벤트 수신
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null);
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  const requireLogin = useCallback(
    (trigger: LoginTrigger) => {
      if (isLoggedIn) {
        return;
      }
      setLoginModal({ isOpen: true, trigger });
    },
    [isLoggedIn]
  );

  const logout = useCallback(async () => {
    try {
      await postLogout();
    } catch {
      // 실패해도 클라이언트 상태는 초기화
    }
    setUser(null);
  }, []);

  const closeLoginModal = useCallback(() => {
    setLoginModal({ isOpen: false, trigger: 'default' });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isLoading, requireLogin, logout, setUser }}>
      {children}

      <LoginModal
        isOpen={loginModal.isOpen}
        onClose={closeLoginModal}
        trigger={loginModal.trigger}
      />
    </AuthContext.Provider>
  );
};

export default AuthProvider;

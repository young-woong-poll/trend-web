'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { usePathname, useSearchParams } from 'next/navigation';

import LoginModal from '@/components/features/Auth/LoginModal';
import { AuthContext, type LoginTrigger, type User } from '@/contexts/AuthContext';
import { getMe, postLogout } from '@/hooks/api/useAuthApi';
import { setForceLogoutHandler } from '@/lib/axios';
import { useMSWReady } from '@/providers/MSWProvider';

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
  const mswReady = useMSWReady();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const isLoggedIn = user !== null;

  // MSW 준비 완료 후 로그인 상태 확인
  useEffect(() => {
    if (!mswReady) {
      return;
    }
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
  }, [mswReady]);

  // ?login=true 쿼리 감지 → 로그인 모달 자동 표시
  useEffect(() => {
    if (isLoading || isLoggedIn) {
      return;
    }
    if (searchParams.get('login') === 'true') {
      setLoginModal({ isOpen: true, trigger: 'default' });
    }
  }, [isLoading, isLoggedIn, searchParams]);

  // 401 토큰 갱신 실패 시 강제 로그아웃 콜백 등록
  useEffect(() => {
    setForceLogoutHandler(() => setUser(null));
    return () => setForceLogoutHandler(() => {});
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
    // login 쿼리가 있으면 URL에서 조용히 제거
    if (searchParams.get('login')) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('login');
      params.delete('returnUrl');
      const query = params.toString();
      const url = query ? `${pathname}?${query}` : pathname;
      window.history.replaceState(null, '', url);
    }
  }, [searchParams, pathname]);

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

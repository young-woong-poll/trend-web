'use client';

import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { usePathname, useSearchParams } from 'next/navigation';

import LoginModal from '@/components/features/Auth/LoginModal';
import { AuthContext, type LoginTrigger, type User } from '@/contexts/AuthContext';
import { getMe, postLogout } from '@/hooks/api/useAuthApi';
import { setForceLogoutHandler } from '@/lib/axios';
import { useMSWReady } from '@/providers/MSWProvider';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * useSearchParams 의존 로직만 분리 — 이 컴포넌트만 Suspense로 감싸서
 * 나머지 children 렌더에 영향을 주지 않도록 함
 */
const LoginQueryWatcher = ({
  isLoading,
  isLoggedIn,
  onLoginRequest,
  onCloseCleanup,
  loginModalOpen,
}: {
  isLoading: boolean;
  isLoggedIn: boolean;
  onLoginRequest: () => void;
  onCloseCleanup: () => void;
  loginModalOpen: boolean;
}) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // ?login=true 쿼리 감지 → 로그인 모달 자동 표시
  useEffect(() => {
    if (isLoading || isLoggedIn) {
      return;
    }
    if (searchParams.get('login') === 'true') {
      onLoginRequest();
    }
  }, [isLoading, isLoggedIn, searchParams, onLoginRequest]);

  // 모달이 닫힐 때 URL에서 login 쿼리 제거
  useEffect(() => {
    if (loginModalOpen) {
      return;
    }
    if (searchParams.get('login')) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('login');
      params.delete('returnUrl');
      const query = params.toString();
      const url = query ? `${pathname}?${query}` : pathname;
      window.history.replaceState(null, '', url);
    }
  }, [loginModalOpen, searchParams, pathname]);

  // 모달 닫힐 때 부모에 알림
  useEffect(() => {
    if (!loginModalOpen) {
      onCloseCleanup();
    }
  }, [loginModalOpen, onCloseCleanup]);

  return null;
};

const AUTH_PATHS = ['/auth/kakao/callback', '/auth/signup'];

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginModal, setLoginModal] = useState<{ isOpen: boolean; trigger: LoginTrigger }>({
    isOpen: false,
    trigger: 'default',
  });
  const mswReady = useMSWReady();
  const pathnameRef = useRef(typeof window !== 'undefined' ? window.location.pathname : '');

  const isLoggedIn = user !== null;

  // MSW 준비 완료 후 로그인 상태 확인
  // 로그인 과정 페이지(/auth/*)에서는 getMe 호출 스킵
  useEffect(() => {
    if (!mswReady) {
      return;
    }
    const isAuthPath = AUTH_PATHS.some((p) => pathnameRef.current.startsWith(p));
    if (isAuthPath) {
      setIsLoading(false);
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

  const handleLoginRequest = useCallback(() => {
    setLoginModal({ isOpen: true, trigger: 'default' });
  }, []);

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

      <Suspense fallback={null}>
        <LoginQueryWatcher
          isLoading={isLoading}
          isLoggedIn={isLoggedIn}
          onLoginRequest={handleLoginRequest}
          onCloseCleanup={() => {}}
          loginModalOpen={loginModal.isOpen}
        />
      </Suspense>

      <LoginModal
        isOpen={loginModal.isOpen}
        onClose={closeLoginModal}
        trigger={loginModal.trigger}
      />
    </AuthContext.Provider>
  );
};

export default AuthProvider;

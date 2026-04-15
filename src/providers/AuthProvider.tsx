'use client';

import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import LoginModal from '@/components/features/Auth/LoginModal';
import { AuthContext, type LoginTrigger } from '@/contexts/AuthContext';
import { postLogout } from '@/hooks/api/useAuthApi';
import { useAuthMe, useSetAuthData } from '@/hooks/api/useAuthMe';
import { setAnalyticsUserId, clearAnalyticsUserId } from '@/lib/analytics';
import { setForceLogoutHandler } from '@/lib/axios';
import { isCSRNavigation, markHydrated } from '@/lib/csr-guard';

// ── 보호 라우트 설정 ──
// pattern: 동적 세그먼트는 :param 으로 표기
// redirect: 비로그인 시 리다이렉트 대상 (동일한 :param 치환)
const PROTECTED_ROUTES: { pattern: string; redirect: string }[] = [
  { pattern: '/bundle/:slug/play', redirect: '/bundle/:slug' },
  { pattern: '/bundle/:slug/result', redirect: '/bundle/:slug' },
  { pattern: '/compare/match/:token', redirect: '/compare/:token' },
];

// ── CSR 전용 라우트 설정 ──
// 직접 URL 접근 및 새로고침 차단, 앱 내 CSR 이동만 허용
const CSR_ONLY_ROUTES: { pattern: string; redirect: string }[] = [
  { pattern: '/bundle/:slug/play', redirect: '/bundle/:slug' },
];

/**
 * pathname이 주어진 라우트 목록에 매칭되면 리다이렉트 대상 경로를 반환한다.
 * 해당하지 않으면 null.
 */
function getRouteRedirect(
  pathname: string,
  routes: { pattern: string; redirect: string }[]
): string | null {
  for (const route of routes) {
    const paramNames: string[] = [];
    const regexStr = route.pattern.replace(/:(\w+)/g, (_match, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    const match = pathname.match(new RegExp(`^${regexStr}$`));
    if (match) {
      let redirect = route.redirect;
      paramNames.forEach((name, i) => {
        redirect = redirect.replace(`:${name}`, match[i + 1]);
      });
      return redirect;
    }
  }
  return null;
}

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

/**
 * 보호 라우트 접근 시 비로그인이면 리다이렉트.
 * 리다이렉트 대상에 ?login=true&returnUrl=... 을 붙여 로그인 모달을 표시한다.
 */
const RouteGuard = ({ isLoading, isLoggedIn }: { isLoading: boolean; isLoggedIn: boolean }) => {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || isLoggedIn) {
      return;
    }
    const redirect = getRouteRedirect(pathname, PROTECTED_ROUTES);
    if (redirect) {
      router.replace(`${redirect}?login=true`);
    }
  }, [isLoading, isLoggedIn, pathname, router]);

  return null;
};

/**
 * CSR 전용 라우트 가드.
 * 풀 로드(직접 URL 접근 / 새로고침) 시 리다이렉트.
 * CSR 이동(router.push/replace) 시에는 hydrated=true이므로 통과.
 */
const CSRGuard = () => {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isCSRNavigation()) {
      return;
    }
    const redirect = getRouteRedirect(pathname, CSR_ONLY_ROUTES);
    if (redirect) {
      // compareToken이 있으면 비교 랜딩으로 리다이렉트
      const params = new URLSearchParams(window.location.search);
      const compareToken = params.get('compareToken');
      if (compareToken) {
        router.replace(`/compare/${compareToken}`);
      } else {
        router.replace(redirect);
      }
    }
  }, [pathname, router]);

  return null;
};

const AUTH_PATHS = ['/auth/kakao/callback', '/auth/signup'];

const AuthProvider = ({ children }: AuthProviderProps) => {
  const pathnameRef = useRef(typeof window !== 'undefined' ? window.location.pathname : '');

  // 로그인 과정 페이지(/auth/*)에서는 getMe 호출 스킵
  const isAuthPath = AUTH_PATHS.some((p) => pathnameRef.current.startsWith(p));

  const { data: user = null, isLoading } = useAuthMe({ enabled: !isAuthPath });
  const { setAuthData } = useSetAuthData();

  const isLoggedIn = user !== null;

  const [loginModal, setLoginModal] = useState<{ isOpen: boolean; trigger: LoginTrigger }>({
    isOpen: false,
    trigger: 'default',
  });

  // Analytics userId 동기화
  useEffect(() => {
    if (user) {
      setAnalyticsUserId(String(user.id));
    } else {
      clearAnalyticsUserId();
    }
  }, [user]);

  // 401 토큰 갱신 실패 시 강제 로그아웃 콜백 등록
  useEffect(() => {
    setForceLogoutHandler(() => setAuthData(null));
    return () => setForceLogoutHandler(() => {});
  }, [setAuthData]);

  // 앱 hydration 완료 마킹 — CSRGuard가 CSR 이동과 풀 로드를 구분하는 데 사용
  useEffect(() => {
    markHydrated();
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
    setAuthData(null);
  }, [setAuthData]);

  const closeLoginModal = useCallback(() => {
    setLoginModal({ isOpen: false, trigger: 'default' });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn, isLoading, requireLogin, logout, setUser: setAuthData }}
    >
      {children}

      <RouteGuard isLoading={isLoading} isLoggedIn={isLoggedIn} />
      <CSRGuard />

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

'use client';

import { Suspense, useEffect, useRef } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { postKakaoLogin } from '@/hooks/api/useAuthApi';
import { setSignupToken } from '@/lib/signupToken';

const parseReturnUrl = (stateParam: string | null) => {
  if (!stateParam) {
    return '/';
  }
  return new URLSearchParams(stateParam).get('returnUrl') || '/';
};

const KakaoCallbackContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const { showToast } = useModal();
  const processedRef = useRef(false);

  const code = searchParams.get('code');
  const returnUrl = parseReturnUrl(searchParams.get('state'));

  useEffect(() => {
    if (processedRef.current) {
      return;
    }
    processedRef.current = true;

    if (!code) {
      showToast('로그인에 실패했습니다');
      router.replace(returnUrl);
      return;
    }

    const handleCallback = async () => {
      try {
        const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI ?? '';
        const result = await postKakaoLogin(code, redirectUri);

        if (result.shouldSignup && result.signupToken) {
          setSignupToken(result.signupToken);
          const signupParams = new URLSearchParams({ returnUrl });
          router.replace(`/auth/signup?${signupParams.toString()}`);
          return;
        }

        if (result.user) {
          // 풀 리로드로 이동 — AuthProvider가 쿠키와 함께 getMe()를 깨끗하게 호출하도록
          // router.replace는 SPA 네비게이션이라 AuthProvider의 getMe() 재실행이 안 됨
          window.location.href = returnUrl;
          return;
        }
      } catch {
        showToast('로그인에 실패했습니다');
      }
      router.replace(returnUrl);
    };

    void handleCallback();
  }, [code, returnUrl, router, setUser, showToast]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#8a8a8a',
      }}
    >
      로그인 처리 중...
    </div>
  );
};

const KakaoCallbackPage = () => (
  <Suspense
    fallback={
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: '#8a8a8a',
        }}
      >
        로그인 처리 중...
      </div>
    }
  >
    <KakaoCallbackContent />
  </Suspense>
);

export default KakaoCallbackPage;

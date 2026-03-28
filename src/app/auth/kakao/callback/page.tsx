'use client';

import { Suspense, useEffect, useRef } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { postKakaoLogin } from '@/hooks/api/useAuthApi';

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

        if (result.isSignUp) {
          const signupParams = new URLSearchParams({ returnUrl });
          router.replace(`/auth/signup?${signupParams.toString()}`);
          return;
        }

        setUser(result.user);
        // TODO: result.needsMigration 처리 (BE 확정 후)
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

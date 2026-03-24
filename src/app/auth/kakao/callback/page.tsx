'use client';

import { Suspense, useEffect, useRef } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { postKakaoLogin } from '@/hooks/api/useAuthApi';
import { useMSWReady } from '@/providers/MSWProvider';

const KakaoCallbackContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setIsNewUserFlag } = useAuth();
  const mswReady = useMSWReady();
  const processedRef = useRef(false);

  useEffect(() => {
    if (!mswReady) {
      return;
    }
    if (processedRef.current) {
      return;
    }
    processedRef.current = true;

    const code = searchParams.get('code');
    if (!code) {
      router.replace('/');
      return;
    }

    const handleCallback = async () => {
      try {
        const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI ?? '';
        const result = await postKakaoLogin(code, redirectUri);
        setUser(result.user);

        if (result.isNewUser) {
          setIsNewUserFlag(true);
          sessionStorage.setItem(
            'signup_consent',
            JSON.stringify({
              genderConsent: result.genderConsent,
              ageConsent: result.ageConsent,
            })
          );
          router.replace('/auth/signup');
          return;
        }

        const intentStr = sessionStorage.getItem('auth_intent');
        sessionStorage.removeItem('auth_intent');

        if (intentStr) {
          try {
            const intent = JSON.parse(intentStr) as { returnUrl?: string };
            if (intent.returnUrl) {
              router.replace(intent.returnUrl);
              return;
            }
          } catch {
            // parse 실패 시 메인으로
          }
        }
        router.replace('/');
      } catch {
        router.replace('/');
      }
    };

    void handleCallback();
  }, [searchParams, router, setUser, setIsNewUserFlag, mswReady]);

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

'use client';

import { Suspense, useEffect, useRef } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { postKakaoLogin } from '@/hooks/api/useAuthApi';
import { trackAuthKakaoCallback } from '@/lib/analytics';
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
      trackAuthKakaoCallback({ is_new_user: false, success: false });
      showToast('로그인에 실패했습니다');
      router.replace(returnUrl);
      return;
    }

    const handleCallback = async () => {
      try {
        const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI ?? '';
        const result = await postKakaoLogin(code, redirectUri);

        if (result.shouldSignup && result.signupToken) {
          trackAuthKakaoCallback({ is_new_user: true, success: true });
          setSignupToken(result.signupToken);
          const signupParams = new URLSearchParams({ returnUrl });
          router.replace(`/auth/signup?${signupParams.toString()}`);
          return;
        }

        if (result.user) {
          trackAuthKakaoCallback({ is_new_user: false, success: true });
          setUser(result.user);
          router.replace(returnUrl);
          return;
        }
        // user도 없고 signup도 아닌 비정상 분기
        trackAuthKakaoCallback({ is_new_user: false, success: false });
      } catch {
        trackAuthKakaoCallback({ is_new_user: false, success: false });
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

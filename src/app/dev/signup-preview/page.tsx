'use client';

import { useEffect, useState } from 'react';

import SignupForm from '@/components/features/Auth/SignupForm';
import { setSignupToken } from '@/lib/signupToken';

/**
 * 회원가입 페이지 미리보기 (dev only)
 * signupToken을 임시 설정하여 실제 SignupForm 컴포넌트를 그대로 렌더링
 */
export default function SignupPreviewPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // dev preview용 임시 토큰 설정 → SignupForm 접근 허용
    setSignupToken('dev-preview-token');
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  return <SignupForm />;
}

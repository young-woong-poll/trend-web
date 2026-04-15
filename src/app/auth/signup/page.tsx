'use client';

import { Suspense } from 'react';

import SignupForm from '@/components/features/Auth/SignupForm';

const SignupPage = () => (
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
        로딩 중...
      </div>
    }
  >
    <SignupForm />
  </Suspense>
);

export default SignupPage;

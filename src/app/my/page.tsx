'use client';

import { useEffect } from 'react';

import MyPageView from '@/components/features/MyPage/MyPageView';
import { useAuth } from '@/contexts/AuthContext';

const MyPage = () => {
  const { isLoggedIn, isLoading, requireLogin } = useAuth();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      requireLogin('default');
    }
  }, [isLoading, isLoggedIn, requireLogin]);

  if (isLoading || !isLoggedIn) {
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
        로딩 중...
      </div>
    );
  }

  return <MyPageView />;
};

export default MyPage;

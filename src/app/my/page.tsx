'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import MyPageView from '@/components/features/MyPage/MyPageView';
import { useAuth } from '@/contexts/AuthContext';

const MyPage = () => {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace(`/?login=true&returnUrl=${encodeURIComponent('/my')}`);
    }
  }, [isLoading, isLoggedIn, router]);

  return <MyPageView />;
};

export default MyPage;

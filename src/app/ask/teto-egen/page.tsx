'use client';

import { useRouter } from 'next/navigation';

import LandingHero from '@/components/features/TetoEgen/LandingHero';
import TetoEgenLayout from '@/components/features/TetoEgen/TetoEgenLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function AskTetoEgenPage() {
  const router = useRouter();
  const { isLoggedIn, requireLogin } = useAuth();

  const handleStart = () => {
    if (!isLoggedIn) {
      requireLogin('ask');
      return;
    }
    router.push('/ask/teto-egen/my');
  };

  return (
    <TetoEgenLayout showClose>
      <LandingHero onStart={handleStart} />
    </TetoEgenLayout>
  );
}

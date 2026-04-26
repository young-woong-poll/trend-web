'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import styles from '@/app/ask/teto-egen/my/page.module.scss';
import MyResultView from '@/components/features/TetoEgen/MyResultView';
import PrimaryFlow from '@/components/features/TetoEgen/PrimaryFlow';
import TetoEgenLayout from '@/components/features/TetoEgen/TetoEgenLayout';
import { useScenario } from '@/components/features/TetoEgen/useScenario';
import { useAuth } from '@/contexts/AuthContext';
import { useMyTetoEgenLink } from '@/hooks/api/useAskTetoEgen';

// 마운트 시점에 myLink 보유 여부를 1회 결정한 뒤 그 결과를 고정한다.
// 이후 mutation으로 myLink가 채워져도 분기를 바꾸지 않아 LinkShareCard가 자연스럽게 노출된다.
type Decision = 'pending' | 'has-link' | 'no-link';

export default function AskTetoEgenMyPage() {
  const router = useRouter();
  const scenario = useScenario();
  const { isLoggedIn, isLoading: isAuthLoading, requireLogin } = useAuth();
  const { data: myLink, isFetched: myLinkFetched } = useMyTetoEgenLink(scenario, isLoggedIn);

  const [decision, setDecision] = useState<Decision>('pending');

  useEffect(() => {
    if (decision !== 'pending') {
      return;
    }
    if (isAuthLoading) {
      return;
    }
    if (!isLoggedIn) {
      router.replace('/ask/teto-egen');
      window.setTimeout(() => requireLogin('default'), 100);
      return;
    }
    if (!myLinkFetched) {
      return;
    }
    setDecision(myLink ? 'has-link' : 'no-link');
  }, [decision, isAuthLoading, isLoggedIn, myLinkFetched, myLink, requireLogin, router]);

  if (decision === 'pending') {
    return (
      <TetoEgenLayout>
        <div className={styles.loadingWrap} role="status" aria-live="polite">
          <div className={styles.spinner} aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <span className={styles.srOnly}>불러오는 중</span>
        </div>
      </TetoEgenLayout>
    );
  }

  if (decision === 'has-link') {
    return <MyResultView />;
  }

  return <PrimaryFlow />;
}

'use client';

import { type FC, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import CopyIcon from '@/assets/icon/CopyIcon';
import FriendAnswersCollapse from '@/components/features/TetoEgen/FriendAnswersCollapse';
import styles from '@/components/features/TetoEgen/MyResultView.module.scss';
import ResultHeroCard from '@/components/features/TetoEgen/ResultHeroCard';
import SelfPredictionRow from '@/components/features/TetoEgen/SelfPredictionRow';
import TetoEgenLayout from '@/components/features/TetoEgen/TetoEgenLayout';
import { useScenario } from '@/components/features/TetoEgen/useScenario';
import { useAuth } from '@/contexts/AuthContext';
import { useMyTetoEgenLink } from '@/hooks/api/useAskTetoEgen';
import { useToast } from '@/hooks/useToast';

const MyResultView: FC = () => {
  const router = useRouter();
  const scenario = useScenario();
  const { isLoggedIn, isLoading: isAuthLoading, requireLogin } = useAuth();
  const { toast, showToast } = useToast();

  // 비로그인 → 랜딩 + 로그인 모달
  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      router.replace(scenario ? `/ask/teto-egen?mock=${scenario}` : '/ask/teto-egen');
      // 다음 렌더에서 requireLogin
      window.setTimeout(() => requireLogin('default'), 100);
    }
  }, [isAuthLoading, isLoggedIn, requireLogin, router, scenario]);

  const { data, isLoading, error } = useMyTetoEgenLink(scenario, isLoggedIn);

  // 본인 링크 없음 → 랜딩으로
  useEffect(() => {
    const status = (error as { response?: { status?: number } } | null)?.response?.status;
    if (status === 404) {
      router.replace(scenario ? `/ask/teto-egen?mock=${scenario}` : '/ask/teto-egen');
    }
  }, [error, router, scenario]);

  const handleCopy = async () => {
    if (!data) {
      return;
    }
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      showToast('링크가 복사됐어요');
    } catch {
      showToast('복사에 실패했어요');
    }
  };

  if (isAuthLoading || isLoading || !data) {
    return (
      <TetoEgenLayout showClose>
        <div className={styles.loading}>결과를 불러오는 중...</div>
      </TetoEgenLayout>
    );
  }

  const total = data.friendVotes.total;
  const isEmpty = total === 0;

  let variant: 'hit' | 'miss' | 'empty' = 'empty';
  let majorityAnswer: 'TETO' | 'EGEN' | undefined;
  let majorityCount = 0;
  let majorityPercent = 0;

  if (!isEmpty) {
    if (data.friendVotes.tetoCount === data.friendVotes.egenCount) {
      // 동률 → 사용자 자기 답과 일치 시 적중 처리
      majorityAnswer = data.selfAnswer;
      majorityCount = data.friendVotes.tetoCount;
      variant = 'hit';
    } else if (data.friendVotes.tetoCount > data.friendVotes.egenCount) {
      majorityAnswer = 'TETO';
      majorityCount = data.friendVotes.tetoCount;
      variant = data.selfAnswer === 'TETO' ? 'hit' : 'miss';
    } else {
      majorityAnswer = 'EGEN';
      majorityCount = data.friendVotes.egenCount;
      variant = data.selfAnswer === 'EGEN' ? 'hit' : 'miss';
    }
    majorityPercent = Math.round((majorityCount / total) * 100);
  }

  return (
    <>
      <TetoEgenLayout showClose>
        <ResultHeroCard
          variant={variant}
          majorityAnswer={majorityAnswer}
          majorityPercent={majorityPercent}
          totalFriends={total}
          majorityCount={majorityCount}
          displayName={data.displayName}
        />

        <div className={styles.body}>
          <SelfPredictionRow selfAnswer={data.selfAnswer} selfPrediction={data.selfPrediction} />

          <FriendAnswersCollapse friendVotes={data.friendVotes} />

          <div className={styles.shareArea}>
            <div className={styles.linkBox}>
              <span className={styles.linkText}>{data.shareUrl}</span>
            </div>
            <button type="button" className={styles.cta} onClick={handleCopy}>
              <CopyIcon className={styles.copyIcon} />
              <span>링크 복사하기</span>
            </button>
          </div>
        </div>
      </TetoEgenLayout>

      {toast.isVisible && <div className={styles.toast}>{toast.message}</div>}
    </>
  );
};

export default MyResultView;

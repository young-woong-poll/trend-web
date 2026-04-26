'use client';

import { type FC, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import CopyIcon from '@/assets/icon/CopyIcon';
import AnswerPairRow from '@/components/features/TetoEgen/AnswerPairRow';
import FriendAnswersCollapse from '@/components/features/TetoEgen/FriendAnswersCollapse';
import styles from '@/components/features/TetoEgen/MyResultView.module.scss';
import ResultHeroCard from '@/components/features/TetoEgen/ResultHeroCard';
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
      <TetoEgenLayout>
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
      <TetoEgenLayout>
        <div className={styles.stack}>
          <ResultHeroCard
            variant={variant}
            majorityAnswer={majorityAnswer}
            majorityPercent={majorityPercent}
            totalFriends={total}
            majorityCount={majorityCount}
            displayName={data.displayName}
          />

          <div className={styles.friendsGroup}>
            <AnswerPairRow
              left={{
                label: '내 선택',
                value: data.selfAnswer === 'TETO' ? '테토' : '에겐',
              }}
              right={{
                label: '친구들 예상',
                value: data.selfPrediction === 'TETO' ? '테토' : '에겐',
              }}
            />
            <FriendAnswersCollapse friendVotes={data.friendVotes} />
          </div>

          <div className={styles.shareArea}>
            <div className={styles.linkBox}>
              <span className={styles.linkText}>{data.shareUrl}</span>
            </div>
            <button type="button" className={styles.cta} onClick={handleCopy}>
              <CopyIcon className={styles.copyIcon} />
              <span className={styles.ctaLabel}>링크 복사하기</span>
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => router.push('/')}
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </TetoEgenLayout>

      {toast.isVisible && <div className={styles.toast}>{toast.message}</div>}
    </>
  );
};

export default MyResultView;

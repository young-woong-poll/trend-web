'use client';

import { type FC, useEffect, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import BackIcon from '@/assets/icon/BackIcon';
import CheckIcon from '@/assets/icon/CheckIcon';
import CopyIcon from '@/assets/icon/CopyIcon';
import AnswerPairRow from '@/components/features/TetoEgen/AnswerPairRow';
import FriendAnswersCollapse from '@/components/features/TetoEgen/FriendAnswersCollapse';
import styles from '@/components/features/TetoEgen/MyResultView.module.scss';
import ResultHeroCard from '@/components/features/TetoEgen/ResultHeroCard';
import TetoEgenLayout from '@/components/features/TetoEgen/TetoEgenLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useMyTetoEgenLink } from '@/hooks/api/useAskTetoEgen';
import { useToast } from '@/hooks/useToast';
import { trackAskOwnerResultView } from '@/lib/analytics';
import { buildFriendShareUrl } from '@/types/ask-teto-egen';

const MyResultView: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 친구 결과 화면에서 [내 결과 보러 가기]/[나도 투표 받아보기]로 넘어온 경우에만 back 버튼 노출.
  const fromFriend = searchParams.get('from') === 'friend';
  const { isLoggedIn, isLoading: isAuthLoading, requireLogin } = useAuth();
  const { toast, showToast } = useToast();

  // 비로그인 → 랜딩 + 로그인 모달
  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      router.replace('/ask/teto-egen');
      // 다음 렌더에서 requireLogin
      window.setTimeout(() => requireLogin('ask'), 100);
    }
  }, [isAuthLoading, isLoggedIn, requireLogin, router]);

  const { data, isLoading, error } = useMyTetoEgenLink(isLoggedIn);

  // 본인 링크 없음 → 랜딩으로
  useEffect(() => {
    const status = (error as { response?: { status?: number } } | null)?.response?.status;
    if (status === 404) {
      router.replace('/ask/teto-egen');
    }
  }, [error, router]);

  const trackedRef = useRef(false);
  useEffect(() => {
    if (trackedRef.current) {
      return;
    }
    if (!data) {
      return;
    }
    const { tetoCount, egenCount, total } = data.friendVotes;
    let isMajorityMatch = false;
    if (total > 0) {
      if (tetoCount === egenCount) {
        isMajorityMatch = true; // 동률 시 자기 답과 일치 처리 (기존 variant 로직과 동일)
      } else if (tetoCount > egenCount) {
        isMajorityMatch = data.selfAnswer === 'TETO';
      } else {
        isMajorityMatch = data.selfAnswer === 'EGEN';
      }
    }
    trackAskOwnerResultView('teto-egen', total, isMajorityMatch);
    trackedRef.current = true;
  }, [data]);

  // 복사 직후 1.8초간 [링크 복사하기] 버튼이 [✓ 복사됐어요!] 상태로 morphing.
  const [isCopied, setIsCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = async () => {
    if (!data) {
      return;
    }
    try {
      await navigator.clipboard.writeText(buildFriendShareUrl(data.token));
      setIsCopied(true);
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
      copiedTimerRef.current = setTimeout(() => setIsCopied(false), 1800);
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
          <header className={styles.identityHeader}>
            {fromFriend && (
              <button
                type="button"
                className={styles.identityBackButton}
                onClick={() => router.back()}
                aria-label="이전 화면으로"
              >
                <BackIcon width={20} height={20} className={styles.identityBackIcon} />
              </button>
            )}
            <h3 className={styles.identityTitle}>내 결과</h3>
          </header>

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
            <div className={styles.shareHeader}>
              <h3 className={styles.shareTitle}>
                {isEmpty ? '친구에게 공유하기' : '더 많은 친구들에게 투표받기'}
              </h3>
            </div>
            <div className={styles.linkBox}>
              <span className={styles.linkText}>{buildFriendShareUrl(data.token)}</span>
            </div>
            <button
              type="button"
              className={`${styles.cta} ${isCopied ? styles.ctaCopied : ''}`}
              onClick={handleCopy}
              aria-live="polite"
            >
              {isCopied ? (
                <CheckIcon width={18} height={18} />
              ) : (
                <CopyIcon className={styles.copyIcon} />
              )}
              <span className={styles.ctaLabel}>{isCopied ? '복사완료!' : '링크 복사하기'}</span>
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

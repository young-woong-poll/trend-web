'use client';

import { useEffect, useMemo, useState, type FC } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import BackIcon from '@/assets/icon/BackIcon';
import { CategoryBadge } from '@/components/common/CategoryBadge/CategoryBadge';
import { FloatingCta } from '@/components/common/FloatingCta/FloatingCta';
import { Toast } from '@/components/common/Toast/Toast';
import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import { CreateCompareLink } from '@/components/features/Bundle/BundleResult/CreateCompareLink';
import { AnswerComparison } from '@/components/features/Compare/CompareResult/AnswerComparison';
import { ChemistryCard } from '@/components/features/Compare/CompareResult/ChemistryCard';
import styles from '@/components/features/Compare/CompareResult/CompareResult.module.scss';
import { PopularityCompare } from '@/components/features/Compare/CompareResult/PopularityCompare';
import { ShockPoint } from '@/components/features/Compare/CompareResult/ShockPoint';
import { classifyAnswers, findShockPoint } from '@/constants/compare';
import { WITHDRAWN_NICKNAME } from '@/constants/profileColors';
import { useAuth } from '@/contexts/AuthContext';
import { useBundleMyResult } from '@/hooks/api/useBundle';
import { useCompareLink, useCompareResult } from '@/hooks/api/useCompare';
import { useToast } from '@/hooks/useToast';
import { trackCompareResult } from '@/lib/analytics';

interface CompareResultProps {
  token: string;
}

/** 가상 상대 답변 생성 (시드 기반, ~40-60% matchRate) */
function generateGhostAnswers(
  myAnswers: Array<{
    electionId: string;
    electionItemId: string;
    options: Array<{ electionItemId?: string }>;
  }>,
  seed: number
): Array<{ electionId: string; electionItemId: string }> {
  return myAnswers.map((a, i) => {
    if ((seed + i) % 3 === 0) {
      return { electionId: a.electionId, electionItemId: a.electionItemId };
    }
    const other = a.options.find((o) => o.electionItemId !== a.electionItemId);
    return {
      electionId: a.electionId,
      electionItemId: other?.electionItemId ?? a.electionItemId,
    };
  });
}

export const CompareResult: FC<CompareResultProps> = ({ token }) => {
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { data: result, isLoading } = useCompareResult(token);
  const { data: link } = useCompareLink(token);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get('from');
  const isFromGroup = fromParam === 'group';
  const showBack = isFromGroup || fromParam === 'my';
  const { toast, showToast } = useToast();
  const [showCompareModal, setShowCompareModal] = useState(false);

  // 프리뷰 모드: 결과 없음 + 생성자
  const isPreview = !result && !isLoading && !!link?.isCreator;
  const { data: myBundleResult } = useBundleMyResult(isPreview ? (link?.bundleSlug ?? '') : '');

  // GA4: 1:1 비교 결과 조회
  useEffect(() => {
    if (result) {
      trackCompareResult(result.bundleSlug ?? '');
    }
  }, [result]);

  // 접근제어: 비참가자(creator도 participant도 아닌 유저) → compare 랜딩
  useEffect(() => {
    if (!isLoading && isLoggedIn && link && !link.isCreator && !link.isParticipant) {
      router.replace(`/compare/${token}`);
    }
  }, [isLoading, isLoggedIn, link, token, router]);

  const handleCopyInvite = async () => {
    const url = `${window.location.origin}/compare/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('초대 링크가 복사되었어요');
    } catch {
      showToast('복사에 실패했습니다');
    }
  };

  const handleShareBundle = async () => {
    const slug = result?.bundleSlug ?? link?.bundleSlug ?? '';
    const url = `${window.location.origin}/bundle/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('테스트 링크가 복사되었어요');
    } catch {
      showToast('복사에 실패했습니다');
    }
  };

  // ─── 프리뷰 데이터 생성 ───
  const previewResult = useMemo(() => {
    if (!isPreview || !myBundleResult || !link) {
      return null;
    }

    const rawAnswers = myBundleResult.myAnswers ?? [];
    const rawStats = myBundleResult.questionStats ?? [];

    const myAnswers = rawAnswers.map((a) => ({
      electionId: a.electionId ?? '',
      electionItemId: a.selectedElectionItemId ?? '',
      options: a.options ?? [],
    }));
    const ghostAnswers = generateGhostAnswers(myAnswers, 42);

    let matchCount = 0;
    for (const my of myAnswers) {
      const ghost = ghostAnswers.find((g) => g.electionId === my.electionId);
      if (ghost && my.electionItemId === ghost.electionItemId) {
        matchCount++;
      }
    }

    return {
      bundleSlug: myBundleResult.bundleSlug ?? '',
      bundleTitle: myBundleResult.bundleTitle ?? '',
      totalQuestions: myBundleResult.totalQuestions ?? rawAnswers.length,
      categoryCode: link.categoryCode,
      me: {
        nickname: link.creatorNickname ?? '',
        answers: myAnswers.map((a) => ({
          electionId: a.electionId,
          electionItemId: a.electionItemId,
        })),
      },
      target: { nickname: '???', answers: ghostAnswers },
      questionStats: rawStats,
      matchCount,
      matchRate: myAnswers.length > 0 ? Math.round((matchCount / myAnswers.length) * 100) : 0,
    };
  }, [isPreview, myBundleResult, link]);

  // ─── 로딩 ───
  if (isAuthLoading || isLoading) {
    return (
      <BundleBackground>
        <div className={styles.loading}>
          <div className={styles.loadingOrbit}>
            {[0, 1].map((i) => (
              <div
                key={i}
                className={styles.loadingDot}
                style={{ '--i': i } as React.CSSProperties}
              />
            ))}
            <div className={styles.loadingCenter} />
          </div>
          <div className={styles.loadingTextGroup}>
            <p className={styles.loadingTitle}>둘의 케미를 분석하고 있어요</p>
            <p className={styles.loadingSubtitle}>답변을 비교 중...</p>
          </div>
        </div>
      </BundleBackground>
    );
  }

  // ─── 프리뷰 모드 ───
  if (previewResult) {
    const previewShockPoint = findShockPoint(previewResult);
    const previewStoryData = classifyAnswers(previewResult);

    return (
      <BundleBackground categoryCode={previewResult.categoryCode} categoryMeta={link?.categoryMeta}>
        <div className={styles.container}>
          <div className={styles.previewBanner}>
            <p className={styles.previewTitle}>아직 참여한 사람이 없어요!</p>
            <p className={styles.previewText}>
              지금 보고 있는 건 가상 데이터예요.
              <br />
              아래 버튼으로 링크를 공유하면 진짜 결과를 볼 수 있어요!
            </p>
          </div>

          <div className={styles.resultHeader}>
            <CategoryBadge
              categoryCode={previewResult.categoryCode}
              categoryMeta={link?.categoryMeta}
              label={link?.category}
            />
            <h2 className={styles.resultTitle}>{previewResult.bundleTitle}</h2>
          </div>

          <ChemistryCard
            matchRate={previewResult.matchRate}
            myNickname={previewResult.me.nickname}
            targetNickname={previewResult.target.nickname}
          />

          <AnswerComparison
            data={previewStoryData}
            myNickname={previewResult.me.nickname}
            targetNickname={previewResult.target.nickname}
          />

          {previewShockPoint && (
            <ShockPoint
              data={previewShockPoint}
              myNickname={previewResult.me.nickname}
              targetNickname={previewResult.target.nickname}
            />
          )}

          <PopularityCompare result={previewResult} />
        </div>

        <FloatingCta onClick={handleCopyInvite}>초대 링크 복사하기</FloatingCta>

        <Toast message={toast.message} isVisible={toast.isVisible} />
      </BundleBackground>
    );
  }

  // ─── 결과 없음 (리다이렉트 대기) ───
  if (!result) {
    return (
      <BundleBackground>
        <div className={styles.loading}>
          <div className={styles.loadingOrbit}>
            {[0, 1].map((i) => (
              <div
                key={i}
                className={styles.loadingDot}
                style={{ '--i': i } as React.CSSProperties}
              />
            ))}
            <div className={styles.loadingCenter} />
          </div>
        </div>
      </BundleBackground>
    );
  }

  // ─── 실제 결과 ───
  const shockPoint = findShockPoint(result);
  const storyData = classifyAnswers(result);
  const me = result.me ?? {};
  const target = result.target ?? {};
  const isTargetWithdrawn = target.isWithdrawn === true;
  // FE 방어: BE에서 마스킹하지만 혹시 모를 경우 대비
  const myNickname = me.displayName ?? me.nickname ?? '';
  const targetNickname = isTargetWithdrawn
    ? WITHDRAWN_NICKNAME
    : (target.displayName ?? target.nickname ?? '');

  return (
    <BundleBackground categoryCode={result.categoryCode} categoryMeta={result.categoryMeta}>
      <div className={styles.container}>
        {showBack && (
          <button
            type="button"
            className={styles.backButton}
            onClick={() => router.back()}
            aria-label="그룹 결과로 돌아가기"
          >
            <BackIcon width={22} height={22} />
          </button>
        )}

        <div className={styles.resultHeader}>
          <CategoryBadge
            categoryCode={result.categoryCode}
            categoryMeta={result.categoryMeta}
            label={result.category}
          />
          <h2 className={styles.resultTitle}>{result.bundleTitle}</h2>
        </div>

        {isFromGroup && (
          <div className={styles.groupPairBanner}>
            <span className={styles.groupPairLabel}>케미 상세보기</span>
            <p className={styles.groupPairNotice}>이 케미 결과는 이력에 저장되지 않아요</p>
          </div>
        )}

        <ChemistryCard
          matchRate={result.matchRate ?? 0}
          myNickname={myNickname}
          targetNickname={targetNickname}
          isTargetWithdrawn={isTargetWithdrawn}
        />

        <AnswerComparison
          data={storyData}
          myNickname={myNickname}
          targetNickname={targetNickname}
        />

        {shockPoint && (
          <ShockPoint data={shockPoint} myNickname={myNickname} targetNickname={targetNickname} />
        )}

        {!isFromGroup && <PopularityCompare result={result} />}
      </div>

      {isFromGroup ? (
        <div className={styles.floatingCta}>
          <div className={styles.floatingCtaRow}>
            <button type="button" className={styles.ctaGroup} onClick={() => router.back()}>
              그룹 결과로 돌아가기
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.floatingCta}>
            <div className={styles.floatingCtaRow}>
              <button
                type="button"
                className={styles.ctaOneToOne}
                onClick={() => setShowCompareModal(true)}
              >
                다른 친구랑 케미 보기
              </button>
              <button type="button" className={styles.ctaGroup} onClick={handleShareBundle}>
                이 테스트 공유하기
              </button>
            </div>
          </div>

          {showCompareModal && (
            <CreateCompareLink
              slug={result.bundleSlug ?? ''}
              categoryCode={result.categoryCode}
              categoryMeta={result.categoryMeta}
              category={result.category}
              bundleTitle={result.bundleTitle}
              onClose={() => setShowCompareModal(false)}
            />
          )}
        </>
      )}

      <Toast message={toast.message} isVisible={toast.isVisible} />
    </BundleBackground>
  );
};

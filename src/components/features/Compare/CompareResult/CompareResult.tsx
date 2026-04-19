'use client';

import { useEffect, useRef, useState, type FC } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import BackIcon from '@/assets/icon/BackIcon';
import { BundleRecommendSection } from '@/components/common/BundleRecommendSection/BundleRecommendSection';
import { CategoryBadge } from '@/components/common/CategoryBadge/CategoryBadge';
import { Toast } from '@/components/common/Toast/Toast';
import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import { CreateCompareLink } from '@/components/features/Bundle/BundleResult/CreateCompareLink';
import { AnswerComparison } from '@/components/features/Compare/CompareResult/AnswerComparison';
import { ChemistryCard } from '@/components/features/Compare/CompareResult/ChemistryCard';
import styles from '@/components/features/Compare/CompareResult/CompareResult.module.scss';
import { PopularityCompare } from '@/components/features/Compare/CompareResult/PopularityCompare';
import { ShockPoint } from '@/components/features/Compare/CompareResult/ShockPoint';
import { WaitingView } from '@/components/features/Compare/GroupResult/WaitingView';
import { classifyAnswers, findShockPoint } from '@/constants/compare';
import { WITHDRAWN_NICKNAME } from '@/constants/profileColors';
import { useAuth } from '@/contexts/AuthContext';
import { useCompareLink, useCompareResult } from '@/hooks/api/useCompare';
import { useToast } from '@/hooks/useToast';
import { trackCompareResult } from '@/lib/analytics';

interface CompareResultProps {
  token: string;
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
  const routeGuardDone = useRef(false);

  // 프리뷰 모드: 결과 없음 + 생성자 (참여자 없음 — 봉인 대기 화면)
  const isPreview = !result && !isLoading && !!link?.isCreator;

  // GA4: 1:1 비교 결과 조회
  useEffect(() => {
    if (result) {
      trackCompareResult(result.bundleSlug ?? '');
    }
  }, [result]);

  // 접근제어: 초기 로딩 시 한 번만 체크 (캐시 갱신에 반응하지 않도록)
  useEffect(() => {
    if (routeGuardDone.current || isLoading || !link) {
      return;
    }
    if (isLoggedIn && !link.isCreator && !link.isParticipant) {
      routeGuardDone.current = true;
      router.replace(`/compare/${token}`);
    }
  }, [isLoading, isLoggedIn, link, token, router]);

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

  // ─── 프리뷰 (생성자, 참여자 없음) → 봉인 대기 화면 ───
  // ghost 데이터로 가짜 결과 띄우는 대신 WaitingView 재활용
  if (isPreview && link) {
    return (
      <BundleBackground categoryCode={link.categoryCode} categoryMeta={link.categoryMeta}>
        <WaitingView
          nickname={link.creatorNickname ?? ''}
          token={token}
          categoryCode={link.categoryCode}
          categoryMeta={link.categoryMeta}
          category={link.category}
          bundleTitle={link.bundleTitle}
          showBack={showBack}
        />
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

        {!isFromGroup && <BundleRecommendSection currentSlug={result.bundleSlug ?? ''} />}
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

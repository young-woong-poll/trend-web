'use client';

import { useEffect, useState, type FC } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { CategoryBadge } from '@/components/common/CategoryBadge/CategoryBadge';
import { FloatingCta } from '@/components/common/FloatingCta/FloatingCta';
import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import { DisplayNameModal } from '@/components/features/Compare/DisplayNameModal/DisplayNameModal';
import styles from '@/components/features/Compare/GroupResult/InviteView.module.scss';
import { NotFoundView } from '@/components/features/Compare/GroupResult/NotFoundView';
import { PreviewRotation } from '@/components/features/Compare/PreviewRotation/PreviewRotation';
import { useAuth } from '@/contexts/AuthContext';
import { useBundleElections } from '@/hooks/api/useBundle';
import { useCompareLink, useJoinCompareLink } from '@/hooks/api/useCompare';
import { trackCompareLanding } from '@/lib/analytics';
import { formatCount } from '@/lib/utils';

interface InviteViewProps {
  token: string;
  /** 부모(GroupResult)에서 join 성공 시 호출 — 결과 화면으로 자동 전이 */
  onJoined?: () => void;
}

/**
 * 비멤버 진입 화면 (스펙 §InviteView).
 * - needsLogin: 비로그인 → 카카오 OAuth 후 returnUrl로 복귀
 * - needsBundle: 로그인 + 번들 미완료 → 번들 플레이로 이동
 * - canJoin: 로그인 + 번들 완료 → POST join → 그룹 결과 자동 전이
 */
export const InviteView: FC<InviteViewProps> = ({ token, onJoined }) => {
  const { isLoggedIn, requireLogin } = useAuth();
  const { data: link, isLoading, isError, refetch } = useCompareLink(token);
  const joinMutation = useJoinCompareLink(token);
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinAfter = searchParams.get('joinAfter') === 'true';
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);

  // 첫 질문 미리보기 (번들 미완료 사용자용)
  const { data: elections } = useBundleElections(link?.bundleSlug ?? '');
  const firstQuestion = elections?.[0];

  // GA4
  useEffect(() => {
    if (link && !link.isCreator) {
      trackCompareLanding(link.bundleSlug ?? '', link.type ?? 'GROUP');
    }
  }, [link]);

  // bundle/play 완료 후 자동으로 displayName 모달 열기
  useEffect(() => {
    if (!joinAfter || !link || isLoading) {
      return;
    }
    if (link.myBundleCompleted) {
      setShowDisplayNameModal(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('joinAfter');
      window.history.replaceState(null, '', url.toString());
    }
  }, [joinAfter, link, isLoading]);

  if (isLoading) {
    return (
      <BundleBackground>
        <div className={styles.loadingState} role="status" aria-live="polite">
          <div className={styles.loadingOrbit} aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={styles.loadingDot}
                style={{ '--i': i } as React.CSSProperties}
              />
            ))}
          </div>
          <p className={styles.loadingText}>케미 테스트 정보를 불러오는 중...</p>
        </div>
      </BundleBackground>
    );
  }

  // 토큰 무효 (404) — link도 못 받음
  if (!link) {
    return <NotFoundView isError={isError} onRetry={isError ? () => void refetch() : undefined} />;
  }

  const needsLogin = !isLoggedIn;
  const needsBundle = isLoggedIn && !link.myBundleCompleted;
  const canJoin = isLoggedIn && link.myBundleCompleted;

  const handleAction = () => {
    if (needsLogin) {
      // 카카오 OAuth state에 returnUrl 전달 → 콜백 후 같은 페이지로 복귀
      const extraParams = new URLSearchParams({
        bundleSlug: link.bundleSlug ?? '',
        compareToken: token,
      });
      const returnUrl = `${window.location.pathname}?${extraParams.toString()}`;
      const url = new URL(window.location.href);
      url.searchParams.set('bundleSlug', link.bundleSlug ?? '');
      url.searchParams.set('compareToken', token);
      url.searchParams.set('returnUrl', returnUrl);
      window.history.replaceState(null, '', url.toString());
      requireLogin('compare');
      return;
    }
    if (needsBundle) {
      // 번들 완료 후 그룹 결과 페이지로 돌아와서 자동으로 displayName 팝업 열기
      const returnWithJoin = `/compare/group/${token}?joinAfter=true`;
      router.push(
        `/bundle/${link.bundleSlug}/play?returnUrl=${encodeURIComponent(returnWithJoin)}`
      );
      return;
    }
    if (canJoin) {
      setShowDisplayNameModal(true);
    }
  };

  const handleDisplayNameConfirm = async (displayName: string, profileColor: string) => {
    try {
      await joinMutation.mutateAsync({ displayName, profileColor });
      setShowDisplayNameModal(false);
      await refetch();
      onJoined?.();
    } catch {
      // 이미 참여한 경우 등 — refetch로 최신 상태 갱신
      setShowDisplayNameModal(false);
      await refetch();
    }
  };

  // ─── 카피 분기 ───
  const creatorName = link.creatorNickname ?? '친구';
  const heroAriaLabel = `${creatorName}님이 케미 테스트를 보냈어요`;
  const heroSubtitle = needsBundle
    ? '먼저 답변하면 우리 케미가 열려요'
    : '우리 생각, 얼마나 통할까요?';
  const ctaText = (() => {
    if (joinMutation.isPending) {
      return '참여 중...';
    }
    if (canJoin) {
      return '결과 보기';
    }
    return '참여하기';
  })();

  // 번들 미완료/비로그인일 때만 프리뷰 노출 (canJoin은 결과 임박이라 깔끔하게)
  const showPreview = needsBundle || needsLogin;

  return (
    <BundleBackground categoryCode={link.categoryCode} categoryMeta={link.categoryMeta} fireworks>
      <div className={styles.container}>
        {/* 카테고리 + 번들 제목 */}
        <div className={styles.resultHeader}>
          <CategoryBadge
            categoryCode={link.categoryCode}
            categoryMeta={link.categoryMeta}
            label={link.category}
          />
          <h2 className={styles.resultTitle}>{link.bundleTitle}</h2>
        </div>

        {/* 히어로 — aria-label로 전체 문장 한 번만 낭독 */}
        <div className={styles.heroSection}>
          <h1 className={styles.heroTitle} aria-label={heroAriaLabel}>
            <span className={styles.highlight} aria-hidden>
              {creatorName}
            </span>
            <span aria-hidden>님이</span>
            <br aria-hidden />
            <span aria-hidden>케미 테스트를 보냈어요</span>
          </h1>
          <p className={styles.heroSubtitle}>{heroSubtitle}</p>
        </div>

        {/* 결과 프리뷰 로테이션 (미완료/비로그인) */}
        {showPreview && <PreviewRotation nickname={creatorName} />}

        {/* 첫 질문 미리보기 (미완료/비로그인) */}
        {showPreview && firstQuestion && (
          <div className={styles.questionPreview} aria-hidden>
            <span className={styles.questionLabel}>이런 질문에 답하게 돼요</span>
            <div className={styles.questionTitle}>{firstQuestion.title}</div>
            <div className={styles.questionOptions}>
              {(firstQuestion.options ?? []).map((opt) => (
                <div key={opt.electionItemId} className={styles.questionOption}>
                  {opt.title}
                </div>
              ))}
            </div>
            <span className={styles.questionMore}>
              외 {(link.questionCount ?? 0) - 1}개 질문 · {formatCount(link.participantCount ?? 0)}
              명 참여
            </span>
          </div>
        )}
      </div>

      <FloatingCta onClick={handleAction} disabled={joinMutation.isPending}>
        {ctaText}
      </FloatingCta>

      <DisplayNameModal
        isOpen={showDisplayNameModal}
        categoryCode={link.categoryCode}
        categoryMeta={link.categoryMeta}
        onClose={() => setShowDisplayNameModal(false)}
        onConfirm={handleDisplayNameConfirm}
        isLoading={joinMutation.isPending}
      />
    </BundleBackground>
  );
};

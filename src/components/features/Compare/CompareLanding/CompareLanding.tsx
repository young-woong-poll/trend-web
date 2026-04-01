'use client';

import type { FC } from 'react';

import { useRouter } from 'next/navigation';

import { Skeleton } from '@/components/common/Skeleton/Skeleton';
import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import styles from '@/components/features/Compare/CompareLanding/CompareLanding.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { useBundleElections } from '@/hooks/api/useBundle';
import { useCompareLink, useJoinCompareLink } from '@/hooks/api/useCompare';
import { formatCount } from '@/lib/utils';

interface CompareLandingProps {
  token: string;
}

export const CompareLanding: FC<CompareLandingProps> = ({ token }) => {
  const { isLoggedIn, requireLogin } = useAuth();
  const { data: link, isLoading, refetch } = useCompareLink(token);
  const joinMutation = useJoinCompareLink(token);
  const router = useRouter();

  // 번들 미완료 유저에게 첫 질문 미리보기 제공
  const { data: elections } = useBundleElections(link?.bundleSlug ?? '');
  const firstQuestion = elections?.[0];

  if (isLoading) {
    return (
      <BundleBackground>
        <div className={styles.container}>
          <Skeleton variant="dark" width={240} height={28} borderRadius={8} />
          <Skeleton variant="dark" width="100%" height={120} borderRadius={12} />
        </div>
      </BundleBackground>
    );
  }

  if (!link) {
    return (
      <BundleBackground>
        <div className={styles.loading}>
          비교 링크를 찾을 수 없습니다.
          <button
            type="button"
            className={styles.ctaButton}
            style={{ maxWidth: 200 }}
            onClick={() => router.push('/')}
          >
            메인으로
          </button>
        </div>
      </BundleBackground>
    );
  }

  // ─── 상태별 분기 ───
  const isCreatorWaiting = link.isCreator && !link.compareReady;
  const isCreatorReady = link.isCreator && link.compareReady;

  const needsLogin = !isLoggedIn && !link.isCreator;
  const needsBundle = isLoggedIn && !link.isCreator && !link.myBundleCompleted;
  const canJoin = isLoggedIn && !link.isCreator && link.myBundleCompleted && !link.compareReady;
  const canViewResult = !link.isCreator && link.compareReady;

  const handleAction = async () => {
    if (needsLogin) {
      requireLogin('default');
      return;
    }
    if (isCreatorReady || canViewResult) {
      router.push(`/compare/${token}/result`);
      return;
    }
    if (needsBundle) {
      router.push(`/bundle/${link.bundleSlug}/play`);
      return;
    }
    if (canJoin) {
      try {
        await joinMutation.mutateAsync();
        await refetch();
        router.push(`/compare/${token}/result`);
      } catch {
        alert('참여에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  // ─── 상태별 문구 ───
  const getHeroMessage = () => {
    if (isCreatorWaiting) {
      return '상대방이 참여하면 비교 결과를 확인할 수 있어요';
    }
    if (isCreatorReady) {
      return '비교 결과가 준비되었어요!';
    }
    if (needsBundle) {
      return '둘의 생각이 얼마나 통하는지 알 수 있어요';
    }
    if (canJoin) {
      return '이미 답변을 마쳤어요! 바로 결과를 확인해보세요';
    }
    if (canViewResult) {
      return '두 사람 모두 답변 완료! 결과가 준비되었어요';
    }
    return '우리 생각, 얼마나 통할까?';
  };

  const getCtaText = () => {
    if (needsLogin) {
      return '로그인하고 대결 수락하기';
    }
    if (isCreatorWaiting) {
      return '상대방 참여 대기 중...';
    }
    if (isCreatorReady || canViewResult) {
      return '비교 결과 보기';
    }
    if (needsBundle) {
      return '대결 수락하기';
    }
    if (canJoin) {
      return '결과 확인하기';
    }
    return '참여하기';
  };

  // 번들 미완료 또는 비로그인 → 프리뷰 + 질문 미리보기 노출
  const showPreview = needsBundle || needsLogin;
  // 생성자 대기 → 재공유 CTA 노출
  const showWaiting = isCreatorWaiting;

  return (
    <BundleBackground fireworks>
      <div className={styles.container}>
        {/* ─── 히어로 ─── */}
        <div className={styles.heroSection}>
          <h1 className={styles.heroTitle}>
            {!link.isCreator ? (
              <>
                <span className={styles.highlight}>{link.creatorNickname}</span>
                님이
                <br />
                가치관 대결을 신청했어요
              </>
            ) : (
              '내가 보낸 비교 링크'
            )}
          </h1>
          <p className={styles.heroSubtitle}>{getHeroMessage()}</p>

          {/* 비교 완료 → CTA로 시선 유도 */}
          {(isCreatorReady || canViewResult) && (
            <div className={styles.arrowBounce}>
              <span className={styles.arrowIcon}>&#8595;</span>
            </div>
          )}
        </div>

        {/* ─── 블러 결과 프리뷰 (미완료 유저) ─── */}
        {showPreview && (
          <div className={styles.previewCard}>
            <div className={styles.previewRow}>
              <span className={styles.previewLabel}>케미 등급</span>
              <span className={styles.previewValue}>S등급 · 소울메이트</span>
            </div>
            <div className={styles.previewRow}>
              <span className={styles.previewLabel}>일치율</span>
              <span className={styles.previewValue}>??%</span>
            </div>
            <div className={styles.previewRow}>
              <span className={styles.previewLabel}>충격 포인트</span>
              <span className={styles.previewValue}>?개 발견</span>
            </div>
          </div>
        )}

        {/* ─── 질문 1개 미리보기 (미완료 유저) ─── */}
        {showPreview && firstQuestion && (
          <div className={styles.questionPreview}>
            <span className={styles.questionLabel}>Q1 미리보기</span>
            <div className={styles.questionTitle}>{firstQuestion.title}</div>
            <div className={styles.questionOptions}>
              <div className={styles.questionOption}>{firstQuestion.optionA}</div>
              <div className={styles.questionOption}>{firstQuestion.optionB}</div>
            </div>
            <span className={styles.questionMore}>외 {link.questionCount - 1}개 질문</span>
          </div>
        )}

        {/* ─── 시간 + 참여자 (미완료 유저) ─── */}
        {showPreview && (
          <div className={styles.bundleMeta}>
            <span>평균 2분 30초</span>
            <span className={styles.metaDot} />
            <span>{formatCount(link.participantCount)}명 참여</span>
          </div>
        )}

        {/* ─── 생성자 대기 상태 ─── */}
        {showWaiting && (
          <div className={styles.waitingSection}>
            <div className={styles.waitingSpinner}>
              <div className={styles.spinnerRing} />
            </div>
            <p className={styles.waitingText}>
              링크를 받은 상대방의
              <br />
              참여를 기다리는 중
            </p>
          </div>
        )}

        {/* ─── CTA ─── */}
        <div className={styles.ctaArea}>
          <button
            type="button"
            className={styles.ctaButton}
            onClick={handleAction}
            disabled={isCreatorWaiting || joinMutation.isPending}
          >
            {joinMutation.isPending ? '참여 중...' : getCtaText()}
          </button>
        </div>
      </div>
    </BundleBackground>
  );
};

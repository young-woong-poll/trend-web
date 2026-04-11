'use client';

import { useEffect, useState, type FC } from 'react';

import { useRouter } from 'next/navigation';

import { CategoryBadge } from '@/components/common/CategoryBadge/CategoryBadge';
import { Skeleton } from '@/components/common/Skeleton/Skeleton';
import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import { CreateCompareLink } from '@/components/features/Bundle/BundleResult/CreateCompareLink';
import styles from '@/components/features/Compare/CompareLanding/CompareLanding.module.scss';
import { PreviewRotation } from '@/components/features/Compare/PreviewRotation/PreviewRotation';
import { useAuth } from '@/contexts/AuthContext';
import { useBundleElections } from '@/hooks/api/useBundle';
import { useCompareLink, useJoinCompareLink } from '@/hooks/api/useCompare';
import { trackCompareLanding } from '@/lib/analytics';
import { formatCount } from '@/lib/utils';

interface CompareLandingProps {
  token: string;
}

export const CompareLanding: FC<CompareLandingProps> = ({ token }) => {
  const { isLoggedIn, requireLogin } = useAuth();
  const { data: link, isLoading, refetch } = useCompareLink(token);
  const joinMutation = useJoinCompareLink(token);
  const router = useRouter();
  const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);

  // 번들 미완료 유저에게 첫 질문 미리보기 제공
  const { data: elections } = useBundleElections(link?.bundleSlug ?? '');
  const firstQuestion = elections?.[0];

  // GA4: 비교 랜딩 조회
  useEffect(() => {
    if (link && !link.isCreator) {
      trackCompareLanding(link.bundleSlug ?? '', link.type ?? 'ONE_TO_ONE');
    }
  }, [link]);

  // 생성자 대기 상태 → 프리뷰 결과 페이지로 즉시 리다이렉트
  const isCreatorWaitingForRedirect = !!link && link.isCreator && !link.hasParticipant;
  useEffect(() => {
    if (isCreatorWaitingForRedirect) {
      router.replace(`/compare/match/${token}`);
    }
  }, [isCreatorWaitingForRedirect, token, router]);

  if (isCreatorWaitingForRedirect) {
    return (
      <BundleBackground>
        <div className={styles.loading} />
      </BundleBackground>
    );
  }

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
          케미 테스트를 찾을 수 없습니다.
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

  // ─── 상태별 분기 (1:1 링크 전용 — GROUP은 /compare/group/{token}에서 직접 처리) ───
  const hasResult = link.hasParticipant;
  const isCreatorReady = link.isCreator && hasResult;

  const needsLogin = !isLoggedIn && !link.isCreator;
  const isAlreadyTaken =
    isLoggedIn && !link.isCreator && !link.isParticipant && hasResult && link.type === 'ONE_TO_ONE';
  const needsBundle =
    isLoggedIn && !link.isCreator && !link.isParticipant && !link.myBundleCompleted && !hasResult;
  const canJoin =
    isLoggedIn && !link.isCreator && !link.isParticipant && link.myBundleCompleted && !hasResult;
  const canViewResult = !link.isCreator && link.isParticipant && hasResult;

  const resultPath = `/compare/match/${token}`;

  const handleAction = async () => {
    if (needsLogin) {
      requireLogin('compare');
      return;
    }
    if (isAlreadyTaken) {
      if (!link.myBundleCompleted) {
        // 번들 미완료 → 먼저 번들 풀기로 유도
        router.push(`/bundle/${link.bundleSlug}/play`);
      } else {
        // 번들 완료 → 바로 비교 링크 생성 모달
        setShowCreateLinkModal(true);
      }
      return;
    }
    if (isCreatorReady || canViewResult) {
      router.push(resultPath);
      return;
    }
    if (needsBundle) {
      router.push(`/bundle/${link.bundleSlug}/play?compareToken=${token}`);
      return;
    }
    if (canJoin) {
      try {
        await joinMutation.mutateAsync(undefined);
        await refetch();
        router.push(resultPath);
      } catch {
        alert('참여에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  // ─── 상태별 문구 ───
  const getHeroMessage = () => {
    if (isAlreadyTaken) {
      return '이 링크는 이미 다른 사람이 참여했어요';
    }
    if (isCreatorReady) {
      return '';
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
      return '대결 수락하기';
    }
    if (isAlreadyTaken) {
      return link.myBundleCompleted ? '내 케미 테스트 만들기' : '먼저 투표 참여하기';
    }
    if (isCreatorReady || canViewResult) {
      return '결과 개봉하기';
    }
    if (needsBundle) {
      return '대결 수락하기';
    }
    if (canJoin) {
      return '결과 확인하기';
    }
    return '참여하기';
  };

  // 번들 미완료 또는 비로그인 → 프리뷰 + 질문 미리보기 노출 (선점당한 경우 제외)
  const showPreview = (needsBundle || needsLogin) && !isAlreadyTaken;

  return (
    <BundleBackground
      categoryCode={link.categoryCode}
      categoryMeta={link.categoryMeta}
      fireworks={!isAlreadyTaken}
    >
      <div className={styles.container}>
        {/* ─── 카테고리 + 번들 제목 ─── */}
        <div className={styles.resultHeader}>
          <CategoryBadge
            categoryCode={link.categoryCode}
            categoryMeta={link.categoryMeta}
            label={link.category}
          />
          <h2 className={styles.resultTitle}>{link.bundleTitle}</h2>
        </div>

        {/* ─── 히어로 ─── */}
        <div className={styles.heroSection}>
          <h1 className={styles.heroTitle}>
            {isAlreadyTaken ? (
              '아쉽지만 한 발 늦었어요'
            ) : !link.isCreator ? (
              <>
                <span className={styles.highlight}>{link.creatorNickname}</span>
                님의 <span className={styles.highlight}>가치관 대결</span> 신청!
              </>
            ) : isCreatorReady ? (
              '상대방이 대결을 수락했어요!'
            ) : (
              '대결 초대장을 보냈어요'
            )}
          </h1>
          <p className={styles.heroSubtitle}>{getHeroMessage()}</p>

          {/* 비교 완료 → 개봉 컨셉 */}
          {(isCreatorReady || canViewResult) && (
            <div className={styles.unsealSection}>
              <div className={styles.unsealIcon}>
                <div className={styles.lockBody}>
                  <div className={styles.lockShackle} />
                </div>
              </div>
              <p className={styles.unsealText}>
                {link.participantNickname
                  ? `${link.participantNickname}님과의 궁합이 궁금하다면?`
                  : '둘의 궁합 결과가 봉인 해제를 기다리고 있어요'}
              </p>
            </div>
          )}
        </div>

        {/* ─── 결과 프리뷰 (미완료 유저) — 로테이션 애니메이션 ─── */}
        {showPreview && <PreviewRotation nickname={link.creatorNickname ?? ''} />}

        {/* ─── 질문 미리보기 (미완료 유저) ─── */}
        {showPreview && firstQuestion && (
          <div className={styles.questionPreview}>
            <span className={styles.questionLabel}>이런 질문에 답하게 돼요</span>
            <div className={styles.questionTitle}>{firstQuestion.title}</div>
            <div className={styles.questionOptions}>
              <div className={styles.questionOption}>{firstQuestion.optionA}</div>
              <div className={styles.questionOption}>{firstQuestion.optionB}</div>
            </div>
            <span className={styles.questionMore}>
              외 {(link.questionCount ?? 0) - 1}개 질문 · {formatCount(link.participantCount ?? 0)}
              명 참여
            </span>
          </div>
        )}

        {/* ─── 선점당한 링크 안내 ─── */}
        {isAlreadyTaken && (
          <div className={styles.takenSection}>
            <p className={styles.takenGuideMain}>
              {link.creatorNickname}님과 비교하고 싶다면
              <br />
              직접 케미 테스트를 만들어 보내보세요!
            </p>
            <p className={styles.takenNotice}>
              이 링크는 이미 다른 사람이 참여했어요
              <br />
              1:1 케미는 한 명만 참여할 수 있어요
            </p>
          </div>
        )}
      </div>

      {/* ─── Fixed Bottom CTA ─── */}
      <div className={styles.ctaArea}>
        <button
          type="button"
          className={styles.ctaButton}
          onClick={handleAction}
          disabled={joinMutation.isPending}
        >
          {joinMutation.isPending ? '참여 중...' : getCtaText()}
        </button>
      </div>

      {showCreateLinkModal && (
        <CreateCompareLink
          slug={link.bundleSlug ?? ''}
          categoryCode={link.categoryCode}
          categoryMeta={link.categoryMeta}
          category={link.category}
          bundleTitle={link.bundleTitle}
          onClose={() => setShowCreateLinkModal(false)}
        />
      )}
    </BundleBackground>
  );
};

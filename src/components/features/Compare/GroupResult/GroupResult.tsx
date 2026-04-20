'use client';

import { type FC } from 'react';

import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import { FullGroupResultView } from '@/components/features/Compare/GroupResult/FullGroupResultView';
import styles from '@/components/features/Compare/GroupResult/GroupResult.module.scss';
import { NotFoundView } from '@/components/features/Compare/GroupResult/NotFoundView';
import { WaitingView } from '@/components/features/Compare/GroupResult/WaitingView';
import { useGroupCompareResult } from '@/hooks/api/useCompare';

interface GroupResultProps {
  token: string;
}

/**
 * 그룹 결과 페이지 라우터.
 *
 * 분기 (생성자 판별은 result.creatorUserId === result.myUserId로):
 * - isLoading → 로딩 (orbit 애니메이션)
 * - !result → NotFoundView (API 실패 또는 무효 토큰)
 * - isCreator && 참여자 1명 → WaitingView (생성자 본인 혼자 봉인 대기)
 * - 그 외 (멤버든 비멤버든) → FullGroupResultView
 *   비멤버도 결과를 보면서 "나도 참여하기" 동기 형성.
 *   참여자 1명 + 비멤버 진입 시엔 섹션별 폴백 UI로 안내.
 */
export const GroupResult: FC<GroupResultProps> = ({ token }) => {
  const { data: result, isLoading, isError, refetch } = useGroupCompareResult(token);

  if (isLoading) {
    return (
      <BundleBackground>
        <div className={styles.loading}>
          <div className={styles.loadingOrbit}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={styles.loadingDot}
                style={{ '--i': i } as React.CSSProperties}
              />
            ))}
            <div className={styles.loadingCenter} />
          </div>
          <div className={styles.loadingTextGroup}>
            <p className={styles.loadingTitle}>그룹 케미를 분석하고 있어요</p>
            <p className={styles.loadingSubtitle}>멤버들의 답변을 비교 중...</p>
          </div>
        </div>
      </BundleBackground>
    );
  }

  if (!result) {
    return <NotFoundView isError={isError} onRetry={isError ? () => void refetch() : undefined} />;
  }

  const isCreator =
    !!result.creatorUserId && !!result.myUserId && result.creatorUserId === result.myUserId;
  const participantCount = (result.members ?? []).length;

  // 생성자 본인 혼자 → 봉인 대기
  if (isCreator && participantCount === 1) {
    const myMember = (result.members ?? []).find((m) => m.userId === result.myUserId);
    return (
      <BundleBackground categoryCode={result.categoryCode} categoryMeta={result.categoryMeta}>
        <WaitingView
          nickname={myMember?.displayName ?? myMember?.nickname ?? ''}
          token={token}
          categoryCode={result.categoryCode}
          categoryMeta={result.categoryMeta}
          category={result.category}
          bundleTitle={result.bundleTitle}
        />
      </BundleBackground>
    );
  }

  // 그 외 모두 (멤버/비멤버, 참여자 1명/N명) → FullGroupResultView
  return <FullGroupResultView token={token} />;
};

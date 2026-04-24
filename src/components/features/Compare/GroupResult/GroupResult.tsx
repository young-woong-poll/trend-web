'use client';

import { type FC } from 'react';

import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import styles from '@/components/features/Compare/GroupResult/GroupResult.module.scss';
import { NotFoundView } from '@/components/features/Compare/GroupResult/NotFoundView';
import { MyResultView } from '@/components/features/Compare/MyResultView/MyResultView';
import { useGroupCompareResult } from '@/hooks/api/useCompare';

interface GroupResultProps {
  token: string;
}

/**
 * 그룹 결과 페이지 라우터.
 *
 * 분기:
 * - isLoading → 로딩 (orbit 애니메이션)
 * - !result → NotFoundView (API 실패 또는 무효 토큰)
 * - 그 외 → FullGroupResultView (참여자 1명/N명 · 멤버/비멤버 모두 처리)
 *
 * FullGroupResultView가 singleMember/isMember 조합을 내부에서 분기:
 * - 참여자 1명: LockedSectionPreview로 잠긴 섹션 안내
 *   - 멤버(=생성자 등)면 "친구들 초대하기" CTA + "친구가 참여하면..." 카피
 *   - 비멤버면 "나도 참여하기" CTA + "참여하면..." 카피
 * - 참여자 2명+: 전체 결과 섹션 노출
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
            <p className={styles.loadingTitle}>그룹 비교를 분석하고 있어요</p>
            <p className={styles.loadingSubtitle}>멤버들의 답변을 비교 중...</p>
          </div>
        </div>
      </BundleBackground>
    );
  }

  if (!result) {
    return <NotFoundView isError={isError} onRetry={isError ? () => void refetch() : undefined} />;
  }

  return <MyResultView token={token} />;
};

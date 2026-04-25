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
 * - 그 외 → MyResultView ("나" 중심 재설계, 2026-04-25 스펙)
 *
 * MyResultView가 singleMember / isMember 조합을 내부에서 분기:
 * - 참여자 1명: 안내 배너 + Layer 1 LockedSectionPreview 3종
 * - 참여자 2명+ 멤버: Hero · Layer 1(훈장 + 궤도 + 소수답 + 결과 캡처) · Layer 2 · Layer 3
 * - 참여자 2명+ 비멤버: Hero · Layer 1(훈장/소수답만 잠금, 궤도는 실루엣 노출) · Layer 2 · Layer 3
 *
 * 레거시 FullGroupResultView는 보존(스펙 Q5) — `src/app/dev/_mock/MockGroupResultPage`에서만 참조.
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

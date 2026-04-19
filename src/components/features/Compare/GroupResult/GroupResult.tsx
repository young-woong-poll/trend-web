'use client';

import { useEffect, useState, type FC } from 'react';

import { useSearchParams } from 'next/navigation';

import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import { FullGroupResultView } from '@/components/features/Compare/GroupResult/FullGroupResultView';
import styles from '@/components/features/Compare/GroupResult/GroupResult.module.scss';
import { InviteView } from '@/components/features/Compare/GroupResult/InviteView';
import { NotFoundView } from '@/components/features/Compare/GroupResult/NotFoundView';
import { WaitingView } from '@/components/features/Compare/GroupResult/WaitingView';
import { useGroupCompareResult } from '@/hooks/api/useCompare';

interface GroupResultProps {
  token: string;
}

/**
 * 그룹 결과 페이지의 얇은 라우터.
 * 상태별로 InviteView / WaitingView / FullGroupResultView / NotFoundView 분기.
 *
 * 분기:
 * - isLoading → 로딩 (orbit 애니메이션)
 * - !result → NotFoundView
 * - isMember && participantCount === 1 → WaitingView (생성자 본인, 봉인)
 * - isMember && participantCount >= 2 → FullGroupResultView (정상 그룹 결과)
 * - !isMember → InviteView (비멤버 진입 — 자체 link fetch + join 처리)
 */
export const GroupResult: FC<GroupResultProps> = ({ token }) => {
  const { data: result, isLoading, refetch } = useGroupCompareResult(token);
  const searchParams = useSearchParams();
  const showBack = searchParams.get('from') === 'my';

  // 마이그레이션 1회 고지 배너 (1:1 → GROUP 전환 링크 첫 진입)
  // BE의 migratedFromOneToOne 플래그 기반 (옵셔널 — 플래그 없으면 자연스럽게 비노출)
  const migratedFromOneToOne =
    (result as { migratedFromOneToOne?: boolean } | undefined)?.migratedFromOneToOne === true;
  const [showMigrationBanner, setShowMigrationBanner] = useState(false);

  useEffect(() => {
    if (!result || !migratedFromOneToOne) {
      return;
    }
    const storageKey = `compare.migrationBanner.seen.${token}`;
    if (typeof window === 'undefined') {
      return;
    }
    if (window.localStorage.getItem(storageKey)) {
      return;
    }
    setShowMigrationBanner(true);
  }, [result, migratedFromOneToOne, token]);

  const handleDismissMigrationBanner = () => {
    setShowMigrationBanner(false);
    try {
      window.localStorage.setItem(`compare.migrationBanner.seen.${token}`, '1');
    } catch {
      // ignore storage errors
    }
  };

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
    return <NotFoundView message="그룹 케미 결과를 찾을 수 없어요" />;
  }

  const currentUserId = result.myUserId ?? '';
  const members = result.members ?? [];
  const isMember = members.some((m) => m.userId === currentUserId);
  const participantCount = members.length;

  // 비멤버 진입 — InviteView (자체 link fetch + join 처리)
  if (!isMember) {
    return <InviteView token={token} onJoined={() => refetch()} />;
  }

  // 멤버 + 참여자 1명 (= 생성자 본인 혼자) → WaitingView
  if (participantCount === 1) {
    const myMember = members.find((m) => m.userId === currentUserId);
    return (
      <BundleBackground categoryCode={result.categoryCode} categoryMeta={result.categoryMeta}>
        <WaitingView
          nickname={myMember?.displayName ?? myMember?.nickname ?? ''}
          token={token}
          categoryCode={result.categoryCode}
          categoryMeta={result.categoryMeta}
          category={result.category}
          bundleTitle={result.bundleTitle}
          showBack={showBack}
        />
      </BundleBackground>
    );
  }

  // 멤버 + 참여자 2명+ → FullGroupResultView
  return (
    <FullGroupResultView
      token={token}
      showMigrationBanner={showMigrationBanner}
      onDismissMigrationBanner={handleDismissMigrationBanner}
    />
  );
};

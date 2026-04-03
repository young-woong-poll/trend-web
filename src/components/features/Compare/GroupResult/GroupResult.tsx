'use client';

import { useMemo, useState, type FC } from 'react';

import { useRouter } from 'next/navigation';

import { FloatingCta } from '@/components/common/FloatingCta/FloatingCta';
import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import { CreateGroupLink } from '@/components/features/Bundle/BundleResult/CreateGroupLink';
import { ChemistryNetwork } from '@/components/features/Compare/GroupResult/ChemistryNetwork';
import { GroupAwards } from '@/components/features/Compare/GroupResult/GroupAwards';
import styles from '@/components/features/Compare/GroupResult/GroupResult.module.scss';
import { GroupStats } from '@/components/features/Compare/GroupResult/GroupStats';
import { MemberList } from '@/components/features/Compare/GroupResult/MemberList';
import { ValueMap } from '@/components/features/Compare/GroupResult/ValueMap';
import { calcAllPairChemistry, calcGroupAwards } from '@/constants/group-compare';
import { useAuth } from '@/contexts/AuthContext';
import { useCompareLink, useGroupCompareResult, useJoinCompareLink } from '@/hooks/api/useCompare';

interface GroupResultProps {
  token: string;
}

export const GroupResult: FC<GroupResultProps> = ({ token }) => {
  const { isLoggedIn, requireLogin } = useAuth();
  const { data: link } = useCompareLink(token);
  const { data: result, isLoading, refetch } = useGroupCompareResult(token);
  const joinMutation = useJoinCompareLink(token);
  const router = useRouter();
  const [showGroupModal, setShowGroupModal] = useState(false);

  const pairs = useMemo(() => (result ? calcAllPairChemistry(result) : []), [result]);
  const awards = useMemo(() => (result ? calcGroupAwards(result, pairs) : []), [result, pairs]);

  // 현재 유저가 이 그룹의 멤버인지
  const isMember = link?.isCreator || link?.isParticipant;

  if (isLoading) {
    return (
      <BundleBackground>
        <div className={styles.loading}>그룹 비교 결과를 불러오는 중...</div>
      </BundleBackground>
    );
  }

  if (!result) {
    return (
      <BundleBackground>
        <div className={styles.loading}>
          그룹 비교 결과를 찾을 수 없습니다.
          <button
            type="button"
            className={styles.secondaryCta}
            style={{ maxWidth: 200 }}
            onClick={() => router.push('/')}
          >
            메인으로
          </button>
        </div>
      </BundleBackground>
    );
  }

  const currentUserId = 'mock-user-1';

  // ─── 비멤버 CTA 핸들러 ───
  const handleJoin = async () => {
    if (!isLoggedIn) {
      requireLogin('default');
      return;
    }
    if (!link?.myBundleCompleted) {
      router.push(`/bundle/${result.bundleSlug}/play?compareToken=${token}`);
      return;
    }
    try {
      await joinMutation.mutateAsync();
      await refetch();
    } catch {
      // 이미 참여한 경우 등
    }
  };

  const getJoinCtaText = () => {
    if (!isLoggedIn) {
      return '로그인하고 참여하기';
    }
    if (!link?.myBundleCompleted) {
      return '번들 풀고 나도 참여하기';
    }
    if (joinMutation.isPending) {
      return '참여 중...';
    }
    return '나도 참여하기';
  };

  return (
    <BundleBackground fireworks>
      <div className={styles.container}>
        <div className={styles.heroSection}>
          <h1 className={styles.groupName}>{result.groupName}</h1>
          <span className={styles.bundleTitle}>{result.bundleTitle}</span>
          <div className={styles.syncRateDisplay}>
            <span className={styles.syncLabel}>그룹 싱크율</span>
            <div>
              <span className={styles.syncValue}>{result.groupSyncRate}</span>
              <span className={styles.syncUnit}>%</span>
            </div>
          </div>
        </div>

        <ChemistryNetwork members={result.members} pairs={pairs} />
        <GroupStats result={result} />
        <ValueMap result={result} />
        <GroupAwards awards={awards} />
        <MemberList
          currentUserId={currentUserId}
          members={result.members}
          pairs={pairs}
          token={token}
        />

        {isMember && (
          <div className={styles.ctaSection}>
            <button
              type="button"
              className={styles.secondaryCta}
              onClick={() => router.push(`/bundle/${result.bundleSlug}/result`)}
            >
              내 결과 다시 보기
            </button>
          </div>
        )}
      </div>

      {isMember ? (
        <FloatingCta onClick={() => setShowGroupModal(true)}>내 그룹 만들기</FloatingCta>
      ) : (
        <FloatingCta onClick={handleJoin} disabled={joinMutation.isPending}>
          {getJoinCtaText()}
        </FloatingCta>
      )}

      {showGroupModal && (
        <CreateGroupLink slug={result.bundleSlug} onClose={() => setShowGroupModal(false)} />
      )}
    </BundleBackground>
  );
};

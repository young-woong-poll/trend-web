'use client';

import { useMemo, useState, type FC } from 'react';

import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';

import EditIcon from '@/assets/icon/EditIcon';
import { FloatingCta } from '@/components/common/FloatingCta/FloatingCta';
import { Toast } from '@/components/common/Toast/Toast';
import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import { CreateCompareLink } from '@/components/features/Bundle/BundleResult/CreateCompareLink';
import { CreateGroupLink } from '@/components/features/Bundle/BundleResult/CreateGroupLink';
import { DisplayNameModal } from '@/components/features/Compare/DisplayNameModal/DisplayNameModal';
import { EditGroupNameModal } from '@/components/features/Compare/EditGroupNameModal/EditGroupNameModal';
import { ChemistryNetwork } from '@/components/features/Compare/GroupResult/ChemistryNetwork';
import { ChemistryRanking } from '@/components/features/Compare/GroupResult/ChemistryRanking';
import { CrossGenderChemistry } from '@/components/features/Compare/GroupResult/CrossGenderChemistry';
import { GenderBattle } from '@/components/features/Compare/GroupResult/GenderBattle';
import { GroupAwards } from '@/components/features/Compare/GroupResult/GroupAwards';
import styles from '@/components/features/Compare/GroupResult/GroupResult.module.scss';
import { PickASide } from '@/components/features/Compare/GroupResult/PickASide';
import { PopularitySpectrum } from '@/components/features/Compare/GroupResult/PopularitySpectrum';
import { RelationExplorer } from '@/components/features/Compare/GroupResult/RelationExplorer';
import { GENDER_CATEGORIES } from '@/constants/bundle';
import { calcAllPairChemistry, calcGroupAwards } from '@/constants/group-compare';
import { GHOST_USER_PREFIX } from '@/constants/profileColors';
import { useAuth } from '@/contexts/AuthContext';
import {
  compareKeys,
  useCompareLink,
  useCreatePairCompare,
  useGroupCompareResult,
  useJoinCompareLink,
  useUpdateGroupName,
} from '@/hooks/api/useCompare';
import { useToast } from '@/hooks/useToast';

/** 네트워크 그래프 → 케미 랭킹 전환 임계값 */
const NETWORK_THRESHOLD = 16;

/** 프리뷰용 가상 멤버 이름 */
const GHOST_NAMES = ['멤버 A', '멤버 B', '멤버 C', '멤버 D'];

/** 가상 멤버 답변 생성 (시드 기반 고정 패턴) */
function generateGhostAnswers(
  electionIds: string[],
  seed: number
): Array<{ electionId: string; selected: 'A' | 'B' }> {
  return electionIds.map((id, i) => ({
    electionId: id,
    selected: (seed + i) % 2 === 0 ? 'A' : ('B' as const),
  }));
}

interface GroupResultProps {
  token: string;
}

export const GroupResult: FC<GroupResultProps> = ({ token }) => {
  const { isLoggedIn, requireLogin } = useAuth();
  const { data: link } = useCompareLink(token);
  const { data: result, isLoading, refetch } = useGroupCompareResult(token);
  const joinMutation = useJoinCompareLink(token);
  const pairCompareMutation = useCreatePairCompare(token);
  const updateGroupNameMutation = useUpdateGroupName(token);
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);

  const { toast, showToast } = useToast();

  // 프리뷰 모드: 실제 멤버가 1명뿐일 때 가상 멤버 3명을 주입
  const isPreview = result?.members.length === 1;

  // displayName이 있으면 nickname 대신 사용 (모든 하위 컴포넌트에 일괄 적용)
  const displayResult = useMemo(() => {
    if (!result) {
      return null;
    }

    const realMembers = result.members.map((m) => ({
      ...m,
      nickname: m.displayName ?? m.nickname,
    }));

    // 프리뷰: 가상 멤버 3명 추가
    if (realMembers.length === 1) {
      const electionIds = result.questionStats.map((q) => q.electionId);
      const ghostMembers = GHOST_NAMES.map((name, i) => ({
        userId: `${GHOST_USER_PREFIX}${i}`,
        nickname: name,
        displayName: name,
        answers: generateGhostAnswers(electionIds, i),
      }));
      return {
        ...result,
        members: [...realMembers, ...ghostMembers],
        memberCount: 1, // 실제 멤버 수는 1로 유지
      };
    }

    return { ...result, members: realMembers };
  }, [result]);

  const pairs = useMemo(
    () => (displayResult ? calcAllPairChemistry(displayResult) : []),
    [displayResult]
  );
  const awards = useMemo(
    () => (displayResult ? calcGroupAwards(displayResult, pairs) : []),
    [displayResult, pairs]
  );
  // 현재 유저가 이 그룹의 멤버인지
  const isMember = link?.isCreator || link?.isParticipant;

  const handleEditGroupName = async (newName: string) => {
    try {
      await updateGroupNameMutation.mutateAsync(newName);
      await queryClient.invalidateQueries({ queryKey: compareKeys.groupResult(token) });
      await queryClient.invalidateQueries({ queryKey: compareKeys.link(token) });
    } catch {
      // 실패 시 원래 이름 유지
    }
    setShowEditNameModal(false);
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

  if (!result || !displayResult) {
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

  const currentUserId = result.myUserId;

  // ─── 비멤버 CTA 핸들러 ───
  const groupResultUrl = `/compare/group/${token}`;

  const handleJoin = () => {
    if (!isLoggedIn) {
      requireLogin('default');
      return;
    }
    if (!link?.myBundleCompleted) {
      // 그룹은 compareToken 자동 join을 쓰지 않음 (displayName 입력 필요)
      // 번들 완료 후 그룹 결과 페이지로 돌아오도록 returnUrl 사용
      router.push(
        `/bundle/${result.bundleSlug}/play?returnUrl=${encodeURIComponent(groupResultUrl)}`
      );
      return;
    }
    setShowDisplayNameModal(true);
  };

  const handleDisplayNameConfirm = async (displayName: string) => {
    try {
      await joinMutation.mutateAsync(displayName);
      setShowDisplayNameModal(false);
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
    <BundleBackground>
      <div className={styles.container}>
        <div className={styles.heroSection}>
          {isPreview && (
            <div className={styles.previewBanner}>
              <p className={styles.previewText}>
                가상 멤버로 구성된 미리보기예요.
                <br />
                2명 이상부터 진짜 결과를 볼 수 있어요!
              </p>
            </div>
          )}
          <div className={styles.groupNameRow}>
            <h1 className={styles.groupName}>{result.groupName}</h1>
            {link?.isCreator && (
              <button
                type="button"
                className={styles.editButton}
                onClick={() => setShowEditNameModal(true)}
                aria-label="그룹 이름 편집"
              >
                <EditIcon width={16} height={16} />
              </button>
            )}
          </div>
          <span className={styles.bundleTitle}>{result.bundleTitle}</span>
          <div className={styles.syncRateDisplay}>
            <span className={styles.syncLabel}>그룹 싱크율</span>
            <div>
              <span className={styles.syncValue}>{result.groupSyncRate}</span>
              <span className={styles.syncUnit}>%</span>
            </div>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatLabel}>참여</span>
              <span className={styles.heroStatValue}>{result.memberCount}</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatLabel}>질문</span>
              <span className={styles.heroStatValue}>{result.totalQuestions}</span>
            </div>
            <div className={styles.heroStatDivider} />
            <span
              className={
                result.groupSyncRate >= 60
                  ? styles.syncTagHigh
                  : result.groupSyncRate >= 40
                    ? styles.syncTagMid
                    : styles.syncTagLow
              }
            >
              {'싱크로율 '}
              <span className={styles.syncTagAccent}>
                {result.groupSyncRate >= 60 ? '높음' : result.groupSyncRate >= 40 ? '보통' : '낮음'}
              </span>
            </span>
          </div>
        </div>

        {displayResult.members.length < NETWORK_THRESHOLD ? (
          <ChemistryNetwork
            currentUserId={currentUserId}
            members={displayResult.members}
            pairs={pairs}
            onCompareRequest={
              isMember
                ? async (targetUserId: string) => {
                    try {
                      const res = await pairCompareMutation.mutateAsync(targetUserId);
                      router.push(`/compare/match/${res.token}`);
                    } catch {
                      showToast('1:1 비교 생성에 실패했어요');
                    }
                  }
                : undefined
            }
          />
        ) : (
          <ChemistryRanking
            currentUserId={currentUserId}
            members={displayResult.members}
            pairs={pairs}
            onCompareRequest={
              isMember
                ? async (targetUserId: string) => {
                    try {
                      const res = await pairCompareMutation.mutateAsync(targetUserId);
                      router.push(`/compare/match/${res.token}`);
                    } catch {
                      showToast('1:1 비교 생성에 실패했어요');
                    }
                  }
                : undefined
            }
          />
        )}
        <PickASide result={displayResult} currentUserId={currentUserId} />
        <PopularitySpectrum result={displayResult} currentUserId={currentUserId} />
        <GroupAwards awards={awards} currentUserId={currentUserId} />
        <RelationExplorer currentUserId={currentUserId} result={displayResult} pairs={pairs} />

        {/* ─── 성별 기반 (연애/결혼 카테고리 전용) ─── */}
        {displayResult.categoryCode && GENDER_CATEGORIES.includes(displayResult.categoryCode) && (
          <>
            <CrossGenderChemistry
              currentUserId={currentUserId}
              members={displayResult.members}
              pairs={pairs}
            />
            <GenderBattle result={displayResult} />
          </>
        )}

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

      {isPreview ? (
        <FloatingCta
          onClick={() => {
            const url = `${window.location.origin}/compare/${token}`;
            void navigator.clipboard.writeText(url);
            showToast('초대 링크가 복사되었어요');
          }}
        >
          초대 링크 복사하기
        </FloatingCta>
      ) : isMember ? (
        <div className={styles.floatingCta}>
          <div className={styles.floatingCtaRow}>
            <button
              type="button"
              className={styles.ctaOneToOne}
              onClick={() => setShowCompareModal(true)}
            >
              친구랑 1:1 비교하기
            </button>
            <button
              type="button"
              className={styles.ctaGroup}
              onClick={() => setShowGroupModal(true)}
            >
              새 그룹 만들기
            </button>
          </div>
        </div>
      ) : (
        <FloatingCta onClick={handleJoin} disabled={joinMutation.isPending}>
          {getJoinCtaText()}
        </FloatingCta>
      )}

      {showCompareModal && (
        <CreateCompareLink slug={result.bundleSlug} onClose={() => setShowCompareModal(false)} />
      )}
      {showGroupModal && (
        <CreateGroupLink slug={result.bundleSlug} onClose={() => setShowGroupModal(false)} />
      )}

      <DisplayNameModal
        isOpen={showDisplayNameModal}
        onClose={() => setShowDisplayNameModal(false)}
        onConfirm={handleDisplayNameConfirm}
        isLoading={joinMutation.isPending}
      />

      <EditGroupNameModal
        isOpen={showEditNameModal}
        currentName={result.groupName}
        onClose={() => setShowEditNameModal(false)}
        onConfirm={handleEditGroupName}
        isLoading={updateGroupNameMutation.isPending}
      />

      {toast.isVisible && <Toast message={toast.message} />}
    </BundleBackground>
  );
};

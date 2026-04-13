'use client';

import { useEffect, useMemo, useState, type FC } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';

import BackIcon from '@/assets/icon/BackIcon';
import LinkIcon from '@/assets/icon/LinkIcon';
import SettingsIcon from '@/assets/icon/SettingsIcon';
import { CategoryBadge } from '@/components/common/CategoryBadge/CategoryBadge';
import { FloatingCta } from '@/components/common/FloatingCta/FloatingCta';
import { Toast } from '@/components/common/Toast/Toast';
import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import { CreateCompareLink } from '@/components/features/Bundle/BundleResult/CreateCompareLink';
import { CreateGroupLink } from '@/components/features/Bundle/BundleResult/CreateGroupLink';
import { DisplayNameModal } from '@/components/features/Compare/DisplayNameModal/DisplayNameModal';
import { ChemistryNetwork } from '@/components/features/Compare/GroupResult/ChemistryNetwork';
import { ChemistryRanking } from '@/components/features/Compare/GroupResult/ChemistryRanking';
import { CrossGenderChemistry } from '@/components/features/Compare/GroupResult/CrossGenderChemistry';
import { GenderBattle } from '@/components/features/Compare/GroupResult/GenderBattle';
import { GroupAwards } from '@/components/features/Compare/GroupResult/GroupAwards';
import styles from '@/components/features/Compare/GroupResult/GroupResult.module.scss';
import { PickASide } from '@/components/features/Compare/GroupResult/PickASide';
import { PopularitySpectrum } from '@/components/features/Compare/GroupResult/PopularitySpectrum';
import {
  GroupSettingsModal,
  type GroupSettings,
} from '@/components/features/Compare/GroupSettingsModal/GroupSettingsModal';
import {
  calcAllPairChemistry,
  calcGroupAwards,
  calcGroupSyncRate,
} from '@/constants/group-compare';
import { GHOST_USER_PREFIX, WITHDRAWN_NICKNAME } from '@/constants/profileColors';
import { useAuth } from '@/contexts/AuthContext';
import {
  compareKeys,
  useCreatePairCompare,
  useGroupCompareResult,
  useJoinCompareLink,
  useUpdateGroupSettings,
  useUpdateMyGroupProfile,
} from '@/hooks/api/useCompare';
import { useToast } from '@/hooks/useToast';
import { trackGroupResult } from '@/lib/analytics';

/** 네트워크 그래프 → 케미 랭킹 전환 임계값 */
const NETWORK_THRESHOLD = 16;

/** 프리뷰용 가상 멤버 이름 */
const GHOST_NAMES = ['멤버 A', '멤버 B', '멤버 C', '멤버 D'];

/** 가상 멤버 답변 생성 (시드 기반 고정 패턴) */
function generateGhostAnswers(
  electionIds: string[],
  seed: number
): Array<{ electionId: string; electionItemId: string }> {
  return electionIds.map((id, i) => ({
    electionId: id,
    electionItemId: `${id}-${(seed + i) % 2 === 0 ? 'A' : 'B'}`,
  }));
}

interface GroupResultProps {
  token: string;
}

export const GroupResult: FC<GroupResultProps> = ({ token }) => {
  const { isLoggedIn, requireLogin } = useAuth();
  const { data: result, isLoading, refetch } = useGroupCompareResult(token);
  const joinMutation = useJoinCompareLink(token);
  const pairCompareMutation = useCreatePairCompare(token);
  const updateGroupSettingsMutation = useUpdateGroupSettings(token);
  const updateMyProfileMutation = useUpdateMyGroupProfile(token);
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showBack = searchParams.get('from') === 'my';
  const joinAfter = searchParams.get('joinAfter') === 'true';
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const { toast, showToast } = useToast();

  // GA4: 그룹 비교 결과 조회
  useEffect(() => {
    if (result && (result.members ?? []).length > 1) {
      trackGroupResult(result.bundleSlug ?? '', result.memberCount ?? 0);
    }
  }, [result]);

  // 프리뷰 모드: 실제 멤버가 1명뿐일 때 (생성자·비멤버 모두)
  const isCreator = result ? result.creatorUserId === result.myUserId : false;
  const isPreview = (result?.members ?? []).length === 1;

  // bundle/play 완료 후 돌아왔으면 자동으로 displayName 팝업 열기
  useEffect(() => {
    if (!joinAfter || !result || isLoading) {
      return;
    }
    const alreadyMember = (result.members ?? []).some((m) => m.userId === result.myUserId);
    if (result.myBundleCompleted && !alreadyMember) {
      setShowDisplayNameModal(true);
      // URL에서 joinAfter 파라미터 제거 (뒤로가기 시 재트리거 방지)
      const url = new URL(window.location.href);
      url.searchParams.delete('joinAfter');
      window.history.replaceState(null, '', url.toString());
    }
  }, [joinAfter, result, isLoading]);

  // displayName이 있으면 nickname 대신 사용 (모든 하위 컴포넌트에 일괄 적용)
  const displayResult = useMemo(() => {
    if (!result) {
      return null;
    }

    const realMembers = (result.members ?? []).map((m) => ({
      ...m,
      userId: m.userId ?? '',
      // FE 방어: BE에서 마스킹하지만 혹시 모를 경우 대비
      nickname: m.isWithdrawn ? WITHDRAWN_NICKNAME : (m.displayName ?? m.nickname ?? ''),
    }));

    // 프리뷰: 가상 멤버 3명 추가
    if (realMembers.length === 1) {
      const electionIds = (result.questionStats ?? []).map((q) => q.electionId ?? '');
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

  const groupSyncRate = useMemo(
    () => (result ? calcGroupSyncRate(result.members ?? [], result.totalQuestions ?? 0) : 0),
    [result]
  );
  const pairs = useMemo(
    () => (displayResult ? calcAllPairChemistry(displayResult) : []),
    [displayResult]
  );
  const awards = useMemo(
    () => (displayResult ? calcGroupAwards(displayResult, pairs) : []),
    [displayResult, pairs]
  );
  // 현재 유저가 이 그룹의 멤버인지 (group-result 응답에서 판별)
  const isMember = result
    ? (result.members ?? []).some((m) => m.userId === result.myUserId)
    : false;

  const handleSaveSettings = async (settings: GroupSettings) => {
    setShowSettingsModal(false);
    try {
      await updateGroupSettingsMutation.mutateAsync(settings);
      await queryClient.invalidateQueries({ queryKey: compareKeys.groupResult(token) });
      await queryClient.invalidateQueries({ queryKey: compareKeys.link(token) });
    } catch {
      // 실패 시 원래 설정 유지
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

  // 멤버가 아직 없는 경우 (엣지케이스: 생성 직후 아무도 참여 안 함)
  if (result && result.memberCount === 0) {
    return (
      <BundleBackground>
        <div className={styles.loading}>
          아직 참여한 멤버가 없어요.
          <p style={{ fontSize: 13, color: '#8a8a8a', marginTop: 8 }}>
            초대 링크를 공유하면 멤버들이 참여할 수 있어요.
          </p>
          <button
            type="button"
            className={styles.secondaryCta}
            style={{ maxWidth: 240 }}
            onClick={() => {
              const url = `${window.location.origin}/compare/group/${token}`;
              void navigator.clipboard.writeText(url);
            }}
          >
            초대 링크 복사하기
          </button>
        </div>
      </BundleBackground>
    );
  }

  if (!result || !displayResult) {
    return (
      <BundleBackground>
        <div className={styles.loading}>
          그룹 케미 결과를 찾을 수 없습니다.
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

  const currentUserId = result.myUserId ?? '';
  const myMember = (result.members ?? []).find((m) => m.userId === currentUserId);

  // ─── 비멤버 CTA 핸들러 ───
  const groupResultUrl = `/compare/group/${token}`;

  const handleJoin = () => {
    if (!isLoggedIn) {
      // LoginModal이 returnUrl 쿼리를 읽어 카카오 OAuth state에 포함시킨다
      // → 콜백 → 회원가입 → SignupForm이 bundleSlug를 파싱해 번들 플레이로 직행
      const extraParams = new URLSearchParams({
        bundleSlug: result.bundleSlug ?? '',
      });
      const returnUrl = `${window.location.pathname}?${extraParams.toString()}`;
      const url = new URL(window.location.href);
      url.searchParams.set('bundleSlug', result.bundleSlug ?? '');
      url.searchParams.set('returnUrl', returnUrl);
      window.history.replaceState(null, '', url.toString());
      requireLogin('compare');
      return;
    }
    if (!result.myBundleCompleted) {
      // 번들 완료 후 그룹 결과 페이지로 돌아와서 자동으로 displayName 팝업 열기
      const returnWithJoin = `${groupResultUrl}?joinAfter=true`;
      router.push(
        `/bundle/${result.bundleSlug}/play?returnUrl=${encodeURIComponent(returnWithJoin)}`
      );
      return;
    }
    setShowDisplayNameModal(true);
  };

  const handleDisplayNameConfirm = async (displayName: string, profileColor: string) => {
    try {
      await joinMutation.mutateAsync({ displayName, profileColor });
      setShowDisplayNameModal(false);
      await refetch();
    } catch {
      // 이미 참여한 경우 등
    }
  };

  const handleEditProfileConfirm = async (displayName: string, profileColor: string) => {
    try {
      await updateMyProfileMutation.mutateAsync({
        displayName,
        displayProfileColor: profileColor,
      });
      setShowEditProfileModal(false);
      await queryClient.invalidateQueries({ queryKey: compareKeys.groupResult(token) });
    } catch {
      // 실패 시 무시
    }
  };

  const getJoinCtaText = (isPreview: boolean = false) => {
    if (joinMutation.isPending) {
      return '참여 중...';
    }

    if (isPreview) {
      return '참여하기';
    }

    return '나도 참여하기';
  };

  return (
    <BundleBackground categoryCode={result?.categoryCode} categoryMeta={result?.categoryMeta}>
      <div className={styles.container}>
        <div className={styles.heroSection}>
          {isPreview && (
            <div className={styles.previewBanner}>
              <p className={styles.previewTitle}>아직 참여한 멤버가 없어요</p>
              <p className={styles.previewText}>
                지금 보고 있는 건 가상 데이터예요.
                <br />
                {isCreator
                  ? '친구들에게 초대 링크를 공유해주세요'
                  : '참여하면 진짜 결과를 볼 수 있어요'}
              </p>
            </div>
          )}
          <div className={styles.groupNameRow}>
            <div className={styles.groupNameLeft}>
              {showBack && (
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={() => router.back()}
                  aria-label="마이 탭으로 돌아가기"
                >
                  <BackIcon width={20} height={20} />
                </button>
              )}
            </div>
            <h1
              className={styles.groupName}
              title={result.groupName}
              onClick={() => {
                const url = `${window.location.origin}/compare/group/${token}`;
                void navigator.clipboard.writeText(url);
                showToast('초대 링크가 복사되었어요');
              }}
            >
              {result.groupName}
            </h1>
            <div className={styles.groupNameRight} style={{ display: 'flex', gap: '8px' }}>
              {isMember && (
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setShowSettingsModal(true)}
                  aria-label="그룹 설정"
                >
                  <SettingsIcon width={14} height={14} />
                </button>
              )}
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => {
                  const url = `${window.location.origin}/compare/group/${token}`;
                  void navigator.clipboard.writeText(url);
                  showToast('초대 링크가 복사되었어요');
                }}
                aria-label="초대 링크 복사"
              >
                <LinkIcon />
              </button>
            </div>
          </div>
          <span className={styles.bundleTitle}>
            <CategoryBadge
              categoryCode={result.categoryCode}
              categoryMeta={result.categoryMeta}
              label={result.category}
            />
            <span className={styles.bundleTitleDot}>·</span>
            {result.bundleTitle}
          </span>
          <div className={styles.syncRateDisplay}>
            <span className={styles.syncLabel}>그룹 싱크율</span>
            <div>
              <span className={styles.syncValue}>{groupSyncRate}</span>
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
                groupSyncRate >= 60
                  ? styles.syncTagHigh
                  : groupSyncRate >= 40
                    ? styles.syncTagMid
                    : styles.syncTagLow
              }
            >
              {'싱크로율 '}
              <span className={styles.syncTagAccent}>
                {groupSyncRate >= 60 ? '높음' : groupSyncRate >= 40 ? '보통' : '낮음'}
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
                      router.push(`/compare/match/${res.token}?from=group`);
                    } catch {
                      showToast('케미 상세보기 생성에 실패했어요');
                    }
                  }
                : undefined
            }
            onEditProfile={isMember ? () => setShowEditProfileModal(true) : undefined}
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
                      router.push(`/compare/match/${res.token}?from=group`);
                    } catch {
                      showToast('케미 상세보기 생성에 실패했어요');
                    }
                  }
                : undefined
            }
            onEditProfile={isMember ? () => setShowEditProfileModal(true) : undefined}
          />
        )}
        <PickASide result={displayResult} currentUserId={currentUserId} />
        <PopularitySpectrum result={displayResult} currentUserId={currentUserId} />
        <GroupAwards awards={awards} currentUserId={currentUserId} />

        {/* ─── 성별 기반 (이성 콘텐츠 토글 ON 시) ─── */}
        {displayResult.showGenderContent && (
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
              onClick={() => router.push(`/bundle/${result.bundleSlug}/result?from=group`)}
            >
              내 결과 다시 보기
            </button>
          </div>
        )}
      </div>

      {isPreview && !isMember ? (
        <FloatingCta onClick={handleJoin} disabled={joinMutation.isPending}>
          {getJoinCtaText(true)}
        </FloatingCta>
      ) : isPreview && isMember ? (
        <FloatingCta
          onClick={() => {
            const url = `${window.location.origin}/compare/group/${token}`;
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
              1:1 케미 따로 보기
            </button>
            <button
              type="button"
              className={styles.ctaGroup}
              onClick={() => setShowGroupModal(true)}
            >
              {isCreator ? '새 그룹 만들기' : '내 그룹 만들기'}
            </button>
          </div>
        </div>
      ) : (
        <FloatingCta onClick={handleJoin} disabled={joinMutation.isPending}>
          {getJoinCtaText()}
        </FloatingCta>
      )}

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
      {showGroupModal && (
        <CreateGroupLink
          slug={result.bundleSlug ?? ''}
          categoryCode={result.categoryCode}
          categoryMeta={result.categoryMeta}
          category={result.category}
          bundleTitle={result.bundleTitle}
          onClose={() => setShowGroupModal(false)}
        />
      )}

      <DisplayNameModal
        isOpen={showDisplayNameModal}
        categoryCode={result.categoryCode}
        categoryMeta={result.categoryMeta}
        onClose={() => setShowDisplayNameModal(false)}
        onConfirm={handleDisplayNameConfirm}
        isLoading={joinMutation.isPending}
      />

      <DisplayNameModal
        isOpen={showEditProfileModal}
        categoryCode={result.categoryCode}
        categoryMeta={result.categoryMeta}
        onClose={() => setShowEditProfileModal(false)}
        onConfirm={handleEditProfileConfirm}
        isLoading={updateMyProfileMutation.isPending}
        mode="edit"
        currentDisplayName={myMember?.displayName ?? myMember?.nickname}
        currentProfileColor={myMember?.displayProfileColor}
      />

      <GroupSettingsModal
        isOpen={showSettingsModal}
        currentName={result.groupName ?? ''}
        currentShowGenderContent={result.showGenderContent ?? false}
        isCreator={isCreator}
        categoryCode={result.categoryCode}
        categoryMeta={result.categoryMeta}
        onClose={() => setShowSettingsModal(false)}
        onConfirm={handleSaveSettings}
        isLoading={updateGroupSettingsMutation.isPending}
      />

      {toast.isVisible && <Toast message={toast.message} />}
    </BundleBackground>
  );
};

'use client';

import { useEffect, useMemo, useState, type CSSProperties, type FC } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';

import BackIcon from '@/assets/icon/BackIcon';
import LinkIcon from '@/assets/icon/LinkIcon';
import NewGroupIcon from '@/assets/icon/NewGroupIcon';
import SettingsIcon from '@/assets/icon/SettingsIcon';
import { BundleRecommendSection } from '@/components/common/BundleRecommendSection/BundleRecommendSection';
import { CategoryBadge } from '@/components/common/CategoryBadge/CategoryBadge';
import { FloatingCta } from '@/components/common/FloatingCta/FloatingCta';
import { Toast } from '@/components/common/Toast/Toast';
import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import { CreateCompareLink } from '@/components/features/Bundle/BundleResult/CreateCompareLink';
import { MemberDetailSheet } from '@/components/features/Compare/CompareResult/MemberDetailSheet';
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
import { PopularityBarGraph } from '@/components/features/Compare/PopularityBarGraph/PopularityBarGraph';
import {
  calcAllPairChemistry,
  calcGroupAwards,
  calcGroupSyncRate,
} from '@/constants/group-compare';
import { WITHDRAWN_NICKNAME } from '@/constants/profileColors';
import { useAuth } from '@/contexts/AuthContext';
import {
  compareKeys,
  useCompareLink,
  useGroupCompareResult,
  useJoinCompareLink,
  useUpdateGroupSettings,
  useUpdateMyGroupProfile,
} from '@/hooks/api/useCompare';
import { useToast } from '@/hooks/useToast';
import { trackGroupResult } from '@/lib/analytics';

/** 네트워크 그래프 → 케미 랭킹 전환 임계값 */
const NETWORK_THRESHOLD = 16;

interface FullGroupResultViewProps {
  token: string;
}

/**
 * 그룹 결과 본문.
 * 멤버/비멤버 모두 결과를 노출한다 — 비멤버는 결과를 보며 "나도 참여하기" 동기 형성.
 *
 * 참여자 수별 렌더:
 * - 2명+: 전체 섹션 노출 (ChemistryNetwork/PickASide/GroupAwards/...)
 * - 1명 (비멤버 진입 edge case): 비교 의존 섹션 숨김 + "아직 혼자예요" 플레이스홀더
 *   (생성자 본인 혼자는 GroupResult 라우터가 WaitingView로 분기)
 *
 * 플로팅 CTA:
 * - 멤버: "친구들 초대하기" (링크 복사)
 * - 비멤버: "나도 참여하기" (로그인→번들→join 흐름)
 */
export const FullGroupResultView: FC<FullGroupResultViewProps> = ({ token }) => {
  const { data: result, refetch } = useGroupCompareResult(token);
  const { data: link } = useCompareLink(token);
  const { isLoggedIn, requireLogin } = useAuth();
  const joinMutation = useJoinCompareLink(token);
  const updateGroupSettingsMutation = useUpdateGroupSettings(token);
  const updateMyProfileMutation = useUpdateMyGroupProfile(token);
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showBack = searchParams.get('from') === 'my';
  const joinAfter = searchParams.get('joinAfter') === 'true';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);
  const [memberSheetUserId, setMemberSheetUserId] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  // GA4
  useEffect(() => {
    if (result && (result.members ?? []).length > 1) {
      trackGroupResult(result.bundleSlug ?? '', result.memberCount ?? 0);
    }
  }, [result]);

  const isCreator =
    result && result.creatorUserId && result.myUserId
      ? result.creatorUserId === result.myUserId
      : false;

  const currentUserId = result?.myUserId ?? '';
  const members = result?.members ?? [];
  const isMember = members.some((m) => m.userId === currentUserId);
  const participantCount = members.length;
  const singleMember = participantCount === 1;

  // bundle/play 완료 후 복귀 시 자동으로 displayName 모달 열기 (비멤버만)
  useEffect(() => {
    if (!joinAfter || !result || isMember) {
      return;
    }
    if (result.myBundleCompleted) {
      setShowDisplayNameModal(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('joinAfter');
      window.history.replaceState(null, '', url.toString());
    }
  }, [joinAfter, result, isMember]);

  const displayResult = useMemo(() => {
    if (!result) {
      return null;
    }
    const realMembers = (result.members ?? []).map((m) => ({
      ...m,
      userId: m.userId ?? '',
      nickname: m.isWithdrawn ? WITHDRAWN_NICKNAME : (m.displayName ?? m.nickname ?? ''),
    }));
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

  if (!result || !displayResult) {
    return null;
  }

  const myMember = (result.members ?? []).find((m) => m.userId === currentUserId);

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

  const handleEditProfileConfirm = async (displayName: string, profileColor: string) => {
    try {
      await updateMyProfileMutation.mutateAsync({
        displayName,
        displayProfileColor: profileColor,
      });
      setShowEditProfileModal(false);
      await refetch();
    } catch {
      // 실패 시 무시
    }
  };

  // 멤버별 1:1 비교 — URL 변경 없이 바텀시트로 전환
  const handleMemberCompare = (targetUserId: string) => {
    if (targetUserId === currentUserId) {
      return;
    }
    setMemberSheetUserId(targetUserId);
  };

  // 비멤버 "나도 참여하기" — 상태별 분기
  const handleJoin = () => {
    if (!isLoggedIn) {
      // 카카오 OAuth state에 returnUrl 전달 → 콜백 후 같은 페이지로 복귀
      const bundleSlug = link?.bundleSlug ?? result.bundleSlug ?? '';
      const extraParams = new URLSearchParams({ bundleSlug, compareToken: token });
      const returnUrl = `${window.location.pathname}?${extraParams.toString()}`;
      const url = new URL(window.location.href);
      url.searchParams.set('bundleSlug', bundleSlug);
      url.searchParams.set('compareToken', token);
      url.searchParams.set('returnUrl', returnUrl);
      window.history.replaceState(null, '', url.toString());
      requireLogin('compare');
      return;
    }
    const bundleCompleted = link?.myBundleCompleted ?? result.myBundleCompleted ?? false;
    if (!bundleCompleted) {
      // 번들 완료 후 그룹 결과 페이지로 돌아와서 자동으로 displayName 팝업 열기
      const bundleSlug = link?.bundleSlug ?? result.bundleSlug ?? '';
      const returnWithJoin = `/compare/group/${token}?joinAfter=true`;
      router.push(`/bundle/${bundleSlug}/play?returnUrl=${encodeURIComponent(returnWithJoin)}`);
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
      // 이미 참여한 경우 등 — refetch로 최신 상태 갱신
      setShowDisplayNameModal(false);
      await refetch();
    }
  };

  const handleCopyInvite = () => {
    const url = `${window.location.origin}/compare/group/${token}`;
    void navigator.clipboard.writeText(url);
    showToast('초대 링크가 복사되었어요');
  };

  const joinCtaText = joinMutation.isPending ? '참여 중...' : '나도 참여하기';

  return (
    <BundleBackground categoryCode={result.categoryCode} categoryMeta={result.categoryMeta}>
      <div className={styles.container}>
        <div className={styles.heroSection}>
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
            <h1 className={styles.groupName} title={result.groupName} onClick={handleCopyInvite}>
              {result.groupName}
            </h1>
            <div
              className={styles.groupNameRight}
              style={{ display: 'flex', gap: '8px' } as CSSProperties}
            >
              {isMember && (
                <>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => setShowCreateModal(true)}
                    aria-label="다른 친구들과 새로 시작"
                    title="다른 친구들과 새로 시작"
                  >
                    <NewGroupIcon width={16} height={16} />
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => setShowSettingsModal(true)}
                    aria-label="그룹 설정"
                  >
                    <SettingsIcon width={14} height={14} />
                  </button>
                </>
              )}
              <button
                type="button"
                className={styles.iconButton}
                onClick={handleCopyInvite}
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
          {!singleMember && (
            <div className={styles.syncRateDisplay}>
              <span className={styles.syncLabel}>그룹 싱크율</span>
              <div>
                <span className={styles.syncValue}>{groupSyncRate}</span>
                <span className={styles.syncUnit}>%</span>
              </div>
            </div>
          )}
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatLabel}>참여</span>
              <span className={styles.heroStatValue}>{result.memberCount ?? participantCount}</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatLabel}>질문</span>
              <span className={styles.heroStatValue}>{result.totalQuestions}</span>
            </div>
            {!singleMember && (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* 참여자 1명 (비멤버 진입) 폴백 — 비교 의존 섹션 숨기고 참여 유도 배너 */}
        {singleMember && !isMember && (
          <div className={styles.singleMemberHint} role="status">
            <p className={styles.singleMemberTitle}>
              아직 {myMember?.displayName ?? '창작자'}님 혼자예요
            </p>
            <p className={styles.singleMemberText}>
              참여하면 답변을 비교해 케미 등급·공통점·의외의 차이가 열려요
            </p>
          </div>
        )}

        {/* 비교 의존 섹션 — 2명+ 일 때만 노출 */}
        {!singleMember && (
          <>
            {displayResult.members.length < NETWORK_THRESHOLD ? (
              <ChemistryNetwork
                currentUserId={currentUserId}
                members={displayResult.members}
                pairs={pairs}
                onCompareRequest={
                  isMember
                    ? async (targetUserId: string) => {
                        handleMemberCompare(targetUserId);
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
                        handleMemberCompare(targetUserId);
                      }
                    : undefined
                }
                onEditProfile={isMember ? () => setShowEditProfileModal(true) : undefined}
              />
            )}
            <PickASide result={displayResult} currentUserId={currentUserId} />
            <GroupAwards awards={awards} currentUserId={currentUserId} />
          </>
        )}

        {/* 단일 멤버도 의미 있는 섹션 — 항상 노출 */}
        <PopularityBarGraph questionStats={displayResult.questionStats ?? []} />
        <PopularitySpectrum result={displayResult} currentUserId={currentUserId} />

        {/* 성별 기반 (이성 콘텐츠 토글 ON) — 2명+ 일 때만 의미 */}
        {!singleMember && displayResult.showGenderContent && (
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

        <BundleRecommendSection
          currentSlug={result.bundleSlug ?? ''}
          contextName={result.groupName ?? undefined}
        />
      </div>

      {/* 플로팅 CTA — 멤버/비멤버 분기 */}
      {isMember ? (
        <FloatingCta onClick={handleCopyInvite}>친구들 초대하기</FloatingCta>
      ) : (
        <FloatingCta onClick={handleJoin} disabled={joinMutation.isPending}>
          {joinCtaText}
        </FloatingCta>
      )}

      {/* 멤버별 1:1 비교 바텀시트 */}
      {memberSheetUserId && (
        <MemberDetailSheet
          token={token}
          targetUserId={memberSheetUserId}
          onClose={() => setMemberSheetUserId(null)}
        />
      )}

      {showCreateModal && (
        <CreateCompareLink
          slug={result.bundleSlug ?? ''}
          categoryCode={result.categoryCode}
          categoryMeta={result.categoryMeta}
          category={result.category}
          bundleTitle={result.bundleTitle}
          onClose={() => setShowCreateModal(false)}
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

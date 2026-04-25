'use client';

import { useEffect, useMemo, useState, type FC } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';

import LinkIcon from '@/assets/icon/LinkIcon';
import PlusIcon from '@/assets/icon/PlusIcon';
import SettingsIcon from '@/assets/icon/SettingsIcon';
import { BundleRecommendSection } from '@/components/common/BundleRecommendSection/BundleRecommendSection';
import { CategoryBadge } from '@/components/common/CategoryBadge/CategoryBadge';
import { FloatingCta } from '@/components/common/FloatingCta/FloatingCta';
import { SmartBackButton } from '@/components/common/SmartBackButton/SmartBackButton';
import { Toast } from '@/components/common/Toast/Toast';
import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import { CreateCompareLink } from '@/components/features/Bundle/BundleResult/CreateCompareLink';
import { MemberDetailSheet } from '@/components/features/Compare/CompareResult/MemberDetailSheet';
import { DisplayNameModal } from '@/components/features/Compare/DisplayNameModal/DisplayNameModal';
import { CrossGenderChemistry } from '@/components/features/Compare/GroupResult/CrossGenderChemistry';
import { GenderBattle } from '@/components/features/Compare/GroupResult/GenderBattle';
import { GroupAwards } from '@/components/features/Compare/GroupResult/GroupAwards';
import grStyles from '@/components/features/Compare/GroupResult/GroupResult.module.scss';
import { LockedSectionPreview } from '@/components/features/Compare/GroupResult/LockedSectionPreview';
import { PickASide } from '@/components/features/Compare/GroupResult/PickASide';
import {
  GroupSettingsModal,
  type GroupSettings,
} from '@/components/features/Compare/GroupSettingsModal/GroupSettingsModal';
import { MyCompareLinksSheet } from '@/components/features/Compare/MyCompareLinksSheet/MyCompareLinksSheet';
import { CaptureButton } from '@/components/features/Compare/MyResultView/CaptureButton';
import { MemberMoreSection } from '@/components/features/Compare/MyResultView/MemberMoreSection';
import { MyExtremeAnswersSection } from '@/components/features/Compare/MyResultView/MyExtremeAnswersSection';
import { MyMedalSection } from '@/components/features/Compare/MyResultView/MyMedalSection';
import styles from '@/components/features/Compare/MyResultView/MyResultView.module.scss';
import type { OrbitMember } from '@/components/features/Compare/MyResultView/OrbitMap/orbit-draw';
import { OrbitMap } from '@/components/features/Compare/MyResultView/OrbitMap/OrbitMap';
import { renderShareCard } from '@/components/features/Compare/MyResultView/ShareCardCanvas';
import { getPersonaLabel } from '@/constants/bundle-persona-labels';
import {
  calcAllPairChemistry,
  calcGroupAwards,
  calcGroupSyncRate,
} from '@/constants/group-compare';
import { getMyMedals, type MyMedal } from '@/constants/my-medals';
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
import { useMyCompareLinks } from '@/hooks/api/useMyCompareLinks';
import { useToast } from '@/hooks/useToast';
import { trackGroupResult } from '@/lib/analytics';

interface MyResultViewProps {
  token: string;
}

/**
 * 그룹 결과 본문 (Redesign skeleton).
 * Layer 1/2/3 body sections are placeholders — filled in later tasks.
 * Hero / FloatingCta / modals / sheets are fully functional.
 */
export const MyResultView: FC<MyResultViewProps> = ({ token }) => {
  const { data: result, refetch } = useGroupCompareResult(token);
  const { data: link } = useCompareLink(token);
  const { isLoggedIn, requireLogin } = useAuth();
  const joinMutation = useJoinCompareLink(token);
  const updateGroupSettingsMutation = useUpdateGroupSettings(token);
  const updateMyProfileMutation = useUpdateMyGroupProfile(token);
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinAfter = searchParams.get('joinAfter') === 'true';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);
  const [showLinksSheet, setShowLinksSheet] = useState(false);
  const [memberSheetUserId, setMemberSheetUserId] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  const bundleSlug = result?.bundleSlug;
  const { data: myLinks } = useMyCompareLinks(isLoggedIn && bundleSlug ? bundleSlug : '');

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

  const orbitMembers = useMemo<OrbitMember[]>(() => {
    if (!displayResult) {
      return [];
    }
    return displayResult.members
      .filter((m) => m.userId !== currentUserId)
      .map((m) => {
        const pair = pairs.find(
          (p) =>
            (p.memberA === currentUserId && p.memberB === m.userId) ||
            (p.memberB === currentUserId && p.memberA === m.userId)
        );
        return {
          userId: m.userId,
          nickname: m.nickname,
          matchRate: pair?.matchRate ?? 0,
          profileColor: m.displayProfileColor,
        };
      });
  }, [displayResult, currentUserId, pairs]);

  const myMemberAnswers = useMemo(
    () => result?.members?.find((m) => m.userId === currentUserId)?.answers ?? [],
    [result, currentUserId]
  );

  const personaLabel = useMemo<MyMedal>(
    () => getPersonaLabel(result?.bundleSlug ?? undefined, currentUserId, myMemberAnswers),
    [result?.bundleSlug, currentUserId, myMemberAnswers]
  );

  if (!result || !displayResult) {
    return null;
  }

  const myMember = (result.members ?? []).find((m) => m.userId === currentUserId);

  const handleCapture = async (): Promise<Blob | null> => {
    const medals = getMyMedals(awards, currentUserId, personaLabel);
    return renderShareCard({
      members: orbitMembers,
      myNickname: myMember?.displayName ?? myMember?.nickname ?? '나',
      groupName: result.groupName ?? '',
      bundleTitle: result.bundleTitle ?? '',
      syncRate: groupSyncRate,
      topMedalTitle: medals.top.title,
      topMedalOneLiner: medals.top.oneLiner,
      topMedalPartner: medals.top.partnerNickname,
    });
  };

  // 같은 번들의 다른 GROUP 링크 — 현재 토큰 제외, 최근 생성순
  const myGroupLinks = (myLinks ?? [])
    .filter((l) => l.type === 'GROUP' && !!l.token && l.token !== token)
    .sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    });

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
      <div className={grStyles.container}>
        <div className={grStyles.heroSection}>
          <div className={grStyles.groupNameRow}>
            <div className={grStyles.groupNameLeft}>
              <SmartBackButton className={grStyles.backButton} />
            </div>
            <h1 className={grStyles.groupName} title={result.groupName} onClick={handleCopyInvite}>
              {result.groupName}
            </h1>
            <div className={grStyles.groupNameRight}>
              {isMember ? (
                <button
                  type="button"
                  className={grStyles.iconButton}
                  onClick={() => setShowSettingsModal(true)}
                  aria-label="그룹 설정"
                >
                  <SettingsIcon width={14} height={14} />
                </button>
              ) : (
                <button
                  type="button"
                  className={grStyles.iconButton}
                  onClick={handleCopyInvite}
                  aria-label="초대 링크 복사"
                >
                  <LinkIcon />
                </button>
              )}
            </div>
          </div>
          <span className={grStyles.bundleTitle}>
            <CategoryBadge
              categoryCode={result.categoryCode}
              categoryMeta={result.categoryMeta}
              label={result.category}
            />
            <span className={grStyles.bundleTitleDot}>·</span>
            {result.bundleTitle}
          </span>
          <div className={grStyles.heroStats}>
            <div className={grStyles.heroStat}>
              <span className={grStyles.heroStatLabel}>참여</span>
              <span className={grStyles.heroStatValue}>
                {result.memberCount ?? participantCount}
              </span>
            </div>
            <div className={grStyles.heroStatDivider} />
            <div className={grStyles.heroStat}>
              <span className={grStyles.heroStatLabel}>질문</span>
              <span className={grStyles.heroStatValue}>{result.totalQuestions}</span>
            </div>
            {!singleMember && (
              <>
                <div className={grStyles.heroStatDivider} />
                <div className={grStyles.heroStat}>
                  <span className={grStyles.heroStatLabel}>싱크로율</span>
                  <span className={grStyles.heroStatValue}>{groupSyncRate}%</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 참여자 1명 — 안내 배너 + 잠긴 섹션 프리뷰 3종.
            멤버/비멤버 모두 같은 레이아웃, 카피만 분기. */}
        {singleMember &&
          (() => {
            const firstMember = members[0];
            const singleMemberName = firstMember?.displayName ?? firstMember?.nickname ?? '참여자';
            const hintTitle = `아직 ${singleMemberName}님 혼자예요`;
            const hintText = isMember
              ? '친구가 참여하면 재미난 비교 결과를 볼 수 있어요'
              : '참여해서 비교하면 재미난 결과를 볼 수 있어요';
            return (
              <>
                <div className={grStyles.singleMemberHint} role="status">
                  <p className={grStyles.singleMemberTitle}>{hintTitle}</p>
                  <p className={grStyles.singleMemberText}>{hintText}</p>
                  {isMember && (
                    <button
                      type="button"
                      className={grStyles.singleMemberEditProfile}
                      onClick={() => {
                        setShowEditProfileModal(true);
                      }}
                    >
                      참여 프로필 수정
                    </button>
                  )}
                </div>
                <LockedSectionPreview
                  title="나의 훈장"
                  desc={isMember ? '친구가 참여하면 훈장이 열려요' : '참여하면 나의 훈장이 열려요'}
                  sketchType="my-medal"
                />
                <LockedSectionPreview
                  title="나의 위치"
                  desc={
                    isMember
                      ? '친구가 참여하면 궤도가 펼쳐져요'
                      : '참여하면 궤도에서 나의 자리가 펼쳐져요'
                  }
                  sketchType="orbit-map"
                />
                <LockedSectionPreview
                  title="혼자만 다르게 고른 답"
                  desc="친구가 참여해야 소수답 비교가 가능해요"
                  sketchType="my-extreme"
                />
              </>
            );
          })()}

        {/* Layer 1 */}
        <section className={styles.layer1} aria-label="나의 결과">
          {isMember && !singleMember && (
            <MyMedalSection
              myNickname={myMember?.displayName ?? myMember?.nickname ?? ''}
              awards={awards}
              currentUserId={currentUserId}
              personaLabel={personaLabel}
            />
          )}
          {!singleMember && (
            <OrbitMap
              members={orbitMembers}
              myNickname={myMember?.displayName ?? myMember?.nickname ?? '나'}
              isMember={isMember}
              onMemberTap={handleMemberCompare}
            />
          )}
          {isMember && !singleMember && (
            <MyExtremeAnswersSection result={displayResult} currentUserId={currentUserId} />
          )}
          {isMember && !singleMember && (
            <CaptureButton
              onCaptureRequest={handleCapture}
              shareTitle={`${result.bundleTitle ?? ''} 비교 결과`}
              shareText="HotPick에서 내 결과를 확인해봤어요"
            />
          )}
          {/* 비멤버: OrbitMap은 위에서 그대로 보이되 중앙 "나" 자리만 실루엣.
              훈장/소수답만 잠금 프리뷰로 가린다. CaptureButton은 비멤버 미노출. */}
          {!singleMember && !isMember && (
            <>
              <LockedSectionPreview
                title="나의 훈장"
                desc="참여하면 나만의 훈장 3단이 열려요"
                sketchType="my-medal"
              />
              <LockedSectionPreview
                title="혼자만 다르게 고른 답"
                desc="참여하면 소수 의견 TOP 3가 공개돼요"
                sketchType="my-extreme"
              />
            </>
          )}
        </section>

        {/* Layer 2 — 멤버/비멤버 모두 공개 */}
        <section className={styles.layer2} aria-label="나머지 지표">
          {!singleMember && (
            <>
              <GroupAwards
                awards={awards}
                currentUserId={currentUserId}
                excludeCurrentUserAwards={isMember}
              />
              <PickASide result={displayResult} currentUserId={currentUserId} />
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
            </>
          )}
        </section>

        {/* Layer 3 — 펼침 */}
        <section className={styles.layer3} aria-label="모든 멤버">
          {!singleMember && (
            <MemberMoreSection
              currentUserId={currentUserId}
              members={displayResult.members}
              pairs={pairs}
              onMemberTap={handleMemberCompare}
            />
          )}
        </section>

        {isMember && (
          <div className={grStyles.ctaSection}>
            <button
              type="button"
              className={grStyles.newGroupCta}
              onClick={() => setShowCreateModal(true)}
            >
              <PlusIcon width={14} height={14} />새 비교링크 만들기
            </button>
            {myGroupLinks.length > 0 && (
              <button
                type="button"
                className={grStyles.linksEntry}
                onClick={() => setShowLinksSheet(true)}
              >
                참여 중인 비교링크 {myGroupLinks.length}개 ›
              </button>
            )}
          </div>
        )}

        <BundleRecommendSection
          currentSlug={result.bundleSlug ?? ''}
          contextName={result.groupName ?? undefined}
        />
      </div>

      {/* 플로팅 CTA — 멤버/비멤버 분기 */}
      {isMember ? (
        <FloatingCta onClick={handleCopyInvite}>공유하기</FloatingCta>
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

      <MyCompareLinksSheet
        isOpen={showLinksSheet}
        links={myGroupLinks}
        onItemClick={(targetToken) => {
          setShowLinksSheet(false);
          router.push(`/compare/group/${targetToken}`);
        }}
        onClose={() => setShowLinksSheet(false)}
      />

      {toast.isVisible && <Toast message={toast.message} />}
    </BundleBackground>
  );
};

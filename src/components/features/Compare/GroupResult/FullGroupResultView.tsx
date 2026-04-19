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
import {
  compareKeys,
  useGroupCompareResult,
  useUpdateGroupSettings,
  useUpdateMyGroupProfile,
} from '@/hooks/api/useCompare';
import { useToast } from '@/hooks/useToast';
import { trackGroupResult } from '@/lib/analytics';

/** 네트워크 그래프 → 케미 랭킹 전환 임계값 */
const NETWORK_THRESHOLD = 16;

interface FullGroupResultViewProps {
  token: string;
  /** 마이그레이션 1:1→GROUP 링크 첫 진입 시 1회 노출 */
  showMigrationBanner?: boolean;
  onDismissMigrationBanner?: () => void;
}

/**
 * 정상 그룹 결과 본문 (멤버 + 참여자 2명+).
 * GroupResult가 라우터 역할을 하면서 이 컴포넌트로 분리됨.
 */
export const FullGroupResultView: FC<FullGroupResultViewProps> = ({
  token,
  showMigrationBanner = false,
  onDismissMigrationBanner,
}) => {
  const { data: result, refetch } = useGroupCompareResult(token);
  const updateGroupSettingsMutation = useUpdateGroupSettings(token);
  const updateMyProfileMutation = useUpdateMyGroupProfile(token);
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showBack = searchParams.get('from') === 'my';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [memberSheetUserId, setMemberSheetUserId] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  // GA4
  useEffect(() => {
    if (result && (result.members ?? []).length > 1) {
      trackGroupResult(result.bundleSlug ?? '', result.memberCount ?? 0);
    }
  }, [result]);

  const isCreator = result ? result.creatorUserId === result.myUserId : false;

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

  const currentUserId = result.myUserId ?? '';
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

  return (
    <BundleBackground categoryCode={result.categoryCode} categoryMeta={result.categoryMeta}>
      <div className={styles.container}>
        {/* 마이그레이션 1회 고지 배너 (1:1 → GROUP 전환 링크 첫 진입) */}
        {showMigrationBanner && (
          <div className={styles.migrationBanner} role="status">
            <span className={styles.migrationText}>
              이 테스트는 이제 다른 친구도 참여할 수 있어요
            </span>
            <button
              type="button"
              className={styles.migrationDismiss}
              onClick={onDismissMigrationBanner}
              aria-label="배너 닫기"
            >
              ×
            </button>
          </div>
        )}

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
            <div
              className={styles.groupNameRight}
              style={{ display: 'flex', gap: '8px' } as CSSProperties}
            >
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
            onCompareRequest={async (targetUserId: string) => {
              handleMemberCompare(targetUserId);
            }}
            onEditProfile={() => setShowEditProfileModal(true)}
          />
        ) : (
          <ChemistryRanking
            currentUserId={currentUserId}
            members={displayResult.members}
            pairs={pairs}
            onCompareRequest={async (targetUserId: string) => {
              handleMemberCompare(targetUserId);
            }}
            onEditProfile={() => setShowEditProfileModal(true)}
          />
        )}
        <PickASide result={displayResult} currentUserId={currentUserId} />
        <GroupAwards awards={awards} currentUserId={currentUserId} />
        <PopularityBarGraph questionStats={displayResult.questionStats ?? []} />
        <PopularitySpectrum result={displayResult} currentUserId={currentUserId} />

        {/* 성별 기반 (이성 콘텐츠 토글 ON) */}
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

        <div className={styles.ctaSection}>
          <button
            type="button"
            className={styles.secondaryCta}
            onClick={() => router.push(`/bundle/${result.bundleSlug}/result?from=group`)}
          >
            내 결과 다시 보기
          </button>
        </div>

        <BundleRecommendSection
          currentSlug={result.bundleSlug ?? ''}
          contextName={result.groupName ?? undefined}
        />
      </div>

      {/* 플로팅 CTA — "친구 초대하기" 단일 (새 그룹 만들기는 상단 NewGroupIcon 이관) */}
      <FloatingCta
        onClick={() => {
          const url = `${window.location.origin}/compare/group/${token}`;
          void navigator.clipboard.writeText(url);
          showToast('초대 링크가 복사되었어요');
        }}
      >
        친구들 초대하기
      </FloatingCta>

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

// src/components/features/MyPage/MyPageView.tsx
'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import BackIcon from '@/assets/icon/BackIcon';
import EditIcon from '@/assets/icon/EditIcon';
import PaletteIcon from '@/assets/icon/PaletteIcon';
import ProfileAvatar from '@/components/common/ProfileAvatar/ProfileAvatar';
import NicknameModal from '@/components/features/Auth/NicknameModal';
import { ProfileSkeleton } from '@/components/features/MyPage/MyPageSkeleton';
import styles from '@/components/features/MyPage/MyPageView.module.scss';
import ProfileColorModal from '@/components/features/MyPage/ProfileColorModal';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { deleteAccount } from '@/hooks/api/useAuthApi';
import { trackAuthWithdraw } from '@/lib/analytics';

const NICKNAME_CHANGE_INTERVAL_DAYS = 30;

const canChangeNickname = (lastChangedAt: string | null): boolean => {
  if (!lastChangedAt) {
    return true;
  }
  const last = new Date(lastChangedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= NICKNAME_CHANGE_INTERVAL_DAYS;
};

const getNextNicknameChangeDate = (lastChangedAt: string | null): string => {
  if (!lastChangedAt) {
    return '';
  }
  const next = new Date(lastChangedAt);
  next.setDate(next.getDate() + NICKNAME_CHANGE_INTERVAL_DAYS);
  return next.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
};

const MyPageView = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showConfirm, showToast } = useModal();
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);

  const handleLogout = () => {
    showConfirm('정말 로그아웃 하시겠습니까?', {
      onConfirm: async () => {
        await logout();
        window.location.href = '/';
      },
    });
  };

  const handleWithdraw = () => {
    showConfirm('정말 탈퇴하시겠습니까?\n모든 데이터가 삭제됩니다.', {
      onConfirm: async () => {
        try {
          await deleteAccount();
          trackAuthWithdraw();
          await logout();
          window.location.href = '/';
        } catch {
          showToast(
            '탈퇴 처리에 실패했어요. 잠시 후 다시 시도해주세요.\n문제가 계속되면 voteboxxxxx@gmail.com 으로 연락해주세요.'
          );
        }
      },
    });
  };

  const handleNicknameEdit = () => {
    if (!canChangeNickname(user?.lastNicknameChangedAt ?? null)) {
      const date = getNextNicknameChangeDate(user?.lastNicknameChangedAt ?? null);
      showToast(`닉네임은 ${date}부터 변경할 수 있어요`);
      return;
    }
    setShowNicknameModal(true);
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 뒤로가기 */}
      <button
        type="button"
        className={styles.backButton}
        onClick={() => router.back()}
        aria-label="뒤로가기"
      >
        <BackIcon width={24} height={24} />
      </button>

      {/* 프로필 영역 */}
      <div className={styles.profileSection}>
        <ProfileAvatar nickname={user.nickname} profileColor={user.profileColor} size={72} />
        <div className={styles.profileName}>
          {user.nickname ?? '닉네임 없음'}
          <span className={styles.profileSuffix}>님</span>
        </div>
      </div>

      {/* 관리 버튼 */}
      <div className={styles.actionButtons}>
        <button type="button" className={styles.actionButton} onClick={handleNicknameEdit}>
          <EditIcon width={14} height={14} />
          닉네임 변경
        </button>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => setShowColorModal(true)}
        >
          <PaletteIcon width={14} height={14} />
          프로필 색상
        </button>
      </div>

      {/* 구분선 */}
      <div className={styles.divider} />

      {/* 계정 관리 */}
      <div className={styles.accountSection}>
        <button type="button" className={styles.logoutButton} onClick={handleLogout}>
          로그아웃
        </button>
        <button type="button" className={styles.withdrawButton} onClick={handleWithdraw}>
          회원 탈퇴
        </button>
      </div>

      {/* 모달 */}
      {showNicknameModal && (
        <NicknameModal isOpen onClose={() => setShowNicknameModal(false)} mode="edit" />
      )}
      {showColorModal && <ProfileColorModal isOpen onClose={() => setShowColorModal(false)} />}
    </div>
  );
};

export default MyPageView;

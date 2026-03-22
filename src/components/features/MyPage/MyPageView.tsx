'use client';

import { useState } from 'react';

import UserIcon from '@/assets/icon/UserIcon';
import NicknameModal from '@/components/features/Auth/NicknameModal';
import MyCommentList from '@/components/features/MyPage/MyCommentList';
import styles from '@/components/features/MyPage/MyPageView.module.scss';
import MyVoteList from '@/components/features/MyPage/MyVoteList';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { deleteAccount } from '@/hooks/api/useAuthApi';

type Tab = 'votes' | 'comments';

const MyPageView = () => {
  const { user, logout } = useAuth();
  const { showConfirm } = useModal();
  const [activeTab, setActiveTab] = useState<Tab>('votes');
  const [showNicknameModal, setShowNicknameModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const handleWithdraw = () => {
    showConfirm('정말 탈퇴하시겠습니까?\n모든 데이터가 삭제됩니다.', {
      onConfirm: async () => {
        try {
          await deleteAccount();
          window.location.href = '/';
        } catch {
          // 실패 처리
        }
      },
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.profileSection}>
        <div className={styles.profileImage}>
          {user.profileImageUrl ? <img src={user.profileImageUrl} alt="프로필" /> : <UserIcon />}
        </div>
        <div className={styles.profileInfo}>
          <span className={styles.nickname}>{user.nickname ?? '닉네임 없음'}</span>
          <button
            type="button"
            className={styles.editButton}
            onClick={() => setShowNicknameModal(true)}
          >
            수정
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'votes' ? styles.active : ''}`}
          onClick={() => setActiveTab('votes')}
        >
          내 투표
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'comments' ? styles.active : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          내 댓글
        </button>
      </div>

      {activeTab === 'votes' ? <MyVoteList /> : <MyCommentList />}

      <div className={styles.footer}>
        <button type="button" className={styles.logoutButton} onClick={handleLogout}>
          로그아웃
        </button>
        <button type="button" className={styles.withdrawButton} onClick={handleWithdraw}>
          회원 탈퇴
        </button>
      </div>

      {showNicknameModal && <NicknameModal isOpen onClose={() => setShowNicknameModal(false)} />}
    </div>
  );
};

export default MyPageView;

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import LogoutIcon from '@/assets/icon/LogoutIcon';
import UserIcon from '@/assets/icon/UserIcon';
import ProfileAvatar from '@/components/common/ProfileAvatar/ProfileAvatar';
import styles from '@/components/features/Main/MainHeader/ProfileDropdown.module.scss';
import { useAuth } from '@/contexts/AuthContext';

const ProfileDropdown = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);

  const handleMyPage = () => {
    close();
    router.push('/my');
  };

  const handleLogout = async () => {
    close();
    await logout();
    window.location.href = '/';
  };

  // 바깥 클릭으로 닫기
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, close]);

  // ESC로 닫기
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  if (!user) {
    return null;
  }

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      <button type="button" className={styles.trigger} onClick={toggle} aria-label="프로필 메뉴">
        <ProfileAvatar nickname={user.nickname} profileColor={user.profileColor} size={32} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <button type="button" className={styles.menuItem} onClick={handleMyPage}>
            <UserIcon width={16} height={16} />
            <span>마이페이지</span>
          </button>
          <div className={styles.menuDivider} />
          <button
            type="button"
            className={`${styles.menuItem} ${styles.danger}`}
            onClick={handleLogout}
          >
            <LogoutIcon width={16} height={16} />
            <span>로그아웃</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;

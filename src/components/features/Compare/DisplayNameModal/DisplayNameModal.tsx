'use client';

import { useState, type FC } from 'react';

import { Modal } from '@/components/common/Modal/Modal';
import styles from '@/components/features/Compare/DisplayNameModal/DisplayNameModal.module.scss';
import { PROFILE_COLORS, getProfileGradient } from '@/constants/profileColors';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfileColor } from '@/hooks/api/useNickname';

interface DisplayNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (displayName: string) => void;
  isLoading?: boolean;
}

export const DisplayNameModal: FC<DisplayNameModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.nickname ?? '');
  const [useCurrentNickname, setUseCurrentNickname] = useState(true);
  const [selectedColor, setSelectedColor] = useState(user?.profileColor ?? 'purple');

  const currentNickname = user?.nickname ?? '';
  const currentColor = user?.profileColor ?? 'purple';
  const finalName = useCurrentNickname ? currentNickname : name.trim();

  const handleToggle = (useCurrent: boolean) => {
    setUseCurrentNickname(useCurrent);
    if (useCurrent) {
      setName(currentNickname);
      setSelectedColor(currentColor);
    } else {
      setName('');
    }
  };

  const handleConfirm = async () => {
    if (selectedColor !== currentColor) {
      try {
        await updateProfileColor(selectedColor);
        setUser(user ? { ...user, profileColor: selectedColor } : null);
      } catch {
        // 실패해도 참여는 진행
      }
    }
    onConfirm(finalName);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton maxWidth={400}>
      <div className={styles.container}>
        <h2 className={styles.title}>이 그룹에서 사용할 이름</h2>

        <div className={styles.options}>
          <button
            type="button"
            className={`${styles.optionButton} ${useCurrentNickname ? styles.selected : ''}`}
            onClick={() => handleToggle(true)}
          >
            <span className={styles.optionLabel}>현재 닉네임 사용</span>
            <div className={styles.currentProfile}>
              <div
                className={styles.profileDot}
                style={{ background: getProfileGradient(currentColor) }}
              />
              <span className={styles.optionNickname}>{currentNickname}</span>
            </div>
          </button>

          <button
            type="button"
            className={`${styles.optionButton} ${!useCurrentNickname ? styles.selected : ''}`}
            onClick={() => handleToggle(false)}
          >
            <span className={styles.optionLabel}>다른 이름 사용</span>
          </button>
        </div>

        {!useCurrentNickname && (
          <div className={styles.customSection}>
            <input
              className={styles.input}
              placeholder="이 그룹에서 사용할 이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <div className={styles.colorSection}>
              <span className={styles.colorLabel}>프로필 색상</span>
              <div className={styles.colorGrid}>
                {PROFILE_COLORS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    className={`${styles.colorButton} ${selectedColor === color.name ? styles.colorSelected : ''}`}
                    style={{ background: getProfileGradient(color.name) }}
                    onClick={() => setSelectedColor(color.name)}
                    aria-label={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          className={styles.confirmButton}
          onClick={handleConfirm}
          disabled={!finalName || isLoading}
        >
          {isLoading ? '참여 중...' : '참여하기'}
        </button>
      </div>
    </Modal>
  );
};

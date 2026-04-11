'use client';

import { useState, type FC } from 'react';

import { Modal } from '@/components/common/Modal/Modal';
import styles from '@/components/features/Compare/DisplayNameModal/DisplayNameModal.module.scss';
import { getCategoryThemeVars } from '@/constants/categoryTheme';
import { PROFILE_COLORS, getProfileGradient } from '@/constants/profileColors';
import { useAuth } from '@/contexts/AuthContext';
import type { CategoryCode } from '@/types/hotpick';

interface DisplayNameModalProps {
  isOpen: boolean;
  categoryCode?: CategoryCode;
  categoryMeta?: string | null;
  onClose: () => void;
  onConfirm: (displayName: string, profileColor: string) => void;
  isLoading?: boolean;
  mode?: 'join' | 'edit';
  /** 수정 모드에서 현재 사용 중인 displayName */
  currentDisplayName?: string;
  /** 수정 모드에서 현재 사용 중인 profileColor */
  currentProfileColor?: string;
}

export const DisplayNameModal: FC<DisplayNameModalProps> = ({
  isOpen,
  categoryCode,
  categoryMeta,
  onClose,
  onConfirm,
  isLoading,
  mode = 'join',
  currentDisplayName,
  currentProfileColor,
}) => {
  const { user } = useAuth();
  const currentNickname = user?.nickname ?? '';
  const currentColor = user?.profileColor ?? 'purple';

  // 수정 모드: 현재 displayName이 계정 닉네임과 다르면 "다른 이름 사용"이 기본
  const isEditWithCustomName =
    mode === 'edit' && currentDisplayName && currentDisplayName !== currentNickname;
  const [name, setName] = useState(isEditWithCustomName ? currentDisplayName : currentNickname);
  const [useCurrentNickname, setUseCurrentNickname] = useState(!isEditWithCustomName);
  const [selectedColor, setSelectedColor] = useState(currentProfileColor ?? currentColor);

  const finalName = useCurrentNickname ? currentNickname : name.trim();

  const handleToggle = (useCurrent: boolean) => {
    setUseCurrentNickname(useCurrent);
    if (useCurrent) {
      setName(currentNickname);
      setSelectedColor(currentColor);
    } else {
      setName(isEditWithCustomName ? (currentDisplayName ?? '') : '');
      setSelectedColor(currentProfileColor ?? currentColor);
    }
  };

  const handleConfirm = () => {
    onConfirm(finalName, selectedColor);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton maxWidth={400}>
      <div className={styles.container} style={getCategoryThemeVars(categoryCode, categoryMeta)}>
        <h2 className={styles.title}>이 그룹에서 사용할 이름</h2>

        <div className={styles.options}>
          <button
            type="button"
            className={`${styles.optionButton} ${useCurrentNickname ? styles.selected : ''}`}
            onClick={() => handleToggle(true)}
          >
            <span className={styles.optionLabel}>계정 닉네임 사용</span>
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
          {isLoading
            ? mode === 'edit'
              ? '수정 중...'
              : '참여 중...'
            : mode === 'edit'
              ? '수정하기'
              : '참여하기'}
        </button>
      </div>
    </Modal>
  );
};

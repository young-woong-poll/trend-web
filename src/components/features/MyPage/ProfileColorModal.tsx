'use client';

import { useState } from 'react';

import { Modal } from '@/components/common/Modal/Modal';
import styles from '@/components/features/MyPage/ProfileColorModal.module.scss';
import { PROFILE_COLORS, getProfileGradient } from '@/constants/profileColors';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfileColor } from '@/hooks/api/useNickname';

interface ProfileColorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileColorModal = ({ isOpen, onClose }: ProfileColorModalProps) => {
  const { user, setUser } = useAuth();
  const [selected, setSelected] = useState(user?.profileColor ?? 'purple');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (selected === user?.profileColor) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfileColor(selected);
      setUser(user ? { ...user, profileColor: selected } : null);
      onClose();
    } catch {
      // 실패 시 무시
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnDimmedClick showCloseButton maxWidth={360}>
      <div className={styles.container}>
        <h2 className={styles.title}>프로필 색상</h2>
        <div className={styles.grid}>
          {PROFILE_COLORS.map((color) => (
            <button
              key={color.name}
              type="button"
              className={`${styles.colorButton} ${selected === color.name ? styles.selected : ''}`}
              style={{ background: getProfileGradient(color.name) }}
              onClick={() => setSelected(color.name)}
              aria-label={color.name}
            />
          ))}
        </div>
        <button
          type="button"
          className={styles.saveButton}
          onClick={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? '변경 중...' : '변경'}
        </button>
      </div>
    </Modal>
  );
};

export default ProfileColorModal;

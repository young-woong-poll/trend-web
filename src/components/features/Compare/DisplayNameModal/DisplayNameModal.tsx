'use client';

import { useState, type FC } from 'react';

import { Modal } from '@/components/common/Modal/Modal';
import styles from '@/components/features/Compare/DisplayNameModal/DisplayNameModal.module.scss';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const [name, setName] = useState(user?.nickname ?? '');
  const [useCurrentNickname, setUseCurrentNickname] = useState(true);

  const currentNickname = user?.nickname ?? '';
  const finalName = useCurrentNickname ? currentNickname : name.trim();

  const handleToggle = (useCurrent: boolean) => {
    setUseCurrentNickname(useCurrent);
    if (useCurrent) {
      setName(currentNickname);
    } else {
      setName('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton maxWidth={400}>
      <div className={styles.container}>
        <h2 className={styles.title}>그룹에서 사용할 이름</h2>
        <p className={styles.description}>그룹 멤버들이 나를 알아볼 수 있는 이름을 설정해주세요</p>

        <div className={styles.options}>
          <button
            type="button"
            className={`${styles.optionButton} ${useCurrentNickname ? styles.selected : ''}`}
            onClick={() => handleToggle(true)}
          >
            <span className={styles.optionLabel}>현재 닉네임 사용</span>
            <span className={styles.optionValue}>{currentNickname}</span>
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
          <input
            className={styles.input}
            placeholder="이 그룹에서 사용할 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoFocus
          />
        )}

        <button
          type="button"
          className={styles.confirmButton}
          onClick={() => onConfirm(finalName)}
          disabled={!finalName || isLoading}
        >
          {isLoading ? '참여 중...' : '이 이름으로 참여하기'}
        </button>
      </div>
    </Modal>
  );
};

'use client';

import { useState, type FC } from 'react';

import { Modal } from '@/components/common/Modal/Modal';
import styles from '@/components/features/Compare/EditGroupNameModal/EditGroupNameModal.module.scss';

interface EditGroupNameModalProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  isLoading?: boolean;
}

export const EditGroupNameModal: FC<EditGroupNameModalProps> = ({
  isOpen,
  currentName,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [name, setName] = useState(currentName);

  const trimmed = name.trim();
  const isChanged = trimmed !== '' && trimmed !== currentName;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton maxWidth={400}>
      <div className={styles.container}>
        <h2 className={styles.title}>그룹 이름 변경</h2>
        <p className={styles.description}>그룹 멤버들에게 보여질 이름을 수정해주세요</p>

        <input
          className={styles.input}
          placeholder="그룹 이름을 입력하세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoFocus
        />

        <button
          type="button"
          className={styles.confirmButton}
          onClick={() => onConfirm(trimmed)}
          disabled={!isChanged || isLoading}
        >
          {isLoading ? '변경 중...' : '변경하기'}
        </button>
      </div>
    </Modal>
  );
};

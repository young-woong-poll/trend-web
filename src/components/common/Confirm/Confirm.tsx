'use client';

import type { FC } from 'react';

import { Button } from '@/components/common/Button';
import styles from '@/components/common/Confirm/Confirm.module.scss';
import { Modal } from '@/components/common/Modal/Modal';

interface ConfirmProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  closeOnDimmedClick?: boolean;
}

export const Confirm: FC<ConfirmProps> = ({
  isOpen,
  title,
  message,
  confirmText = '그만두기',
  cancelText = '취소',
  onConfirm,
  onCancel,
  closeOnDimmedClick = false,
}) => (
  <Modal isOpen={isOpen} onClose={onCancel} closeOnDimmedClick={closeOnDimmedClick} maxWidth={360}>
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        {message && <p className={styles.message}>{message}</p>}
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel} fullWidth height={48}>
          {cancelText}
        </Button>
        <Button variant="primary" onClick={onConfirm} fullWidth height={48}>
          {confirmText}
        </Button>
      </div>
    </div>
  </Modal>
);

'use client';

import { type FC } from 'react';

import styles from '@/components/common/Alert/Alert.module.scss';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal/Modal';

interface AlertProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  onConfirm: () => void;
  closeOnDimmedClick?: boolean;
  showCloseButton?: boolean;
}

export const Alert: FC<AlertProps> = ({
  isOpen,
  title,
  message,
  confirmText = '확인',
  onConfirm,
  closeOnDimmedClick = false,
  showCloseButton = true,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onConfirm}
    closeOnDimmedClick={closeOnDimmedClick}
    showCloseButton={showCloseButton}
    maxWidth={360}
  >
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        {message && <p className={styles.message}>{message}</p>}
      </div>

      <div className={styles.actions}>
        <Button variant="primary" onClick={onConfirm} fullWidth height={48}>
          {confirmText}
        </Button>
      </div>
    </div>
  </Modal>
);

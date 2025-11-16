'use client';

import { useState, type FC } from 'react';

import styles from '@/components/common/Alert/Alert.module.scss';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal/Modal';

interface AlertProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value?: string) => void;
  onCancel?: () => void;
  onClose?: () => void;
  closeOnDimmedClick?: boolean;
  showCloseButton?: boolean;
  inputType?: 'text' | 'number';
  inputPlaceholder?: string;
  inputValue?: string;
  inputError?: string;
  inputMaxLength?: number;
  onInputChange?: (value: string) => void;
}

export const Alert: FC<AlertProps> = ({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText,
  onConfirm,
  onCancel,
  onClose,
  closeOnDimmedClick = false,
  showCloseButton = true,
  inputType,
  inputPlaceholder,
  inputValue: externalInputValue,
  inputError,
  inputMaxLength,
  onInputChange,
}) => {
  const [internalInputValue, setInternalInputValue] = useState('');
  const inputValue = externalInputValue !== undefined ? externalInputValue : internalInputValue;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (onInputChange) {
      onInputChange(value);
    } else {
      setInternalInputValue(value);
    }
  };

  const handleConfirm = () => {
    if (inputType) {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      closeOnDimmedClick={closeOnDimmedClick}
      showCloseButton={showCloseButton}
      maxWidth={360}
    >
      <div className={styles.container}>
        <div className={styles.content}>
          <h2 className={styles.title}>{title}</h2>
          {message && <p className={styles.message}>{message}</p>}

          {inputType && (
            <div className={styles.inputWrapper}>
              <input
                type={inputType}
                className={`${styles.input} ${inputError ? styles.inputError : ''}`}
                placeholder={inputPlaceholder}
                value={inputValue}
                onChange={handleInputChange}
                maxLength={inputMaxLength}
              />
              {inputError && <p className={styles.errorMessage}>{inputError}</p>}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {cancelText && (
            <Button variant="secondary" onClick={handleCancel} fullWidth height={48}>
              {cancelText}
            </Button>
          )}
          <Button variant="primary" onClick={handleConfirm} fullWidth height={48}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

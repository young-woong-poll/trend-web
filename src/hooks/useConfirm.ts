import { useState } from 'react';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '확인',
    cancelText: '취소',
  });

  const showConfirm = (
    title: string,
    options?: {
      message?: string;
      confirmText?: string;
      cancelText?: string;
      onConfirm?: () => void;
    }
  ) => {
    setConfirmState({
      isOpen: true,
      title,
      message: options?.message,
      confirmText: options?.confirmText || '확인',
      cancelText: options?.cancelText || '취소',
      onConfirm: options?.onConfirm,
    });
  };

  const hideConfirm = () => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (confirmState.onConfirm) {
      confirmState.onConfirm();
    }
    hideConfirm();
  };

  const handleCancel = () => {
    hideConfirm();
  };

  return {
    confirmState,
    showConfirm,
    hideConfirm,
    handleConfirm,
    handleCancel,
  };
};

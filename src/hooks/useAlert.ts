import { useState } from 'react';

interface AlertState {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  onConfirm?: () => void;
}

export const useAlert = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '확인',
  });

  const showAlert = (
    title: string,
    options?: {
      message?: string;
      confirmText?: string;
      onConfirm?: () => void;
    }
  ) => {
    setAlertState({
      isOpen: true,
      title,
      message: options?.message,
      confirmText: options?.confirmText || '확인',
      onConfirm: options?.onConfirm,
    });
  };

  const hideAlert = () => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (alertState.onConfirm) {
      alertState.onConfirm();
    }
    hideAlert();
  };

  return {
    alertState,
    showAlert,
    hideAlert,
    handleConfirm,
  };
};

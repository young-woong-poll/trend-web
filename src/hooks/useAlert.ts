import { useState } from 'react';

interface AlertState {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  inputType?: 'text' | 'number';
  inputPlaceholder?: string;
  inputValue?: string;
  inputError?: string;
  inputMaxLength?: number;
  onConfirm?: (value?: string) => void;
  onCancel?: () => void;
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
      cancelText?: string;
      inputType?: 'text' | 'number';
      inputPlaceholder?: string;
      inputValue?: string;
      inputError?: string;
      inputMaxLength?: number;
      onConfirm?: (value?: string) => void;
      onCancel?: () => void;
    }
  ) => {
    setAlertState({
      isOpen: true,
      title,
      message: options?.message,
      confirmText: options?.confirmText || '확인',
      cancelText: options?.cancelText,
      inputType: options?.inputType,
      inputPlaceholder: options?.inputPlaceholder,
      inputValue: options?.inputValue,
      inputError: options?.inputError,
      inputMaxLength: options?.inputMaxLength,
      onConfirm: options?.onConfirm,
      onCancel: options?.onCancel,
    });
  };

  const hideAlert = () => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = (value?: string) => {
    if (alertState.onConfirm) {
      alertState.onConfirm(value);
    }
    hideAlert();
  };

  const handleCancel = () => {
    if (alertState.onCancel) {
      alertState.onCancel();
    }
    hideAlert();
  };

  const updateInputError = (error?: string) => {
    setAlertState((prev) => ({ ...prev, inputError: error }));
  };

  const updateInputValue = (value: string) => {
    setAlertState((prev) => ({ ...prev, inputValue: value }));
  };

  return {
    alertState,
    showAlert,
    hideAlert,
    handleConfirm,
    handleCancel,
    updateInputError,
    updateInputValue,
  };
};

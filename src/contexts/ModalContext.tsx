'use client';

import { createContext, useContext, type ReactNode } from 'react';

import { Alert } from '@/components/common/Alert/Alert';
import { Confirm } from '@/components/common/Confirm/Confirm';
import { Toast } from '@/components/common/Toast';
import { useAlert } from '@/hooks/useAlert';
import { useConfirm } from '@/hooks/useConfirm';
import { useToast } from '@/hooks/useToast';

interface ModalContextType {
  // Toast
  showToast: (message: string, icon?: ReactNode) => void;
  hideToast: () => void;
  // Confirm
  showConfirm: (
    title: string,
    options?: {
      message?: string;
      confirmText?: string;
      cancelText?: string;
      onConfirm?: () => void;
      onCancel?: () => void;
    }
  ) => void;
  hideConfirm: () => void;
  // Alert
  showAlert: (
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
  ) => void;
  hideAlert: () => void;
  updateInputError: (error?: string) => void;
  updateInputValue: (value: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider = ({ children }: ModalProviderProps) => {
  const { toast, showToast, hideToast } = useToast();
  const { confirmState, showConfirm, hideConfirm, handleConfirm, handleCancel } = useConfirm();
  const {
    alertState,
    showAlert,
    hideAlert,
    handleConfirm: handleAlertConfirm,
    handleCancel: handleAlertCancel,
    updateInputError,
    updateInputValue,
  } = useAlert();

  return (
    <ModalContext.Provider
      value={{
        showToast,
        hideToast,
        showConfirm,
        hideConfirm,
        showAlert,
        hideAlert,
        updateInputError,
        updateInputValue,
      }}
    >
      {/* 전역 모달 컴포넌트들 */}
      <Toast
        message={toast.message}
        icon={toast.icon}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
      <Confirm
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <Alert
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        inputType={alertState.inputType}
        inputPlaceholder={alertState.inputPlaceholder}
        inputValue={alertState.inputValue}
        inputError={alertState.inputError}
        inputMaxLength={alertState.inputMaxLength}
        onConfirm={handleAlertConfirm}
        onCancel={handleAlertCancel}
        onClose={hideAlert}
      />
      {children}
    </ModalContext.Provider>
  );
};

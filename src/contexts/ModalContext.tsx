'use client';

import { createContext, useContext, type ReactNode } from 'react';

import { Alert } from '@/components/common/Alert/Alert';
import { Confirm } from '@/components/common/Confirm/Confirm';
import { Modal } from '@/components/common/Modal/Modal';
import { Toast } from '@/components/common/Toast';
import { useAlert } from '@/hooks/useAlert';
import { useConfirm } from '@/hooks/useConfirm';
import { useCustomModal } from '@/hooks/useCustomModal';
import { useToast } from '@/hooks/useToast';

interface ModalContextType {
  // Toast
  showToast: (message: string, icon?: ReactNode) => void;
  hideToast: () => void;
  // Alert - 알림용 (확인 버튼만)
  showAlert: (
    title: string,
    options?: {
      message?: string;
      confirmText?: string;
      onConfirm?: () => void;
    }
  ) => void;
  hideAlert: () => void;
  // Confirm - 의사결정용 (확인/취소 버튼)
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
  // CustomModal - 커스텀 content용
  showModal: (content: ReactNode, options?: { onClose?: () => void }) => void;
  hideModal: () => void;
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
  const { alertState, showAlert, hideAlert, handleConfirm: handleAlertConfirm } = useAlert();
  const { modalState, showModal, hideModal, handleClose } = useCustomModal();

  return (
    <ModalContext.Provider
      value={{
        showToast,
        hideToast,
        showAlert,
        hideAlert,
        showConfirm,
        hideConfirm,
        showModal,
        hideModal,
      }}
    >
      {/* 전역 모달 컴포넌트들 */}
      <Toast
        message={toast.message}
        icon={toast.icon}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
      {/* Alert 컴포넌트들 */}
      <Alert
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        confirmText={alertState.confirmText}
        onConfirm={handleAlertConfirm}
      />
      {/* Confirm 컴포넌트들 */}
      <Confirm
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      {/* CustomModal - 커스텀 content용 */}
      <Modal isOpen={modalState.isOpen} onClose={handleClose} maxWidth={360}>
        {modalState.content}
      </Modal>
      {children}
    </ModalContext.Provider>
  );
};

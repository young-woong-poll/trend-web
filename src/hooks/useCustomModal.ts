import { type ReactNode, useState } from 'react';

interface CustomModalState {
  isOpen: boolean;
  content?: ReactNode;
  onClose?: () => void;
}

export const useCustomModal = () => {
  const [modalState, setModalState] = useState<CustomModalState>({
    isOpen: false,
  });

  const showModal = (content: ReactNode, options?: { onClose?: () => void }) => {
    setModalState({
      isOpen: true,
      content,
      onClose: options?.onClose,
    });
  };

  const hideModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleClose = () => {
    if (modalState.onClose) {
      modalState.onClose();
    }
    hideModal();
  };

  return {
    modalState,
    showModal,
    hideModal,
    handleClose,
  };
};

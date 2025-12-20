import { useCallback, useRef, useState } from 'react';

interface ToastState {
  isVisible: boolean;
  message: string;
  icon?: React.ReactNode;
  onClose?: () => void;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: '',
    icon: undefined,
    onClose: undefined,
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hideToast = useCallback(() => {
    setToast((prev) => ({
      ...prev,
      isVisible: false,
    }));
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const showToast = useCallback(
    (message: string, icon?: React.ReactNode, showClose?: boolean) => {
      // 이전 타이머가 있다면 제거
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setToast({
        isVisible: true,
        message,
        icon,
        onClose: showClose ? hideToast : undefined,
      });

      timeoutRef.current = setTimeout(() => {
        hideToast();
      }, 1000);
    },
    [hideToast]
  );

  return {
    toast,
    showToast,
    hideToast,
  };
};

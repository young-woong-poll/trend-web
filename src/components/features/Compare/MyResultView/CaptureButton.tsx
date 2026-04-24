'use client';

import { useState, type FC } from 'react';

import { Toast } from '@/components/common/Toast/Toast';
import styles from '@/components/features/Compare/MyResultView/CaptureButton.module.scss';
import { useToast } from '@/hooks/useToast';

interface CaptureButtonProps {
  /** 결과 캡처 시 호출 — PNG Blob 반환. 실패 시 null */
  onCaptureRequest: () => Promise<Blob | null>;
  shareTitle: string;
  shareText: string;
}

export const CaptureButton: FC<CaptureButtonProps> = ({
  onCaptureRequest,
  shareTitle,
  shareText,
}) => {
  const [capturing, setCapturing] = useState(false);
  const { toast, showToast } = useToast();

  const handleCapture = async () => {
    setCapturing(true);
    try {
      const blob = await onCaptureRequest();
      if (!blob) {
        showToast('캡처에 실패했어요');
        return;
      }
      const file = new File([blob], 'hotpick-result.png', { type: 'image/png' });
      // Web Share API(files) 우선 — 모바일에서 인스타 스토리/릴스로 직접 공유
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: shareTitle, text: shareText });
        return;
      }
      // 폴백: 다운로드
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hotpick-result.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('결과 이미지를 저장했어요');
    } catch {
      showToast('캡처에 실패했어요');
    } finally {
      setCapturing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.button}
        onClick={() => {
          void handleCapture();
        }}
        disabled={capturing}
      >
        {capturing ? '이미지 생성 중...' : '결과 캡처'}
      </button>
      {toast.isVisible && <Toast message={toast.message} />}
    </>
  );
};

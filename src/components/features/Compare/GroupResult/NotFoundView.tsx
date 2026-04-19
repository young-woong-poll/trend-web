'use client';

import { type FC } from 'react';

import { useRouter } from 'next/navigation';

import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import styles from '@/components/features/Compare/GroupResult/NotFoundView.module.scss';

interface NotFoundViewProps {
  /** 표시 메시지 — message 또는 isError 중 하나만 사용 */
  message?: string;
  /** API 호출 실패 (네트워크 등) — true면 재시도 카피/액션 노출 */
  isError?: boolean;
  /** isError=true일 때 재시도 핸들러 */
  onRetry?: () => void;
}

export const NotFoundView: FC<NotFoundViewProps> = ({ message, isError = false, onRetry }) => {
  const router = useRouter();

  const displayMessage =
    message ??
    (isError ? '결과를 불러오지 못했어요. 다시 시도해 주세요' : '케미 테스트를 찾을 수 없어요');

  return (
    <BundleBackground>
      <div className={styles.container}>
        <p className={styles.message}>{displayMessage}</p>
        {isError && onRetry ? (
          <button type="button" className={styles.ctaButton} onClick={onRetry}>
            다시 시도
          </button>
        ) : (
          <button type="button" className={styles.ctaButton} onClick={() => router.push('/')}>
            메인으로
          </button>
        )}
      </div>
    </BundleBackground>
  );
};

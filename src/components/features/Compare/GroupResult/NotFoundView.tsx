'use client';

import { type FC } from 'react';

import { useRouter } from 'next/navigation';

import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import styles from '@/components/features/Compare/GroupResult/NotFoundView.module.scss';

interface NotFoundViewProps {
  message?: string;
}

export const NotFoundView: FC<NotFoundViewProps> = ({
  message = '케미 테스트를 찾을 수 없어요',
}) => {
  const router = useRouter();

  return (
    <BundleBackground>
      <div className={styles.container}>
        <p className={styles.message}>{message}</p>
        <button type="button" className={styles.ctaButton} onClick={() => router.push('/')}>
          메인으로
        </button>
      </div>
    </BundleBackground>
  );
};

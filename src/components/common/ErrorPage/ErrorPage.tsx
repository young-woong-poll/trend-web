import Link from 'next/link';

import styles from '@/app/error.module.scss';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/common/Header/Header';

interface ErrorPageProps {
  message: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

export const ErrorPage = ({ message, showRetry = false, onRetry }: ErrorPageProps) => (
  <div className={styles.page}>
    <Header />
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.icon}
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
        </div>
        <p className={styles.message}>{message}</p>

        <p className={styles.contact}>
          해당 문제가 지속되면 아래 메일로 연락주세요
          <br />
          voteboxxxxx@gmail.com
        </p>

        {showRetry && onRetry && (
          <div className={styles.link}>
            <Button variant="primary" fullWidth height={48} onClick={onRetry}>
              다시 시도
            </Button>
          </div>
        )}

        <Link href="/" className={styles.link}>
          <Button variant={showRetry ? 'secondary' : 'primary'} fullWidth height={48}>
            홈으로 가기
          </Button>
        </Link>
      </div>
    </div>
  </div>
);

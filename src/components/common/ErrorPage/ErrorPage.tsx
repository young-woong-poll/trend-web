import Image from 'next/image';
import Link from 'next/link';

import mainLogo1x from '@/assets/img/main-logo@1x.png';
import { Button } from '@/components/common/Button';
import styles from '@/components/common/ErrorPage/ErrorPage.module.scss';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';

interface ErrorPageProps {
  message: string;
  statusCode?: string;
  showRetry?: boolean;
  simpleHeader?: boolean;
  onRetry?: () => void;
}

export const ErrorPage = ({
  message,
  statusCode,
  showRetry = false,
  simpleHeader = false,
  onRetry,
}: ErrorPageProps) => (
  <div className={styles.page}>
    {simpleHeader ? (
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logoContainer} aria-label="메인으로 이동">
            <Image src={mainLogo1x} alt="HotPick" className={styles.logo} priority height={24} />
          </Link>
        </div>
      </header>
    ) : (
      <MainHeader />
    )}
    <div className={styles.container}>
      <div className={styles.content}>
        {statusCode && <p className={styles.statusCode}>{statusCode}</p>}
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

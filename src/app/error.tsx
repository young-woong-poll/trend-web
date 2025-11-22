'use client';

import Link from 'next/link';

import styles from '@/app/error.module.scss';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/common/Header/Header';
import { VoteSubmissionError, VoteValidationError } from '@/lib/errors';

export default function Error({
  error,
  _reset,
}: {
  error: Error & { digest?: string };
  _reset: () => void;
}) {
  // 커스텀 에러 메시지 추출
  const getErrorMessage = () => {
    if (error instanceof VoteValidationError || error instanceof VoteSubmissionError) {
      return error.message;
    }
    return '예상치못한 에러가 발생했습니다.';
  };

  return (
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
          <p className={styles.message}>{getErrorMessage()}</p>

          <p className={styles.contact}>
            해당 문제가 지속되면 아래 메일로 연락주세요
            <br />
            voteboxxxxx@gmail.com
          </p>

          <Link href="/" className={styles.link}>
            <Button variant="primary" fullWidth height={48}>
              홈으로 가기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

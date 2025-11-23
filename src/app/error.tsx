'use client';

import Link from 'next/link';

import styles from '@/app/error.module.scss';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/common/Header/Header';
import { ApiFetchError, VoteSubmissionError, VoteValidationError } from '@/lib/errors';

import type { AxiosError } from 'axios';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // 커스텀 에러 메시지 추출
  const getErrorMessage = () => {
    // 커스텀 에러 메시지
    if (
      error instanceof VoteValidationError ||
      error instanceof VoteSubmissionError ||
      error instanceof ApiFetchError
    ) {
      return error.message;
    }

    // AxiosError 처리
    if ('isAxiosError' in error && error.isAxiosError) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        // 서버 응답이 있는 경우
        return '서버에서 오류가 발생했습니다.';
      } else if (axiosError.request) {
        // 요청은 보냈지만 응답이 없는 경우
        return '서버와 연결할 수 없습니다.';
      }
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

          <div className={styles.link}>
            <Button variant="primary" fullWidth height={48} onClick={reset}>
              다시 시도
            </Button>
          </div>

          <Link href="/" className={styles.link}>
            <Button variant="secondary" fullWidth height={48}>
              홈으로 가기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

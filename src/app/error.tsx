'use client';

import { ErrorPage } from '@/components/common/ErrorPage';
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

  return <ErrorPage message={getErrorMessage()} showRetry onRetry={reset} />;
}

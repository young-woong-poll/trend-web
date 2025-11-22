import { useCallback, useState } from 'react';

/**
 * async 함수에서 발생한 에러를 ErrorBoundary로 전달하는 훅
 *
 * @example
 * const handleError = useErrorHandler();
 *
 * const handleSubmit = async () => {
 *   try {
 *     await someAsyncFunction();
 *   } catch (error) {
 *     handleError(error); // ErrorBoundary가 캐치
 *   }
 * };
 */
export const useErrorHandler = () => {
  const [error, setError] = useState<Error | null>(null);

  // 에러가 설정되면 렌더링 중에 throw
  if (error) {
    throw error;
  }

  // catch 블록에서 호출할 함수
  const handleError = useCallback((err: unknown) => {
    setError(err instanceof Error ? err : new Error('Unknown error'));
  }, []);

  return handleError;
};

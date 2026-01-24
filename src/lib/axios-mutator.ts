import { type AxiosError, type AxiosRequestConfig } from 'axios';

import axiosInstance from '@/lib/axios';

/**
 * Orval에서 사용하는 커스텀 Axios 인스턴스
 * 기존 axiosInstance를 재사용하여 인터셉터 설정(BaseResponse.data 추출)을 유지합니다.
 */
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const controller = new AbortController();

  const promise = axiosInstance({
    ...config,
    ...options,
    signal: controller.signal,
  }).then(({ data }) => data as T);

  // React Query의 query cancellation 지원
  // @ts-expect-error - cancel 메서드를 promise에 추가
  promise.cancel = () => {
    controller.abort();
  };

  return promise;
};

export default customInstance;

// Orval이 필요로 하는 타입 export
export type ErrorType<Error> = AxiosError<Error>;
export type BodyType<BodyData> = BodyData;

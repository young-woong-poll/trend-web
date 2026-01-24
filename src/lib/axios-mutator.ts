import { type AxiosError, type AxiosRequestConfig } from 'axios';

import axiosInstance from '@/lib/axios';

/**
 * BaseResponse wrapper에서 data 필드 타입을 추출하는 유틸리티 타입
 * Orval이 BaseResponseXXX 타입을 생성하지만, axios 인터셉터가 .data를 추출하므로
 * 실제 반환 타입은 내부 data 필드의 타입입니다.
 */
type ExtractData<T> = T extends { data?: infer D } ? D : T;

/**
 * Orval에서 사용하는 커스텀 Axios 인스턴스
 * 기존 axiosInstance를 재사용하여 인터셉터 설정(BaseResponse.data 추출)을 유지합니다.
 */
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<ExtractData<T>> => {
  const controller = new AbortController();

  const promise = axiosInstance({
    ...config,
    ...options,
    signal: controller.signal,
  }).then(({ data }) => data as ExtractData<T>);

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

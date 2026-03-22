import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import type { BaseResponse } from '@/types/api';

/** _retry 플래그를 포함한 확장 요청 설정 */
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/** 실패한 요청 큐 항목 */
interface FailedQueueItem {
  resolve: (value: InternalAxiosRequestConfig) => void;
  reject: (reason: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

function processQueue(error: unknown | null, config: InternalAxiosRequestConfig | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (config) {
      resolve(config);
    }
  });
  failedQueue = [];
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://hotpick-api.votebox.kr',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) =>
    // 필요시 토큰 추가
    // const token = localStorage.getItem('token');
    // if (token && config.headers) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    config,
  (error: AxiosError) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    // BaseResponse 구조에서 data 필드만 추출
    if (response.data && 'data' in response.data && 'code' in response.data) {
      const baseResponse = response.data as BaseResponse<unknown>;
      response.data = baseResponse.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    // 401이 아닌 경우: 기존 에러 로깅 유지
    if (!error.response || error.response.status !== 401) {
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('Request error:', error.request);
      } else {
        console.error('Error:', error.message);
      }
      return Promise.reject(error);
    }

    // refresh 요청 자체가 401인 경우: 무한 루프 방지
    if (originalRequest?.url?.includes('/api/auth/refresh')) {
      return Promise.reject(error);
    }

    // 이미 재시도한 요청인 경우
    if (originalRequest?._retry) {
      return Promise.reject(error);
    }

    // 다른 요청이 이미 refresh 중이면 큐에 추가
    if (isRefreshing) {
      return new Promise<InternalAxiosRequestConfig>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((config) => axiosInstance(config));
    }

    // 토큰 갱신 시도
    if (originalRequest) {
      originalRequest._retry = true;
    }
    isRefreshing = true;

    try {
      await axiosInstance.post('/api/auth/refresh');

      processQueue(null, originalRequest);

      // 원래 요청 재시도
      return axiosInstance(originalRequest!);
    } catch (refreshError) {
      processQueue(refreshError);

      // 브라우저 환경에서만 로그아웃 이벤트 발행
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;

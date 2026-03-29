import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import type { BaseResponse } from '@/types/api';

// ─── 토큰 갱신 관련 타입 및 상태 ───

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface FailedQueueItem {
  resolve: () => void;
  reject: (reason: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];
let onForceLogout: (() => void) | null = null;

/** AuthProvider에서 로그아웃 콜백을 등록 */
export const setForceLogoutHandler = (handler: () => void) => {
  onForceLogout = handler;
};

function processQueue(error: unknown | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  failedQueue = [];
}

// ─── Response Interceptor: 성공 ───

/** BaseResponse 래퍼에서 data 필드만 추출 */
function unwrapBaseResponse(response: AxiosResponse) {
  if (response.data && 'data' in response.data && 'code' in response.data) {
    const baseResponse = response.data as BaseResponse<unknown>;
    response.data = baseResponse.data;
  }
  return response;
}

// ─── Response Interceptor: 에러 ───

/** 401 → 토큰 갱신 시도 후 원래 요청 재시도 */
async function retryWithTokenRefresh(error: AxiosError) {
  const originalRequest = error.config as RetryableRequestConfig | undefined;

  // refresh 요청 자체가 401 → 무한 루프 방지
  if (originalRequest?.url?.includes('/api/auth/refresh')) {
    return Promise.reject(error);
  }

  // 이미 재시도한 요청
  if (originalRequest?._retry) {
    return Promise.reject(error);
  }

  // 다른 요청이 이미 refresh 중이면 큐에 대기 후 자기 요청 재시도
  if (isRefreshing) {
    return new Promise<void>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then(() => axiosInstance(originalRequest!));
  }

  if (originalRequest) {
    originalRequest._retry = true;
  }
  isRefreshing = true;

  try {
    await axiosInstance.post('/api/auth/refresh');
    processQueue(null);
    return axiosInstance(originalRequest!);
  } catch (refreshError) {
    processQueue(refreshError);

    onForceLogout?.();

    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
}

/** 에러 로깅 후 reject */
function logAndReject(error: AxiosError) {
  if (error.response) {
    console.error('Response error:', error.response.status, error.response.data);
  } else if (error.request) {
    console.error('Request error:', error.request);
  } else {
    console.error('Error:', error.message);
  }
  return Promise.reject(error);
}

/** 에러 응답 분기 처리 */
async function handleResponseError(error: AxiosError) {
  if (error.response?.status === 401) {
    return retryWithTokenRefresh(error);
  }
  return logAndReject(error);
}

// ─── 인스턴스 생성 및 인터셉터 등록 ───

const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://hotpick-api.votebox.kr',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.response.use(unwrapBaseResponse, handleResponseError);

export default axiosInstance;

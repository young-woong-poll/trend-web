import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import type { BaseResponse } from '@/types/api';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://trend-api.votebox.kr',
  timeout: 10000,
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
  (error: AxiosError) => {
    if (error.response) {
      // 서버가 2xx 외의 상태 코드로 응답
      console.error('Response error:', error.response.status, error.response.data);
    } else if (error.request) {
      // 요청이 전송되었으나 응답을 받지 못함
      console.error('Request error:', error.request);
    } else {
      // 요청 설정 중 오류 발생
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

import type { LoginResponse, User } from '@/contexts/AuthContext';
import axiosInstance from '@/lib/axios';

export const postKakaoLogin = async (code: string, redirectUri: string): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>('/api/auth/kakao', {
    code,
    redirectUri,
  });
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await axiosInstance.get<User>('/api/auth/me');
  return response.data;
};

export const postLogout = async (): Promise<void> => {
  await axiosInstance.post('/api/auth/logout');
};

export const postLink = async (tkuId: string): Promise<{ linked: boolean; votesCount: number }> => {
  const response = await axiosInstance.post<{ linked: boolean; votesCount: number }>(
    '/api/auth/link',
    { tkuId }
  );
  return response.data;
};

export const deleteAccount = async (): Promise<void> => {
  await axiosInstance.delete('/api/auth/me');
};

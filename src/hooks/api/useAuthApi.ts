import type { LoginResponse, User } from '@/contexts/AuthContext';
import axiosInstance from '@/lib/axios';

export const postKakaoLogin = async (code: string, redirectUri: string): Promise<LoginResponse> => {
  const response = await axiosInstance.post('/api/auth/kakao', { code, redirectUri });
  return response as unknown as LoginResponse;
};

export const getMe = async (): Promise<User> => {
  const response = await axiosInstance.get('/api/auth/me');
  return response as unknown as User;
};

export const postRefresh = async (): Promise<void> => {
  await axiosInstance.post('/api/auth/refresh');
};

export const postLogout = async (): Promise<void> => {
  await axiosInstance.post('/api/auth/logout');
};

export const postLink = async (tkuId: string): Promise<{ linked: boolean; votesCount: number }> => {
  const response = await axiosInstance.post('/api/auth/link', { tkuId });
  return response as unknown as { linked: boolean; votesCount: number };
};

export const deleteAccount = async (): Promise<void> => {
  await axiosInstance.delete('/api/auth/me');
};

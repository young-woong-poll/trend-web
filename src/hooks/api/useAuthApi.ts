import type { LoginResponse, User } from '@/contexts/AuthContext';
import axiosInstance from '@/lib/axios';

export interface SignupProfileRequest {
  nickname: string;
  gender?: 'MALE' | 'FEMALE';
  ageGroup?: string;
}

export interface SignupProfileResponse {
  user: User;
  rewardCoins: number;
}

export const postKakaoLogin = async (code: string, redirectUri: string): Promise<LoginResponse> => {
  const response = await axiosInstance.post('/api/auth/kakao', { code, redirectUri });
  return response.data as LoginResponse;
};

export const getMe = async (): Promise<User> => {
  const response = await axiosInstance.get('/api/auth/me');
  return response.data as User;
};

export const postRefresh = async (): Promise<void> => {
  await axiosInstance.post('/api/auth/refresh');
};

export const postLogout = async (): Promise<void> => {
  await axiosInstance.post('/api/auth/logout');
};

export const postLink = async (tkuId: string): Promise<{ linked: boolean; votesCount: number }> => {
  const response = await axiosInstance.post('/api/auth/link', { tkuId });
  return response.data as { linked: boolean; votesCount: number };
};

export const deleteAccount = async (): Promise<void> => {
  await axiosInstance.delete('/api/auth/me');
};

export const postSignupProfile = async (
  data: SignupProfileRequest
): Promise<SignupProfileResponse> => {
  const response = await axiosInstance.post('/api/auth/signup/profile', data);
  return response.data as SignupProfileResponse;
};

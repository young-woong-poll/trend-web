import type { User } from '@/contexts/AuthContext';
import axiosInstance from '@/lib/axios';

export const getSuggestedNickname = async (): Promise<string> => {
  const response = await axiosInstance.get<{ nickname: string }>('/api/auth/nickname/suggest');
  return response.data.nickname;
};

export const checkNicknameAvailability = async (nickname: string): Promise<boolean> => {
  const response = await axiosInstance.get<{ available: boolean }>('/api/auth/nickname/check', {
    params: { nickname },
  });
  return response.data.available;
};

export const updateNickname = async (nickname: string): Promise<void> => {
  await axiosInstance.patch('/api/auth/me', { nickname });
};

export interface SignupResponse {
  user: User;
  needsLink: boolean;
}

export const submitSignup = async (data: {
  nickname: string;
  gender: 'male' | 'female' | null;
  birthYear: number | null;
}): Promise<SignupResponse> => {
  const response = await axiosInstance.patch<SignupResponse>('/api/auth/me', data);
  return response.data;
};

export const updateProfileColor = async (profileColor: string): Promise<void> => {
  await axiosInstance.patch('/api/auth/me', { profileColor });
};

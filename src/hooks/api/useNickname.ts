import axiosInstance from '@/lib/axios';
import { getSignupToken } from '@/lib/signupToken';

const signupAuthHeader = () => {
  const token = getSignupToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getSuggestedNickname = async (): Promise<string> => {
  const response = await axiosInstance.get<{ nickname: string }>('/api/auth/nickname/suggest', {
    headers: signupAuthHeader(),
  });
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

export const updateProfileColor = async (profileColor: string): Promise<void> => {
  await axiosInstance.patch('/api/auth/me', { profileColor });
};

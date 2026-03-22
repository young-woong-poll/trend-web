import axiosInstance from '@/lib/axios';

export const getSuggestedNickname = async (): Promise<string> => {
  const response = await axiosInstance.get('/api/auth/nickname/suggest');
  return (response as unknown as { nickname: string }).nickname;
};

export const checkNicknameAvailability = async (nickname: string): Promise<boolean> => {
  const response = await axiosInstance.get('/api/auth/nickname/check', {
    params: { nickname },
  });
  return (response as unknown as { available: boolean }).available;
};

export const updateNickname = async (nickname: string): Promise<void> => {
  await axiosInstance.patch('/api/auth/me', { nickname });
};

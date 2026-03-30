import type { LoginResponse, User } from '@/contexts/AuthContext';
import axiosInstance from '@/lib/axios';
import { getSignupToken } from '@/lib/signupToken';

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

export interface SignupLinkRequest {
  tkuId: string;
  votes: boolean;
  comments: boolean;
  likes: boolean;
}

export interface SignupRequest {
  nickname: string;
  link?: SignupLinkRequest | null;
}

export interface SignupLinkedResult {
  votes: number;
  comments: number;
  likes: number;
}

export interface SignupResponse {
  user: User;
  linked: SignupLinkedResult | null;
}

export const submitSignup = async (data: SignupRequest): Promise<SignupResponse> => {
  const token = getSignupToken();
  const response = await axiosInstance.post<SignupResponse>('/api/auth/signup', data, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data;
};

export const deleteAccount = async (): Promise<void> => {
  await axiosInstance.delete('/api/auth/me');
};

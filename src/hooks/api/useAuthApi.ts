import type { LoginResponse, User } from '@/contexts/AuthContext';
import {
  kakaoLogin,
  getMe as getMeApi,
  logout as logoutApi,
  signup as signupApi,
  deleteMe,
} from '@/generated/api/client/auth-controller/auth-controller';
import type {
  KakaoLoginResponse,
  SignupRequest as GeneratedSignupRequest,
  SignupResponse as GeneratedSignupResponse,
  UserResponse,
} from '@/generated/models';
import { getSignupToken } from '@/lib/signupToken';

/** BE UserResponse → FE User 변환 */
const toUser = (res: UserResponse): User => ({
  id: res.id,
  nickname: res.nickname ?? null,
  profileColor: res.profileColor ?? 'purple',
  lastNicknameChangedAt: res.lastNicknameChangedAt ?? null,
});

/** 카카오 로그인 */
export const postKakaoLogin = async (code: string, redirectUri: string): Promise<LoginResponse> => {
  const res = (await kakaoLogin({ code, redirectUri })) as KakaoLoginResponse;
  return {
    user: res.user ? toUser(res.user) : undefined,
    shouldSignup: res.shouldSignup ?? false,
    signupToken: res.signupToken,
  };
};

/** 내 정보 조회 */
export const getMe = async (): Promise<User> => {
  const res = (await getMeApi()) as UserResponse;
  return toUser(res);
};

/** 로그아웃 */
export const postLogout = async (): Promise<void> => {
  await logoutApi();
};

/** 회원가입 요청/응답 타입 */
export interface SignupRequest {
  nickname: string;
  tkuId?: string;
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

/** 회원가입 완료 */
export const submitSignup = async (data: SignupRequest): Promise<SignupResponse> => {
  const token = getSignupToken();
  // BE가 gender/birthYear를 optional(nullable)로 받도록 변경하기로 합의됨.
  // orval 재생성 전이라 generated 타입에는 필수로 남아있어 단언으로 우회.
  const body = {
    nickname: data.nickname,
    ...(data.tkuId ? { tkuId: data.tkuId } : {}),
  } as GeneratedSignupRequest;
  const res = (await signupApi(body, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })) as GeneratedSignupResponse;

  if (!res.user) {
    // signup 성공 응답이라면 user는 항상 포함되어야 함. 없으면 BE 계약 위반.
    throw new Error('회원가입 응답에 user 정보가 없습니다');
  }

  return {
    user: toUser(res.user),
    linked: res.linked
      ? {
          votes: res.linked.votes ?? 0,
          comments: res.linked.comments ?? 0,
          likes: res.linked.likes ?? 0,
        }
      : null,
  };
};

/** 회원 탈퇴 */
export const deleteAccount = async (): Promise<void> => {
  await deleteMe();
};

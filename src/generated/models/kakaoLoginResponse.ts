import type { UserResponse } from './userResponse';

/**
 * 응답 데이터
 */
export interface KakaoLoginResponse {
  shouldSignup?: boolean;
  user?: UserResponse;
  signupToken?: string;
}

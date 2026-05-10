import type { LinkedResult } from './linkedResult';
import type { UserResponse } from './userResponse';

/**
 * 응답 데이터
 */
export interface SignupResponse {
  user?: UserResponse;
  linked?: LinkedResult;
}

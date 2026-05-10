import type { NicknameChangeCooldownResponse } from './nicknameChangeCooldownResponse';

/**
 * 닉네임 변경 쿨다운 에러 응답
 */
export interface NicknameChangeCooldownErrorResponse {
  code?: string;
  message?: string;
  data?: NicknameChangeCooldownResponse;
}

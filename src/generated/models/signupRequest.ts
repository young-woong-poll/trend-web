import type { SignupRequestGender } from './signupRequestGender';

export interface SignupRequest {
  /**
   * @minLength 0
   * @maxLength 20
   */
  nickname: string;
  gender?: SignupRequestGender;
  birthYear?: number;
  tkuId?: string;
}

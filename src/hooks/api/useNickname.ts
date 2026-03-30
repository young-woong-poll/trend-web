import {
  checkNickname,
  updateProfile,
} from '@/generated/api/client/auth-controller/auth-controller';
import type { NicknameCheckResponse } from '@/generated/models';
import { getSignupToken } from '@/lib/signupToken';
import { generateUniqueNickname } from '@/lib/utils';

const signupAuthHeader = () => {
  const token = getSignupToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** 회원가입용 닉네임 추천 (FE 타임스탬프 기반 생성) */
export const getSuggestedNickname = (): string => generateUniqueNickname();

/** 닉네임 중복 확인 */
export const checkNicknameAvailability = async (nickname: string): Promise<boolean> => {
  const res = (await checkNickname(
    { nickname },
    { headers: signupAuthHeader() }
  )) as NicknameCheckResponse;
  return res.available ?? false;
};

/** 닉네임 변경 */
export const updateNickname = async (nickname: string): Promise<void> => {
  await updateProfile({ nickname });
};

/** 프로필 색상 변경 */
export const updateProfileColor = async (profileColor: string): Promise<void> => {
  await updateProfile({ profileColor });
};

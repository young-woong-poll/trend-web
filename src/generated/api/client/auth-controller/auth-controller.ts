import type {
  BaseResponseKakaoLoginResponse,
  BaseResponseMigrationStatusResponse,
  BaseResponseNicknameCheckResponse,
  BaseResponseSignupResponse,
  BaseResponseUserResponse,
  BaseResponseVoid,
  CheckNicknameParams,
  KakaoLoginRequest,
  SignupRequest,
  UpdateProfileRequest,
} from '../../../models';

import { customInstance } from '../../../../lib/axios-mutator';
import type { BodyType } from '../../../../lib/axios-mutator';

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const signup = (
  signupRequest: BodyType<SignupRequest>,
  options?: SecondParameter<typeof customInstance<BaseResponseSignupResponse>>
) => {
  return customInstance<BaseResponseSignupResponse>(
    {
      url: `/api/v1/auth/signup`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: signupRequest,
    },
    options
  );
};
export const refresh = (options?: SecondParameter<typeof customInstance<BaseResponseVoid>>) => {
  return customInstance<BaseResponseVoid>({ url: `/api/v1/auth/refresh`, method: 'POST' }, options);
};
export const logout = (options?: SecondParameter<typeof customInstance<BaseResponseVoid>>) => {
  return customInstance<BaseResponseVoid>({ url: `/api/v1/auth/logout`, method: 'POST' }, options);
};
export const kakaoLogin = (
  kakaoLoginRequest: BodyType<KakaoLoginRequest>,
  options?: SecondParameter<typeof customInstance<BaseResponseKakaoLoginResponse>>
) => {
  return customInstance<BaseResponseKakaoLoginResponse>(
    {
      url: `/api/v1/auth/kakao`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: kakaoLoginRequest,
    },
    options
  );
};
export const getMe = (
  options?: SecondParameter<typeof customInstance<BaseResponseUserResponse>>
) => {
  return customInstance<BaseResponseUserResponse>(
    { url: `/api/v1/auth/me`, method: 'GET' },
    options
  );
};
export const deleteMe = (options?: SecondParameter<typeof customInstance<BaseResponseVoid>>) => {
  return customInstance<BaseResponseVoid>({ url: `/api/v1/auth/me`, method: 'DELETE' }, options);
};
export const updateProfile = (
  updateProfileRequest: BodyType<UpdateProfileRequest>,
  options?: SecondParameter<typeof customInstance<unknown>>
) => {
  return customInstance<unknown>(
    {
      url: `/api/v1/auth/me`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      data: updateProfileRequest,
    },
    options
  );
};
export const checkNickname = (
  params: CheckNicknameParams,
  options?: SecondParameter<typeof customInstance<BaseResponseNicknameCheckResponse>>
) => {
  return customInstance<BaseResponseNicknameCheckResponse>(
    { url: `/api/v1/auth/nickname/check`, method: 'GET', params },
    options
  );
};
/**
 * 회원가입 prompt 분기용. x-tku-id 헤더가 비어있으면 hasMigratableData=false.
 * @summary TKUID에 묶인 마이그레이션 가능한 익명 데이터 존재 여부 조회
 */
export const getMigrationStatus = (
  options?: SecondParameter<typeof customInstance<BaseResponseMigrationStatusResponse>>
) => {
  return customInstance<BaseResponseMigrationStatusResponse>(
    { url: `/api/v1/auth/migration-status`, method: 'GET' },
    options
  );
};
export type SignupResult = NonNullable<Awaited<ReturnType<typeof signup>>>;
export type RefreshResult = NonNullable<Awaited<ReturnType<typeof refresh>>>;
export type LogoutResult = NonNullable<Awaited<ReturnType<typeof logout>>>;
export type KakaoLoginResult = NonNullable<Awaited<ReturnType<typeof kakaoLogin>>>;
export type GetMeResult = NonNullable<Awaited<ReturnType<typeof getMe>>>;
export type DeleteMeResult = NonNullable<Awaited<ReturnType<typeof deleteMe>>>;
export type UpdateProfileResult = NonNullable<Awaited<ReturnType<typeof updateProfile>>>;
export type CheckNicknameResult = NonNullable<Awaited<ReturnType<typeof checkNickname>>>;
export type GetMigrationStatusResult = NonNullable<Awaited<ReturnType<typeof getMigrationStatus>>>;

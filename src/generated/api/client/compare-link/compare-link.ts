import type {
  BaseResponseCompareLinkInfoResponse,
  BaseResponseCreatePairResponse,
  BaseResponseGroupCloseResponse,
  BaseResponseGroupCompareResultResponse,
  BaseResponseJoinCompareLinkResponse,
  BaseResponseOneToOneCompareResultResponse,
  BaseResponseVoid,
  CreatePairRequest,
  JoinCompareLinkRequest,
  UpdateGroupSettingsRequest,
  UpdateMyCompareProfileRequest,
} from '../../../models';

import { customInstance } from '../../../../lib/axios-mutator';
import type { BodyType } from '../../../../lib/axios-mutator';

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

/**
 * @summary 비교 링크 참여 (API 7, 로그인 필수)
 */
export const join = (
  token: string,
  joinCompareLinkRequest?: BodyType<JoinCompareLinkRequest>,
  options?: SecondParameter<typeof customInstance<BaseResponseJoinCompareLinkResponse>>
) => {
  return customInstance<BaseResponseJoinCompareLinkResponse>(
    {
      url: `/api/v1/compare-links/${token}/join`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: joinCompareLinkRequest,
    },
    options
  );
};
/**
 * @summary 그룹 내 1:1 pair 즉시 생성 (API 13, 로그인 필수)
 */
export const createPair = (
  groupToken: string,
  createPairRequest: BodyType<CreatePairRequest>,
  options?: SecondParameter<typeof customInstance<BaseResponseCreatePairResponse>>
) => {
  return customInstance<BaseResponseCreatePairResponse>(
    {
      url: `/api/v1/compare-links/${groupToken}/pair`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: createPairRequest,
    },
    options
  );
};
/**
 * @summary 그룹 설정 변경 (API 10, 생성자만)
 */
export const updateGroupSettings = (
  token: string,
  updateGroupSettingsRequest: BodyType<UpdateGroupSettingsRequest>,
  options?: SecondParameter<typeof customInstance<BaseResponseVoid>>
) => {
  return customInstance<BaseResponseVoid>(
    {
      url: `/api/v1/compare-links/${token}/settings`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      data: updateGroupSettingsRequest,
    },
    options
  );
};
/**
 * @summary 그룹 재오픈 (API 12, 생성자만)
 */
export const reopen = (
  token: string,
  options?: SecondParameter<typeof customInstance<BaseResponseGroupCloseResponse>>
) => {
  return customInstance<BaseResponseGroupCloseResponse>(
    { url: `/api/v1/compare-links/${token}/reopen`, method: 'PATCH' },
    options
  );
};
/**
 * @summary 그룹 내 내 프로필 수정 (API 14, 멤버만)
 */
export const updateMyCompareProfile = (
  token: string,
  updateMyCompareProfileRequest: BodyType<UpdateMyCompareProfileRequest>,
  options?: SecondParameter<typeof customInstance<BaseResponseVoid>>
) => {
  return customInstance<BaseResponseVoid>(
    {
      url: `/api/v1/compare-links/${token}/my-profile`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      data: updateMyCompareProfileRequest,
    },
    options
  );
};
/**
 * @summary 그룹 마감 (API 11, 생성자만)
 */
export const close = (
  token: string,
  options?: SecondParameter<typeof customInstance<BaseResponseGroupCloseResponse>>
) => {
  return customInstance<BaseResponseGroupCloseResponse>(
    { url: `/api/v1/compare-links/${token}/close`, method: 'PATCH' },
    options
  );
};
/**
 * @summary 비교 링크 정보 조회 (API 6, 비로그인 허용)
 */
export const getInfo = (
  token: string,
  options?: SecondParameter<typeof customInstance<BaseResponseCompareLinkInfoResponse>>
) => {
  return customInstance<BaseResponseCompareLinkInfoResponse>(
    { url: `/api/v1/compare-links/${token}`, method: 'GET' },
    options
  );
};
/**
 * @summary 1:1 비교 결과 (API 8, 로그인 필수)
 */
export const getOneToOneResult = (
  token: string,
  options?: SecondParameter<typeof customInstance<BaseResponseOneToOneCompareResultResponse>>
) => {
  return customInstance<BaseResponseOneToOneCompareResultResponse>(
    { url: `/api/v1/compare-links/${token}/result`, method: 'GET' },
    options
  );
};
/**
 * @summary 그룹 비교 결과 (API 9, 비로그인 허용)
 */
export const getGroupResult = (
  token: string,
  options?: SecondParameter<typeof customInstance<BaseResponseGroupCompareResultResponse>>
) => {
  return customInstance<BaseResponseGroupCompareResultResponse>(
    { url: `/api/v1/compare-links/${token}/group-result`, method: 'GET' },
    options
  );
};
export type JoinResult = NonNullable<Awaited<ReturnType<typeof join>>>;
export type CreatePairResult = NonNullable<Awaited<ReturnType<typeof createPair>>>;
export type UpdateGroupSettingsResult = NonNullable<
  Awaited<ReturnType<typeof updateGroupSettings>>
>;
export type ReopenResult = NonNullable<Awaited<ReturnType<typeof reopen>>>;
export type UpdateMyCompareProfileResult = NonNullable<
  Awaited<ReturnType<typeof updateMyCompareProfile>>
>;
export type CloseResult = NonNullable<Awaited<ReturnType<typeof close>>>;
export type GetInfoResult = NonNullable<Awaited<ReturnType<typeof getInfo>>>;
export type GetOneToOneResultResult = NonNullable<Awaited<ReturnType<typeof getOneToOneResult>>>;
export type GetGroupResultResult = NonNullable<Awaited<ReturnType<typeof getGroupResult>>>;

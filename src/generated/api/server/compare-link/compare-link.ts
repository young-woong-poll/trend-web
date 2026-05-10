import type {
  BaseResponseCompareLinkInfoResponse,
  BaseResponseCreatePairResponse,
  BaseResponseGroupCloseResponse,
  BaseResponseGroupCompareResultResponse,
  BaseResponseJoinCompareLinkResponse,
  BaseResponseObject,
  BaseResponseOneToOneCompareResultResponse,
  BaseResponseVoid,
  CreatePairRequest,
  JoinCompareLinkRequest,
  UpdateGroupSettingsRequest,
  UpdateMyCompareProfileRequest,
} from '../openAPIDefinition.schemas';

import { serverFetchInstance } from '../../../../lib/server-fetch-mutator';

export type joinResponse200 = {
  data: BaseResponseJoinCompareLinkResponse;
  status: 200;
};

export type joinResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type joinResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type joinResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type joinResponseSuccess = joinResponse200 & {
  headers: Headers;
};
export type joinResponseError = (joinResponse409 | joinResponse429 | joinResponse500) & {
  headers: Headers;
};

export type joinResponse = joinResponseSuccess | joinResponseError;

export const getJoinUrl = (token: string) => {
  return `/api/v1/compare-links/${token}/join`;
};

/**
 * @summary 비교 링크 참여 (API 7, 로그인 필수)
 */
export const join = async (
  token: string,
  joinCompareLinkRequest?: JoinCompareLinkRequest,
  options?: RequestInit
): Promise<joinResponse> => {
  return serverFetchInstance<joinResponse>(getJoinUrl(token), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(joinCompareLinkRequest),
  });
};

export type createPairResponse200 = {
  data: BaseResponseCreatePairResponse;
  status: 200;
};

export type createPairResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type createPairResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type createPairResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type createPairResponseSuccess = createPairResponse200 & {
  headers: Headers;
};
export type createPairResponseError = (
  | createPairResponse409
  | createPairResponse429
  | createPairResponse500
) & {
  headers: Headers;
};

export type createPairResponse = createPairResponseSuccess | createPairResponseError;

export const getCreatePairUrl = (groupToken: string) => {
  return `/api/v1/compare-links/${groupToken}/pair`;
};

/**
 * @summary 그룹 내 1:1 pair 즉시 생성 (API 13, 로그인 필수)
 */
export const createPair = async (
  groupToken: string,
  createPairRequest: CreatePairRequest,
  options?: RequestInit
): Promise<createPairResponse> => {
  return serverFetchInstance<createPairResponse>(getCreatePairUrl(groupToken), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(createPairRequest),
  });
};

export type updateGroupSettingsResponse200 = {
  data: BaseResponseVoid;
  status: 200;
};

export type updateGroupSettingsResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type updateGroupSettingsResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type updateGroupSettingsResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type updateGroupSettingsResponseSuccess = updateGroupSettingsResponse200 & {
  headers: Headers;
};
export type updateGroupSettingsResponseError = (
  | updateGroupSettingsResponse409
  | updateGroupSettingsResponse429
  | updateGroupSettingsResponse500
) & {
  headers: Headers;
};

export type updateGroupSettingsResponse =
  | updateGroupSettingsResponseSuccess
  | updateGroupSettingsResponseError;

export const getUpdateGroupSettingsUrl = (token: string) => {
  return `/api/v1/compare-links/${token}/settings`;
};

/**
 * @summary 그룹 설정 변경 (API 10, 생성자만)
 */
export const updateGroupSettings = async (
  token: string,
  updateGroupSettingsRequest: UpdateGroupSettingsRequest,
  options?: RequestInit
): Promise<updateGroupSettingsResponse> => {
  return serverFetchInstance<updateGroupSettingsResponse>(getUpdateGroupSettingsUrl(token), {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(updateGroupSettingsRequest),
  });
};

export type reopenResponse200 = {
  data: BaseResponseGroupCloseResponse;
  status: 200;
};

export type reopenResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type reopenResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type reopenResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type reopenResponseSuccess = reopenResponse200 & {
  headers: Headers;
};
export type reopenResponseError = (reopenResponse409 | reopenResponse429 | reopenResponse500) & {
  headers: Headers;
};

export type reopenResponse = reopenResponseSuccess | reopenResponseError;

export const getReopenUrl = (token: string) => {
  return `/api/v1/compare-links/${token}/reopen`;
};

/**
 * @summary 그룹 재오픈 (API 12, 생성자만)
 */
export const reopen = async (token: string, options?: RequestInit): Promise<reopenResponse> => {
  return serverFetchInstance<reopenResponse>(getReopenUrl(token), {
    ...options,
    method: 'PATCH',
  });
};

export type updateMyCompareProfileResponse200 = {
  data: BaseResponseVoid;
  status: 200;
};

export type updateMyCompareProfileResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type updateMyCompareProfileResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type updateMyCompareProfileResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type updateMyCompareProfileResponseSuccess = updateMyCompareProfileResponse200 & {
  headers: Headers;
};
export type updateMyCompareProfileResponseError = (
  | updateMyCompareProfileResponse409
  | updateMyCompareProfileResponse429
  | updateMyCompareProfileResponse500
) & {
  headers: Headers;
};

export type updateMyCompareProfileResponse =
  | updateMyCompareProfileResponseSuccess
  | updateMyCompareProfileResponseError;

export const getUpdateMyCompareProfileUrl = (token: string) => {
  return `/api/v1/compare-links/${token}/my-profile`;
};

/**
 * @summary 그룹 내 내 프로필 수정 (API 14, 멤버만)
 */
export const updateMyCompareProfile = async (
  token: string,
  updateMyCompareProfileRequest: UpdateMyCompareProfileRequest,
  options?: RequestInit
): Promise<updateMyCompareProfileResponse> => {
  return serverFetchInstance<updateMyCompareProfileResponse>(getUpdateMyCompareProfileUrl(token), {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(updateMyCompareProfileRequest),
  });
};

export type closeResponse200 = {
  data: BaseResponseGroupCloseResponse;
  status: 200;
};

export type closeResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type closeResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type closeResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type closeResponseSuccess = closeResponse200 & {
  headers: Headers;
};
export type closeResponseError = (closeResponse409 | closeResponse429 | closeResponse500) & {
  headers: Headers;
};

export type closeResponse = closeResponseSuccess | closeResponseError;

export const getCloseUrl = (token: string) => {
  return `/api/v1/compare-links/${token}/close`;
};

/**
 * @summary 그룹 마감 (API 11, 생성자만)
 */
export const close = async (token: string, options?: RequestInit): Promise<closeResponse> => {
  return serverFetchInstance<closeResponse>(getCloseUrl(token), {
    ...options,
    method: 'PATCH',
  });
};

export type getInfoResponse200 = {
  data: BaseResponseCompareLinkInfoResponse;
  status: 200;
};

export type getInfoResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type getInfoResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type getInfoResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type getInfoResponseSuccess = getInfoResponse200 & {
  headers: Headers;
};
export type getInfoResponseError = (
  | getInfoResponse409
  | getInfoResponse429
  | getInfoResponse500
) & {
  headers: Headers;
};

export type getInfoResponse = getInfoResponseSuccess | getInfoResponseError;

export const getGetInfoUrl = (token: string) => {
  return `/api/v1/compare-links/${token}`;
};

/**
 * @summary 비교 링크 정보 조회 (API 6, 비로그인 허용)
 */
export const getInfo = async (token: string, options?: RequestInit): Promise<getInfoResponse> => {
  return serverFetchInstance<getInfoResponse>(getGetInfoUrl(token), {
    ...options,
    method: 'GET',
  });
};

export type getOneToOneResultResponse200 = {
  data: BaseResponseOneToOneCompareResultResponse;
  status: 200;
};

export type getOneToOneResultResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type getOneToOneResultResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type getOneToOneResultResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type getOneToOneResultResponseSuccess = getOneToOneResultResponse200 & {
  headers: Headers;
};
export type getOneToOneResultResponseError = (
  | getOneToOneResultResponse409
  | getOneToOneResultResponse429
  | getOneToOneResultResponse500
) & {
  headers: Headers;
};

export type getOneToOneResultResponse =
  | getOneToOneResultResponseSuccess
  | getOneToOneResultResponseError;

export const getGetOneToOneResultUrl = (token: string) => {
  return `/api/v1/compare-links/${token}/result`;
};

/**
 * @summary 1:1 비교 결과 (API 8, 로그인 필수)
 */
export const getOneToOneResult = async (
  token: string,
  options?: RequestInit
): Promise<getOneToOneResultResponse> => {
  return serverFetchInstance<getOneToOneResultResponse>(getGetOneToOneResultUrl(token), {
    ...options,
    method: 'GET',
  });
};

export type getGroupResultResponse200 = {
  data: BaseResponseGroupCompareResultResponse;
  status: 200;
};

export type getGroupResultResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type getGroupResultResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type getGroupResultResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type getGroupResultResponseSuccess = getGroupResultResponse200 & {
  headers: Headers;
};
export type getGroupResultResponseError = (
  | getGroupResultResponse409
  | getGroupResultResponse429
  | getGroupResultResponse500
) & {
  headers: Headers;
};

export type getGroupResultResponse = getGroupResultResponseSuccess | getGroupResultResponseError;

export const getGetGroupResultUrl = (token: string) => {
  return `/api/v1/compare-links/${token}/group-result`;
};

/**
 * @summary 그룹 비교 결과 (API 9, 비로그인 허용)
 */
export const getGroupResult = async (
  token: string,
  options?: RequestInit
): Promise<getGroupResultResponse> => {
  return serverFetchInstance<getGroupResultResponse>(getGetGroupResultUrl(token), {
    ...options,
    method: 'GET',
  });
};

import type {
  AskVoteRequest,
  BaseResponseAskCountResponse,
  BaseResponseAskCreateLinkResponse,
  BaseResponseAskFriendMetaResponse,
  BaseResponseAskMyLinkResponse,
  BaseResponseAskVoteResponse,
  BaseResponseObject,
  BaseResponseVoid,
  CreateAskLinkRequest,
} from '../openAPIDefinition.schemas';

import { serverFetchInstance } from '../../../../lib/server-fetch-mutator';

export type createLinkResponse200 = {
  data: BaseResponseAskCreateLinkResponse;
  status: 200;
};

export type createLinkResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type createLinkResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type createLinkResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type createLinkResponseSuccess = createLinkResponse200 & {
  headers: Headers;
};
export type createLinkResponseError = (
  | createLinkResponse409
  | createLinkResponse429
  | createLinkResponse500
) & {
  headers: Headers;
};

export type createLinkResponse = createLinkResponseSuccess | createLinkResponseError;

export const getCreateLinkUrl = () => {
  return `/api/v1/ask/teto-egen/links`;
};

/**
 * @summary 본인 링크 생성 (API 2, 로그인 필수)
 */
export const createLink = async (
  createAskLinkRequest: CreateAskLinkRequest,
  options?: RequestInit
): Promise<createLinkResponse> => {
  return serverFetchInstance<createLinkResponse>(getCreateLinkUrl(), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(createAskLinkRequest),
  });
};

export type submitVoteResponse200 = {
  data: BaseResponseAskVoteResponse;
  status: 200;
};

export type submitVoteResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type submitVoteResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type submitVoteResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type submitVoteResponseSuccess = submitVoteResponse200 & {
  headers: Headers;
};
export type submitVoteResponseError = (
  | submitVoteResponse409
  | submitVoteResponse429
  | submitVoteResponse500
) & {
  headers: Headers;
};

export type submitVoteResponse = submitVoteResponseSuccess | submitVoteResponseError;

export const getSubmitVoteUrl = (token: string) => {
  return `/api/v1/ask/teto-egen/friend/${token}/vote`;
};

/**
 * @summary 친구 평가 제출 (API 5, 로그인 필수)
 */
export const submitVote = async (
  token: string,
  askVoteRequest: AskVoteRequest,
  options?: RequestInit
): Promise<submitVoteResponse> => {
  return serverFetchInstance<submitVoteResponse>(getSubmitVoteUrl(token), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(askVoteRequest),
  });
};

export type getMyLinkResponse200 = {
  data: BaseResponseAskMyLinkResponse;
  status: 200;
};

export type getMyLinkResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type getMyLinkResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type getMyLinkResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type getMyLinkResponseSuccess = getMyLinkResponse200 & {
  headers: Headers;
};
export type getMyLinkResponseError = (
  | getMyLinkResponse409
  | getMyLinkResponse429
  | getMyLinkResponse500
) & {
  headers: Headers;
};

export type getMyLinkResponse = getMyLinkResponseSuccess | getMyLinkResponseError;

export const getGetMyLinkUrl = () => {
  return `/api/v1/ask/teto-egen/links/me`;
};

/**
 * @summary 본인 링크 + 결과 조회 (API 3, 로그인 필수)
 */
export const getMyLink = async (options?: RequestInit): Promise<getMyLinkResponse> => {
  return serverFetchInstance<getMyLinkResponse>(getGetMyLinkUrl(), {
    ...options,
    method: 'GET',
  });
};

export type getFriendMetaResponse200 = {
  data: BaseResponseAskFriendMetaResponse;
  status: 200;
};

export type getFriendMetaResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type getFriendMetaResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type getFriendMetaResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type getFriendMetaResponseSuccess = getFriendMetaResponse200 & {
  headers: Headers;
};
export type getFriendMetaResponseError = (
  | getFriendMetaResponse409
  | getFriendMetaResponse429
  | getFriendMetaResponse500
) & {
  headers: Headers;
};

export type getFriendMetaResponse = getFriendMetaResponseSuccess | getFriendMetaResponseError;

export const getGetFriendMetaUrl = (token: string) => {
  return `/api/v1/ask/teto-egen/friend/${token}`;
};

/**
 * @summary 친구 평가 진입 메타 (API 4, 비로그인 OK)
 */
export const getFriendMeta = async (
  token: string,
  options?: RequestInit
): Promise<getFriendMetaResponse> => {
  return serverFetchInstance<getFriendMetaResponse>(getGetFriendMetaUrl(token), {
    ...options,
    method: 'GET',
  });
};

export type getCountResponse200 = {
  data: BaseResponseAskCountResponse;
  status: 200;
};

export type getCountResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type getCountResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type getCountResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type getCountResponseSuccess = getCountResponse200 & {
  headers: Headers;
};
export type getCountResponseError = (
  | getCountResponse409
  | getCountResponse429
  | getCountResponse500
) & {
  headers: Headers;
};

export type getCountResponse = getCountResponseSuccess | getCountResponseError;

export const getGetCountUrl = () => {
  return `/api/v1/ask/teto-egen/count`;
};

/**
 * @summary 참여자 수 조회 (API 1, 비로그인 OK)
 */
export const getCount = async (options?: RequestInit): Promise<getCountResponse> => {
  return serverFetchInstance<getCountResponse>(getGetCountUrl(), {
    ...options,
    method: 'GET',
  });
};

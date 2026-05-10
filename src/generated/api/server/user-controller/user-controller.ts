import type {
  BaseResponseCursorPageResponseMyCommentResponse,
  BaseResponseCursorPageResponseMyLikeResponse,
  BaseResponseObject,
  BaseResponseVoid,
  GetMyCommentsParams,
  GetMyLikesParams,
} from '../openAPIDefinition.schemas';

import { serverFetchInstance } from '../../../../lib/server-fetch-mutator';

export type getMyLikesResponse200 = {
  data: BaseResponseCursorPageResponseMyLikeResponse;
  status: 200;
};

export type getMyLikesResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type getMyLikesResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type getMyLikesResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type getMyLikesResponseSuccess = getMyLikesResponse200 & {
  headers: Headers;
};
export type getMyLikesResponseError = (
  | getMyLikesResponse409
  | getMyLikesResponse429
  | getMyLikesResponse500
) & {
  headers: Headers;
};

export type getMyLikesResponse = getMyLikesResponseSuccess | getMyLikesResponseError;

export const getGetMyLikesUrl = (params?: GetMyLikesParams) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : value.toString());
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0
    ? `/api/v1/users/me/likes?${stringifiedParams}`
    : `/api/v1/users/me/likes`;
};

export const getMyLikes = async (
  params?: GetMyLikesParams,
  options?: RequestInit
): Promise<getMyLikesResponse> => {
  return serverFetchInstance<getMyLikesResponse>(getGetMyLikesUrl(params), {
    ...options,
    method: 'GET',
  });
};

export type getMyCommentsResponse200 = {
  data: BaseResponseCursorPageResponseMyCommentResponse;
  status: 200;
};

export type getMyCommentsResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type getMyCommentsResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type getMyCommentsResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type getMyCommentsResponseSuccess = getMyCommentsResponse200 & {
  headers: Headers;
};
export type getMyCommentsResponseError = (
  | getMyCommentsResponse409
  | getMyCommentsResponse429
  | getMyCommentsResponse500
) & {
  headers: Headers;
};

export type getMyCommentsResponse = getMyCommentsResponseSuccess | getMyCommentsResponseError;

export const getGetMyCommentsUrl = (params?: GetMyCommentsParams) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : value.toString());
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0
    ? `/api/v1/users/me/comments?${stringifiedParams}`
    : `/api/v1/users/me/comments`;
};

export const getMyComments = async (
  params?: GetMyCommentsParams,
  options?: RequestInit
): Promise<getMyCommentsResponse> => {
  return serverFetchInstance<getMyCommentsResponse>(getGetMyCommentsUrl(params), {
    ...options,
    method: 'GET',
  });
};

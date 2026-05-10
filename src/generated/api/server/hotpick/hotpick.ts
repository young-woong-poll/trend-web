import type {
  BaseResponseElectionSeriesResponse,
  BaseResponseHotpickDetailResponse,
  BaseResponseHotpickLikeResponse,
  BaseResponseListCategoryTabResponse,
  BaseResponseListHotpickCardResponse,
  BaseResponseMainHotpickResponse,
  BaseResponseObject,
  BaseResponseVoid,
  BaseResponseVoteResultResponse,
  CreateVoteRequest,
  GetCategories1Params,
  GetElectionSeriesParams,
  GetMainParams,
} from '../openAPIDefinition.schemas';

import { serverFetchInstance } from '../../../../lib/server-fetch-mutator';

export type voteResponse200 = {
  data: BaseResponseVoteResultResponse;
  status: 200;
};

export type voteResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type voteResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type voteResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type voteResponseSuccess = voteResponse200 & {
  headers: Headers;
};
export type voteResponseError = (voteResponse409 | voteResponse429 | voteResponse500) & {
  headers: Headers;
};

export type voteResponse = voteResponseSuccess | voteResponseError;

export const getVoteUrl = (slug: string) => {
  return `/api/v1/hotpicks/${slug}/votes`;
};

/**
 * @summary Submit vote for a hotpick
 */
export const vote = async (
  slug: string,
  createVoteRequest: CreateVoteRequest,
  options?: RequestInit
): Promise<voteResponse> => {
  return serverFetchInstance<voteResponse>(getVoteUrl(slug), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(createVoteRequest),
  });
};

export type likeHotpickResponse200 = {
  data: BaseResponseHotpickLikeResponse;
  status: 200;
};

export type likeHotpickResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type likeHotpickResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type likeHotpickResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type likeHotpickResponseSuccess = likeHotpickResponse200 & {
  headers: Headers;
};
export type likeHotpickResponseError = (
  | likeHotpickResponse409
  | likeHotpickResponse429
  | likeHotpickResponse500
) & {
  headers: Headers;
};

export type likeHotpickResponse = likeHotpickResponseSuccess | likeHotpickResponseError;

export const getLikeHotpickUrl = (slug: string) => {
  return `/api/v1/hotpicks/${slug}/like`;
};

/**
 * @summary Like hotpick
 */
export const likeHotpick = async (
  slug: string,
  options?: RequestInit
): Promise<likeHotpickResponse> => {
  return serverFetchInstance<likeHotpickResponse>(getLikeHotpickUrl(slug), {
    ...options,
    method: 'POST',
  });
};

export type unlikeHotpickResponse200 = {
  data: BaseResponseHotpickLikeResponse;
  status: 200;
};

export type unlikeHotpickResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type unlikeHotpickResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type unlikeHotpickResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type unlikeHotpickResponseSuccess = unlikeHotpickResponse200 & {
  headers: Headers;
};
export type unlikeHotpickResponseError = (
  | unlikeHotpickResponse409
  | unlikeHotpickResponse429
  | unlikeHotpickResponse500
) & {
  headers: Headers;
};

export type unlikeHotpickResponse = unlikeHotpickResponseSuccess | unlikeHotpickResponseError;

export const getUnlikeHotpickUrl = (slug: string) => {
  return `/api/v1/hotpicks/${slug}/like`;
};

/**
 * @summary Unlike hotpick
 */
export const unlikeHotpick = async (
  slug: string,
  options?: RequestInit
): Promise<unlikeHotpickResponse> => {
  return serverFetchInstance<unlikeHotpickResponse>(getUnlikeHotpickUrl(slug), {
    ...options,
    method: 'DELETE',
  });
};

export type getDetailResponse200 = {
  data: BaseResponseHotpickDetailResponse;
  status: 200;
};

export type getDetailResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type getDetailResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type getDetailResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type getDetailResponseSuccess = getDetailResponse200 & {
  headers: Headers;
};
export type getDetailResponseError = (
  | getDetailResponse409
  | getDetailResponse429
  | getDetailResponse500
) & {
  headers: Headers;
};

export type getDetailResponse = getDetailResponseSuccess | getDetailResponseError;

export const getGetDetailUrl = (slug: string) => {
  return `/api/v1/hotpicks/${slug}`;
};

/**
 * @summary Get hotpick detail
 */
export const getDetail = async (
  slug: string,
  options?: RequestInit
): Promise<getDetailResponse> => {
  return serverFetchInstance<getDetailResponse>(getGetDetailUrl(slug), {
    ...options,
    method: 'GET',
  });
};

export type getElectionSeriesResponse200 = {
  data: BaseResponseElectionSeriesResponse;
  status: 200;
};

export type getElectionSeriesResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type getElectionSeriesResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type getElectionSeriesResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type getElectionSeriesResponseSuccess = getElectionSeriesResponse200 & {
  headers: Headers;
};
export type getElectionSeriesResponseError = (
  | getElectionSeriesResponse409
  | getElectionSeriesResponse429
  | getElectionSeriesResponse500
) & {
  headers: Headers;
};

export type getElectionSeriesResponse =
  | getElectionSeriesResponseSuccess
  | getElectionSeriesResponseError;

export const getGetElectionSeriesUrl = (slug: string, params?: GetElectionSeriesParams) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : value.toString());
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0
    ? `/api/v1/hotpicks/${slug}/election-series?${stringifiedParams}`
    : `/api/v1/hotpicks/${slug}/election-series`;
};

/**
 * @summary Get election series for chart
 */
export const getElectionSeries = async (
  slug: string,
  params?: GetElectionSeriesParams,
  options?: RequestInit
): Promise<getElectionSeriesResponse> => {
  return serverFetchInstance<getElectionSeriesResponse>(getGetElectionSeriesUrl(slug, params), {
    ...options,
    method: 'GET',
  });
};

export type getMainResponse200 = {
  data: BaseResponseMainHotpickResponse;
  status: 200;
};

export type getMainResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type getMainResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type getMainResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type getMainResponseSuccess = getMainResponse200 & {
  headers: Headers;
};
export type getMainResponseError = (
  | getMainResponse409
  | getMainResponse429
  | getMainResponse500
) & {
  headers: Headers;
};

export type getMainResponse = getMainResponseSuccess | getMainResponseError;

export const getGetMainUrl = (params?: GetMainParams) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : value.toString());
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0
    ? `/api/v1/hotpicks/main?${stringifiedParams}`
    : `/api/v1/hotpicks/main`;
};

/**
 * @summary Get main hotpick display
 */
export const getMain = async (
  params?: GetMainParams,
  options?: RequestInit
): Promise<getMainResponse> => {
  return serverFetchInstance<getMainResponse>(getGetMainUrl(params), {
    ...options,
    method: 'GET',
  });
};

export type getFixedHotpicksResponse200 = {
  data: BaseResponseListHotpickCardResponse;
  status: 200;
};

export type getFixedHotpicksResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type getFixedHotpicksResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type getFixedHotpicksResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type getFixedHotpicksResponseSuccess = getFixedHotpicksResponse200 & {
  headers: Headers;
};
export type getFixedHotpicksResponseError = (
  | getFixedHotpicksResponse409
  | getFixedHotpicksResponse429
  | getFixedHotpicksResponse500
) & {
  headers: Headers;
};

export type getFixedHotpicksResponse =
  | getFixedHotpicksResponseSuccess
  | getFixedHotpicksResponseError;

export const getGetFixedHotpicksUrl = () => {
  return `/api/v1/hotpicks/fixed`;
};

/**
 * @summary Get fixed hotpicks (latest order)
 */
export const getFixedHotpicks = async (
  options?: RequestInit
): Promise<getFixedHotpicksResponse> => {
  return serverFetchInstance<getFixedHotpicksResponse>(getGetFixedHotpicksUrl(), {
    ...options,
    method: 'GET',
  });
};

export type getCategories1Response200 = {
  data: BaseResponseListCategoryTabResponse;
  status: 200;
};

export type getCategories1Response409 = {
  data: BaseResponseObject;
  status: 409;
};

export type getCategories1Response429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type getCategories1Response500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type getCategories1ResponseSuccess = getCategories1Response200 & {
  headers: Headers;
};
export type getCategories1ResponseError = (
  | getCategories1Response409
  | getCategories1Response429
  | getCategories1Response500
) & {
  headers: Headers;
};

export type getCategories1Response = getCategories1ResponseSuccess | getCategories1ResponseError;

export const getGetCategories1Url = (params?: GetCategories1Params) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : value.toString());
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0
    ? `/api/v1/hotpicks/categories?${stringifiedParams}`
    : `/api/v1/hotpicks/categories`;
};

/**
 * @summary Get category tabs
 */
export const getCategories1 = async (
  params?: GetCategories1Params,
  options?: RequestInit
): Promise<getCategories1Response> => {
  return serverFetchInstance<getCategories1Response>(getGetCategories1Url(params), {
    ...options,
    method: 'GET',
  });
};

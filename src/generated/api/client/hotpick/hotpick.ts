import type {
  BaseResponseElectionSeriesResponse,
  BaseResponseHotpickDetailResponse,
  BaseResponseHotpickLikeResponse,
  BaseResponseListCategoryTabResponse,
  BaseResponseListHotpickCardResponse,
  BaseResponseMainHotpickResponse,
  BaseResponseVoteResultResponse,
  CreateVoteRequest,
  GetCategories1Params,
  GetElectionSeriesParams,
  GetMainParams,
} from '../../../models';

import { customInstance } from '../../../../lib/axios-mutator';
import type { BodyType } from '../../../../lib/axios-mutator';

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

/**
 * @summary Submit vote for a hotpick
 */
export const vote = (
  slug: string,
  createVoteRequest: BodyType<CreateVoteRequest>,
  options?: SecondParameter<typeof customInstance<BaseResponseVoteResultResponse>>
) => {
  return customInstance<BaseResponseVoteResultResponse>(
    {
      url: `/api/v1/hotpicks/${slug}/votes`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: createVoteRequest,
    },
    options
  );
};
/**
 * @summary Like hotpick
 */
export const likeHotpick = (
  slug: string,
  options?: SecondParameter<typeof customInstance<BaseResponseHotpickLikeResponse>>
) => {
  return customInstance<BaseResponseHotpickLikeResponse>(
    { url: `/api/v1/hotpicks/${slug}/like`, method: 'POST' },
    options
  );
};
/**
 * @summary Unlike hotpick
 */
export const unlikeHotpick = (
  slug: string,
  options?: SecondParameter<typeof customInstance<BaseResponseHotpickLikeResponse>>
) => {
  return customInstance<BaseResponseHotpickLikeResponse>(
    { url: `/api/v1/hotpicks/${slug}/like`, method: 'DELETE' },
    options
  );
};
/**
 * @summary Get hotpick detail
 */
export const getDetail = (
  slug: string,
  options?: SecondParameter<typeof customInstance<BaseResponseHotpickDetailResponse>>
) => {
  return customInstance<BaseResponseHotpickDetailResponse>(
    { url: `/api/v1/hotpicks/${slug}`, method: 'GET' },
    options
  );
};
/**
 * @summary Get election series for chart
 */
export const getElectionSeries = (
  slug: string,
  params?: GetElectionSeriesParams,
  options?: SecondParameter<typeof customInstance<BaseResponseElectionSeriesResponse>>
) => {
  return customInstance<BaseResponseElectionSeriesResponse>(
    { url: `/api/v1/hotpicks/${slug}/election-series`, method: 'GET', params },
    options
  );
};
/**
 * @summary Get main hotpick display
 */
export const getMain = (
  params?: GetMainParams,
  options?: SecondParameter<typeof customInstance<BaseResponseMainHotpickResponse>>
) => {
  return customInstance<BaseResponseMainHotpickResponse>(
    { url: `/api/v1/hotpicks/main`, method: 'GET', params },
    options
  );
};
/**
 * @summary Get fixed hotpicks (latest order)
 */
export const getFixedHotpicks = (
  options?: SecondParameter<typeof customInstance<BaseResponseListHotpickCardResponse>>
) => {
  return customInstance<BaseResponseListHotpickCardResponse>(
    { url: `/api/v1/hotpicks/fixed`, method: 'GET' },
    options
  );
};
/**
 * @summary Get category tabs
 */
export const getCategories1 = (
  params?: GetCategories1Params,
  options?: SecondParameter<typeof customInstance<BaseResponseListCategoryTabResponse>>
) => {
  return customInstance<BaseResponseListCategoryTabResponse>(
    { url: `/api/v1/hotpicks/categories`, method: 'GET', params },
    options
  );
};
export type VoteResult = NonNullable<Awaited<ReturnType<typeof vote>>>;
export type LikeHotpickResult = NonNullable<Awaited<ReturnType<typeof likeHotpick>>>;
export type UnlikeHotpickResult = NonNullable<Awaited<ReturnType<typeof unlikeHotpick>>>;
export type GetDetailResult = NonNullable<Awaited<ReturnType<typeof getDetail>>>;
export type GetElectionSeriesResult = NonNullable<Awaited<ReturnType<typeof getElectionSeries>>>;
export type GetMainResult = NonNullable<Awaited<ReturnType<typeof getMain>>>;
export type GetFixedHotpicksResult = NonNullable<Awaited<ReturnType<typeof getFixedHotpicks>>>;
export type GetCategories1Result = NonNullable<Awaited<ReturnType<typeof getCategories1>>>;

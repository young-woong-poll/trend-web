import type {
  BaseResponseCommentCountResponse,
  BaseResponseCommentCreateResponse,
  BaseResponseCommentDetailResponse,
  BaseResponseCommentLikeResponse,
  BaseResponseCommentListResponse,
  BaseResponseCommentUpdateResponse,
  BaseResponseCommentVerifyResponse,
  BaseResponseObject,
  BaseResponseVoid,
  CreateCommentRequest,
  DeleteCommentRequest,
  GetCommentsParams,
  GetRepliesParams,
  UpdateCommentRequest,
  VerifyCommentRequest,
} from '../openAPIDefinition.schemas';

import { serverFetchInstance } from '../../../../lib/server-fetch-mutator';

export type getCommentDetailResponse200 = {
  data: BaseResponseCommentDetailResponse;
  status: 200;
};

export type getCommentDetailResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type getCommentDetailResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type getCommentDetailResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type getCommentDetailResponseSuccess = getCommentDetailResponse200 & {
  headers: Headers;
};
export type getCommentDetailResponseError = (
  | getCommentDetailResponse409
  | getCommentDetailResponse429
  | getCommentDetailResponse500
) & {
  headers: Headers;
};

export type getCommentDetailResponse =
  | getCommentDetailResponseSuccess
  | getCommentDetailResponseError;

export const getGetCommentDetailUrl = (commentId: string) => {
  return `/api/v1/comments/${commentId}`;
};

/**
 * @summary 단건 댓글 조회 (핀 영역용; comment + parent 응답)
 */
export const getCommentDetail = async (
  commentId: string,
  options?: RequestInit
): Promise<getCommentDetailResponse> => {
  return serverFetchInstance<getCommentDetailResponse>(getGetCommentDetailUrl(commentId), {
    ...options,
    method: 'GET',
  });
};

export type updateCommentResponse200 = {
  data: BaseResponseCommentUpdateResponse;
  status: 200;
};

export type updateCommentResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type updateCommentResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type updateCommentResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type updateCommentResponseSuccess = updateCommentResponse200 & {
  headers: Headers;
};
export type updateCommentResponseError = (
  | updateCommentResponse409
  | updateCommentResponse429
  | updateCommentResponse500
) & {
  headers: Headers;
};

export type updateCommentResponse = updateCommentResponseSuccess | updateCommentResponseError;

export const getUpdateCommentUrl = (commentId: string) => {
  return `/api/v1/comments/${commentId}`;
};

/**
 * @summary Update comment
 */
export const updateComment = async (
  commentId: string,
  updateCommentRequest: UpdateCommentRequest,
  options?: RequestInit
): Promise<updateCommentResponse> => {
  return serverFetchInstance<updateCommentResponse>(getUpdateCommentUrl(commentId), {
    ...options,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(updateCommentRequest),
  });
};

export type deleteCommentResponse200 = {
  data: BaseResponseVoid;
  status: 200;
};

export type deleteCommentResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type deleteCommentResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type deleteCommentResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type deleteCommentResponseSuccess = deleteCommentResponse200 & {
  headers: Headers;
};
export type deleteCommentResponseError = (
  | deleteCommentResponse409
  | deleteCommentResponse429
  | deleteCommentResponse500
) & {
  headers: Headers;
};

export type deleteCommentResponse = deleteCommentResponseSuccess | deleteCommentResponseError;

export const getDeleteCommentUrl = (commentId: string) => {
  return `/api/v1/comments/${commentId}`;
};

/**
 * @summary Delete comment
 */
export const deleteComment = async (
  commentId: string,
  deleteCommentRequest?: DeleteCommentRequest,
  options?: RequestInit
): Promise<deleteCommentResponse> => {
  return serverFetchInstance<deleteCommentResponse>(getDeleteCommentUrl(commentId), {
    ...options,
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(deleteCommentRequest),
  });
};

export type getCommentsResponse200 = {
  data: BaseResponseCommentListResponse;
  status: 200;
};

export type getCommentsResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type getCommentsResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type getCommentsResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type getCommentsResponseSuccess = getCommentsResponse200 & {
  headers: Headers;
};
export type getCommentsResponseError = (
  | getCommentsResponse409
  | getCommentsResponse429
  | getCommentsResponse500
) & {
  headers: Headers;
};

export type getCommentsResponse = getCommentsResponseSuccess | getCommentsResponseError;

export const getGetCommentsUrl = (slug: string, electionId: number, params?: GetCommentsParams) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : value.toString());
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0
    ? `/api/v1/hotpicks/${slug}/elections/${electionId}/comments?${stringifiedParams}`
    : `/api/v1/hotpicks/${slug}/elections/${electionId}/comments`;
};

/**
 * @summary Get comment list
 */
export const getComments = async (
  slug: string,
  electionId: number,
  params?: GetCommentsParams,
  options?: RequestInit
): Promise<getCommentsResponse> => {
  return serverFetchInstance<getCommentsResponse>(getGetCommentsUrl(slug, electionId, params), {
    ...options,
    method: 'GET',
  });
};

export type createCommentResponse200 = {
  data: BaseResponseCommentCreateResponse;
  status: 200;
};

export type createCommentResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type createCommentResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type createCommentResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type createCommentResponseSuccess = createCommentResponse200 & {
  headers: Headers;
};
export type createCommentResponseError = (
  | createCommentResponse409
  | createCommentResponse429
  | createCommentResponse500
) & {
  headers: Headers;
};

export type createCommentResponse = createCommentResponseSuccess | createCommentResponseError;

export const getCreateCommentUrl = (slug: string, electionId: number) => {
  return `/api/v1/hotpicks/${slug}/elections/${electionId}/comments`;
};

/**
 * @summary Create comment
 */
export const createComment = async (
  slug: string,
  electionId: number,
  createCommentRequest: CreateCommentRequest,
  options?: RequestInit
): Promise<createCommentResponse> => {
  return serverFetchInstance<createCommentResponse>(getCreateCommentUrl(slug, electionId), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(createCommentRequest),
  });
};

export type verifyCommentResponse200 = {
  data: BaseResponseCommentVerifyResponse;
  status: 200;
};

export type verifyCommentResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type verifyCommentResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type verifyCommentResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type verifyCommentResponseSuccess = verifyCommentResponse200 & {
  headers: Headers;
};
export type verifyCommentResponseError = (
  | verifyCommentResponse409
  | verifyCommentResponse429
  | verifyCommentResponse500
) & {
  headers: Headers;
};

export type verifyCommentResponse = verifyCommentResponseSuccess | verifyCommentResponseError;

export const getVerifyCommentUrl = (commentId: string) => {
  return `/api/v1/comments/${commentId}/verify`;
};

/**
 * @summary Verify comment password
 */
export const verifyComment = async (
  commentId: string,
  verifyCommentRequest: VerifyCommentRequest,
  options?: RequestInit
): Promise<verifyCommentResponse> => {
  return serverFetchInstance<verifyCommentResponse>(getVerifyCommentUrl(commentId), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(verifyCommentRequest),
  });
};

export type getRepliesResponse200 = {
  data: BaseResponseCommentListResponse;
  status: 200;
};

export type getRepliesResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type getRepliesResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type getRepliesResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type getRepliesResponseSuccess = getRepliesResponse200 & {
  headers: Headers;
};
export type getRepliesResponseError = (
  | getRepliesResponse409
  | getRepliesResponse429
  | getRepliesResponse500
) & {
  headers: Headers;
};

export type getRepliesResponse = getRepliesResponseSuccess | getRepliesResponseError;

export const getGetRepliesUrl = (commentId: string, params?: GetRepliesParams) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : value.toString());
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0
    ? `/api/v1/comments/${commentId}/replies?${stringifiedParams}`
    : `/api/v1/comments/${commentId}/replies`;
};

/**
 * @summary Get replies for a comment (대댓글 조회)
 */
export const getReplies = async (
  commentId: string,
  params?: GetRepliesParams,
  options?: RequestInit
): Promise<getRepliesResponse> => {
  return serverFetchInstance<getRepliesResponse>(getGetRepliesUrl(commentId, params), {
    ...options,
    method: 'GET',
  });
};

export type createReplyResponse200 = {
  data: BaseResponseCommentCreateResponse;
  status: 200;
};

export type createReplyResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type createReplyResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type createReplyResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type createReplyResponseSuccess = createReplyResponse200 & {
  headers: Headers;
};
export type createReplyResponseError = (
  | createReplyResponse409
  | createReplyResponse429
  | createReplyResponse500
) & {
  headers: Headers;
};

export type createReplyResponse = createReplyResponseSuccess | createReplyResponseError;

export const getCreateReplyUrl = (commentId: string) => {
  return `/api/v1/comments/${commentId}/replies`;
};

/**
 * @summary Create a reply to a comment (대댓글 작성)
 */
export const createReply = async (
  commentId: string,
  createCommentRequest: CreateCommentRequest,
  options?: RequestInit
): Promise<createReplyResponse> => {
  return serverFetchInstance<createReplyResponse>(getCreateReplyUrl(commentId), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(createCommentRequest),
  });
};

export type likeCommentResponse200 = {
  data: BaseResponseCommentLikeResponse;
  status: 200;
};

export type likeCommentResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type likeCommentResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type likeCommentResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type likeCommentResponseSuccess = likeCommentResponse200 & {
  headers: Headers;
};
export type likeCommentResponseError = (
  | likeCommentResponse409
  | likeCommentResponse429
  | likeCommentResponse500
) & {
  headers: Headers;
};

export type likeCommentResponse = likeCommentResponseSuccess | likeCommentResponseError;

export const getLikeCommentUrl = (commentId: string) => {
  return `/api/v1/comments/${commentId}/like`;
};

/**
 * @summary Like comment
 */
export const likeComment = async (
  commentId: string,
  options?: RequestInit
): Promise<likeCommentResponse> => {
  return serverFetchInstance<likeCommentResponse>(getLikeCommentUrl(commentId), {
    ...options,
    method: 'POST',
  });
};

export type unlikeCommentResponse200 = {
  data: BaseResponseCommentLikeResponse;
  status: 200;
};

export type unlikeCommentResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type unlikeCommentResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type unlikeCommentResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type unlikeCommentResponseSuccess = unlikeCommentResponse200 & {
  headers: Headers;
};
export type unlikeCommentResponseError = (
  | unlikeCommentResponse409
  | unlikeCommentResponse429
  | unlikeCommentResponse500
) & {
  headers: Headers;
};

export type unlikeCommentResponse = unlikeCommentResponseSuccess | unlikeCommentResponseError;

export const getUnlikeCommentUrl = (commentId: string) => {
  return `/api/v1/comments/${commentId}/like`;
};

/**
 * @summary Unlike comment
 */
export const unlikeComment = async (
  commentId: string,
  options?: RequestInit
): Promise<unlikeCommentResponse> => {
  return serverFetchInstance<unlikeCommentResponse>(getUnlikeCommentUrl(commentId), {
    ...options,
    method: 'DELETE',
  });
};

export type countCommentsResponse200 = {
  data: BaseResponseCommentCountResponse;
  status: 200;
};

export type countCommentsResponse409 = {
  data: BaseResponseObject;
  status: 409;
};

export type countCommentsResponse429 = {
  data: BaseResponseVoid;
  status: 429;
};

export type countCommentsResponse500 = {
  data: BaseResponseVoid;
  status: 500;
};

export type countCommentsResponseSuccess = countCommentsResponse200 & {
  headers: Headers;
};
export type countCommentsResponseError = (
  | countCommentsResponse409
  | countCommentsResponse429
  | countCommentsResponse500
) & {
  headers: Headers;
};

export type countCommentsResponse = countCommentsResponseSuccess | countCommentsResponseError;

export const getCountCommentsUrl = (slug: string, electionId: number) => {
  return `/api/v1/hotpicks/${slug}/elections/${electionId}/comments/count`;
};

/**
 * @summary Get comment count
 */
export const countComments = async (
  slug: string,
  electionId: number,
  options?: RequestInit
): Promise<countCommentsResponse> => {
  return serverFetchInstance<countCommentsResponse>(getCountCommentsUrl(slug, electionId), {
    ...options,
    method: 'GET',
  });
};

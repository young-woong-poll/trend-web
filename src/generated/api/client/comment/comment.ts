import type {
  BaseResponseCommentCountResponse,
  BaseResponseCommentCreateResponse,
  BaseResponseCommentDetailResponse,
  BaseResponseCommentLikeResponse,
  BaseResponseCommentListResponse,
  BaseResponseCommentUpdateResponse,
  BaseResponseCommentVerifyResponse,
  BaseResponseVoid,
  CreateCommentRequest,
  DeleteCommentRequest,
  GetCommentsParams,
  GetRepliesParams,
  UpdateCommentRequest,
  VerifyCommentRequest,
} from '../../../models';

import { customInstance } from '../../../../lib/axios-mutator';
import type { BodyType } from '../../../../lib/axios-mutator';

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

/**
 * @summary 단건 댓글 조회 (핀 영역용; comment + parent 응답)
 */
export const getCommentDetail = (
  commentId: string,
  options?: SecondParameter<typeof customInstance<BaseResponseCommentDetailResponse>>
) => {
  return customInstance<BaseResponseCommentDetailResponse>(
    { url: `/api/v1/comments/${commentId}`, method: 'GET' },
    options
  );
};
/**
 * @summary Update comment
 */
export const updateComment = (
  commentId: string,
  updateCommentRequest: BodyType<UpdateCommentRequest>,
  options?: SecondParameter<typeof customInstance<BaseResponseCommentUpdateResponse>>
) => {
  return customInstance<BaseResponseCommentUpdateResponse>(
    {
      url: `/api/v1/comments/${commentId}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      data: updateCommentRequest,
    },
    options
  );
};
/**
 * @summary Delete comment
 */
export const deleteComment = (
  commentId: string,
  deleteCommentRequest?: BodyType<DeleteCommentRequest>,
  options?: SecondParameter<typeof customInstance<BaseResponseVoid>>
) => {
  return customInstance<BaseResponseVoid>(
    {
      url: `/api/v1/comments/${commentId}`,
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      data: deleteCommentRequest,
    },
    options
  );
};
/**
 * @summary Get comment list
 */
export const getComments = (
  slug: string,
  electionId: number,
  params?: GetCommentsParams,
  options?: SecondParameter<typeof customInstance<BaseResponseCommentListResponse>>
) => {
  return customInstance<BaseResponseCommentListResponse>(
    { url: `/api/v1/hotpicks/${slug}/elections/${electionId}/comments`, method: 'GET', params },
    options
  );
};
/**
 * @summary Create comment
 */
export const createComment = (
  slug: string,
  electionId: number,
  createCommentRequest: BodyType<CreateCommentRequest>,
  options?: SecondParameter<typeof customInstance<BaseResponseCommentCreateResponse>>
) => {
  return customInstance<BaseResponseCommentCreateResponse>(
    {
      url: `/api/v1/hotpicks/${slug}/elections/${electionId}/comments`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: createCommentRequest,
    },
    options
  );
};
/**
 * @summary Verify comment password
 */
export const verifyComment = (
  commentId: string,
  verifyCommentRequest: BodyType<VerifyCommentRequest>,
  options?: SecondParameter<typeof customInstance<BaseResponseCommentVerifyResponse>>
) => {
  return customInstance<BaseResponseCommentVerifyResponse>(
    {
      url: `/api/v1/comments/${commentId}/verify`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: verifyCommentRequest,
    },
    options
  );
};
/**
 * @summary Get replies for a comment (대댓글 조회)
 */
export const getReplies = (
  commentId: string,
  params?: GetRepliesParams,
  options?: SecondParameter<typeof customInstance<BaseResponseCommentListResponse>>
) => {
  return customInstance<BaseResponseCommentListResponse>(
    { url: `/api/v1/comments/${commentId}/replies`, method: 'GET', params },
    options
  );
};
/**
 * @summary Create a reply to a comment (대댓글 작성)
 */
export const createReply = (
  commentId: string,
  createCommentRequest: BodyType<CreateCommentRequest>,
  options?: SecondParameter<typeof customInstance<BaseResponseCommentCreateResponse>>
) => {
  return customInstance<BaseResponseCommentCreateResponse>(
    {
      url: `/api/v1/comments/${commentId}/replies`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: createCommentRequest,
    },
    options
  );
};
/**
 * @summary Like comment
 */
export const likeComment = (
  commentId: string,
  options?: SecondParameter<typeof customInstance<BaseResponseCommentLikeResponse>>
) => {
  return customInstance<BaseResponseCommentLikeResponse>(
    { url: `/api/v1/comments/${commentId}/like`, method: 'POST' },
    options
  );
};
/**
 * @summary Unlike comment
 */
export const unlikeComment = (
  commentId: string,
  options?: SecondParameter<typeof customInstance<BaseResponseCommentLikeResponse>>
) => {
  return customInstance<BaseResponseCommentLikeResponse>(
    { url: `/api/v1/comments/${commentId}/like`, method: 'DELETE' },
    options
  );
};
/**
 * @summary Get comment count
 */
export const countComments = (
  slug: string,
  electionId: number,
  options?: SecondParameter<typeof customInstance<BaseResponseCommentCountResponse>>
) => {
  return customInstance<BaseResponseCommentCountResponse>(
    { url: `/api/v1/hotpicks/${slug}/elections/${electionId}/comments/count`, method: 'GET' },
    options
  );
};
export type GetCommentDetailResult = NonNullable<Awaited<ReturnType<typeof getCommentDetail>>>;
export type UpdateCommentResult = NonNullable<Awaited<ReturnType<typeof updateComment>>>;
export type DeleteCommentResult = NonNullable<Awaited<ReturnType<typeof deleteComment>>>;
export type GetCommentsResult = NonNullable<Awaited<ReturnType<typeof getComments>>>;
export type CreateCommentResult = NonNullable<Awaited<ReturnType<typeof createComment>>>;
export type VerifyCommentResult = NonNullable<Awaited<ReturnType<typeof verifyComment>>>;
export type GetRepliesResult = NonNullable<Awaited<ReturnType<typeof getReplies>>>;
export type CreateReplyResult = NonNullable<Awaited<ReturnType<typeof createReply>>>;
export type LikeCommentResult = NonNullable<Awaited<ReturnType<typeof likeComment>>>;
export type UnlikeCommentResult = NonNullable<Awaited<ReturnType<typeof unlikeComment>>>;
export type CountCommentsResult = NonNullable<Awaited<ReturnType<typeof countComments>>>;

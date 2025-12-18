import axiosInstance from '@/lib/axios';
import type {
  CreateCommentRequest,
  CommentCreateResponse,
  UpdateCommentRequest,
  CommentUpdateResponse,
  VerifyCommentRequest,
  CommentVerifyResponse,
  DeleteCommentRequest,
  CommentCountResponse,
  CommentLikeResponse,
} from '@/types/comment';

import type { AxiosResponse } from 'axios';

/**
 * Comment API 서비스
 */
export const commentApi = {
  /**
   * 댓글 작성
   * POST /api/v1/comment
   */
  createComment: async (data: CreateCommentRequest): Promise<CommentCreateResponse> => {
    const response: AxiosResponse<CommentCreateResponse> = await axiosInstance.post(
      '/api/v1/comment',
      data
    );
    return response.data;
  },

  /**
   * 댓글 수정
   * PUT /api/v1/comment/{commentId}
   *
   * @returns CommentUpdateResponse - 수정된 댓글의 id, content, updatedAt 포함
   * @note BE 개발자에게 updatedAt을 응답에 포함하도록 요청 필요
   */
  updateComment: async (
    commentId: string,
    data: UpdateCommentRequest
  ): Promise<CommentUpdateResponse> => {
    const response: AxiosResponse<CommentUpdateResponse> = await axiosInstance.put(
      `/api/v1/comment/${commentId}`,
      data
    );
    return response.data;
  },

  /**
   * 댓글 수정 검증
   * POST /api/v1/comment/{commentId}/verify
   */
  verifyComment: async (
    commentId: string,
    data: VerifyCommentRequest
  ): Promise<CommentVerifyResponse> => {
    const response: AxiosResponse<CommentVerifyResponse> = await axiosInstance.post(
      `/api/v1/comment/${commentId}/verify`,
      data
    );
    return response.data;
  },

  /**
   * 댓글 좋아요
   * POST /api/v1/comment/{commentId}/like
   */
  likeComment: async (commentId: string, tkuId: string): Promise<CommentLikeResponse> => {
    const response: AxiosResponse<CommentLikeResponse> = await axiosInstance.post(
      `/api/v1/comment/${commentId}/like`,
      {},
      {
        headers: {
          'x-tku-id': tkuId,
        },
      }
    );
    return response.data;
  },

  /**
   * 댓글 좋아요 취소
   * DELETE /api/v1/comment/{commentId}/like
   */
  unlikeComment: async (commentId: string, tkuId: string): Promise<CommentLikeResponse> => {
    const response: AxiosResponse<CommentLikeResponse> = await axiosInstance.delete(
      `/api/v1/comment/${commentId}/like`,
      {
        headers: {
          'x-tku-id': tkuId,
        },
      }
    );
    return response.data;
  },

  /**
   * 댓글 삭제
   * DELETE /api/v1/comment/{commentId}
   */
  deleteComment: async (commentId: string, data: DeleteCommentRequest): Promise<void> => {
    await axiosInstance.delete(`/api/v1/comment/${commentId}`, { data });
  },

  /**
   * 댓글 개수 조회
   * GET /api/v1/comment/{trendId}/item/{itemId}/count
   */
  countComments: async (trendId: string, itemId: string): Promise<CommentCountResponse> => {
    const response: AxiosResponse<CommentCountResponse> = await axiosInstance.get(
      `/api/v1/comment/${trendId}/item/${itemId}/count`
    );
    return response.data;
  },
};

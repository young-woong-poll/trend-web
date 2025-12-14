import axiosInstance from '@/lib/axios';
import type {
  CreateCommentRequest,
  CommentCreateResponse,
  UpdateCommentRequest,
  VerifyCommentRequest,
  CommentVerifyResponse,
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
   */
  updateComment: async (commentId: string, data: UpdateCommentRequest): Promise<void> => {
    await axiosInstance.put(`/api/v1/comment/${commentId}`, data);
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
};

/**
 * Comment 관련 타입 — generated models 재export + 확장
 *
 * 컴포넌트에서 '@/types/comment' 경로를 유지하기 위해
 * generated 모델을 re-export 합니다.
 */

import type { CommentItem as GeneratedCommentItem } from '@/generated/models';

/**
 * CommentItem 확장 — BE 응답에 로그인 유저 정보 필드 추가 예정
 * - profileColor: 로그인 유저 댓글의 프로필 색상 (비로그인 댓글은 undefined)
 * - isMine: 현재 요청자의 댓글 여부
 */
export interface CommentItem extends GeneratedCommentItem {
  profileColor?: string;
  isMine?: boolean;
}

export type {
  CommentListResponse,
  CommentCountResponse,
  CommentCreateResponse,
  CommentUpdateResponse,
  CommentVerifyResponse,
  CommentLikeResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
  DeleteCommentRequest,
  VerifyCommentRequest,
} from '@/generated/models';

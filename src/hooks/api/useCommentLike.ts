/**
 * 댓글 좋아요 Hook — 스텁 처리
 *
 * Comment API가 새 swagger에서 제거됨 (need-api.md 참고).
 */

import { useCallback } from 'react';

interface UseCommentLikeOptions {
  onError?: (error: unknown) => void;
}

export const useCommentLike = (
  _hotpickId: string,
  _electionId: string,
  _sort: 'latest' | 'popular',
  _options?: UseCommentLikeOptions
) => {
  const handleLikeClick = useCallback(async (_commentId: string, _currentLiked: boolean) => {
    // 스텁: Comment API 미구현
  }, []);

  return {
    handleLikeClick,
  };
};

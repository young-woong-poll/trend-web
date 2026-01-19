import type { CommentItem, CommentListResponse } from '@/types/comment';

/**
 * 댓글 Mock 데이터 생성 헬퍼
 */
const createMockComment = (id: string, index: number): CommentItem => ({
  id,
  nickname: `사용자${index + 1}`,
  content: `이것은 테스트 댓글 ${index + 1}번 입니다. 투표 항목에 대한 의견을 공유합니다.`,
  likeCount: Math.floor(Math.random() * 100),
  liked: Math.random() > 0.5,
  createdAt: new Date(Date.now() - index * 3600000).toISOString(),
  ...(Math.random() > 0.7 && { updatedAt: new Date().toISOString() }),
});

/**
 * 댓글 목록 Mock 데이터
 */
export const mockCommentList: CommentItem[] = Array.from({ length: 50 }, (_, i) =>
  createMockComment(`comment-${i + 1}`, i)
);

/**
 * 페이지네이션된 댓글 응답 생성
 */
export const getMockCommentListResponse = (
  cursor?: string,
  size: number = 10,
  sort: 'latest' | 'popular' = 'latest'
): CommentListResponse => {
  const sortedComments = [...mockCommentList];

  // 정렬 적용
  if (sort === 'popular') {
    sortedComments.sort((a, b) => b.likeCount - a.likeCount);
  } else {
    sortedComments.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // 커서 기반 페이지네이션
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = sortedComments.findIndex((c) => c.id === cursor);
    if (cursorIndex !== -1) {
      startIndex = cursorIndex + 1;
    }
  }

  const paginatedComments = sortedComments.slice(startIndex, startIndex + size);
  const hasNext = startIndex + size < sortedComments.length;

  return {
    totalSize: mockCommentList.length,
    nextId: hasNext ? (paginatedComments[paginatedComments.length - 1]?.id ?? null) : null,
    comments: paginatedComments,
  };
};

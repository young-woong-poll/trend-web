/**
 * API Hooks Export
 */

// Comment Hooks & Query Options
export {
  commentKeys,
  commentQueries,
  useCommentCount,
  useInfiniteComments,
  useCreateComment,
  useUpdateComment,
  useVerifyComment,
  useDeleteComment,
} from '@/hooks/api/useComment';

export { useCommentLike } from '@/hooks/api/useCommentLike';
export { useLike } from '@/hooks/api/useLike';
export { useSingleVote } from '@/hooks/api/useSingleVote';

// Display Hooks & Query Options
export {
  displayKeys,
  displayQueries,
  useCategories,
  useMainDisplay,
  useInfiniteMainDisplay,
  useHotpickDetail,
  useResultDetail,
} from '@/hooks/api/useDisplay';

// Hotpick Hooks
export {
  hotpickKeys,
  useHotpickElectionOptionsCount,
  useHotpickElectionOptionsCountMap,
} from '@/hooks/api/useHotpick';

// Result Hooks
export { resultKeys, useCheckResultExists, useCreateResult } from '@/hooks/api/useResult';

// Search Hooks
export { searchKeys, searchQueries, useSearch } from '@/hooks/api/useSearch';
export type { SearchResponse, SearchHit } from '@/hooks/api/useSearch';

// Suggestion Hooks
export { useCreateSuggestion } from '@/hooks/api/useSuggestion';

// Reply Hooks
export { replyKeys, useInfiniteReplies, useCreateReply } from '@/hooks/api/useReplies';

// Notification Hooks
export {
  notificationKeys,
  useInfiniteNotifications,
  useUnreadNotificationCount,
  useMarkAllNotificationsRead,
} from '@/hooks/api/useNotifications';

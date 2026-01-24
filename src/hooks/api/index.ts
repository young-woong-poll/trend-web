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
  useLikeComment,
  useUnlikeComment,
  useDeleteComment,
} from '@/hooks/api/useComment';

export { useCommentLike } from '@/hooks/api/useCommentLike';

// Display Hooks & Query Options
export {
  displayKeys,
  displayQueries,
  useMainDisplay,
  useInfiniteMainDisplay,
  useTrendDetail,
  useResultDetail,
  useTrendNavigation,
} from '@/hooks/api/useDisplay';

// Admin Hooks
export {
  adminKeys,
  useTrends,
  useCreateTrend,
  useUpdateTrend,
  useDeleteTrend,
  useElection,
  useFetchElection,
  useGeneratePresignedUrl,
  useCheckTrendAlias,
} from '@/hooks/api/useAdmin';

// Trend Hooks
export {
  trendKeys,
  useTrendItemOptionsCount,
  useTrendItemOptionsCountMap,
} from '@/hooks/api/useTrend';

// Result Hooks
export { resultKeys, useCheckResultExists, useCreateResult } from '@/hooks/api/useResult';

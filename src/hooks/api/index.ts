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

// Admin Hooks
export {
  adminKeys,
  useHotpicks,
  useCreateHotpick,
  useUpdateHotpick,
  useDeleteHotpick,
  useGeneratePresignedUrl,
  useCheckHotpickAlias,
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/api/useAdmin';

// Hotpick Hooks
export {
  hotpickKeys,
  useHotpickElectionOptionsCount,
  useHotpickElectionOptionsCountMap,
} from '@/hooks/api/useHotpick';

// Result Hooks
export { resultKeys, useCheckResultExists, useCreateResult } from '@/hooks/api/useResult';

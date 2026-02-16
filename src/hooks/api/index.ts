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
export { useSingleVote } from '@/hooks/api/useSingleVote';

// Display Hooks & Query Options
export {
  displayKeys,
  displayQueries,
  useMainDisplay,
  useInfiniteMainDisplay,
  useHotpickDetail,
  useResultDetail,
  useHotpickNavigation,
} from '@/hooks/api/useDisplay';

// Admin Hooks
export {
  adminKeys,
  useHotpicks,
  useCreateHotpick,
  useUpdateHotpick,
  useDeleteHotpick,
  useElection,
  useFetchElection,
  useGeneratePresignedUrl,
  useCheckHotpickAlias,
} from '@/hooks/api/useAdmin';

// Hotpick Hooks
export {
  hotpickKeys,
  useHotpickElectionOptionsCount,
  useHotpickElectionOptionsCountMap,
} from '@/hooks/api/useHotpick';

// Election Hooks
export {
  electionKeys,
  useElectionList,
  useElectionDetail,
  useCreateElection,
  useUpdateElection,
  useDeleteElection,
  useSearchElections,
} from '@/hooks/api/useElection';

// Result Hooks
export { resultKeys, useCheckResultExists, useCreateResult } from '@/hooks/api/useResult';

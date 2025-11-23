/**
 * API Hooks Export
 */

// Display
export {
  displayKeys,
  useMainDisplay,
  useResultDisplay,
  useTrendDisplay,
  useResultDisplayInvitee,
} from '@/hooks/api/useDisplay';

// Trend
export { trendKeys, useTrendVoteCount } from '@/hooks/api/useTrend';

// Result
export { resultKeys, useCreateResult } from '@/hooks/api/useResult';

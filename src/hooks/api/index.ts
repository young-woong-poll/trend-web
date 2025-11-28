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
export { trendKeys, useTrendItemOptions, useTrendItemOptionsMap } from '@/hooks/api/useTrend';

// Result
export {
  resultKeys,
  useCreateResult,
  useCheckResultExists,
  useSetNickname,
} from '@/hooks/api/useResult';

// Admin (접근 제어 필요)
export { adminKeys, useCreateTrend } from '@/hooks/api/useAdmin';

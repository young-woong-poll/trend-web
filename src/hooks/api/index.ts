/**
 * API Hooks Export
 *
 * Note: useQuery 훅들은 제거되었습니다.
 * 대신 useQuery와 displayQueries를 직접 사용하세요:
 *
 * @example
 * import { useQuery } from '@tanstack/react-query';
 * import { displayQueries } from '@/lib/react-query/queries';
 *
 * const { data } = useQuery(displayQueries.main());
 */

// Result Mutations (로직이 있으므로 유지)
export {
  resultKeys,
  useCreateResult,
  useCheckResultExists,
  useSetNickname,
} from '@/hooks/api/useResult';

// Admin (접근 제어 필요)
export { adminKeys, useCreateTrend, useElection, useFetchElection } from '@/hooks/api/useAdmin';

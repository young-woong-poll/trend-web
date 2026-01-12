/**
 * @deprecated 이 파일은 더 이상 사용되지 않습니다.
 * 대신 @/lib/react-query/index.ts를 사용하세요.
 *
 * 마이그레이션:
 * - import { queryClient } from '@/lib/react-query'
 *   → import { getQueryClient } from '@/lib/react-query'
 *   → const queryClient = getQueryClient()
 */

// 하위 호환성을 위한 re-export
export {
  queryKeys,
  createServerQueryClient,
  getQueryClient,
  displayQueries,
} from '@/lib/react-query/index';

// 하위 호환성을 위한 deprecated export
import { getQueryClient } from '@/lib/react-query/index';
export const queryClient = getQueryClient();

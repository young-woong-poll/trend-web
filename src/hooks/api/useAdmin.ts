import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminKeys, adminQueries } from '@/lib/react-query/queries';
import { adminApi } from '@/services/api/admin';
import type { CreateTrendRequest, UpdateTrendRequest } from '@/types/trend';

// adminKeys를 @/lib/react-query/queries에서 re-export
export { adminKeys };

/**
 * Admin: 트렌드 목록 조회 Hook
 *
 * @example
 * ```tsx
 * const { data } = useTrends();
 *
 * // 쿼리키 접근
 * queryClient.invalidateQueries({ queryKey: adminQueries.trends().queryKey });
 * ```
 */
export const useTrends = (enabled = true) =>
  useQuery({
    ...adminQueries.trends(),
    enabled,
  });

/**
 * Admin: Trend 생성 Hook
 */
export const useCreateTrend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTrendRequest) => adminApi.createTrend(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueries.trends().queryKey });
    },
  });
};

/**
 * Admin: 트렌드 수정 Hook
 */
export const useUpdateTrend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ trendId, data }: { trendId: number; data: UpdateTrendRequest }) =>
      adminApi.updateTrend(trendId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueries.trends().queryKey });
    },
  });
};

/**
 * Admin: 트렌드 삭제 Hook
 */
export const useDeleteTrend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trendId: number) => adminApi.deleteTrend(trendId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueries.trends().queryKey });
    },
  });
};

/**
 * Admin: 선거 상세 조회 Hook (Query)
 *
 * @example
 * ```tsx
 * const { data } = useElection('election-123');
 *
 * // 쿼리키 접근
 * queryClient.invalidateQueries({ queryKey: adminQueries.election('election-123').queryKey });
 * ```
 */
export const useElection = (electionId: string) =>
  useQuery({
    ...adminQueries.election(electionId),
    enabled: !!electionId,
  });

/**
 * Admin: 선거 상세 조회 Hook (Mutation)
 * 사용자 액션에 의해 선거 정보를 가져올 때 사용
 */
export const useFetchElection = () =>
  useMutation({
    mutationFn: (electionId: string) => adminApi.getElection(electionId),
  });

/**
 * Admin: Pre-signed URL 발급 Hook
 * 이미지 업로드 시 S3 Pre-signed URL을 받아옴
 * @returns uploadUrl과 cdnUrl을 포함한 객체
 */
export const useGeneratePresignedUrl = () =>
  useMutation({
    mutationFn: (filename: string) => adminApi.generatePresignedUrl(filename),
  });

/**
 * Admin: Trend ID 중복 체크 Hook
 * Trend Alias가 이미 존재하는지 확인
 * @returns exists 여부를 포함한 객체
 */
export const useCheckTrendAlias = () =>
  useMutation({
    mutationFn: (alias: string) => adminApi.checkTrendAlias(alias),
  });

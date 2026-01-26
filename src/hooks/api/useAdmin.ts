import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getItem } from '@/generated/api/client/admin-item/admin-item';
import { generatePresignedUrl } from '@/generated/api/client/admin-storage/admin-storage';
import {
  getTrends,
  createTrend,
  updateTrend,
  deleteTrend,
  checkTrendAlias,
} from '@/generated/api/client/admin-trend/admin-trend';
import { useToast } from '@/hooks/useToast';
import type { CreateTrendRequest, UpdateTrendRequest, AdminTrendResponse } from '@/types/trend';

/**
 * Admin Query Keys
 */
export const adminKeys = {
  all: ['admin'] as const,
  trends: () => [...adminKeys.all, 'trends'] as const,
  trend: (id: number) => [...adminKeys.all, 'trend', id] as const,
  election: (id: string) => [...adminKeys.all, 'election', id] as const,
};

/**
 * Admin: 트렌드 목록 조회 Hook
 */
export const useTrends = (enabled = true) =>
  useQuery({
    queryKey: adminKeys.trends(),
    // Orval API 호출 후 타입 캐스팅 (Swagger와 실제 API 스키마 불일치)
    queryFn: () => getTrends() as Promise<AdminTrendResponse[]>,
    enabled,
  });

/**
 * Admin: 트렌드 상세 조회 Hook
 * 목록 API에서 특정 ID의 트렌드를 찾아 반환
 */
export const useGetTrendDetail = (trendId: number) =>
  useQuery({
    queryKey: adminKeys.trend(trendId),
    queryFn: async () => {
      const trends = (await getTrends()) as AdminTrendResponse[];
      const trend = trends.find((t) => t.id === trendId);
      if (!trend) {
        throw new Error('Trend not found');
      }
      return trend;
    },
    enabled: !!trendId,
    staleTime: 1000 * 60,
  });

/**
 * Admin: Trend 생성 Hook
 */
export const useCreateTrend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTrendRequest) => createTrend(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.trends() });
    },
  });
};

/**
 * Admin: 트렌드 수정 Hook
 */
export const useUpdateTrend = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ trendId, data }: { trendId: number; data: UpdateTrendRequest }) =>
      updateTrend(trendId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.trends() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.trend(variables.trendId) });
      showToast('트렌드가 수정되었습니다.');
      window.location.href = '/admin/trend';
    },
    onError: () => {
      showToast('트렌드 수정에 실패했습니다.');
    },
  });
};

/**
 * Admin: 트렌드 삭제 Hook
 */
export const useDeleteTrend = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (trendId: number) => deleteTrend(trendId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.trends() });
      showToast('트렌드가 삭제되었습니다.');
      window.location.href = '/admin/trend';
    },
    onError: () => {
      showToast('트렌드 삭제에 실패했습니다.');
    },
  });
};

/**
 * Admin: 선거 상세 조회 Hook (Query)
 */
export const useElection = (electionId: string) =>
  useQuery({
    queryKey: adminKeys.election(electionId),
    queryFn: () => getItem(electionId),
    enabled: !!electionId,
  });

/**
 * Admin: 선거 상세 조회 Hook (Mutation)
 * 사용자 액션에 의해 선거 정보를 가져올 때 사용
 */
export const useFetchElection = () =>
  useMutation({
    mutationFn: (electionId: string) => getItem(electionId),
  });

/**
 * Admin: Pre-signed URL 발급 Hook
 * 이미지 업로드 시 S3 Pre-signed URL을 받아옴
 */
export const useGeneratePresignedUrl = () =>
  useMutation({
    mutationFn: (filename: string) => generatePresignedUrl({ filename }),
  });

/**
 * Admin: Trend ID 중복 체크 Hook
 * Trend Alias가 이미 존재하는지 확인
 */
export const useCheckTrendAlias = () =>
  useMutation({
    mutationFn: (alias: string) => checkTrendAlias({ alias }),
  });

import { useRouter } from 'next/navigation';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/hooks/useToast';
import { adminApi } from '@/services/api/admin';
import type { CreateTrendRequest, UpdateTrendRequest } from '@/types/trend';

/**
 * 트렌드 목록 조회 훅
 */
export const useGetTrends = () =>
  useQuery({
    queryKey: ['admin', 'trends'],
    queryFn: () => adminApi.getTrends(),
    staleTime: 1000 * 60,
  });

/**
 * 트렌드 상세 조회 훅
 * 목록 API에서 특정 ID의 트렌드를 찾아 반환
 */
export const useGetTrendDetail = (trendId: number) =>
  useQuery({
    queryKey: ['admin', 'trend', trendId],
    queryFn: async () => {
      const trends = await adminApi.getTrends();
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
 * 트렌드 생성 훅
 */
export const useCreateTrend = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateTrendRequest) => adminApi.createTrend(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'trends'] });
      showToast('트렌드가 생성되었습니다.');
      router.push('/admin/trend');
    },
    onError: () => {
      showToast('트렌드 생성에 실패했습니다.');
    },
  });
};

/**
 * 트렌드 수정 훅
 */
export const useUpdateTrend = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ trendId, data }: { trendId: number; data: UpdateTrendRequest }) =>
      adminApi.updateTrend(trendId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'trends'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'trend', variables.trendId] });
      showToast('트렌드가 수정되었습니다.');
      router.push('/admin/trend');
    },
    onError: () => {
      showToast('트렌드 수정에 실패했습니다.');
    },
  });
};

/**
 * 트렌드 삭제 훅
 */
export const useDeleteTrend = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (trendId: number) => adminApi.deleteTrend(trendId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'trends'] });
      showToast('트렌드가 삭제되었습니다.');
      router.push('/admin/trend');
    },
    onError: () => {
      showToast('트렌드 삭제에 실패했습니다.');
    },
  });
};

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
import type {
  CreateHotpickRequest,
  UpdateHotpickRequest,
  AdminHotpickResponse,
} from '@/types/hotpick';

/**
 * Admin Query Keys
 */
export const adminKeys = {
  all: ['admin'] as const,
  hotpicks: () => [...adminKeys.all, 'hotpicks'] as const,
  hotpick: (id: number) => [...adminKeys.all, 'hotpick', id] as const,
  election: (id: string) => [...adminKeys.all, 'election', id] as const,
};

/**
 * Admin: 핫픽 목록 조회 Hook
 */
export const useHotpicks = (enabled = true) =>
  useQuery({
    queryKey: adminKeys.hotpicks(),
    // Orval API 호출 후 타입 캐스팅 (Swagger와 실제 API 스키마 불일치)
    queryFn: () => getTrends() as Promise<AdminHotpickResponse[]>,
    enabled,
  });

/**
 * Admin: 핫픽 상세 조회 Hook
 * 목록 API에서 특정 ID의 핫픽을 찾아 반환
 */
export const useGetHotpickDetail = (hotpickId: number) =>
  useQuery({
    queryKey: adminKeys.hotpick(hotpickId),
    queryFn: async () => {
      const hotpicks = (await getTrends()) as AdminHotpickResponse[];
      const hotpick = hotpicks.find((h) => h.id === hotpickId);
      if (!hotpick) {
        throw new Error('Hotpick not found');
      }
      return hotpick;
    },
    enabled: !!hotpickId,
    staleTime: 1000 * 60,
  });

/**
 * Admin: Hotpick 생성 Hook
 */
export const useCreateHotpick = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHotpickRequest) => createTrend(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.hotpicks() });
    },
  });
};

/**
 * Admin: 핫픽 수정 Hook
 */
export const useUpdateHotpick = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ hotpickId, data }: { hotpickId: number; data: UpdateHotpickRequest }) =>
      updateTrend(hotpickId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.hotpicks() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.hotpick(variables.hotpickId) });
      showToast('핫픽이 수정되었습니다.');
      window.location.href = '/admin/hotpick';
    },
    onError: () => {
      showToast('핫픽 수정에 실패했습니다.');
    },
  });
};

/**
 * Admin: 핫픽 삭제 Hook
 */
export const useDeleteHotpick = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (hotpickId: number) => deleteTrend(hotpickId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.hotpicks() });
      showToast('핫픽이 삭제되었습니다.');
      window.location.href = '/admin/hotpick';
    },
    onError: () => {
      showToast('핫픽 삭제에 실패했습니다.');
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
 * Admin: Hotpick Alias 중복 체크 Hook
 * Hotpick Alias가 이미 존재하는지 확인
 */
export const useCheckHotpickAlias = () =>
  useMutation({
    mutationFn: (alias: string) => checkTrendAlias({ alias }),
  });

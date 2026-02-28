import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/generated/api/client/admin-category/admin-category';
import {
  getHotpicks,
  getHotpick,
  createHotpick,
  updateHotpick,
  deleteHotpick,
  checkSlug,
} from '@/generated/api/client/admin-hotpick/admin-hotpick';
import { generatePresignedUrl } from '@/generated/api/client/admin-storage/admin-storage';
import type {
  AdminCategoryResponse,
  AdminHotpickSummaryResponse,
  AdminHotpickDetailResponse,
  CreateCategoryRequest,
  CreateHotpickRequest,
  UpdateCategoryRequest,
  UpdateHotpickRequest,
  HotpickSlugCheckResponse,
} from '@/generated/models';
import { useToast } from '@/hooks/useToast';

/**
 * Admin Query Keys
 */
export const adminKeys = {
  all: ['admin'] as const,
  hotpicks: () => [...adminKeys.all, 'hotpicks'] as const,
  hotpick: (id: number) => [...adminKeys.all, 'hotpick', id] as const,
  categories: () => [...adminKeys.all, 'categories'] as const,
};

// ──────────────────────────────────────────────────────────
// Hotpick Hooks
// ──────────────────────────────────────────────────────────

/**
 * Admin: 핫픽 목록 조회 Hook
 */
export const useHotpicks = (enabled = true) =>
  useQuery({
    queryKey: adminKeys.hotpicks(),
    queryFn: () => getHotpicks() as Promise<AdminHotpickSummaryResponse[]>,
    enabled,
  });

/**
 * Admin: 핫픽 상세 조회 Hook
 */
export const useGetHotpickDetail = (hotpickId: number) =>
  useQuery({
    queryKey: adminKeys.hotpick(hotpickId),
    queryFn: () => getHotpick(hotpickId) as Promise<AdminHotpickDetailResponse>,
    enabled: !!hotpickId,
    staleTime: 1000 * 60,
  });

/**
 * Admin: Hotpick 생성 Hook
 */
export const useCreateHotpick = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHotpickRequest) => createHotpick(data),
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
      updateHotpick(hotpickId, data),
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
    mutationFn: (hotpickId: number) => deleteHotpick(hotpickId),
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
 * Admin: Pre-signed URL 발급 Hook
 */
export const useGeneratePresignedUrl = () =>
  useMutation({
    mutationFn: (filename: string) => generatePresignedUrl({ filename }),
  });

/**
 * Admin: Hotpick Slug 중복 체크 Hook
 */
export const useCheckHotpickAlias = () =>
  useMutation({
    mutationFn: async (slug: string) => {
      const result = await checkSlug({ slug });
      return result as HotpickSlugCheckResponse;
    },
  });

// ──────────────────────────────────────────────────────────
// Category Hooks
// ──────────────────────────────────────────────────────────

/**
 * Admin: 카테고리 목록 조회 Hook
 */
export const useAdminCategories = (enabled = true) =>
  useQuery({
    queryKey: adminKeys.categories(),
    queryFn: () => getCategories() as Promise<AdminCategoryResponse[]>,
    enabled,
  });

/**
 * Admin: 카테고리 생성 Hook
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => createCategory(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
      showToast('카테고리가 생성되었습니다.');
    },
    onError: () => {
      showToast('카테고리 생성에 실패했습니다.');
    },
  });
};

/**
 * Admin: 카테고리 수정 Hook
 */
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: number; data: UpdateCategoryRequest }) =>
      updateCategory(categoryId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
      showToast('카테고리가 수정되었습니다.');
    },
    onError: () => {
      showToast('카테고리 수정에 실패했습니다.');
    },
  });
};

/**
 * Admin: 카테고리 삭제 Hook
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (categoryId: number) => deleteCategory(categoryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
      showToast('카테고리가 삭제되었습니다.');
    },
    onError: () => {
      showToast('카테고리 삭제에 실패했습니다.');
    },
  });
};

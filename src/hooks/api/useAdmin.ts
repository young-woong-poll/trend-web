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
import {
  getAll as getServerMetas,
  create as createServerMeta,
  _delete as deleteServerMeta,
} from '@/generated/api/client/admin-servermeta/admin-servermeta';
import { generatePresignedUrl } from '@/generated/api/client/admin-storage/admin-storage';
import {
  getSuggestions,
  getSuggestion,
  approveSuggestion,
  rejectSuggestion,
} from '@/generated/api/client/admin-suggestion/admin-suggestion';
import type {
  AdminCategoryResponse,
  AdminHotpickSummaryResponse,
  AdminHotpickDetailResponse,
  CreateCategoryRequest,
  CreateHotpickRequest,
  CreateServerMetaRequest,
  ServerMetaResponse,
  UpdateCategoryRequest,
  UpdateHotpickRequest,
  HotpickSlugCheckResponse,
  SuggestionResponse,
  GetSuggestionsStatus,
  ReviewSuggestionRequest,
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
  serverMetas: () => [...adminKeys.all, 'serverMetas'] as const,
  suggestions: (status?: GetSuggestionsStatus) =>
    [...adminKeys.all, 'suggestions', status] as const,
  suggestion: (id: number) => [...adminKeys.all, 'suggestion', id] as const,
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

// ──────────────────────────────────────────────────────────
// ServerMeta Hooks
// ──────────────────────────────────────────────────────────

/**
 * Admin: ServerMeta 목록 조회 Hook
 */
export const useServerMetas = (enabled = true) =>
  useQuery({
    queryKey: adminKeys.serverMetas(),
    queryFn: () => getServerMetas() as Promise<ServerMetaResponse[]>,
    enabled,
  });

/**
 * Admin: ServerMeta 생성 Hook
 */
export const useCreateServerMeta = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateServerMetaRequest) => createServerMeta(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.serverMetas() });
      showToast('서버 메타가 생성되었습니다.');
    },
    onError: () => {
      showToast('서버 메타 생성에 실패했습니다.');
    },
  });
};

/**
 * Admin: ServerMeta 삭제 Hook
 */
export const useDeleteServerMeta = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteServerMeta(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.serverMetas() });
      showToast('서버 메타가 삭제되었습니다.');
    },
    onError: () => {
      showToast('서버 메타 삭제에 실패했습니다.');
    },
  });
};

// ──────────────────────────────────────────────────────────
// Suggestion Hooks
// ──────────────────────────────────────────────────────────

/**
 * Admin: 제안 목록 조회 Hook
 */
export const useSuggestions = (status?: GetSuggestionsStatus) =>
  useQuery({
    queryKey: adminKeys.suggestions(status),
    queryFn: () => getSuggestions(status ? { status } : undefined) as Promise<SuggestionResponse[]>,
  });

/**
 * Admin: 제안 상세 조회 Hook
 */
export const useAdminSuggestion = (id: number) =>
  useQuery({
    queryKey: adminKeys.suggestion(id),
    queryFn: () => getSuggestion(id) as Promise<SuggestionResponse>,
    enabled: !!id,
  });

/**
 * Admin: 제안 승인 Hook
 */
export const useApproveSuggestion = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReviewSuggestionRequest }) =>
      approveSuggestion(id, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.suggestions() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.suggestion(variables.id) });
      showToast('제안이 승인되었습니다. 핫픽이 자동 생성됩니다.');
    },
    onError: () => {
      showToast('제안 승인에 실패했습니다.');
    },
  });
};

/**
 * Admin: 제안 거절 Hook
 */
export const useRejectSuggestion = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReviewSuggestionRequest }) =>
      rejectSuggestion(id, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.suggestions() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.suggestion(variables.id) });
      showToast('제안이 거절되었습니다.');
    },
    onError: () => {
      showToast('제안 거절에 실패했습니다.');
    },
  });
};

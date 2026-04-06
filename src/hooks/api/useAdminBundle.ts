import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { customInstance } from '@/lib/axios-mutator';
import type {
  AdminBundleSummary,
  AdminBundleStats,
  UpdateBundleStatusRequest,
  UpdateBundleStatusResponse,
} from '@/types/admin-bundle';

export const adminBundleKeys = {
  all: ['admin', 'bundle'] as const,
  list: () => [...adminBundleKeys.all, 'list'] as const,
  stats: (slug: string) => [...adminBundleKeys.all, 'stats', slug] as const,
};

export const adminBundleQueries = {
  list: () =>
    queryOptions<AdminBundleSummary[]>({
      queryKey: adminBundleKeys.list(),
      queryFn: () =>
        customInstance<AdminBundleSummary[]>({
          url: '/admin/api/v1/bundles',
          method: 'GET',
        }),
    }),

  stats: (slug: string) =>
    queryOptions<AdminBundleStats>({
      queryKey: adminBundleKeys.stats(slug),
      queryFn: () =>
        customInstance<AdminBundleStats>({
          url: `/admin/api/v1/bundles/${slug}/stats`,
          method: 'GET',
        }),
      staleTime: 0,
    }),
};

export const useAdminBundleList = () => useQuery(adminBundleQueries.list());

export const useAdminBundleStats = (slug: string) =>
  useQuery({
    ...adminBundleQueries.stats(slug),
    enabled: !!slug,
  });

export const useUpdateBundleStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdateBundleStatusRequest }) =>
      customInstance<UpdateBundleStatusResponse>({
        url: `/admin/api/v1/bundles/${slug}/status`,
        method: 'PATCH',
        data,
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminBundleKeys.list() });
      void queryClient.invalidateQueries({ queryKey: adminBundleKeys.stats(variables.slug) });
    },
  });
};

// src/hooks/api/useBundle.ts
import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { customInstance } from '@/lib/axios-mutator';
import type {
  BundleDetail,
  BundleElection,
  BundleAnswerRequest,
  BundleMyResult,
} from '@/types/bundle';

/**
 * Bundle Query Keys
 */
export const bundleKeys = {
  all: ['bundle'] as const,
  detail: (slug: string) => [...bundleKeys.all, 'detail', slug] as const,
  elections: (slug: string) => [...bundleKeys.all, 'elections', slug] as const,
  myResult: (slug: string) => [...bundleKeys.all, 'myResult', slug] as const,
};

/**
 * Query Options
 */
export const bundleQueries = {
  detail: (slug: string) =>
    queryOptions<BundleDetail | null>({
      queryKey: bundleKeys.detail(slug),
      queryFn: () =>
        customInstance<BundleDetail>({
          url: `/api/v1/bundles/${slug}`,
          method: 'GET',
        }),
      staleTime: 60 * 1000,
    }),

  elections: (slug: string) =>
    queryOptions<BundleElection[] | null>({
      queryKey: bundleKeys.elections(slug),
      queryFn: () =>
        customInstance<BundleElection[]>({
          url: `/api/v1/bundles/${slug}/elections`,
          method: 'GET',
        }),
      staleTime: 60 * 1000,
    }),

  myResult: (slug: string) =>
    queryOptions<BundleMyResult | null>({
      queryKey: bundleKeys.myResult(slug),
      queryFn: () =>
        customInstance<BundleMyResult>({
          url: `/api/v1/bundles/${slug}/my-result`,
          method: 'GET',
        }),
      staleTime: 0,
    }),
};

/**
 * Hooks
 */
export const useBundleDetail = (slug: string) =>
  useQuery({
    ...bundleQueries.detail(slug),
    enabled: !!slug,
  });

export const useBundleElections = (slug: string) =>
  useQuery({
    ...bundleQueries.elections(slug),
    enabled: !!slug,
  });

export const useBundleMyResult = (slug: string) =>
  useQuery({
    ...bundleQueries.myResult(slug),
    enabled: !!slug,
    refetchOnMount: 'always',
  });

export const useSubmitBundleAnswers = (slug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BundleAnswerRequest) =>
      customInstance({
        url: `/api/v1/bundles/${slug}/answers`,
        method: 'POST',
        data,
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bundleKeys.myResult(slug) });
    },
  });
};

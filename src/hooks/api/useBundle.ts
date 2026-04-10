// src/hooks/api/useBundle.ts
import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getDetail1,
  getElections,
  getMyResult,
  submitAnswers,
} from '@/generated/api/client/bundle/bundle';
import type {
  BundleDetail,
  BundleElection,
  BundleMyResult,
  BundleAnswerRequest,
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
 *
 * generated API 함수의 반환 타입(BaseResponse unwrap)을 FE alias 타입으로 캐스팅.
 * categoryCode: string → CategoryCode 좁히기를 위해 필요.
 */
export const bundleQueries = {
  detail: (slug: string) =>
    queryOptions<BundleDetail | undefined>({
      queryKey: bundleKeys.detail(slug),
      queryFn: () => getDetail1(slug) as Promise<BundleDetail | undefined>,
      staleTime: 60 * 1000,
    }),

  elections: (slug: string) =>
    queryOptions<BundleElection[] | undefined>({
      queryKey: bundleKeys.elections(slug),
      queryFn: () => getElections(slug) as Promise<BundleElection[] | undefined>,
      staleTime: 60 * 1000,
    }),

  myResult: (slug: string) =>
    queryOptions<BundleMyResult | undefined>({
      queryKey: bundleKeys.myResult(slug),
      queryFn: () => getMyResult(slug) as Promise<BundleMyResult | undefined>,
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
    mutationFn: (data: BundleAnswerRequest) => submitAnswers(slug, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bundleKeys.myResult(slug) });
    },
  });
};

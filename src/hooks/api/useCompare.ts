// src/hooks/api/useCompare.ts
import { queryOptions, useQuery, useMutation } from '@tanstack/react-query';

import { customInstance } from '@/lib/axios-mutator';
import type {
  CompareLink,
  CompareResult,
  CreateCompareLinkRequest,
  CreateCompareLinkResponse,
} from '@/types/compare';

/**
 * Compare Query Keys
 */
export const compareKeys = {
  all: ['compare'] as const,
  link: (token: string) => [...compareKeys.all, 'link', token] as const,
  result: (token: string) => [...compareKeys.all, 'result', token] as const,
};

/**
 * Query Options
 */
export const compareQueries = {
  link: (token: string) =>
    queryOptions<CompareLink | null>({
      queryKey: compareKeys.link(token),
      queryFn: () =>
        customInstance<CompareLink>({
          url: `/api/v1/compare-links/${token}`,
          method: 'GET',
        }),
      staleTime: 30 * 1000,
    }),

  result: (token: string) =>
    queryOptions<CompareResult | null>({
      queryKey: compareKeys.result(token),
      queryFn: () =>
        customInstance<CompareResult>({
          url: `/api/v1/compare-links/${token}/result`,
          method: 'GET',
        }),
      staleTime: 0,
    }),
};

/**
 * Hooks
 */
export const useCompareLink = (token: string) =>
  useQuery({
    ...compareQueries.link(token),
    enabled: !!token,
  });

export const useCompareResult = (token: string) =>
  useQuery({
    ...compareQueries.result(token),
    enabled: !!token,
  });

export const useCreateCompareLink = (slug: string) =>
  useMutation({
    mutationFn: (data: CreateCompareLinkRequest) =>
      customInstance<CreateCompareLinkResponse>({
        url: `/api/v1/bundles/${slug}/compare-links`,
        method: 'POST',
        data,
        headers: { 'Content-Type': 'application/json' },
      }),
  });

export const useJoinCompareLink = (token: string) =>
  useMutation({
    mutationFn: () =>
      customInstance({
        url: `/api/v1/compare-links/${token}/join`,
        method: 'POST',
      }),
  });

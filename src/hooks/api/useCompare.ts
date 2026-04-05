// src/hooks/api/useCompare.ts
import { queryOptions, useQuery, useMutation } from '@tanstack/react-query';

import { customInstance } from '@/lib/axios-mutator';
import type {
  CompareLink,
  CompareResult,
  CreateCompareLinkRequest,
  CreateCompareLinkResponse,
} from '@/types/compare';
import type { GroupCompareResult } from '@/types/group-compare';

/**
 * Compare Query Keys
 */
export const compareKeys = {
  all: ['compare'] as const,
  link: (token: string) => [...compareKeys.all, 'link', token] as const,
  result: (token: string) => [...compareKeys.all, 'result', token] as const,
  groupResult: (token: string) => [...compareKeys.all, 'group-result', token] as const,
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

  groupResult: (token: string) =>
    queryOptions<GroupCompareResult | null>({
      queryKey: compareKeys.groupResult(token),
      queryFn: () =>
        customInstance<GroupCompareResult>({
          url: `/api/v1/compare-links/${token}/group-result`,
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
    mutationFn: (displayName: string | undefined = undefined) =>
      customInstance({
        url: `/api/v1/compare-links/${token}/join`,
        method: 'POST',
        ...(displayName
          ? { data: { displayName }, headers: { 'Content-Type': 'application/json' } }
          : {}),
      }),
  });

export const useGroupCompareResult = (token: string) =>
  useQuery({
    ...compareQueries.groupResult(token),
    enabled: !!token,
  });

export const useUpdateGroupName = (token: string) =>
  useMutation({
    mutationFn: (groupName: string) =>
      customInstance({
        url: `/api/v1/compare-links/${token}/group-name`,
        method: 'PATCH',
        data: { groupName },
        headers: { 'Content-Type': 'application/json' },
      }),
  });

export const useCloseGroup = (token: string) =>
  useMutation({
    mutationFn: () =>
      customInstance({
        url: `/api/v1/compare-links/${token}/close`,
        method: 'PATCH',
      }),
  });

export const useReopenGroup = (token: string) =>
  useMutation({
    mutationFn: () =>
      customInstance({
        url: `/api/v1/compare-links/${token}/reopen`,
        method: 'PATCH',
      }),
  });

/** 그룹 내 1:1 비교 링크 즉시 생성 */
export const useCreatePairCompare = (groupToken: string) =>
  useMutation({
    mutationFn: (targetUserId: string) =>
      customInstance<{ token: string }>({
        url: `/api/v1/compare-links/${groupToken}/pair`,
        method: 'POST',
        data: { targetUserId },
        headers: { 'Content-Type': 'application/json' },
      }),
  });

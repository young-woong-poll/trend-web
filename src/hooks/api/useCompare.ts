// src/hooks/api/useCompare.ts
import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { createCompareLink } from '@/generated/api/client/bundle/bundle';
import {
  getInfo,
  getOneToOneResult,
  getGroupResult,
  join,
  updateMyCompareProfile,
  updateGroupSettings,
  close,
  reopen,
  createPair,
} from '@/generated/api/client/compare-link/compare-link';
import { myCompareLinksQueryKey } from '@/hooks/api/useMyCompareLinks';
import type { CompareLink, CompareResult, CreateCompareLinkRequest } from '@/types/compare';
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
 *
 * generated API 함수의 반환 타입(BaseResponse unwrap)을 FE alias 타입으로 캐스팅.
 * categoryCode: string → CategoryCode 좁히기를 위해 필요.
 */
export const compareQueries = {
  link: (token: string) =>
    queryOptions<CompareLink | undefined>({
      queryKey: compareKeys.link(token),
      queryFn: () => getInfo(token) as Promise<CompareLink | undefined>,
      staleTime: 0,
    }),

  result: (token: string) =>
    queryOptions<CompareResult | undefined>({
      queryKey: compareKeys.result(token),
      queryFn: () => getOneToOneResult(token) as Promise<CompareResult | undefined>,
      staleTime: 0,
    }),

  groupResult: (token: string) =>
    queryOptions<GroupCompareResult | undefined>({
      queryKey: compareKeys.groupResult(token),
      queryFn: () => getGroupResult(token) as Promise<GroupCompareResult | undefined>,
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

export const useCreateCompareLink = (slug: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCompareLinkRequest) => createCompareLink(slug, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: myCompareLinksQueryKey(slug) });
    },
  });
};

export const useJoinCompareLink = (token: string) =>
  useMutation({
    mutationFn: (params?: { displayName?: string; profileColor?: string }) =>
      join(token, params ?? {}),
  });

export const useGroupCompareResult = (token: string) =>
  useQuery({
    ...compareQueries.groupResult(token),
    enabled: !!token,
    refetchOnMount: 'always',
  });

export const useUpdateMyGroupProfile = (token: string) =>
  useMutation({
    mutationFn: (data: { displayName?: string; displayProfileColor?: string }) =>
      updateMyCompareProfile(token, data),
  });

export const useUpdateGroupSettings = (token: string) =>
  useMutation({
    mutationFn: (data: { groupName?: string; showGenderContent?: boolean }) =>
      updateGroupSettings(token, data),
  });

export const useCloseGroup = (token: string) =>
  useMutation({
    mutationFn: () => close(token),
  });

export const useReopenGroup = (token: string) =>
  useMutation({
    mutationFn: () => reopen(token),
  });

/** 그룹 내 1:1 비교 링크 즉시 생성 */
export const useCreatePairCompare = (groupToken: string) =>
  useMutation({
    mutationFn: (targetUserId: string) => createPair(groupToken, { targetUserId }),
  });

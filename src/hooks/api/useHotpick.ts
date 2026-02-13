import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { getTrendItemOptions } from '@/generated/api/client/trend/trend';
import type { TrendItemOptionsResponse, OptionCount } from '@/generated/models';

/**
 * Hotpick Query Keys
 */
export const hotpickKeys = {
  all: ['hotpick'] as const,
  electionOptions: (hotpickAlias: string, electionId: string) =>
    [...hotpickKeys.all, 'electionOptions', hotpickAlias, electionId] as const,
};

/**
 * Hotpick 선거 옵션 카운트 조회 Hook
 */
export const useHotpickElectionOptionsCount = ({
  hotpickAlias,
  electionId,
  enabled = true,
  size,
}: {
  hotpickAlias: string;
  electionId: string;
  enabled?: boolean;
  size?: number;
}) =>
  useQuery({
    queryKey: hotpickKeys.electionOptions(hotpickAlias, electionId),
    queryFn: () => getTrendItemOptions(hotpickAlias, electionId, { size }),
    enabled,
    throwOnError: true,
    staleTime: 60 * 1000,
  });

/**
 * Hotpick 선거 옵션 카운트를 Map 형태로 조회하는 Hook
 */
export const useHotpickElectionOptionsCountMap = (
  hotpickAlias: string,
  electionId: string,
  size?: number,
  options?: Omit<
    UseQueryOptions<TrendItemOptionsResponse, Error, Record<string, number>>,
    'queryKey' | 'queryFn' | 'select'
  >
) =>
  useQuery({
    queryKey: hotpickKeys.electionOptions(hotpickAlias, electionId),
    queryFn: () => getTrendItemOptions(hotpickAlias, electionId, { size }),
    throwOnError: true,
    select: (data: TrendItemOptionsResponse) =>
      (data.options ?? []).reduce(
        (acc: Record<string, number>, option: OptionCount) => ({
          ...acc,
          [option.id ?? '']: option.count ?? 0,
        }),
        {} as Record<string, number>
      ),
    staleTime: 60 * 1000,
    ...options,
  });

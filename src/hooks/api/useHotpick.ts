/**
 * Hotpick 선거 옵션 카운트 hooks — 스텁 처리
 *
 * 투표 수는 이제 ElectionViewResponse.items[].voteCount/voteRate에 내장됨.
 * 별도 API 불필요하므로 스텁 처리.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

/**
 * Hotpick Query Keys
 */
export const hotpickKeys = {
  all: ['hotpick'] as const,
  electionOptions: (hotpickAlias: string, electionId: string) =>
    [...hotpickKeys.all, 'electionOptions', hotpickAlias, electionId] as const,
};

/**
 * Hotpick 선거 옵션 카운트 조회 Hook (스텁)
 */
export const useHotpickElectionOptionsCount = ({
  hotpickAlias,
  electionId,
  enabled = true,
}: {
  hotpickAlias: string;
  electionId: string;
  enabled?: boolean;
  size?: number;
}) =>
  useQuery({
    queryKey: hotpickKeys.electionOptions(hotpickAlias, electionId),
    queryFn: () => Promise.resolve({ options: [] as { id?: string; count?: number }[] }),
    enabled,
    staleTime: 60 * 1000,
  });

/**
 * Hotpick 선거 옵션 카운트를 Map 형태로 조회하는 Hook (스텁)
 */
export const useHotpickElectionOptionsCountMap = (
  hotpickAlias: string,
  electionId: string,
  _size?: number,
  _options?: Omit<
    UseQueryOptions<unknown, Error, Record<string, number>>,
    'queryKey' | 'queryFn' | 'select'
  >
) =>
  useQuery({
    queryKey: hotpickKeys.electionOptions(hotpickAlias, electionId),
    queryFn: () => Promise.resolve({} as Record<string, number>),
    staleTime: 60 * 1000,
  });

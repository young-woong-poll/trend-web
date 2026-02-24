/**
 * Election hooks — 스텁 처리
 *
 * 선거(election)가 핫픽에 내장되어 별도 CRUD API가 제거됨.
 * Admin election 페이지에서 참조하므로 인터페이스만 유지.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  CreateElectionRequest,
  UpdateElectionRequest,
  ElectionListParams,
  ElectionListResponse,
  Election,
} from '@/types/election';

/**
 * Election Query Keys
 */
export const electionKeys = {
  all: ['election'] as const,
  list: (params?: ElectionListParams) => [...electionKeys.all, 'list', params] as const,
  detail: (id: string) => [...electionKeys.all, 'detail', id] as const,
};

const EMPTY_LIST: ElectionListResponse = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 20,
};

/**
 * Admin: 선거 목록 조회 Hook (스텁)
 */
export const useElectionList = (_params?: ElectionListParams) =>
  useQuery({
    queryKey: electionKeys.list(_params),
    queryFn: () => Promise.resolve(EMPTY_LIST),
  });

/**
 * Admin: 선거 상세 조회 Hook (스텁)
 */
export const useElectionDetail = (electionId: string) =>
  useQuery({
    queryKey: electionKeys.detail(electionId),
    queryFn: () => Promise.resolve(null as Election | null),
    enabled: !!electionId,
  });

/**
 * Admin: 선거 생성 Hook (스텁)
 */
export const useCreateElection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_data: CreateElectionRequest) => {
      throw new Error('선거는 핫픽에 내장되어 별도 생성이 불필요합니다');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: electionKeys.all });
    },
  });
};

/**
 * Admin: 선거 수정 Hook (스텁)
 */
export const useUpdateElection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_params: { electionId: string; data: UpdateElectionRequest }) => {
      throw new Error('선거는 핫픽에 내장되어 별도 수정이 불필요합니다');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: electionKeys.all });
    },
  });
};

/**
 * Admin: 선거 삭제 Hook (스텁)
 */
export const useDeleteElection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_electionId: string) => {
      throw new Error('선거는 핫픽에 내장되어 별도 삭제가 불필요합니다');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: electionKeys.all });
    },
  });
};

/**
 * Admin: 선거 검색 Hook (스텁)
 */
export const useSearchElections = () =>
  useMutation({
    mutationFn: async (_params: ElectionListParams) => EMPTY_LIST,
  });

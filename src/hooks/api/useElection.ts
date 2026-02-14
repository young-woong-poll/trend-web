// ──────────────────────────────────────────────────────────
// [DEPRECATED] 수동 작성된 electionApi 기반 — BE API 연동 후 Orval 생성 함수로 교체 예정.
// Orval 재생성 후 이 파일의 queryFn들을 Orval 함수로 교체하세요.
// 관련 파일: src/services/api/election.ts (함께 삭제/교체)
// ──────────────────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useModal } from '@/contexts/ModalContext';
import { electionApi } from '@/services/api/election';
import type {
  CreateElectionRequest,
  UpdateElectionRequest,
  ElectionListParams,
} from '@/types/election';

/**
 * Election Query Keys
 */
export const electionKeys = {
  all: ['election'] as const,
  list: (params?: ElectionListParams) => [...electionKeys.all, 'list', params] as const,
  detail: (id: string) => [...electionKeys.all, 'detail', id] as const,
};

/**
 * Admin: 선거 목록 조회 Hook
 */
export const useElectionList = (params?: ElectionListParams) =>
  useQuery({
    queryKey: electionKeys.list(params),
    queryFn: () => electionApi.getElections(params),
  });

/**
 * Admin: 선거 상세 조회 Hook
 */
export const useElectionDetail = (electionId: string) =>
  useQuery({
    queryKey: electionKeys.detail(electionId),
    queryFn: () => electionApi.getElection(electionId),
    enabled: !!electionId,
  });

/**
 * Admin: 선거 생성 Hook
 */
export const useCreateElection = () => {
  const queryClient = useQueryClient();
  const { showAlert } = useModal();

  return useMutation({
    mutationFn: (data: CreateElectionRequest) => electionApi.createElection(data),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: electionKeys.all });
      showAlert(`선거가 생성되었습니다! 제목: ${result.title}`, {
        onConfirm: () => {
          window.location.href = '/admin/election';
        },
      });
    },
    onError: (error: Error) => {
      showAlert(`선거 생성 실패: ${error.message}`);
    },
  });
};

/**
 * Admin: 선거 수정 Hook
 */
export const useUpdateElection = () => {
  const queryClient = useQueryClient();
  const { showAlert } = useModal();

  return useMutation({
    mutationFn: ({ electionId, data }: { electionId: string; data: UpdateElectionRequest }) =>
      electionApi.updateElection(electionId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: electionKeys.all });
      void queryClient.invalidateQueries({
        queryKey: electionKeys.detail(variables.electionId),
      });
      showAlert('선거가 수정되었습니다.', {
        onConfirm: () => {
          window.location.href = '/admin/election';
        },
      });
    },
    onError: () => {
      showAlert('선거 수정에 실패했습니다.');
    },
  });
};

/**
 * Admin: 선거 삭제 Hook
 */
export const useDeleteElection = () => {
  const queryClient = useQueryClient();
  const { showAlert } = useModal();

  return useMutation({
    mutationFn: (electionId: string) => electionApi.deleteElection(electionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: electionKeys.all });
      showAlert('선거가 삭제되었습니다.', {
        onConfirm: () => {
          window.location.href = '/admin/election';
        },
      });
    },
    onError: (error: Error) => {
      showAlert(error.message || '선거 삭제에 실패했습니다.');
    },
  });
};

/**
 * Admin: 선거 검색 Hook (핫픽 폼에서 사용)
 * 검색어로 선거 목록을 조회하는 mutation
 */
export const useSearchElections = () =>
  useMutation({
    mutationFn: (params: ElectionListParams) => electionApi.getElections(params),
  });

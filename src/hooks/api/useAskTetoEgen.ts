// src/hooks/api/useAskTetoEgen.ts
//
// H3 "테토/에겐" React Query 훅.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createTetoEgenLink,
  getFriendTetoEgenMeta,
  getMyTetoEgenLink,
  getTetoEgenCount,
  submitFriendVote,
} from '@/api/ask-teto-egen';
import type {
  CreateTetoEgenLinkRequest,
  FriendTetoEgenMetaResponse,
  SubmitFriendVoteRequest,
} from '@/types/ask-teto-egen';

const keys = {
  count: ['askTetoEgen', 'count'] as const,
  myLink: ['askTetoEgen', 'myLink'] as const,
  friendMeta: (token: string) => ['askTetoEgen', 'friendMeta', token] as const,
};

export const useTetoEgenCount = () =>
  useQuery({
    queryKey: keys.count,
    queryFn: getTetoEgenCount,
    staleTime: 60 * 1000,
  });

// 링크 생성 후 다시 my 페이지로 진입했을 때 항상 최신 데이터를 보장하기 위해
// staleTime: 0 + refetchOnMount: 'always' 적용.
export const useMyTetoEgenLink = (enabled = true) =>
  useQuery({
    queryKey: keys.myLink,
    queryFn: getMyTetoEgenLink,
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });

// 링크 생성 직후 myLink invalidate는 불필요.
// LinkShareCard에서 보여줄 데이터(token, shareUrl)는 mutation 응답으로 이미 확보되며,
// my 페이지에 다음에 다시 진입할 때 자연스럽게 새로 fetch된다.
export const useCreateTetoEgenLink = () =>
  useMutation({
    mutationFn: (body: CreateTetoEgenLinkRequest) => createTetoEgenLink(body),
  });

export const useFriendTetoEgenMeta = (token: string, enabled = true) =>
  useQuery({
    queryKey: keys.friendMeta(token),
    queryFn: () => getFriendTetoEgenMeta(token),
    enabled: enabled && !!token,
    staleTime: 60 * 1000,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });

export const useSubmitFriendVote = (token: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SubmitFriendVoteRequest) => submitFriendVote(token, body),
    // vote 제출 직후 friendMeta 캐시를 결과 화면 상태로 동기화.
    // 사용자가 /my 등으로 이동했다가 뒤로가기로 돌아왔을 때, stale 캐시(myVote 없음)로 인해
    // 평가 화면이 잠깐 깜빡 노출되는 문제 방지.
    onSuccess: (data) => {
      queryClient.setQueryData<FriendTetoEgenMetaResponse | undefined>(
        keys.friendMeta(token),
        (old) => ({
          token,
          ownerDisplayName: data.ownerDisplayName,
          isOwn: old?.isOwn ?? false,
          myVote: data.myVote,
          ownerSelfAnswer: data.ownerSelfAnswer,
          friendVotes: data.friendVotes,
        })
      );
    },
  });
};

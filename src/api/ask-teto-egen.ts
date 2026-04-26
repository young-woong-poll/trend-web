// src/api/ask-teto-egen.ts
//
// H3 "테토/에겐" API 호출 함수.
// 응답 unwrapping은 axios 인터셉터(src/lib/axios.ts)가 처리하므로 여기서는 data만 받음.

import axiosInstance from '@/lib/axios';
import type {
  CreateTetoEgenLinkRequest,
  CreateTetoEgenLinkResponse,
  FriendTetoEgenMetaResponse,
  MyTetoEgenLinkResponse,
  SubmitFriendVoteRequest,
  SubmitFriendVoteResponse,
  TetoEgenCountResponse,
} from '@/types/ask-teto-egen';

const path = (suffix: string) => `/api/v1/ask/teto-egen${suffix}`;

const scenarioHeader = (scenario?: string | null) =>
  scenario ? { 'X-Mock-Scenario': scenario } : undefined;

export const getTetoEgenCount = async (
  scenario?: string | null
): Promise<TetoEgenCountResponse> => {
  const { data } = await axiosInstance.get<TetoEgenCountResponse>(path('/count'), {
    headers: scenarioHeader(scenario),
  });
  return data;
};

export const createTetoEgenLink = async (
  body: CreateTetoEgenLinkRequest
): Promise<CreateTetoEgenLinkResponse> => {
  const { data } = await axiosInstance.post<CreateTetoEgenLinkResponse>(path('/links'), body);
  return data;
};

export const getMyTetoEgenLink = async (
  scenario?: string | null
): Promise<MyTetoEgenLinkResponse> => {
  const { data } = await axiosInstance.get<MyTetoEgenLinkResponse>(path('/links/me'), {
    headers: scenarioHeader(scenario),
  });
  return data;
};

export const getFriendTetoEgenMeta = async (token: string): Promise<FriendTetoEgenMetaResponse> => {
  const { data } = await axiosInstance.get<FriendTetoEgenMetaResponse>(
    path(`/friend/${encodeURIComponent(token)}`)
  );
  return data;
};

export const submitFriendVote = async (
  token: string,
  body: SubmitFriendVoteRequest,
  scenario?: string | null
): Promise<SubmitFriendVoteResponse> => {
  const { data } = await axiosInstance.post<SubmitFriendVoteResponse>(
    path(`/friend/${encodeURIComponent(token)}/vote`),
    body,
    { headers: scenarioHeader(scenario) }
  );
  return data;
};

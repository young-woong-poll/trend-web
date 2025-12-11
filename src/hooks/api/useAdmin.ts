import { useMutation, useQuery } from '@tanstack/react-query';

import { adminApi } from '@/services/api/admin';
import type { CreateTrendRequest } from '@/types/trend';

/**
 * Admin Query Keys
 */
export const adminKeys = {
  all: ['admin'] as const,
  trend: () => [...adminKeys.all, 'trend'] as const,
  election: (electionId: string) => [...adminKeys.all, 'election', electionId] as const,
  storage: () => [...adminKeys.all, 'storage'] as const,
};

/**
 * Admin: Trend 생성 Hook
 */
export const useCreateTrend = () =>
  useMutation({
    mutationFn: (data: CreateTrendRequest) => adminApi.createTrend(data),
  });

/**
 * Admin: 선거 상세 조회 Hook (Query)
 */
export const useElection = (electionId: string) =>
  useQuery({
    queryKey: adminKeys.election(electionId),
    queryFn: () => adminApi.getElection(electionId),
    enabled: !!electionId,
  });

/**
 * Admin: 선거 상세 조회 Hook (Mutation)
 * 사용자 액션에 의해 선거 정보를 가져올 때 사용
 */
export const useFetchElection = () =>
  useMutation({
    mutationFn: (electionId: string) => adminApi.getElection(electionId),
  });

/**
 * Admin: Pre-signed URL 발급 Hook
 * 이미지 업로드 시 S3 Pre-signed URL을 받아옴
 * @returns uploadUrl과 cdnUrl을 포함한 객체
 */
export const useGeneratePresignedUrl = () =>
  useMutation({
    mutationFn: (filename: string) => adminApi.generatePresignedUrl(filename),
  });

/**
 * Admin: Trend ID 중복 체크 Hook
 * Trend ID가 이미 존재하는지 확인
 * @returns exists 여부를 포함한 객체
 */
export const useCheckTrendId = () =>
  useMutation({
    mutationFn: (trendId: string) => adminApi.checkTrendId(trendId),
  });

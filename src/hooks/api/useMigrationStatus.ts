/**
 * 마이그레이션 상태 조회 훅
 *
 * 익명 사용자의 TKUID에 묶인 vote/like/comment 데이터가 있는지 BE에 조회.
 * 회원가입 폼의 [연결하기/건너뛰기] prompt 노출 분기에 사용.
 */

import { useQuery } from '@tanstack/react-query';

import { getMigrationStatus } from '@/generated/api/client/auth-controller/auth-controller';
import type { MigrationStatusResponse } from '@/generated/models';
import { getTKUID, hasTKUID } from '@/lib/tkuid';

export const migrationStatusKeys = {
  all: ['auth', 'migrationStatus'] as const,
};

const fetchMigrationStatus = async (): Promise<MigrationStatusResponse> => {
  // TKUID가 없으면 자동 생성하지 않고 빈 헤더로 호출 — BE는 hasMigratableData=false 반환.
  const tkuId = hasTKUID() ? getTKUID() : '';
  return (await getMigrationStatus({
    headers: tkuId ? { 'x-tku-id': tkuId } : undefined,
  })) as MigrationStatusResponse;
};

export const useMigrationStatus = (enabled: boolean) =>
  useQuery({
    queryKey: migrationStatusKeys.all,
    queryFn: fetchMigrationStatus,
    enabled,
    staleTime: 0,
    retry: 1,
  });

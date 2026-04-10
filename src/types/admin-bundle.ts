// src/types/admin-bundle.ts
import type { CategoryCode } from '@/types/hotpick';

/** GET /admin/api/v1/bundles — 목록 아이템 */
export interface AdminBundleSummary {
  bundleId: number;
  hotpickId: number;
  slug: string;
  title: string;
  category: string;
  categoryCode: CategoryCode;
  questionCount: number;
  participantCount: number;
  compareLinkCount: number;
  status: 'ACTIVE' | 'CLOSED';
  createdAt: string;
}

/** 일별 참여 통계 */
export interface DailyStat {
  date: string;
  count: number;
}

/** 비교 링크 아이템 */
export interface AdminCompareLink {
  token: string;
  type: 'ONE_TO_ONE' | 'GROUP';
  creatorNickname: string;
  groupName: string | null;
  memberCount: number;
  isClosed: boolean;
  createdAt: string;
}

/** 질문별 통계 */
export interface AdminQuestionStat {
  electionId: string;
  title: string;
  optionA: string;
  optionB: string;
  optionACount: number;
  optionBCount: number;
  optionARate: number;
  optionBRate: number;
}

/** GET /admin/api/v1/bundles/{slug}/stats */
export interface AdminBundleStats {
  bundleId: number;
  slug: string;
  title: string;
  hotpickId: number;
  categoryCode: CategoryCode;
  status: 'ACTIVE' | 'CLOSED';
  participation: {
    totalParticipants: number;
    completionRate: number;
    dailyStats: DailyStat[];
  };
  compareLinks: {
    totalCount: number;
    oneToOneCount: number;
    groupCount: number;
    activeGroupCount: number;
    links: AdminCompareLink[];
  };
  questionStats: AdminQuestionStat[];
}

/** PUT /admin/api/v1/bundles/{slug} — 요청 */
export interface UpdateBundleRequest {
  title?: string;
  subtitle?: string;
  description?: string;
  categoryCode?: CategoryCode;
  imageUrl?: string;
  status?: 'ACTIVE' | 'CLOSED';
  questions?: UpdateBundleQuestion[];
}

export interface UpdateBundleQuestion {
  electionId?: string;
  title: string;
  optionA: string;
  optionB: string;
}

/** PUT /admin/api/v1/bundles/{slug} — 응답 */
export interface UpdateBundleResponse {
  slug: string;
  title: string;
  status: 'ACTIVE' | 'CLOSED';
}

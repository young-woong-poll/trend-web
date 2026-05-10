import type { BundleSummaryResponseStatus } from './bundleSummaryResponseStatus';

/**
 * 응답 데이터
 */
export interface BundleSummaryResponse {
  bundleId?: number;
  slug?: string;
  title?: string;
  subtitle?: string;
  category?: string;
  categoryCode?: string;
  categoryMeta?: string;
  questionCount?: number;
  status?: BundleSummaryResponseStatus;
  imageUrl?: string;
  participantCount?: number;
  completed?: boolean;
}

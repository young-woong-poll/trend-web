import type { BundleElectionOptionResponse } from './bundleElectionOptionResponse';

/**
 * 응답 데이터
 */
export interface BundleElectionResponse {
  electionId?: string;
  title?: string;
  options?: BundleElectionOptionResponse[];
}

import type { BundleElectionResponse } from './bundleElectionResponse';

/**
 * 공통 응답 포맷
 */
export interface BaseResponseListBundleElectionResponse {
  /** 응답 코드 */
  code?: string;
  /** 응답 메시지 */
  message?: string;
  /** 응답 데이터 */
  data?: BundleElectionResponse[];
}

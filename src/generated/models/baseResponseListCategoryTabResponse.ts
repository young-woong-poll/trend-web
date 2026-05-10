import type { CategoryTabResponse } from './categoryTabResponse';

/**
 * 공통 응답 포맷
 */
export interface BaseResponseListCategoryTabResponse {
  /** 응답 코드 */
  code?: string;
  /** 응답 메시지 */
  message?: string;
  /** 응답 데이터 */
  data?: CategoryTabResponse[];
}

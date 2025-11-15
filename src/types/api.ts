/**
 * API 응답의 기본 타입
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

/**
 * API 에러 응답 타입
 */
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

/**
 * 페이지네이션 메타 데이터
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * 페이지네이션이 포함된 응답 타입
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

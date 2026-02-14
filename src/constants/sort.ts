/**
 * 핫픽 정렬 옵션 상수
 * 메인 페이지, 네비게이션 등 핫픽 관련 API에서 공통으로 사용
 */
export const HOTPICK_SORT = 'popular' as const;

export type HotpickSortOption = 'popular' | 'latest';

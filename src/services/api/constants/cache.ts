/**
 * 캐싱 전략 상수
 * 서버 ISR revalidate와 클라이언트 staleTime에 공통 사용
 *
 * @description
 * - 서버: Next.js ISR의 revalidate 값으로 사용 (초 단위)
 * - 클라이언트: React Query의 staleTime으로 사용 (초 단위, 사용 시 * 1000)
 * - 데이터 특성에 따라 캐시 시간 차등 적용
 */

export const CACHE_TIMES = {
  // Display API 캐싱
  DISPLAY: {
    MAIN: 60, // 60초 - 메인 페이지 (자주 변경)
    HOTPICK: 60, // 60초 - 핫픽 페이지 (자주 변경)
    RESULT: 3600, // 1시간 - 투표 결과 (불변 데이터)
  },

  // Hotpick API 캐싱
  HOTPICK: {
    VOTE_COUNT: 60, // 60초 - 투표 수
    ELECTION_OPTIONS: 60, // 60초 - 선거 옵션
  },

  // Comment API 캐싱
  COMMENT: {
    LIST: 30, // 30초 - 댓글 목록
    COUNT: 30, // 30초 - 댓글 수
  },

  // Result API 캐싱
  RESULT: {
    EXISTS: 60, // 60초 - 결과 존재 여부
  },
} as const;

export type CacheTimes = typeof CACHE_TIMES;

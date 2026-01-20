/**
 * Query Key Factory
 * 서버와 클라이언트에서 공통으로 사용하는 Query Key 정의
 *
 * @description
 * - 서버/클라이언트 Query Key 통일 (중복 fetch 방지)
 * - 타입 안전성 보장
 * - 한 곳에서만 관리 (유지보수성)
 */

export const queryKeys = {
  // Display 관련
  display: {
    all: ['display'] as const,
    main: (params?: { size?: number; page?: number; sort?: 'latest' | 'popular' }) =>
      [...queryKeys.display.all, 'main', params] as const,
    mainInfinite: (params?: { size?: number; sort?: 'latest' | 'popular' }) =>
      [...queryKeys.display.all, 'mainInfinite', params] as const,
    trend: (trendAlias: string) => [...queryKeys.display.all, 'trend', trendAlias] as const,
    result: (resultId: string) => [...queryKeys.display.all, 'result', resultId] as const,
    comments: (trendId: string, itemId: string, sort: string) =>
      [...queryKeys.display.all, 'comments', trendId, itemId, sort] as const,
  },

  // Trend 관련
  trend: {
    all: ['trend'] as const,
    voteCount: (trendId: string) => [...queryKeys.trend.all, 'voteCount', trendId] as const,
    itemOptions: (trendAlias: string, itemId: string) =>
      [...queryKeys.trend.all, 'itemOptions', trendAlias, itemId] as const,
  },

  // Result 관련
  result: {
    all: ['result'] as const,
    exists: (resultId: string) => [...queryKeys.result.all, 'exists', resultId] as const,
  },

  // Comment 관련
  comment: {
    all: ['comment'] as const,
    count: (trendId: number, itemId: string) =>
      [...queryKeys.comment.all, 'count', trendId, itemId] as const,
  },
} as const;

// 타입 추출
export type QueryKeys = typeof queryKeys;

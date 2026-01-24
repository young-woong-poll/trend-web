/**
 * Orval 서버 API용 fetch mutator
 * 서버 컴포넌트에서 사용하며, Next.js ISR 캐싱을 지원합니다.
 *
 * Orval fetch client는 URL 문자열을 첫 번째 인자로 전달합니다.
 */

const API_URL =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://trend-api.votebox.kr';

type FetchOptions = RequestInit & {
  next?: { revalidate?: number | false; tags?: string[] };
};

export const serverFetchInstance = async <T>(url: string, options?: FetchOptions): Promise<T> => {
  // URL이 상대 경로인 경우 API_URL을 앞에 붙임
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

  const response = await fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  // 응답 전체를 반환 (status, data, headers 포함)
  const data = await response.json();

  return {
    data,
    status: response.status,
    headers: response.headers,
  } as T;
};

export default serverFetchInstance;

// Orval이 필요로 하는 타입 export
export type ErrorType<Error> = Error;
export type BodyType<BodyData> = BodyData;

/**
 * Orval 서버 API용 fetch mutator
 * 서버 컴포넌트에서 사용하며, Next.js ISR 캐싱을 지원합니다.
 *
 * Orval fetch client는 URL 문자열을 첫 번째 인자로 전달합니다.
 */

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://hotpick-api.votebox.kr';
const isMSW = process.env.ENABLE_MSW === 'true';

type FetchOptions = RequestInit & {
  next?: { revalidate?: number | false; tags?: string[] };
};

export const serverFetchInstance = async <T>(url: string, options?: FetchOptions): Promise<T> => {
  // URL이 상대 경로인 경우 API_URL을 앞에 붙임
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

  // MSW 환경에서는 Next.js Data Cache를 비활성화하여 항상 MSW 핸들러를 사용
  const fetchOptions: FetchOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
    ...(isMSW ? { cache: 'no-store' as const, next: undefined } : {}),
  };

  const response = await fetch(fullUrl, fetchOptions);

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

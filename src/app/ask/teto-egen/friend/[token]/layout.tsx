import { SITE_NAME, SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

const OG_IMAGE =
  'https://trend-image.votebox.kr/uploads/2026/05/08/3ab9c6adcc6b421a8da4bfea56444935.png';
const FALLBACK_NAME = '친구';

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
};

type FriendMetaApiResponse = {
  data?: {
    ownerDisplayName?: string;
  };
};

/**
 * 토큰으로 BE에 ownerDisplayName을 조회한다.
 * - 서버 컴포넌트에서 호출 → 인증 쿠키 미전달이 정상. friend meta 엔드포인트는 ownerDisplayName을 비인증으로도 반환한다.
 * - 64초 단위로 revalidate. 만료된 토큰일 경우 fallback name으로 처리.
 */
async function fetchDisplayName(token: string): Promise<string> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://hotpick-api.votebox.kr';
  try {
    const res = await fetch(`${apiBase}/api/v1/ask/teto-egen/friend/${encodeURIComponent(token)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return FALLBACK_NAME;
    }
    const json = (await res.json()) as FriendMetaApiResponse;
    return json.data?.ownerDisplayName ?? FALLBACK_NAME;
  } catch {
    return FALLBACK_NAME;
  }
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { token } = await params;
  const displayName = await fetchDisplayName(token);

  const title = `${displayName}님은 테토? 에겐?`;
  const description = `고르면 ${displayName}님 + 친구들 생각 공개!`;
  const pageUrl = `${SITE_URL}/ask/teto-egen/friend/${token}`;

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title,
      description,
      url: pageUrl,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE],
    },
    // 토큰 기반 사적 링크 — 검색엔진 인덱싱 차단
    robots: { index: false, follow: false },
  };
}

export default function TetoEgenFriendLayout({ children }: LayoutProps) {
  return children;
}

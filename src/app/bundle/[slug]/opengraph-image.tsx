import { ImageResponse } from 'next/og';

import { SITE_URL } from '@/lib/seo/constants';

export const runtime = 'edge';
export const revalidate = 300;
export const alt = 'HotPick 번들';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const fontBold = fetch(new URL('/fonts/NotoSansKR-Bold.ttf', SITE_URL)).then((res) =>
  res.arrayBuffer()
);
const fontRegular = fetch(new URL('/fonts/NotoSansKR-Regular.ttf', SITE_URL)).then((res) =>
  res.arrayBuffer()
);
const logoUrl = `${SITE_URL}/main-logo.png`;

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [boldFont, regularFont] = await Promise.all([fontBold, fontRegular]);

  let title = '가치관 테스트';
  let questionCount = 0;
  let participantCount = 0;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/v1/bundles/${slug}`, {
      next: { revalidate: 300 },
    });
    const json = await res.json();
    const bundle = json?.data;
    if (bundle) {
      title = bundle.title;
      questionCount = bundle.questionCount ?? 0;
      participantCount = bundle.participantCount ?? 0;
    }
  } catch {
    // 기본값 사용
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#121212',
          padding: '44px 56px',
          fontFamily: '"Noto Sans KR"',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt="HotPick"
          width="200"
          height="40"
          style={{ objectFit: 'contain', objectPosition: 'left' }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              fontSize: '52px',
              fontWeight: 700,
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.3,
              wordBreak: 'keep-all',
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '24px',
              fontSize: '24px',
              color: '#8a8a8a',
            }}
          >
            {questionCount > 0 && <span>{questionCount}개 질문</span>}
            {participantCount > 0 && <span>{participantCount.toLocaleString()}명 참여</span>}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Noto Sans KR', data: boldFont, weight: 700 },
        { name: 'Noto Sans KR', data: regularFont, weight: 400 },
      ],
    }
  );
}

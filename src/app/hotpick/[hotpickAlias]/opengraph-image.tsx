import { ImageResponse } from 'next/og';

import { getDetail } from '@/generated/api/server/hotpick/hotpick';
import { SITE_URL } from '@/lib/seo/constants';

export const runtime = 'edge';
export const alt = 'HotPick - 투표 플랫폼';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// 한글 폰트 로드 (Google Fonts - Noto Sans KR TTF)
const fontBold = fetch(
  'https://fonts.gstatic.com/s/notosanskr/v39/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzg01eLQ.ttf'
).then((res) => res.arrayBuffer());

const fontRegular = fetch(
  'https://fonts.gstatic.com/s/notosanskr/v39/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzuoyeLQ.ttf'
).then((res) => res.arrayBuffer());

const logoUrl = `${SITE_URL}/main-logo.png`;

export default async function OgImage({ params }: { params: Promise<{ hotpickAlias: string }> }) {
  const { hotpickAlias } = await params;
  const [boldFont, regularFont] = await Promise.all([fontBold, fontRegular]);

  try {
    const response = await getDetail(hotpickAlias, { next: { revalidate: 60 } });
    const hotpickData = response.status === 200 ? response.data.data : null;
    const election = hotpickData?.hotpick?.election;
    const items = election?.items ?? [];
    const title = election?.title ?? '';
    const totalVotes = election?.totalVoteCount ?? 0;
    const optionA = items[0]?.title ?? '';
    const optionB = items[1]?.title ?? '';
    const imageA = items[0]?.imageUrl;
    const imageB = items[1]?.imageUrl;
    const hasImages = !!imageA && !!imageB;

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
          {/* Header: Logo Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="HotPick"
            width="200"
            height="40"
            style={{ objectFit: 'contain', objectPosition: 'left' }}
          />

          {/* Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              marginTop: '28px',
              backgroundColor: '#1e1e1e',
              borderRadius: '16px',
              border: '1px solid #555555',
              padding: '36px 44px',
            }}
          >
            {/* Question */}
            <div
              style={{
                fontSize: '44px',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.3,
                wordBreak: 'keep-all',
              }}
            >
              {title}
            </div>

            {/* Options with Images */}
            <div
              style={{
                display: 'flex',
                gap: '20px',
                flex: 1,
                alignItems: 'center',
                marginTop: '24px',
              }}
            >
              {/* Option A */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: hasImages ? 'column' : 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: hasImages ? '14px' : '14px',
                  flex: 1,
                  height: hasImages ? '260px' : '90px',
                  borderRadius: '14px',
                  border: '2px solid #555555',
                  backgroundColor: 'rgba(255, 0, 255, 0.06)',
                  padding: hasImages ? '16px' : '0 28px',
                  overflow: 'hidden',
                }}
              >
                {hasImages && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imageA}
                    alt={optionA}
                    width="480"
                    height="160"
                    style={{
                      width: '100%',
                      height: '160px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                    }}
                  />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 700, color: '#ff00ff' }}>A</span>
                  <span style={{ fontSize: '36px', fontWeight: 600, color: '#ffffff' }}>
                    {optionA}
                  </span>
                </div>
              </div>

              {/* Option B */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: hasImages ? 'column' : 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: hasImages ? '14px' : '14px',
                  flex: 1,
                  height: hasImages ? '260px' : '90px',
                  borderRadius: '14px',
                  border: '2px solid #555555',
                  backgroundColor: 'rgba(255, 69, 0, 0.06)',
                  padding: hasImages ? '16px' : '0 28px',
                  overflow: 'hidden',
                }}
              >
                {hasImages && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imageB}
                    alt={optionB}
                    width="480"
                    height="160"
                    style={{
                      width: '100%',
                      height: '160px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                    }}
                  />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 700, color: '#ff4500' }}>B</span>
                  <span style={{ fontSize: '36px', fontWeight: 600, color: '#ffffff' }}>
                    {optionB}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer: 참여 인원 + CTA */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '20px',
              }}
            >
              <span style={{ fontSize: '30px', fontWeight: 500, color: '#8a8a8a' }}>
                {totalVotes > 0 ? `${totalVotes.toLocaleString()}명 참여` : '투표 진행 중'}
              </span>
              <span style={{ fontSize: '28px', fontWeight: 700, color: '#ff00ff' }}>
                투표하고 결과확인하기 →
              </span>
            </div>
          </div>
        </div>
      ),
      {
        ...size,
        fonts: [
          { name: 'Noto Sans KR', data: regularFont, weight: 400 },
          { name: 'Noto Sans KR', data: boldFont, weight: 700 },
        ],
      }
    );
  } catch {
    // fallback: 로고 + 슬로건
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#121212',
            fontFamily: '"Noto Sans KR"',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="HotPick"
            width="300"
            height="60"
            style={{ objectFit: 'contain' }}
          />
        </div>
      ),
      {
        ...size,
        fonts: [{ name: 'Noto Sans KR', data: regularFont, weight: 400 }],
      }
    );
  }
}

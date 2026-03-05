import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

import { SITE_URL } from '@/lib/seo/constants';

export const runtime = 'edge';

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

const COLORS = {
  bgDeep: '#0a0a0a',
  cardBg: 'rgba(255, 255, 255, 0.04)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#ffffff',
  textSecondary: '#b0b0b0',
  textTertiary: '#666666',
  barBg: 'rgba(255, 255, 255, 0.06)',
  barLosing: '#333333',
  gradientStart: '#ff00ff',
  gradientEnd: '#ff4500',
};

interface ElectionItem {
  electionItemId?: number;
  title?: string;
  voteCount?: number;
  voteRate?: number;
}

// 모듈 레벨에서 폰트 로드 (기존 opengraph-image.tsx 패턴과 동일)
const fontBoldPromise = fetch(new URL('/fonts/NotoSansKR-Bold.ttf', SITE_URL)).then((res) =>
  res.arrayBuffer()
);
const fontRegularPromise = fetch(new URL('/fonts/NotoSansKR-Regular.ttf', SITE_URL)).then((res) =>
  res.arrayBuffer()
);

async function fetchHotpickData(alias: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://hotpick-api.votebox.kr';
  const res = await fetch(`${apiUrl}/api/v1/hotpicks/${alias}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    return null;
  }

  const json = await res.json();
  return json?.data ?? null;
}

function formatCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}만`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return String(count);
}

function calcPercentage(voteCount: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((voteCount / total) * 100);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const alias = searchParams.get('alias');

  if (!alias) {
    return new Response('Missing alias parameter', { status: 400 });
  }

  try {
    const [fontBold, fontRegular] = await Promise.all([fontBoldPromise, fontRegularPromise]);

    const data = await fetchHotpickData(alias);
    if (!data) {
      return new Response('Hotpick not found', { status: 404 });
    }

    const hotpick = data.hotpick;
    const election = hotpick?.election;
    const items: ElectionItem[] = election?.items ?? [];
    const title: string = election?.title ?? '';
    const totalVoteCount: number = election?.totalVoteCount ?? 0;
    const categories: string[] = (hotpick?.categories ?? []).map(
      (c: { name?: string }) => c.name ?? ''
    );

    const LABELS = ['A', 'B', 'C', 'D'];

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: COLORS.bgDeep,
            fontFamily: '"Noto Sans KR"',
            position: 'relative',
          }}
        >
          {/* 배경 그라디언트 오브 - 마젠타 (우상단) */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: '-100px',
              right: '-80px',
              width: '700px',
              height: '700px',
              backgroundImage:
                'radial-gradient(circle, rgba(255, 0, 255, 0.15) 0%, rgba(255, 0, 255, 0) 70%)',
            }}
          />
          {/* 배경 그라디언트 오브 - 오렌지 (좌하단) */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              bottom: '-150px',
              left: '-120px',
              width: '600px',
              height: '600px',
              backgroundImage:
                'radial-gradient(circle, rgba(255, 69, 0, 0.1) 0%, rgba(255, 69, 0, 0) 70%)',
            }}
          />

          {/* 메인 콘텐츠 영역 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              padding: '72px 56px',
              position: 'relative',
            }}
          >
            {/* 상단: 로고 + 카테고리 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '48px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: `linear-gradient(135deg, ${COLORS.gradientStart}, ${COLORS.gradientEnd})`,
                    fontSize: '26px',
                    boxShadow: '0 4px 20px rgba(255, 0, 255, 0.3)',
                  }}
                >
                  🔥
                </div>
                <span
                  style={{
                    fontSize: '36px',
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    letterSpacing: '-0.5px',
                  }}
                >
                  HotPick
                </span>
              </div>

              {categories.length > 0 && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  {categories.slice(0, 2).map((cat) => (
                    <span
                      key={cat}
                      style={{
                        fontSize: '24px',
                        color: COLORS.textSecondary,
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        padding: '6px 18px',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 질문 영역 - 글래스 카드 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 40px',
                marginBottom: '48px',
                backgroundColor: COLORS.cardBg,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: '28px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              }}
            >
              <h1
                style={{
                  fontSize: title.length > 30 ? '44px' : title.length > 20 ? '52px' : '56px',
                  fontWeight: 700,
                  color: COLORS.textPrimary,
                  textAlign: 'center',
                  lineHeight: 1.5,
                  margin: 0,
                  wordBreak: 'keep-all',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                }}
              >
                {title}
              </h1>
            </div>

            {/* 결과 바 영역 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '28px',
                flex: 1,
                justifyContent: 'center',
              }}
            >
              {items.map((item, i) => {
                const percentage =
                  totalVoteCount > 0 ? calcPercentage(item.voteCount ?? 0, totalVoteCount) : 0;
                const isWinning =
                  items.length === 2
                    ? (item.voteCount ?? 0) > (items[1 - i]?.voteCount ?? 0)
                    : percentage >= 50;

                return (
                  <div
                    key={item.electionItemId ?? i}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    {/* 라벨 + 텍스트 + 퍼센트 */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                        }}
                      >
                        {/* 우승 표시: 그라디언트 도트 */}
                        {isWinning && (
                          <div
                            style={{
                              display: 'flex',
                              width: '10px',
                              height: '10px',
                              borderRadius: '5px',
                              background: `linear-gradient(135deg, ${COLORS.gradientStart}, ${COLORS.gradientEnd})`,
                              boxShadow: '0 0 8px rgba(255, 0, 255, 0.5)',
                            }}
                          />
                        )}
                        <span
                          style={{
                            fontSize: '26px',
                            fontWeight: 700,
                            color: isWinning ? COLORS.gradientStart : COLORS.textTertiary,
                            width: '36px',
                          }}
                        >
                          {LABELS[i]}
                        </span>
                        <span
                          style={{
                            fontSize: '34px',
                            fontWeight: isWinning ? 700 : 400,
                            color: isWinning ? COLORS.textPrimary : COLORS.textSecondary,
                          }}
                        >
                          {item.title}
                        </span>
                      </div>

                      {/* 퍼센트: 우승자는 그라디언트 텍스트 */}
                      <span
                        style={{
                          fontSize: isWinning ? '56px' : '44px',
                          fontWeight: 700,
                          ...(isWinning
                            ? {
                                backgroundImage: `linear-gradient(90deg, ${COLORS.gradientStart}, ${COLORS.gradientEnd})`,
                                backgroundClip: 'text',
                                color: 'transparent',
                              }
                            : {
                                color: COLORS.textTertiary,
                              }),
                        }}
                      >
                        {percentage}%
                      </span>
                    </div>

                    {/* 프로그레스 바 */}
                    <div
                      style={{
                        display: 'flex',
                        width: '100%',
                        height: isWinning ? '52px' : '44px',
                        backgroundColor: COLORS.barBg,
                        borderRadius: '26px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          width: `${Math.max(percentage, 4)}%`,
                          height: '100%',
                          background: isWinning
                            ? `linear-gradient(90deg, ${COLORS.gradientStart}, ${COLORS.gradientEnd})`
                            : `linear-gradient(90deg, ${COLORS.barLosing}, #3a3a3a)`,
                          borderRadius: '26px',
                          boxShadow: isWinning
                            ? '0 0 20px rgba(255, 0, 255, 0.35), 0 0 40px rgba(255, 0, 255, 0.15)'
                            : 'none',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 하단: 참여자 수 + CTA */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px',
                marginTop: '48px',
              }}
            >
              <span
                style={{
                  fontSize: '28px',
                  color: COLORS.textTertiary,
                }}
              >
                {formatCount(totalVoteCount)}명 참여
              </span>

              {/* CTA - 엘레건트 세퍼레이터 스타일 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  gap: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flex: 1,
                    height: '1px',
                    backgroundImage:
                      'linear-gradient(90deg, rgba(255, 0, 255, 0), rgba(255, 0, 255, 0.4), rgba(255, 0, 255, 0))',
                  }}
                />
                <span
                  style={{
                    fontSize: '26px',
                    fontWeight: 400,
                    color: COLORS.textTertiary,
                  }}
                >
                  나도 투표하기
                </span>
                <span
                  style={{
                    fontSize: '26px',
                    fontWeight: 700,
                    color: COLORS.gradientStart,
                    textShadow: '0 0 12px rgba(255, 0, 255, 0.4)',
                  }}
                >
                  hotpick.votebox.kr
                </span>
                <div
                  style={{
                    display: 'flex',
                    flex: 1,
                    height: '1px',
                    backgroundImage:
                      'linear-gradient(90deg, rgba(255, 69, 0, 0), rgba(255, 69, 0, 0.4), rgba(255, 69, 0, 0))',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        fonts: [
          {
            name: 'Noto Sans KR',
            data: fontBold,
            style: 'normal',
            weight: 700,
          },
          {
            name: 'Noto Sans KR',
            data: fontRegular,
            style: 'normal',
            weight: 400,
          },
        ],
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Share Card OG Error]', err);
    return new Response('Failed to generate share card image', { status: 500 });
  }
}

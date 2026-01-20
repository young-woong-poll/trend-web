import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const img1 = searchParams.get('img1');
  const img2 = searchParams.get('img2');

  if (!img1 || !img2) {
    return new Response('Missing image URLs', { status: 400 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img1}
          alt=""
          style={{
            width: '50%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img2}
          alt=""
          style={{
            width: '50%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  );
}

/**
 * OG ImageResponse 공용 폰트 로더
 *
 * Satori는 TTF/OTF/WOFF를 지원 (WOFF2 비권장).
 * 메인 OG용 폰트 세트:
 *   - Pretendard Black 900 — 한글 헤드라인
 *   - Pretendard Regular 400 — 본문/서브
 *   - Archivo Black — 영문/숫자/등급 강조
 *   - Gmarket Sans Bold — 포스터 톤 variant (선택적)
 *
 * origin을 인자로 받는 이유: dev/prod/staging 환경별로 폰트 fetch 대상이 달라져야 하고,
 * NEXT_PUBLIC_SITE_URL가 dev에 세팅되지 않은 경우 폰트 404 방지.
 * edge runtime의 fetch는 내부적으로 응답을 캐싱하므로 반복 호출 비용이 크지 않음.
 */

export interface LoadedFonts {
  pretendardBlack: ArrayBuffer;
  pretendardRegular: ArrayBuffer;
  archivoBlack: ArrayBuffer;
  gmarketBold: ArrayBuffer;
}

export async function loadOgFonts(origin: string): Promise<LoadedFonts> {
  const fetchFont = (file: string): Promise<ArrayBuffer> =>
    fetch(new URL(`/fonts/${file}`, origin)).then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load font ${file}: ${res.status}`);
      }
      return res.arrayBuffer();
    });

  const [pretendardBlack, pretendardRegular, archivoBlack, gmarketBold] = await Promise.all([
    fetchFont('Pretendard-Black.otf'),
    fetchFont('Pretendard-Regular.otf'),
    fetchFont('ArchivoBlack-Regular.ttf'),
    fetchFont('GmarketSansTTFBold.ttf'),
  ]);
  return { pretendardBlack, pretendardRegular, archivoBlack, gmarketBold };
}

/** Satori에 전달할 fonts 배열 */
export function buildFontsArray(fonts: LoadedFonts) {
  return [
    {
      name: 'Pretendard',
      data: fonts.pretendardRegular,
      style: 'normal' as const,
      weight: 400 as const,
    },
    {
      name: 'Pretendard',
      data: fonts.pretendardBlack,
      style: 'normal' as const,
      weight: 900 as const,
    },
    {
      name: 'Archivo Black',
      data: fonts.archivoBlack,
      style: 'normal' as const,
      weight: 900 as const,
    },
    {
      name: 'Gmarket Sans',
      data: fonts.gmarketBold,
      style: 'normal' as const,
      weight: 700 as const,
    },
  ];
}

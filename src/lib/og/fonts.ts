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
 * Edge runtime에서 module-level fetch는 1회만 실행 후 promise 캐싱됨.
 */
import { SITE_URL } from '@/lib/seo/constants';

const fontUrl = (file: string) => new URL(`/fonts/${file}`, SITE_URL);

const fetchFont = (file: string): Promise<ArrayBuffer> =>
  fetch(fontUrl(file)).then((res) => res.arrayBuffer());

export const pretendardBlackPromise = fetchFont('Pretendard-Black.otf');
export const pretendardRegularPromise = fetchFont('Pretendard-Regular.otf');
export const archivoBlackPromise = fetchFont('ArchivoBlack-Regular.ttf');
export const gmarketBoldPromise = fetchFont('GmarketSansTTFBold.ttf');

export interface LoadedFonts {
  pretendardBlack: ArrayBuffer;
  pretendardRegular: ArrayBuffer;
  archivoBlack: ArrayBuffer;
  gmarketBold: ArrayBuffer;
}

export async function loadOgFonts(): Promise<LoadedFonts> {
  const [pretendardBlack, pretendardRegular, archivoBlack, gmarketBold] = await Promise.all([
    pretendardBlackPromise,
    pretendardRegularPromise,
    archivoBlackPromise,
    gmarketBoldPromise,
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

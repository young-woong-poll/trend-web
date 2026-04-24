import {
  assignAngles,
  drawOrbitScene,
  generateStars,
  type OrbitMember,
} from '@/components/features/Compare/MyResultView/OrbitMap/orbit-draw';

interface RenderShareCardParams {
  members: OrbitMember[];
  myNickname: string;
  groupName: string;
  bundleTitle: string;
  syncRate: number;
  topMedalTitle: string;
  topMedalOneLiner: string;
  /** TOP이 쌍 어워드(SOUL_CONNECTION 등)일 때 파트너 닉네임 */
  topMedalPartner?: string;
}

const CARD_WIDTH = 1024;
const CARD_HEIGHT = 1792;
const ORBIT_BAND_HEIGHT = 1024;

/** 결과 공유 카드를 PNG Blob으로 생성. 실패 시 null. */
export async function renderShareCard(params: RenderShareCardParams): Promise<Blob | null> {
  const supportsOffscreen = typeof OffscreenCanvas !== 'undefined';
  const canvas: OffscreenCanvas | HTMLCanvasElement = supportsOffscreen
    ? new OffscreenCanvas(CARD_WIDTH, CARD_HEIGHT)
    : (() => {
        const c = document.createElement('canvas');
        c.width = CARD_WIDTH;
        c.height = CARD_HEIGHT;
        return c;
      })();

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
  if (!ctx) {
    return null;
  }

  // 배경
  const bg = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  bg.addColorStop(0, '#121212');
  bg.addColorStop(1, '#0a0a12');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // 상단 메타
  ctx.fillStyle = '#dfff00';
  ctx.font = '700 28px -apple-system, Pretendard, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MY RESULT', CARD_WIDTH / 2, 100);

  // 닉네임 행 — TOP이 쌍 어워드일 때 파트너 포함형
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 56px -apple-system, Pretendard, sans-serif';
  const heading = params.topMedalPartner
    ? `${params.myNickname}님은 ${params.topMedalPartner}님과`
    : `${params.myNickname}님은`;
  ctx.fillText(heading, CARD_WIDTH / 2, 200);

  // 그라디언트 훈장 타이틀
  const titleGrad = ctx.createLinearGradient(0, 250, CARD_WIDTH, 350);
  titleGrad.addColorStop(0, '#ff00ff');
  titleGrad.addColorStop(1, '#ff4500');
  ctx.fillStyle = titleGrad;
  ctx.font = '900 88px -apple-system, Pretendard, sans-serif';
  ctx.fillText(params.topMedalTitle, CARD_WIDTH / 2, 320);

  ctx.fillStyle = '#d1d1d1';
  ctx.font = '500 28px -apple-system, Pretendard, sans-serif';
  ctx.fillText(params.topMedalOneLiner, CARD_WIDTH / 2, 380);

  // 궤도 밴드 — drawOrbitScene 재사용
  ctx.save();
  ctx.translate(0, 440);
  ctx.beginPath();
  ctx.rect(0, 0, CARD_WIDTH, ORBIT_BAND_HEIGHT);
  ctx.clip();

  const orbitStars = generateStars(180);
  const orbitAngles = assignAngles(params.members);
  const hitBoxes = new Map<string, { x: number; y: number; r: number }>();

  try {
    drawOrbitScene({
      ctx,
      width: CARD_WIDTH,
      height: ORBIT_BAND_HEIGHT,
      dpr: 2,
      cam: { x: 0, y: 0, scale: 1 },
      stars: orbitStars,
      members: params.members,
      myNickname: params.myNickname,
      rotation: 0,
      selectedUserId: null,
      memberAngles: orbitAngles,
      isMember: true,
      nodeHitBoxes: hitBoxes,
    });
  } catch {
    // 궤도 그리기 실패해도 카드 자체는 생성
  }
  ctx.restore();

  // 하단 스탯 · 워터마크
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '700 48px -apple-system, Pretendard, sans-serif';
  ctx.fillText(`싱크로율 ${params.syncRate}%`, CARD_WIDTH / 2, CARD_HEIGHT - 200);

  ctx.fillStyle = '#8a8a8a';
  ctx.font = '500 24px -apple-system, Pretendard, sans-serif';
  ctx.fillText(`${params.groupName} · ${params.bundleTitle}`, CARD_WIDTH / 2, CARD_HEIGHT - 150);

  ctx.fillStyle = '#dfff00';
  ctx.font = '800 32px -apple-system, Pretendard, sans-serif';
  ctx.fillText('HotPick', CARD_WIDTH / 2, CARD_HEIGHT - 80);

  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: 'image/png' });
  }
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => {
      resolve(b);
    }, 'image/png');
  });
}

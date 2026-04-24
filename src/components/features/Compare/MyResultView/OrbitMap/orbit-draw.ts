export interface OrbitMember {
  userId: string;
  nickname: string;
  matchRate: number;
  profileColor?: string;
}

export interface OrbitCam {
  x: number;
  y: number;
  scale: number;
}

export interface OrbitStar {
  x: number;
  y: number;
  depth: number;
  size: number;
  blink: number;
}

/** 매칭률 → orbit tier (1 inner / 2 mid / 3 outer / 'satellite' 100% / 'asteroid' 0%) */
export type OrbitTier = 1 | 2 | 3 | 'satellite' | 'asteroid';

export function getOrbitTier(matchRate: number): OrbitTier {
  if (matchRate === 100) {
    return 'satellite';
  }
  if (matchRate === 0) {
    return 'asteroid';
  }
  if (matchRate >= 60) {
    return 1;
  }
  if (matchRate >= 40) {
    return 2;
  }
  return 3;
}

export function getOrbitRadius(width: number, height: number, n: 1 | 2 | 3): number {
  const base = Math.min(width, height) * 0.18;
  return base * n;
}

export function getNodeColor(tier: OrbitTier, profileColor?: string): string {
  if (profileColor) {
    return profileColor;
  }
  switch (tier) {
    case 'satellite':
      return '#ffffff';
    case 1:
      return '#ff6ec7';
    case 2:
      return '#facc15';
    case 3:
    case 'asteroid':
      return '#ef4444';
  }
}

export function generateStars(count = 220): OrbitStar[] {
  const stars: OrbitStar[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      depth: 0.3 + Math.random() * 0.7,
      size: 0.3 + Math.random() * 1.4,
      blink: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

interface DrawOrbitParams {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
  cam: OrbitCam;
  stars: OrbitStar[];
  members: OrbitMember[];
  myNickname: string;
  /** 0~∞ 누적 회전(rad). draw 호출자가 매 프레임 증가시킴 */
  rotation: number;
  /** 현재 탭으로 선택된 유저 — 없으면 null */
  selectedUserId: string | null;
  /** Mock과 달리 실제 데이터에는 angle이 없으므로 외부에서 결정 */
  memberAngles: Record<string, number>;
  /** 비멤버면 중앙 "나"를 실루엣으로 */
  isMember: boolean;
  /** 호출 후 세팅되는 멤버 스크린 좌표 — 히트 테스트용 */
  nodeHitBoxes: Map<string, { x: number; y: number; r: number }>;
}

export function drawOrbitScene(params: DrawOrbitParams): void {
  const {
    ctx,
    width,
    height,
    dpr,
    cam,
    stars,
    members,
    myNickname,
    rotation,
    selectedUserId,
    memberAngles,
    isMember,
    nodeHitBoxes,
  } = params;

  ctx.clearRect(0, 0, width, height);

  const cx = width / 2 + cam.x;
  const cy = height / 2 + cam.y;
  const s = cam.scale;

  // 별 parallax — Mock option-orbit-1.html 라인 278-287 동일 로직
  for (const star of stars) {
    const px = width / 2 + star.x * width * 0.7 + cam.x * star.depth * 0.4;
    const py = height / 2 + star.y * height * 0.7 + cam.y * star.depth * 0.4;
    const alpha = 0.3 + Math.sin(star.blink + performance.now() * 0.002) * 0.3;
    ctx.fillStyle = `rgba(255,255,255,${alpha * star.depth})`;
    ctx.beginPath();
    ctx.arc(px, py, star.size * dpr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);

  // 궤도 3겹
  const orbitColors = ['rgba(255,0,255,0.35)', 'rgba(255,255,255,0.14)', 'rgba(239,68,68,0.25)'];
  const orbitDashes: number[][] = [[], [6, 8], [3, 10]];
  for (let i = 1; i <= 3; i++) {
    const r = getOrbitRadius(width, height, i as 1 | 2 | 3);
    ctx.beginPath();
    ctx.setLineDash(orbitDashes[i - 1]);
    ctx.strokeStyle = orbitColors[i - 1];
    ctx.lineWidth = 1.2 * dpr;
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // 중앙 "나" 오브
  const meRadius = 28 * dpr;
  if (isMember) {
    const grad = ctx.createRadialGradient(-meRadius * 0.3, -meRadius * 0.3, 0, 0, 0, meRadius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#ff6ec7');
    grad.addColorStop(1, '#7a2dff');
    ctx.fillStyle = grad;
    ctx.shadowBlur = 40 * dpr;
    ctx.shadowColor = 'rgba(255,110,199,0.6)';
    ctx.beginPath();
    ctx.arc(0, 0, meRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${13 * dpr}px -apple-system, Pretendard, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(myNickname.slice(0, 2) || '나', 0, 0);
  } else {
    // 비멤버: 실루엣
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.arc(0, 0, meRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `600 ${11 * dpr}px -apple-system, Pretendard, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('YOU', 0, 0);
  }

  // 멤버 노드
  nodeHitBoxes.clear();
  for (const m of members) {
    const tier = getOrbitTier(m.matchRate);
    let r: number;
    switch (tier) {
      case 'satellite':
        r = getOrbitRadius(width, height, 1) * 0.6;
        break;
      case 'asteroid':
        r = getOrbitRadius(width, height, 3) * 1.5;
        break;
      default:
        r = getOrbitRadius(width, height, tier);
    }
    const baseAngle = memberAngles[m.userId] ?? 0;
    const tierNum = tier === 'satellite' ? 1 : tier === 'asteroid' ? 3 : tier;
    const a = baseAngle + rotation * (4 - tierNum) * 0.3;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;

    // 엣지 — INNER, satellite, asteroid만 노출
    if (tier === 1 || tier === 'satellite') {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,110,199,0.45)';
      ctx.lineWidth = 1 * dpr;
      ctx.moveTo(0, 0);
      ctx.lineTo(px, py);
      ctx.stroke();
    } else if (tier === 3 || tier === 'asteroid') {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(239,68,68,0.25)';
      ctx.lineWidth = 0.8 * dpr;
      ctx.setLineDash([2, 6]);
      ctx.moveTo(0, 0);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 행성 본체
    const pr = (tier === 1 ? 20 : tier === 2 ? 17 : tier === 'satellite' ? 12 : 15) * dpr;
    const color = getNodeColor(tier, m.profileColor);
    const pg = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, 0, px, py, pr);
    pg.addColorStop(0, '#fff');
    pg.addColorStop(0.4, color);
    pg.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = pg;
    ctx.shadowBlur = (selectedUserId === m.userId ? 30 : 12) * dpr;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 이니셜
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${11 * dpr}px -apple-system, Pretendard, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(m.nickname.slice(0, 1), px, py);

    // 이름 + 케미율
    ctx.font = `600 ${10 * dpr}px -apple-system, Pretendard, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(m.nickname, px, py + pr + 14 * dpr);
    ctx.font = `700 ${9 * dpr}px -apple-system, Pretendard, sans-serif`;
    ctx.fillStyle = tier === 3 || tier === 'asteroid' ? '#ef4444' : '#dfff00';
    ctx.fillText(`${m.matchRate}%`, px, py + pr + 26 * dpr);

    // 히트박스 (스크린 좌표) — Task 6에서 탭 검출에 사용
    nodeHitBoxes.set(m.userId, { x: cx + px * s, y: cy + py * s, r: pr * s });
  }

  ctx.restore();
}

/**
 * 고르게 분포된 각도 생성. tier별 그룹 내에서 균등 분포 — 같은 궤도에서 겹치지 않도록.
 * members 배열이 같으면 같은 결과가 나오므로 useMemo로 고정.
 */
export function assignAngles(members: OrbitMember[]): Record<string, number> {
  const byTier: Record<string, OrbitMember[]> = {
    '1': [],
    '2': [],
    '3': [],
    satellite: [],
    asteroid: [],
  };
  for (const m of members) {
    const tier = getOrbitTier(m.matchRate);
    byTier[String(tier)].push(m);
  }
  const angles: Record<string, number> = {};
  for (const key of Object.keys(byTier)) {
    const group = byTier[key];
    group.forEach((m, idx) => {
      angles[m.userId] = (idx / Math.max(group.length, 1)) * Math.PI * 2;
    });
  }
  return angles;
}

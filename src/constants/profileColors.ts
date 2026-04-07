export interface ProfileColor {
  name: string;
  start: string;
  end: string;
}

export const PROFILE_COLORS: ProfileColor[] = [
  // 색상환 15도 간격 기준, start↔end 색상 거리 최소 60도 이상 확보
  { name: 'red', start: '#EF4444', end: '#FCA5A5' }, // 빨강 → 연분홍
  { name: 'flame', start: '#F97316', end: '#FBBF24' }, // 주황 → 노랑
  { name: 'coral', start: '#FF6B6B', end: '#FFD93D' }, // 산호 → 골드
  { name: 'peach', start: '#FB923C', end: '#FDE68A' }, // 피치 → 크림
  { name: 'amber', start: '#D97706', end: '#84CC16' }, // 호박 → 연두
  { name: 'gold', start: '#EAB308', end: '#F97316' }, // 금색 → 오렌지
  { name: 'lime', start: '#84CC16', end: '#06B6D4' }, // 라임 → 틸
  { name: 'green', start: '#16A34A', end: '#FDE047' }, // 초록 → 레몬
  { name: 'forest', start: '#166534', end: '#4ADE80' }, // 짙은숲 → 밝은초록
  { name: 'teal', start: '#0D9488', end: '#A78BFA' }, // 틸 → 라벤더
  { name: 'mint', start: '#34D399', end: '#38BDF8' }, // 민트 → 하늘
  { name: 'cyan', start: '#06B6D4', end: '#E0F2FE' }, // 시안 → 아이스블루
  { name: 'sky', start: '#38BDF8', end: '#F0ABFC' }, // 하늘 → 연보라
  { name: 'blue', start: '#2563EB', end: '#22D3EE' }, // 파랑 → 청록
  { name: 'ocean', start: '#1E40AF', end: '#38BDF8' }, // 딥블루 → 스카이
  { name: 'sapphire', start: '#1D4ED8', end: '#C084FC' }, // 사파이어 → 연보라
  { name: 'indigo', start: '#4F46E5', end: '#F472B6' }, // 인디고 → 핑크
  { name: 'grape', start: '#6D28D9', end: '#06B6D4' }, // 포도 → 틸
  { name: 'purple', start: '#7C3AED', end: '#EC4899' }, // 보라 → 핫핑크
  { name: 'lavender', start: '#A78BFA', end: '#FDE68A' }, // 라벤더 → 크림
  { name: 'magenta', start: '#D946EF', end: '#F97316' }, // 마젠타 → 오렌지
  { name: 'pink', start: '#EC4899', end: '#FCD34D' }, // 핑크 → 옐로우
  { name: 'rose', start: '#F43F5E', end: '#818CF8' }, // 로즈 → 퍼플블루
  { name: 'sunset', start: '#FF6B35', end: '#D946EF' }, // 석양 → 마젠타
];

export const DEFAULT_PROFILE_COLOR = 'purple';

export const getProfileColor = (name: string): ProfileColor =>
  PROFILE_COLORS.find((c) => c.name === name) ?? PROFILE_COLORS[0];

export const getProfileGradient = (name: string): string => {
  const color = getProfileColor(name);
  return `linear-gradient(135deg, ${color.start}, ${color.end})`;
};

/** 인덱스 기반 그라데이션 (그룹 비교 멤버 아바타용) */
export const getGradientByIndex = (index: number): string => {
  const color = PROFILE_COLORS[index % PROFILE_COLORS.length];
  return `linear-gradient(135deg, ${color.start}, ${color.end})`;
};

/** 가상 멤버(고스트) 프로필 그라데이션 — 무채색 */
export const GHOST_GRADIENT = 'linear-gradient(135deg, #555, #3a3a3a)';

/** 가상 멤버 userId 프리픽스 */
export const GHOST_USER_PREFIX = '__ghost__';

/** userId가 가상 멤버인지 확인 */
export const isGhostUser = (userId: string): boolean => userId.startsWith(GHOST_USER_PREFIX);

/** 멤버 아바타 그라데이션 (displayProfileColor 우선 → 가상 멤버면 회색 → 인덱스 기반) */
export const getMemberGradient = (
  index: number,
  userId?: string,
  profileColor?: string
): string => {
  if (profileColor) {
    return getProfileGradient(profileColor);
  }
  if (userId && isGhostUser(userId)) {
    return GHOST_GRADIENT;
  }
  return getGradientByIndex(index);
};

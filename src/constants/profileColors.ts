export interface ProfileColor {
  name: string;
  start: string;
  end: string;
}

export const PROFILE_COLORS: ProfileColor[] = [
  // ── 기존 8색 (그라데이션 강화) ──
  { name: 'purple', start: '#7C3AED', end: '#EC4899' },
  { name: 'blue', start: '#2563EB', end: '#06B6D4' },
  { name: 'green', start: '#059669', end: '#84CC16' },
  { name: 'amber', start: '#D97706', end: '#EF4444' },
  { name: 'red', start: '#DC2626', end: '#FF6B9D' },
  { name: 'pink', start: '#EC4899', end: '#8B5CF6' },
  { name: 'cyan', start: '#06B6D4', end: '#3B82F6' },
  { name: 'indigo', start: '#4F46E5', end: '#A855F7' },
  // ── 추가 16색 ──
  { name: 'magenta', start: '#FF00FF', end: '#FF4500' },
  { name: 'sky', start: '#4FC3F7', end: '#00BCD4' },
  { name: 'gold', start: '#FFD700', end: '#FFA500' },
  { name: 'teal', start: '#66BB6A', end: '#00BCD4' },
  { name: 'grape', start: '#8B5CF6', end: '#EC4899' },
  { name: 'sunset', start: '#FF6B35', end: '#FF00FF' },
  { name: 'ocean', start: '#0077B6', end: '#48CAE4' },
  { name: 'lime', start: '#84CC16', end: '#22D3EE' },
  { name: 'coral', start: '#FF6B6B', end: '#FFD93D' },
  { name: 'lavender', start: '#A78BFA', end: '#F472B6' },
  { name: 'mint', start: '#34D399', end: '#60A5FA' },
  { name: 'peach', start: '#FB923C', end: '#F472B6' },
  { name: 'sapphire', start: '#1D4ED8', end: '#7C3AED' },
  { name: 'rose', start: '#F43F5E', end: '#D946EF' },
  { name: 'forest', start: '#15803D', end: '#0891B2' },
  { name: 'flame', start: '#F97316', end: '#EF4444' },
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

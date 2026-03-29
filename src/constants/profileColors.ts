export interface ProfileColor {
  name: string;
  start: string;
  end: string;
}

export const PROFILE_COLORS: ProfileColor[] = [
  { name: 'purple', start: '#7C3AED', end: '#A855F7' },
  { name: 'blue', start: '#2563EB', end: '#3B82F6' },
  { name: 'green', start: '#059669', end: '#10B981' },
  { name: 'amber', start: '#D97706', end: '#F59E0B' },
  { name: 'red', start: '#DC2626', end: '#EF4444' },
  { name: 'pink', start: '#DB2777', end: '#EC4899' },
  { name: 'cyan', start: '#0891B2', end: '#06B6D4' },
  { name: 'indigo', start: '#4F46E5', end: '#6366F1' },
];

export const DEFAULT_PROFILE_COLOR = 'purple';

export const getProfileColor = (name: string): ProfileColor =>
  PROFILE_COLORS.find((c) => c.name === name) ?? PROFILE_COLORS[0];

export const getProfileGradient = (name: string): string => {
  const color = getProfileColor(name);
  return `linear-gradient(135deg, ${color.start}, ${color.end})`;
};

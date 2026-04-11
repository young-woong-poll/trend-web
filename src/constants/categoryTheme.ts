import type { CategoryCode } from '@/types/hotpick';

interface CategoryTheme {
  start: string;
  end: string;
  startRgb: string;
  endRgb: string;
  emoji: string;
  label: string;
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

const DEFAULT_THEME: CategoryTheme = {
  start: '#FF00FF',
  end: '#FF4500',
  startRgb: '255, 0, 255',
  endRgb: '255, 69, 0',
  emoji: '🔥',
  label: '트렌드',
};

const CATEGORY_THEMES: Record<CategoryCode, CategoryTheme> = {
  LOVE: {
    start: '#FF6B9D',
    end: '#C850C0',
    startRgb: hexToRgb('#FF6B9D'),
    endRgb: hexToRgb('#C850C0'),
    emoji: '💕',
    label: '연애',
  },
  MARRIAGE: {
    start: '#F7971E',
    end: '#FFD200',
    startRgb: hexToRgb('#F7971E'),
    endRgb: hexToRgb('#FFD200'),
    emoji: '💍',
    label: '결혼',
  },
  FINANCE: {
    start: '#56AB2F',
    end: '#A8E063',
    startRgb: hexToRgb('#56AB2F'),
    endRgb: hexToRgb('#A8E063'),
    emoji: '💰',
    label: '재테크',
  },
  WORK: {
    start: '#667EEA',
    end: '#764BA2',
    startRgb: hexToRgb('#667EEA'),
    endRgb: hexToRgb('#764BA2'),
    emoji: '💼',
    label: '직장',
  },
  SPORTS: {
    start: '#F2994A',
    end: '#F2C94C',
    startRgb: hexToRgb('#F2994A'),
    endRgb: hexToRgb('#F2C94C'),
    emoji: '⚽',
    label: '스포츠',
  },
  FOOD: {
    start: '#FF5F6D',
    end: '#FFC371',
    startRgb: hexToRgb('#FF5F6D'),
    endRgb: hexToRgb('#FFC371'),
    emoji: '🍔',
    label: '음식',
  },
  GAME: {
    start: '#7F00FF',
    end: '#E100FF',
    startRgb: hexToRgb('#7F00FF'),
    endRgb: hexToRgb('#E100FF'),
    emoji: '🎮',
    label: '게임',
  },
  CAR: {
    start: '#4ECDC4',
    end: '#556270',
    startRgb: hexToRgb('#4ECDC4'),
    endRgb: hexToRgb('#556270'),
    emoji: '🚗',
    label: '자동차',
  },
  HEALTH: {
    start: '#11998E',
    end: '#38EF7D',
    startRgb: hexToRgb('#11998E'),
    endRgb: hexToRgb('#38EF7D'),
    emoji: '💪',
    label: '건강',
  },
  TREND: {
    start: '#FF00FF',
    end: '#FF4500',
    startRgb: '255, 0, 255',
    endRgb: '255, 69, 0',
    emoji: '🔥',
    label: '트렌드',
  },
};

/** categoryMeta JSON 문자열에서 테마를 파싱. 실패 시 undefined */
export function parseCategoryMeta(meta?: string | null): CategoryTheme | undefined {
  if (!meta) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(meta);
    const theme = parsed?.theme;
    if (!theme?.start || !theme?.end) {
      return undefined;
    }
    return {
      start: theme.start,
      end: theme.end,
      startRgb: theme.startRgb ?? hexToRgb(theme.start),
      endRgb: theme.endRgb ?? hexToRgb(theme.end),
      emoji: theme.emoji ?? DEFAULT_THEME.emoji,
      label: DEFAULT_THEME.label,
    };
  } catch {
    return undefined;
  }
}

/** 카테고리 코드에 해당하는 테마를 반환. categoryMeta가 있으면 우선 사용. 없으면 기본 마젠타-오렌지 */
export function getCategoryTheme(code?: CategoryCode, categoryMeta?: string | null): CategoryTheme {
  const metaTheme = parseCategoryMeta(categoryMeta);
  if (metaTheme) {
    return metaTheme;
  }
  if (!code) {
    return DEFAULT_THEME;
  }
  return CATEGORY_THEMES[code] ?? DEFAULT_THEME;
}

/** BundleBackground wrapper div에 주입할 CSS custom property 객체 */
export function getCategoryThemeVars(
  code?: CategoryCode,
  categoryMeta?: string | null
): React.CSSProperties {
  const t = getCategoryTheme(code, categoryMeta);
  return {
    '--primary-start': t.start,
    '--primary-end': t.end,
    '--primary-gradient': `linear-gradient(90deg, ${t.start} 0%, ${t.end} 100%)`,
    '--primary-start-rgb': t.startRgb,
    '--primary-end-rgb': t.endRgb,
  } as React.CSSProperties;
}

/** 카테고리 이름(한글)에서 CategoryCode로 매핑 (BE에서 코드를 안 줄 때 사용) */
const NAME_TO_CODE: Record<string, CategoryCode> = {
  연애: 'LOVE',
  결혼: 'MARRIAGE',
  재테크: 'FINANCE',
  직장: 'WORK',
  스포츠: 'SPORTS',
  음식: 'FOOD',
  게임: 'GAME',
  자동차: 'CAR',
  건강: 'HEALTH',
  트렌드: 'TREND',
};

export function categoryNameToCode(name?: string): CategoryCode | undefined {
  if (!name) {
    return undefined;
  }
  return NAME_TO_CODE[name];
}

export type { CategoryTheme };

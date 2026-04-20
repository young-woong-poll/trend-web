/**
 * 클라이언트 사이드 봇 감지.
 *
 * GA4 자동 봇 필터(IAB/ABC)는 착한 봇만 거르므로, 헤드리스·AI 크롤러를
 * 분류하기 위한 보강 레이어. `high`는 분석 이벤트 차단, `medium`은 태깅 후
 * 보고서에서 필터링, `low`는 실제 유저로 간주.
 */

export type BotScore = 'high' | 'medium' | 'low';

const UA_BOT_PATTERNS = [
  'bot',
  'crawler',
  'spider',
  'scraper',
  'headless',
  'phantom',
  'puppeteer',
  'playwright',
  'selenium',
  'lighthouse',
  'chrome-lighthouse',
  'pagespeed',
  'gptbot',
  'claude-web',
  'bytespider',
  'yandex',
  'ahrefs',
  'semrush',
  'dotbot',
  'mj12bot',
  'facebookexternalhit',
  'whatsapp',
  'telegram',
];

export function detectBotLikelihood(): BotScore {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'high';
  }

  const ua = (navigator.userAgent ?? '').toLowerCase();
  const isUABot = UA_BOT_PATTERNS.some((p) => ua.includes(p));

  const nav = navigator as Navigator & { webdriver?: boolean };
  const isWebdriver = nav.webdriver === true;

  if (isUABot || isWebdriver) {
    return 'high';
  }

  const hasNoPlugins = (navigator.plugins?.length ?? 0) === 0;
  const hasNoLanguages = !navigator.languages || navigator.languages.length === 0;
  const hasWeirdScreen =
    typeof window.screen !== 'undefined' &&
    (window.screen.width < 100 || window.screen.height < 100);

  const suspiciousCount = [hasNoPlugins, hasNoLanguages, hasWeirdScreen].filter(Boolean).length;
  if (suspiciousCount >= 2) {
    return 'medium';
  }
  return 'low';
}

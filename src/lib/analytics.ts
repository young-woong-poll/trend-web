/**
 * GA4 커스텀 이벤트 트래킹 유틸리티
 *
 * @next/third-parties/google의 GoogleAnalytics 컴포넌트가 gtag.js를 로드하고,
 * 이 모듈은 커스텀 이벤트 전송을 담당합니다.
 */

import type { LoginTrigger } from '@/contexts/AuthContext';
import { detectBotLikelihood, type BotScore } from '@/lib/botDetector';

type GtagPrimitive = string | number | boolean | undefined;
type GtagParams = Record<string, GtagPrimitive>;

type UserType = 'guest' | 'logged_in';

// 현재 user_type을 모듈 상태로 유지해서 매 이벤트에 자동 주입.
let currentUserType: UserType = 'guest';

const HAS_VOTED_KEY = 'hp_has_voted';
const HAS_COMPLETED_BUNDLE_KEY = 'hp_has_completed_bundle';
const IS_REAL_USER_KEY = 'hp_is_real_user';

// 봇 스코어는 세션 내 1회만 계산 (계산 비용 회피).
let cachedBotScore: BotScore | null = null;
function getBotScore(): BotScore {
  if (cachedBotScore === null) {
    cachedBotScore = detectBotLikelihood();
  }
  return cachedBotScore;
}

// ──────────────────────────────────────────────────────────
// 내부 공통 전송 로직
// ──────────────────────────────────────────────────────────

/** 개발 환경/`/dev/*` 경로 여부를 판단해서 실제 전송 여부를 결정. */
function shouldSkipSend(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  if (window.location.pathname.startsWith('/dev')) {
    return true;
  }
  return false;
}

/** 공통 래퍼 — 모든 이벤트에 user_type/bot_score 자동 주입 + dev/prod 분기. */
function track(eventName: string, params?: GtagParams) {
  if (shouldSkipSend()) {
    return;
  }

  // 고위험 봇은 이벤트 자체를 차단 — "봇인데 인터랙션 이벤트" 오염 제거.
  const botScore = getBotScore();
  if (botScore === 'high') {
    return;
  }

  const merged: GtagParams = {
    ...(params ?? {}),
    user_type: currentUserType,
    bot_score: botScore,
  };

  if (process.env.NODE_ENV !== 'production') {
    // dev: 실제 전송 대신 디버그 로그
    // eslint-disable-next-line no-console
    console.debug('[GA]', eventName, merged);
    return;
  }

  if (typeof window.gtag !== 'function') {
    return;
  }
  window.gtag('event', eventName, merged);
}

/**
 * GA4 커스텀 이벤트 전송 — 기존 시그니처 유지.
 * 내부적으로 공통 래퍼 track()을 사용해 user_type/dev 가드가 자동 적용됨.
 */
export function trackEvent(eventName: string, params?: GtagParams) {
  track(eventName, params);
}

/** user_properties 일괄 세팅 — gtag('set', 'user_properties', {...}) 래핑. */
export function setUserProperties(props: Record<string, GtagPrimitive>) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }
  window.gtag('set', 'user_properties', props);
}

/** GA4 User ID 설정 (로그인 시 호출) */
export function setAnalyticsUserId(userId: string) {
  if (typeof window === 'undefined') {
    return;
  }
  currentUserType = 'logged_in';
  setUserProperties({ user_type: 'logged_in' });
  if (typeof window.gtag === 'function') {
    window.gtag('set', { user_id: userId });
  }
}

/** GA4 User ID 해제 (로그아웃 시 호출) */
export function clearAnalyticsUserId() {
  if (typeof window === 'undefined') {
    return;
  }
  currentUserType = 'guest';
  setUserProperties({ user_type: 'guest' });
  if (typeof window.gtag === 'function') {
    window.gtag('set', { user_id: undefined });
  }
}

// ──────────────────────────────────────────────────────────
// 사용자 속성 헬퍼
// ──────────────────────────────────────────────────────────

export function setUserType(type: UserType) {
  currentUserType = type;
  setUserProperties({ user_type: type });
}

/** 첫 투표 성공 시 1회만 user property 세팅 (localStorage 가드). */
export function markHasVoted() {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    if (window.localStorage.getItem(HAS_VOTED_KEY) === '1') {
      return;
    }
    window.localStorage.setItem(HAS_VOTED_KEY, '1');
  } catch {
    // localStorage 접근 실패 시에도 property는 설정
  }
  setUserProperties({ has_voted_ever: true });
}

/** 첫 번들 완료 시 1회만 user property 세팅. */
export function markHasCompletedBundle() {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    if (window.localStorage.getItem(HAS_COMPLETED_BUNDLE_KEY) === '1') {
      return;
    }
    window.localStorage.setItem(HAS_COMPLETED_BUNDLE_KEY, '1');
  } catch {
    // noop
  }
  setUserProperties({ has_completed_bundle: true });
}

// ──────────────────────────────────────────────────────────
// 번들 퍼널 이벤트 헬퍼
// ──────────────────────────────────────────────────────────

/** 번들 인트로 페이지 조회 */
export function trackBundleView(slug: string, entryPoint?: string) {
  track('bundle_view', { slug, entry_point: entryPoint });
}

/** 번들 "시작하기" 클릭 */
export function trackBundleStart(slug: string) {
  track('bundle_start', { slug });
}

/** 번들 질문 답변 */
export function trackBundleAnswer(slug: string, questionIndex: number, selected: string) {
  track('bundle_answer', { slug, question_index: questionIndex, selected });
}

/** 번들 완료 (전체 제출) */
export function trackBundleComplete(slug: string, questionCount: number) {
  track('bundle_complete', { slug, question_count: questionCount });
  markHasVoted();
  markHasCompletedBundle();
}

/** 번들 결과 페이지 조회 */
export function trackBundleResultView(slug: string) {
  track('bundle_result_view', { slug });
}

/** 비교 링크 생성 (그룹 전용 — 1:1은 2026-04 폐기) */
export function trackCompareCreate(slug: string, source: string) {
  track('compare_create', { slug, source });
}

/** 그룹 비교 결과 조회 */
export function trackGroupResult(bundleSlug: string, memberCount: number) {
  track('group_result', { bundle_slug: bundleSlug, member_count: memberCount });
}

// ──────────────────────────────────────────────────────────
// 싱글 투표 이벤트 헬퍼
// ──────────────────────────────────────────────────────────

export type SingleVoteStatus = 'not_voted' | 'voted' | 'expired';

export function trackSingleView(
  alias: string,
  params: { category?: string; vote_status: SingleVoteStatus }
) {
  track('single_view', {
    alias,
    content_id: alias,
    category: params.category,
    vote_status: params.vote_status,
    page_type: 'single_detail',
  });
}

export function trackSingleVoteAttempt(alias: string, optionId: number) {
  track('single_vote_attempt', {
    alias,
    content_id: alias,
    option_id: optionId,
    page_type: 'single_detail',
  });
}

export function trackSingleVoteSuccess(alias: string, optionId: number, timeToVoteMs?: number) {
  track('single_vote_success', {
    alias,
    content_id: alias,
    option_id: optionId,
    time_to_vote_ms: timeToVoteMs,
    page_type: 'single_detail',
  });
  markHasVoted();
}

export function trackSingleVoteBlocked(alias: string, reason: 'already_voted' | 'expired') {
  track('single_vote_blocked', {
    alias,
    content_id: alias,
    reason,
    page_type: 'single_detail',
  });
}

// ──────────────────────────────────────────────────────────
// 인증 이벤트 헬퍼
// ──────────────────────────────────────────────────────────

export type ReturnUrlType = 'main' | 'single' | 'bundle' | 'compare' | 'my' | 'other';

export function trackAuthModalOpen(trigger: LoginTrigger) {
  track('auth_modal_open', { trigger, page_type: 'auth' });
}

export function trackAuthKakaoClick(returnUrlType: ReturnUrlType) {
  track('auth_kakao_click', { return_url_type: returnUrlType, page_type: 'auth' });
}

export function trackAuthKakaoCallback(params: { is_new_user: boolean; success: boolean }) {
  track('auth_kakao_callback', {
    is_new_user: params.is_new_user,
    success: params.success,
    page_type: 'auth_callback',
  });
}

export function trackAuthSignupView() {
  track('auth_signup_view', { page_type: 'auth_signup' });
}

export function trackAuthSignupSubmit(params: { has_migration: boolean }) {
  track('auth_signup_submit', {
    has_migration: params.has_migration,
    page_type: 'auth_signup',
  });
}

export function trackAuthSignupSuccess() {
  track('auth_signup_success', {
    signup_method: 'kakao',
    page_type: 'auth_signup',
  });
  setUserProperties({
    signup_method: 'kakao',
  });
}

export function trackAuthLogout() {
  track('auth_logout');
}

export function trackAuthWithdraw() {
  track('auth_withdraw');
}

// ──────────────────────────────────────────────────────────
// 메인 페이지 이벤트 헬퍼
// ──────────────────────────────────────────────────────────

export type MainTabKind = 'filter' | 'category';

export function trackMainView(params: {
  tabKind: MainTabKind;
  tabValue: string;
  mySubTab?: string;
}) {
  track('main_view', {
    tab_kind: params.tabKind,
    tab_value: params.tabValue,
    my_sub_tab: params.mySubTab,
    page_type: 'main',
  });
}

export function trackMainTabChange(params: {
  fromKind: MainTabKind;
  fromValue: string;
  toKind: MainTabKind;
  toValue: string;
}) {
  track('main_tab_change', {
    from_kind: params.fromKind,
    from_value: params.fromValue,
    to_kind: params.toKind,
    to_value: params.toValue,
  });
}

export type CardClickType = 'single' | 'bundle' | 'poll';

export function trackCardClick(params: {
  cardType: CardClickType;
  contentId: string;
  position: number;
  tabKind: MainTabKind;
  tabValue: string;
  categorySlug?: string;
}) {
  track('card_click', {
    card_type: params.cardType,
    content_id: params.contentId,
    position: params.position,
    tab_kind: params.tabKind,
    tab_value: params.tabValue,
    category_slug: params.categorySlug,
  });
}

// ──────────────────────────────────────────────────────────
// Ask H3 (테토/에겐) 이벤트 헬퍼
// ──────────────────────────────────────────────────────────

export type AskTopic = 'teto-egen';
export type AskAnswer = 'TETO' | 'EGEN';

/** 랜딩 진입. entry_point는 querystring `src` 파라미터(있을 시) > referrer 검사 순. */
export function trackAskView(
  topic: AskTopic,
  entryPoint: 'direct' | 'relay' | 'share_link' | 'main_banner'
) {
  track('ask_view', { topic, entry_point: entryPoint });
}

/** 자기 평가 2개 질문 모두 완료 (link create 직전) */
export function trackAskSelfAnswer(
  topic: AskTopic,
  selfAnswer: AskAnswer,
  selfPrediction: AskAnswer
) {
  track('ask_self_answer', {
    topic,
    self_answer: selfAnswer,
    self_prediction: selfPrediction,
  });
}

/** 본인 링크 생성 성공 */
export function trackAskLinkCreate(
  topic: AskTopic,
  selfAnswer: AskAnswer,
  selfPrediction: AskAnswer
) {
  track('ask_link_create', {
    topic,
    self_answer: selfAnswer,
    self_prediction: selfPrediction,
  });
}

/** 본인 링크 공유 트리거 */
export function trackAskShareLink(topic: AskTopic, method: 'copy' | 'kakao') {
  track('ask_share_link', { topic, method });
}

/** 친구 평가 페이지 진입 — is_own=true면 자기 링크 진입(평가 차단됨) */
export function trackAskFriendLanding(topic: AskTopic, isOwn: boolean) {
  track('ask_friend_landing', { topic, is_own: isOwn });
}

/** 친구 평가 제출 성공 */
export function trackAskFriendVote(
  topic: AskTopic,
  vote: AskAnswer,
  matchesOwnerSelfAnswer: boolean
) {
  track('ask_friend_vote', {
    topic,
    vote,
    matches_owner_self_answer: matchesOwnerSelfAnswer,
  });
}

/** 본인 결과 화면 조회 (직접 진입 + 폴링 갱신 + 친구 평가 후 재진입) */
export function trackAskOwnerResultView(
  topic: AskTopic,
  friendCount: number,
  isMajorityMatch: boolean
) {
  track('ask_owner_result_view', {
    topic,
    friend_count: friendCount,
    is_majority_match: isMajorityMatch,
  });
}

export type AskFriendResultCtaLabel = 'create_my' | 'home';

/** 친구 평가 후 결과 화면 mount (1회) */
export function trackAskFriendResultView(topic: AskTopic, hasMyLink: boolean, voteMatch: boolean) {
  track('ask_friend_result_view', {
    topic,
    has_my_link: hasMyLink,
    vote_match: voteMatch,
  });
}

/** 결과 화면 하단 CTA가 뷰포트 50% 이상 노출된 첫 시점 (스크롤 도달률) */
export function trackAskFriendResultCtaVisible(topic: AskTopic, hasMyLink: boolean) {
  track('ask_friend_result_cta_visible', {
    topic,
    has_my_link: hasMyLink,
  });
}

/** 결과 화면 하단 CTA 클릭 ("나도 평가 받아보기" / "홈으로 가기") */
export function trackAskFriendResultCtaClick(
  topic: AskTopic,
  ctaLabel: AskFriendResultCtaLabel,
  hasMyLink: boolean
) {
  track('ask_friend_result_cta_click', {
    topic,
    cta_label: ctaLabel,
    has_my_link: hasMyLink,
  });
}

/** 결과 화면 상단 BackIcon 클릭 (홈으로 빠져나감) */
export function trackAskFriendResultBack(topic: AskTopic) {
  track('ask_friend_result_back', { topic });
}

export type AskBannerPlacement = 'main_new' | 'main_category';

/** 메인 ask promo banner 노출 (mount 시 1회). */
export function trackAskPromoBannerView(placement: AskBannerPlacement, tabValue?: string) {
  track('ask_promo_banner_view', { placement, tab_value: tabValue });
}

/** 메인 ask promo banner 클릭 (Link 클릭 시). */
export function trackAskPromoBannerClick(placement: AskBannerPlacement, tabValue?: string) {
  track('ask_promo_banner_click', { placement, tab_value: tabValue });
}

// ──────────────────────────────────────────────────────────
// Real User 감지 — 첫 실제 인터랙션 시 사용자 속성 세팅
// ──────────────────────────────────────────────────────────

/**
 * pointerdown/keydown/scroll 중 첫 1회가 일어나면 `is_real_user=true`를
 * 사용자 속성으로 세팅. 봇은 대체로 인터랙션이 없으므로 bot_score로
 * 잡히지 않은 케이스까지 한번 더 걸러낸다. 한 세션에서 1회만 발화.
 */
export function initRealUserDetection() {
  if (typeof window === 'undefined') {
    return;
  }
  if (getBotScore() === 'high') {
    return;
  }
  try {
    if (window.localStorage.getItem(IS_REAL_USER_KEY) === '1') {
      setUserProperties({ is_real_user: true });
      return;
    }
  } catch {
    // localStorage 접근 실패 시 계속 진행
  }

  const onInteraction = () => {
    try {
      window.localStorage.setItem(IS_REAL_USER_KEY, '1');
    } catch {
      // noop
    }
    setUserProperties({ is_real_user: true });
    window.removeEventListener('pointerdown', onInteraction);
    window.removeEventListener('keydown', onInteraction);
    window.removeEventListener('scroll', onInteraction, true);
  };

  window.addEventListener('pointerdown', onInteraction, { passive: true, once: true });
  window.addEventListener('keydown', onInteraction, { passive: true, once: true });
  window.addEventListener('scroll', onInteraction, { passive: true, once: true, capture: true });
}

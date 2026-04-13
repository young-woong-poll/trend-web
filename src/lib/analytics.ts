/**
 * GA4 커스텀 이벤트 트래킹 유틸리티
 *
 * @next/third-parties/google의 GoogleAnalytics 컴포넌트가 gtag.js를 로드하고,
 * 이 모듈은 커스텀 이벤트 전송을 담당합니다.
 */

type GtagParams = Record<string, string | number | boolean | undefined>;

/** GA4 커스텀 이벤트 전송 */
export function trackEvent(eventName: string, params?: GtagParams) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }
  window.gtag('event', eventName, params);
}

/** GA4 User ID 설정 (로그인 시 호출) */
export function setAnalyticsUserId(userId: string) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }
  window.gtag('set', { user_id: userId });
}

/** GA4 User ID 해제 (로그아웃 시 호출) */
export function clearAnalyticsUserId() {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }
  window.gtag('set', { user_id: undefined });
}

// ──────────────────────────────────────────────────────────
// 번들 퍼널 이벤트 헬퍼
// ──────────────────────────────────────────────────────────

/** 번들 인트로 페이지 조회 */
export function trackBundleView(slug: string, entryPoint?: string) {
  trackEvent('bundle_view', { slug, entry_point: entryPoint });
}

/** 번들 "시작하기" 클릭 */
export function trackBundleStart(slug: string) {
  trackEvent('bundle_start', { slug });
}

/** 번들 질문 답변 */
export function trackBundleAnswer(slug: string, questionIndex: number, selected: string) {
  trackEvent('bundle_answer', { slug, question_index: questionIndex, selected });
}

/** 번들 완료 (전체 제출) */
export function trackBundleComplete(slug: string, questionCount: number) {
  trackEvent('bundle_complete', { slug, question_count: questionCount });
}

/** 번들 결과 페이지 조회 */
export function trackBundleResultView(slug: string) {
  trackEvent('bundle_result_view', { slug });
}

/** 비교 링크 생성 */
export function trackCompareCreate(slug: string, type: 'ONE_TO_ONE' | 'GROUP', source: string) {
  trackEvent('compare_create', { slug, compare_type: type, source });
}

/** 비교 링크 공유 */
export function trackCompareShare(
  slug: string,
  method: 'kakao' | 'copy',
  type: 'ONE_TO_ONE' | 'GROUP',
  source: string
) {
  trackEvent('compare_share', { slug, method, compare_type: type, source });
}

/** 비교 랜딩 페이지 조회 */
export function trackCompareLanding(bundleSlug: string, type: 'ONE_TO_ONE' | 'GROUP') {
  trackEvent('compare_landing', { bundle_slug: bundleSlug, compare_type: type });
}

/** 1:1 비교 결과 조회 */
export function trackCompareResult(bundleSlug: string) {
  trackEvent('compare_result', { bundle_slug: bundleSlug });
}

/** 그룹 비교 결과 조회 */
export function trackGroupResult(bundleSlug: string, memberCount: number) {
  trackEvent('group_result', { bundle_slug: bundleSlug, member_count: memberCount });
}

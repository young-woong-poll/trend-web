/**
 * 싱글 핫픽 투표 전환 애니메이션 상수
 *
 * 3-Phase 전환 (총 700ms):
 * Phase 1 (0~150ms): 탭 피드백 scale(0.97→1.0)
 * Phase 2 (150~400ms): 2열 버튼 → 1열 바 전환
 * Phase 3 (400~700ms): 바 채움 + 카운트업 + "투표 완료" fade-in
 */

export const VOTE_EASING = [0.22, 1, 0.36, 1] as const;

/** Phase 1: 버튼 탭 피드백 */
export const buttonTapVariants = {
  idle: { scale: 1 },
  tap: { scale: 0.97 },
};

/** Phase 2: 레이아웃 전환 */
export const layoutTransition = {
  duration: 0.25,
  ease: VOTE_EASING,
};

/** Phase 3: 바 채움 애니메이션 */
export const barFillVariants = {
  initial: { width: '0%' },
  animate: (percentage: number) => ({
    width: `${percentage}%`,
    transition: { duration: 0.3, delay: 0.15, ease: VOTE_EASING },
  }),
};

/** Phase 3: 텍스트/숫자 페이드인 */
export const fadeInVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { delay: 0.25, duration: 0.2 },
  },
};

/** 카드 진입 애니메이션 */
export const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: VOTE_EASING },
  },
};

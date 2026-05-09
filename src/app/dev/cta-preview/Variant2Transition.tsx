'use client';

import { type FC, useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import {
  MOCK_FRIEND_VOTES,
  MOCK_MY_VOTE,
  MOCK_OWNER_DISPLAY_NAME,
  MOCK_OWNER_SELF_ANSWER,
} from '@/app/dev/cta-preview/_mock';
import PreviewBaseView from '@/app/dev/cta-preview/PreviewBaseView';
import styles from '@/app/dev/cta-preview/Variant2Transition.module.scss';

/**
 * 방법 2: sticky → static transition
 * - Hero 단계: 화면 하단에 fixed sticky CTA "친구들 답 보기 ↓"
 * - Detail 50% 진입: sticky fade-out + detail 안 inline CTA "나도 해보기"가 fade-in으로 등장
 * - 위치/형태가 모두 변함 → "이제 다른 단계"가 명확히 인지됨
 */
const Variant2Transition: FC = () => {
  const [frameEl, setFrameEl] = useState<HTMLDivElement | null>(null);
  const [detailEl, setDetailEl] = useState<HTMLDivElement | null>(null);
  const [inDetail, setInDetail] = useState(false);
  // Hero에서 사용자가 한 번이라도 스크롤하면 통통 펄스 정지 — 발견성 시그널 임무 완료.
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    if (!frameEl || !detailEl || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          setInDetail(e.intersectionRatio >= 0.5);
        }
      },
      { root: frameEl, threshold: [0, 0.5, 1] }
    );
    obs.observe(detailEl);
    return () => obs.disconnect();
  }, [frameEl, detailEl]);

  useEffect(() => {
    if (!frameEl) {
      return;
    }
    const onScroll = () => {
      if (frameEl.scrollTop > 4) {
        setHasScrolled(true);
      }
    };
    frameEl.addEventListener('scroll', onScroll, { passive: true });
    return () => frameEl.removeEventListener('scroll', onScroll);
  }, [frameEl]);

  const handleScroll = () => {
    detailEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAction = () => {
    // eslint-disable-next-line no-console
    console.log('[preview] 나도 해보기 → /ask/teto-egen/my');
  };

  return (
    <PreviewBaseView
      ownerDisplayName={MOCK_OWNER_DISPLAY_NAME}
      ownerSelfAnswer={MOCK_OWNER_SELF_ANSWER}
      myVote={MOCK_MY_VOTE}
      friendVotes={MOCK_FRIEND_VOTES}
      onFrameMount={setFrameEl}
      onDetailMount={setDetailEl}
      inlineCtaSlot={
        <AnimatePresence>
          {inDetail && (
            <motion.div
              key="inline-cta"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className={styles.inlineHook}>친구들은 나를 어떻게 볼까?</p>
              <button type="button" className={styles.inlineCta} onClick={handleAction}>
                나도 해보기
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      }
      fixedOverlaySlot={
        <AnimatePresence>
          {!inDetail && (
            <motion.div
              key="sticky"
              className={styles.stickyWrap}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25 }}
            >
              <button
                type="button"
                className={`${styles.stickyCta} ${hasScrolled ? '' : styles.stickyCtaPulse}`}
                onClick={handleScroll}
              >
                <span>친구들 답 보기</span>
                <svg
                  className={styles.stickyArrow}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden
                >
                  <path d="M6 6l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      }
    />
  );
};

export default Variant2Transition;

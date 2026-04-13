'use client';

import { useState, useCallback, useRef, useEffect, type FC } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';

import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import styles from '@/components/features/Bundle/BundlePlay/BundlePlay.module.scss';
import { ProgressBar } from '@/components/features/Bundle/BundlePlay/ProgressBar';
import { QuestionCard } from '@/components/features/Bundle/BundlePlay/QuestionCard';
import { useAuth } from '@/contexts/AuthContext';
import {
  useBundleDetail,
  useBundleElections,
  useSubmitBundleAnswers,
  bundleKeys,
} from '@/hooks/api/useBundle';
import { compareKeys, useJoinCompareLink } from '@/hooks/api/useCompare';
import { trackBundleAnswer, trackBundleComplete } from '@/lib/analytics';

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 120 : -120,
    y: 20,
    opacity: 0,
  }),
  center: {
    x: 0,
    y: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -120 : 120,
    y: -10,
    opacity: 0,
  }),
};

interface BundlePlayProps {
  slug: string;
}

export const BundlePlay: FC<BundlePlayProps> = ({ slug }) => {
  const { isLoading: isAuthLoading } = useAuth();
  const { data: bundle } = useBundleDetail(slug);
  const { data: elections, isLoading } = useBundleElections(slug);
  const submitMutation = useSubmitBundleAnswers(slug);
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const compareToken = searchParams.get('compareToken');
  const returnUrl = searchParams.get('returnUrl');
  const joinMutation = useJoinCompareLink(compareToken ?? '');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, 'A' | 'B'>>(new Map());
  const [direction, setDirection] = useState(1);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 접근제어: 이미 완료 → returnUrl / compareLanding / 결과 페이지
  useEffect(() => {
    if (bundle?.completed) {
      if (returnUrl) {
        router.replace(returnUrl);
      } else if (compareToken) {
        router.replace(`/compare/${compareToken}`);
      } else {
        router.replace(`/bundle/${slug}/result`);
      }
    }
  }, [bundle?.completed, slug, router, returnUrl, compareToken]);

  // 접근제어: 번들 마감 → 인트로
  useEffect(() => {
    if (bundle && bundle.status === 'CLOSED') {
      router.replace(`/bundle/${slug}`);
    }
  }, [bundle, slug, router]);

  const handleSelect = useCallback(
    (choice: 'A' | 'B') => {
      if (!elections) {
        return;
      }
      const election = elections[currentIndex];
      const id = election.electionId ?? '';
      setAnswers((prev) => new Map(prev).set(id, choice));
      trackBundleAnswer(slug, currentIndex, choice);

      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
      // 마지막 질문이 아니면 항상 자동 이동 (같은 선택 재클릭 포함)
      if (currentIndex < elections.length - 1) {
        autoAdvanceTimer.current = setTimeout(() => {
          setDirection(1);
          setCurrentIndex((i) => i + 1);
        }, 400);
      }
    },
    [elections, currentIndex]
  );

  useEffect(
    () => () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    },
    []
  );

  const goPrev = () => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }
    setDirection(-1);
    setCurrentIndex((i) => i - 1);
  };

  const handleSubmit = async () => {
    if (!elections) {
      return;
    }

    const unanswered = elections.filter((e) => !answers.has(e.electionId ?? ''));
    if (unanswered.length > 0) {
      return;
    }

    const answerData = elections.map((e) => {
      const id = e.electionId ?? '';
      const selected = answers.get(id);
      // unanswered guard가 위에서 이미 검증했으므로 여기서는 fallback
      return { electionId: id, selected: selected ?? ('A' as const) };
    });

    try {
      await submitMutation.mutateAsync({ answers: answerData });
      trackBundleComplete(slug, elections.length);
      // 번들 완료 상태가 바뀌었으므로 관련 캐시 무효화 (그룹 결과 등에서 stale 방지)
      void queryClient.invalidateQueries({ queryKey: bundleKeys.detail(slug) });
      void queryClient.invalidateQueries({ queryKey: compareKeys.all });
      if (returnUrl) {
        router.replace(returnUrl);
      } else if (compareToken) {
        try {
          await joinMutation.mutateAsync(undefined);
          router.replace(`/compare/match/${compareToken}`);
        } catch {
          // join 실패 (이미 다른 유저가 참여 등) → 랜딩 페이지로 이동 (isAlreadyTaken 안내)
          router.replace(`/compare/${compareToken}`);
        }
      } else {
        router.replace(`/bundle/${slug}/result`);
      }
    } catch (err) {
      // 중복 제출 에러 (이미 완료된 유저) → 결과 페이지로 이동
      const isBadRequest =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { status?: number } }).response?.status === 400;
      if (isBadRequest) {
        if (returnUrl) {
          router.replace(returnUrl);
        } else if (compareToken) {
          router.replace(`/compare/${compareToken}`);
        } else {
          router.replace(`/bundle/${slug}/result`);
        }
        return;
      }
      // eslint-disable-next-line no-alert
      window.alert('제출에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (isAuthLoading || isLoading || !elections || elections.length === 0) {
    return (
      <BundleBackground categoryCode={bundle?.categoryCode} categoryMeta={bundle?.categoryMeta}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          질문을 불러오는 중...
        </div>
      </BundleBackground>
    );
  }

  const currentElection = elections[currentIndex];
  const currentAnswer = answers.get(currentElection.electionId ?? '') ?? null;
  const allAnswered = elections.every((e) => answers.has(e.electionId ?? ''));
  const isLast = currentIndex === elections.length - 1;

  return (
    <BundleBackground categoryCode={bundle?.categoryCode} categoryMeta={bundle?.categoryMeta}>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <ProgressBar current={currentIndex + 1} total={elections.length} />
        </div>

        <div className={styles.questionWrapper}>
          <LazyMotion features={domAnimation}>
            <AnimatePresence mode="wait" custom={direction}>
              <m.div
                key={currentElection.electionId}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              >
                <QuestionCard
                  election={currentElection}
                  index={currentIndex}
                  selected={currentAnswer}
                  onSelect={handleSelect}
                  onBack={currentIndex > 0 ? goPrev : undefined}
                />
              </m.div>
            </AnimatePresence>
          </LazyMotion>
        </div>

        {isLast && (
          <div className={styles.submitArea}>
            <button
              type="button"
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={!allAnswered || submitMutation.isPending}
            >
              {submitMutation.isPending ? '제출 중...' : '결과 보기'}
            </button>
          </div>
        )}
      </div>
    </BundleBackground>
  );
};

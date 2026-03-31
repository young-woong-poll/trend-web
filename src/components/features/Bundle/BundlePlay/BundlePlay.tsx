'use client';

import { useState, useCallback, useRef, useEffect, type FC } from 'react';

import { useRouter } from 'next/navigation';

import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import styles from '@/components/features/Bundle/BundlePlay/BundlePlay.module.scss';
import { ProgressBar } from '@/components/features/Bundle/BundlePlay/ProgressBar';
import { QuestionCard } from '@/components/features/Bundle/BundlePlay/QuestionCard';
import { useAuth } from '@/contexts/AuthContext';
import {
  useBundleElections,
  useBundleMyResult,
  useSubmitBundleAnswers,
} from '@/hooks/api/useBundle';

const STORAGE_KEY = (slug: string) => `bundle_answers_${slug}`;

function loadAnswers(slug: string): Map<string, 'A' | 'B'> {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY(slug));
    if (!stored) {
      return new Map();
    }
    return new Map(JSON.parse(stored));
  } catch {
    return new Map();
  }
}

function saveAnswers(slug: string, answers: Map<string, 'A' | 'B'>) {
  try {
    sessionStorage.setItem(STORAGE_KEY(slug), JSON.stringify([...answers]));
  } catch {
    // storage full
  }
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

interface BundlePlayProps {
  slug: string;
}

export const BundlePlay: FC<BundlePlayProps> = ({ slug }) => {
  const { isLoggedIn } = useAuth();
  const { data: elections, isLoading } = useBundleElections(slug);
  const { data: existingResult } = useBundleMyResult(slug);
  const submitMutation = useSubmitBundleAnswers(slug);
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, 'A' | 'B'>>(() => loadAnswers(slug));
  const [direction, setDirection] = useState(1);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace(`/bundle/${slug}`);
    }
  }, [isLoggedIn, slug, router]);

  useEffect(() => {
    if (existingResult) {
      sessionStorage.removeItem(STORAGE_KEY(slug));
      router.replace(`/bundle/${slug}/result`);
    }
  }, [existingResult, slug, router]);

  const handleSelect = useCallback(
    (choice: 'A' | 'B') => {
      if (!elections) {
        return;
      }
      const election = elections[currentIndex];
      setAnswers((prev) => {
        const next = new Map(prev).set(election.electionId, choice);
        saveAnswers(slug, next);
        return next;
      });

      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
      if (currentIndex < elections.length - 1) {
        autoAdvanceTimer.current = setTimeout(() => {
          setDirection(1);
          setCurrentIndex((i) => i + 1);
        }, 400);
      }
    },
    [elections, currentIndex, slug]
  );

  useEffect(
    () => () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    },
    []
  );

  const goTo = (nextIndex: number) => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }
    setDirection(nextIndex > currentIndex ? 1 : -1);
    setCurrentIndex(nextIndex);
  };

  const handleSubmit = async () => {
    if (!elections) {
      return;
    }

    const unanswered = elections.filter((e) => !answers.has(e.electionId));
    if (unanswered.length > 0) {
      return;
    }

    const answerData = elections.map((e) => {
      const selected = answers.get(e.electionId);
      // unanswered guard가 위에서 이미 검증했으므로 여기서는 fallback
      return { electionId: e.electionId, selected: selected ?? ('A' as const) };
    });

    try {
      await submitMutation.mutateAsync({ answers: answerData });
      sessionStorage.removeItem(STORAGE_KEY(slug));
      router.push(`/bundle/${slug}/result`);
    } catch {
      // eslint-disable-next-line no-alert
      window.alert('제출에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (isLoading || !elections) {
    return (
      <FlexibleLayout>
        <div className={styles.loading}>질문을 불러오는 중...</div>
      </FlexibleLayout>
    );
  }

  const currentElection = elections[currentIndex];
  const currentAnswer = answers.get(currentElection.electionId) ?? null;
  const allAnswered = elections.every((e) => answers.has(e.electionId));
  const isLast = currentIndex === elections.length - 1;

  return (
    <FlexibleLayout>
      <div className={styles.container}>
        <ProgressBar current={currentIndex + 1} total={elections.length} />

        <LazyMotion features={domAnimation}>
          <AnimatePresence mode="wait" custom={direction}>
            <m.div
              key={currentElection.electionId}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <QuestionCard
                election={currentElection}
                selected={currentAnswer}
                onSelect={handleSelect}
              />
            </m.div>
          </AnimatePresence>
        </LazyMotion>

        <div className={styles.navigation}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            이전
          </button>

          {isLast ? (
            <button
              type="button"
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={!allAnswered || submitMutation.isPending}
            >
              {submitMutation.isPending ? '제출 중...' : '결과 보기'}
            </button>
          ) : (
            <button
              type="button"
              className={styles.navButton}
              onClick={() => goTo(currentIndex + 1)}
              disabled={!currentAnswer}
            >
              다음
            </button>
          )}
        </div>
      </div>
    </FlexibleLayout>
  );
};

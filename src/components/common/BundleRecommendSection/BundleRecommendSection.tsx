'use client';

import { memo, useMemo, useRef } from 'react';

import Link from 'next/link';

import ChevronDownIcon from '@/assets/icon/ChevronDownIcon';
import styles from '@/components/common/BundleRecommendSection/BundleRecommendSection.module.scss';
import { getCategoryTheme } from '@/constants/categoryTheme';
import { useBundleList } from '@/hooks/api/useBundle';
import { toBundleCardModelFromSummary } from '@/lib/mappers/cardMapper';
import { withParticle } from '@/lib/utils';
import type { BundleCardModel } from '@/types/card';

const RECOMMEND_COUNT = 3;

/** Fisher-Yates 셔플 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface BundleRecommendSectionProps {
  currentSlug: string;
  /** 추천 섹션 헤더에 노출할 맥락 이름 (예: 그룹명 또는 친구 닉네임). 있으면 "{name}과 이런 테스트도 해볼래요?"로 카피 변경 */
  contextName?: string;
}

// eslint-disable-next-line react/display-name
export const BundleRecommendSection = memo<BundleRecommendSectionProps>(
  ({ currentSlug, contextName }) => {
    const { data: bundles, isLoading } = useBundleList(true);
    const shuffledRef = useRef<BundleCardModel[] | null>(null);

    const recommendations = useMemo(() => {
      if (!bundles || isLoading) {
        return [];
      }

      const cards = bundles.map(toBundleCardModelFromSummary);
      const filtered = cards.filter(
        (b) => b.slug !== currentSlug && !b.participated && b.status !== 'CLOSED'
      );

      if (filtered.length === 0) {
        return [];
      }

      // 마운트 시 1회만 셔플, 이후 리렌더에서 동일 결과 유지
      if (!shuffledRef.current || shuffledRef.current.length !== filtered.length) {
        shuffledRef.current = shuffle(filtered);
      }

      return shuffledRef.current.slice(0, RECOMMEND_COUNT);
    }, [bundles, isLoading, currentSlug]);

    if (recommendations.length === 0) {
      return null;
    }

    const headerCopy = contextName
      ? `${withParticle(contextName)} 이런 테스트도 해볼래요?`
      : '이런 테스트는 어때요?';

    return (
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>{headerCopy}</span>
          <div className={styles.sectionLine} />
        </div>
        <div className={styles.list}>
          {recommendations.map((bundle) => {
            const theme = getCategoryTheme(bundle.categoryCode, bundle.categoryMeta);
            return (
              <Link key={bundle.slug} href={`/bundle/${bundle.slug}`} className={styles.card}>
                <div className={styles.cardColorBar} style={{ backgroundColor: theme.start }} />
                <div className={styles.cardContent}>
                  <div className={styles.cardMeta}>
                    <span
                      className={styles.categoryBadge}
                      style={{
                        backgroundColor: `rgba(${theme.startRgb}, 0.15)`,
                        color: theme.start,
                      }}
                    >
                      {bundle.categories[0] ?? theme.label}
                    </span>
                    <span className={styles.questionCount}>{bundle.electionCount}문항</span>
                  </div>
                  <span className={styles.cardTitle}>{bundle.title}</span>
                  <span className={styles.participantCount}>
                    {bundle.totalVoteCount.toLocaleString()}명 참여
                  </span>
                </div>
                <ChevronDownIcon className={styles.chevron} width={14} height={14} aria-hidden />
              </Link>
            );
          })}
        </div>
      </div>
    );
  }
);

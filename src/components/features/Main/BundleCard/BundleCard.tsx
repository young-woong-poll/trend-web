'use client';

import { memo, useState } from 'react';

import { useRouter } from 'next/navigation';

import ClockIcon from '@/assets/icon/ClockIcon';
import ShareIcon from '@/assets/icon/ShareIcon';
import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import { DeadlineBadge } from '@/components/common/DeadlineBadge';
import styles from '@/components/features/Main/BundleCard/BundleCard.module.scss';
import { getCategoryThemeVars } from '@/constants/categoryTheme';
import { useCardActions } from '@/contexts/CardActionsContext';
import { formatCount } from '@/lib/utils';
import type { BundleCardModel } from '@/types/card';

const EMPTY_CATEGORIES: string[] = [];

interface BundleCardProps {
  data: BundleCardModel;
}

// eslint-disable-next-line react/display-name
export const BundleCard = memo<BundleCardProps>(({ data }) => {
  const {
    slug,
    title,
    subtitle,
    categories = EMPTY_CATEGORIES,
    categoryCode,
    categoryMeta,
    totalVoteCount,
    electionCount,
    expiredAt,
    status,
    participated,
  } = data;

  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const actions = useCardActions();

  const isClosed = status === 'CLOSED';
  const themeVars = getCategoryThemeVars(categoryCode, categoryMeta);

  const handleClick = () => {
    if (isClosed) {
      return;
    }
    setIsNavigating(true);
    router.push(participated ? `/bundle/${slug}/result` : `/bundle/${slug}`);
  };

  return (
    <div
      className={`${styles.card} ${isClosed ? styles.closed : ''}`}
      data-testid="bundle-card"
      style={themeVars}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleClick();
        }
      }}
    >
      <div className={styles.accentBorder} />

      <div className={styles.content}>
        {/* 상단: 카테고리 + 케미 뱃지 + 공유 */}
        <div className={styles.topRow}>
          <div className={styles.categoryRow}>
            {categories.map((cat, i) => (
              <span key={cat}>
                {i > 0 && <span className={styles.categorySeparator}>·</span>}
                <span className={styles.categoryTag}>{cat}</span>
              </span>
            ))}
            {categories.length > 0 && <span className={styles.categorySeparator}>·</span>}
            <span className={styles.chemiBadge}>가치관 비교</span>
          </div>
          <button
            type="button"
            className={styles.shareButton}
            onClick={(e) => {
              e.stopPropagation();
              actions.share(slug, 'BUNDLE');
            }}
            aria-label="공유"
          >
            <ShareIcon />
          </button>
        </div>

        {/* 제목 */}
        <div className={styles.titleGroup}>
          <h3 className={styles.title}>{title}</h3>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        {/* 메타 — 가치관 질문 N개 · 약 N분 · M명 참여 */}
        <div className={styles.metaRow}>
          {electionCount && <span className={styles.metaText}>가치관 질문 {electionCount}개</span>}
          {electionCount && <span className={styles.dot} />}
          {electionCount && (
            <>
              <span className={styles.durationText}>
                <ClockIcon width={12} height={12} />
                {electionCount * 5 <= 30
                  ? '약 30초'
                  : electionCount * 5 <= 59
                    ? '약 1분'
                    : `약 ${Math.round((electionCount * 5) / 60)}분`}
              </span>
              <span className={styles.dot} />
            </>
          )}
          <span className={styles.metaText}>{formatCount(totalVoteCount)}명 참여</span>
        </div>

        {/* 비교 어필 — 단톡방 친구들과 가치관 맞춰보기 */}
        <p className={styles.compareText}>
          <span className={styles.compareHighlight}>단톡방 친구들</span>과 가치관 맞춰보기
        </p>

        {/* CTA 버튼 */}
        <button
          type="button"
          className={`${styles.ctaButton} ${participated ? styles.participated : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          disabled={isNavigating || isClosed}
        >
          {isNavigating ? (
            <span className={styles.loading}>...</span>
          ) : participated ? (
            <>
              결과 보기 <StartArrowIcon width={16} height={16} />
            </>
          ) : (
            <>
              시작하기 <StartArrowIcon width={16} height={16} />
            </>
          )}
        </button>

        {/* 마감 뱃지 */}
        <div className={styles.bottomRow}>
          {expiredAt && <DeadlineBadge deadline={expiredAt} compact />}
          {isClosed && (
            <span className={styles.closedBadge} data-testid="closed-badge">
              마감
            </span>
          )}
          {participated && <span className={styles.participatedBadge}>참여 완료</span>}
        </div>
      </div>
    </div>
  );
});

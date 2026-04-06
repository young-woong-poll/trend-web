'use client';

import { memo, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import CheckIcon from '@/assets/icon/CheckIcon';
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
    totalVoteCount,
    electionCount,
    imageUrls,
    expiredAt,
    status,
    participated,
  } = data;

  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const actions = useCardActions();

  const isClosed = status === 'CLOSED';
  const thumbnailUrl = imageUrls?.[0];
  const themeVars = getCategoryThemeVars(categoryCode);

  const handleClick = () => {
    if (isClosed) {
      return;
    }
    setIsNavigating(true);
    router.push(`/bundle/${slug}`);
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
        {/* 상단: 카테고리 + 공유 */}
        <div className={styles.topRow}>
          <div className={styles.categoryRow}>
            {categories.map((code, i) => (
              <span key={code}>
                {i > 0 && <span className={styles.categorySeparator}>·</span>}
                <span className={styles.categoryTag}>{code}</span>
              </span>
            ))}
          </div>
          <button
            type="button"
            className={styles.shareButton}
            onClick={(e) => {
              e.stopPropagation();
              actions.share(slug);
            }}
            aria-label="공유"
          >
            <ShareIcon />
          </button>
        </div>

        {/* 제목 */}
        <div className={styles.titleRow}>
          {thumbnailUrl && (
            <Image
              src={thumbnailUrl}
              alt={title}
              width={40}
              height={40}
              className={styles.titleLogo}
            />
          )}
          <div className={styles.titleGroup}>
            <div className={styles.titleWithBadges}>
              <h3 className={styles.title}>{title}</h3>
              <div className={styles.titleBadges}>
                <span className={styles.bundleBadge}>
                  {electionCount ? `${electionCount}개 질문` : '번들'}
                </span>
                {isClosed && (
                  <span className={styles.closedBadge} data-testid="closed-badge">
                    마감
                  </span>
                )}
              </div>
            </div>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>

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

        {/* 메타 */}
        <div className={styles.metaRow}>
          <span className={styles.participants}>{formatCount(totalVoteCount)}명 참여</span>
          {expiredAt && (
            <>
              <span className={styles.dot} />
              <DeadlineBadge deadline={expiredAt} compact />
            </>
          )}
          {participated && (
            <>
              <span className={styles.dot} />
              <span className={styles.participatedBadge}>
                <CheckIcon width={10} height={10} /> 참여 완료
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

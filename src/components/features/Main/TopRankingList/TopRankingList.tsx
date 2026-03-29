'use client';

import { memo, type FC } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import CrownIcon from '@/assets/icon/CrownIcon';
import styles from '@/components/features/Main/TopRankingList/TopRankingList.module.scss';
import { formatCount } from '@/lib/utils';
import type { CardModel } from '@/types/card';

// ── Helpers ──

function getSlug(card: CardModel): string {
  return card.data.slug;
}

function getTitle(card: CardModel): string {
  return card.data.title;
}

function getTotalVoteCount(card: CardModel): number {
  return card.data.totalVoteCount;
}

function getCategories(card: CardModel): string[] {
  return card.data.categories;
}

function getImageUrl(card: CardModel): string | undefined {
  if (card.type === 'SINGLE') {
    return card.data.mainImageUrl;
  }
  return card.data.imageUrls?.[0];
}

// ── Types ──

interface TopRankingListProps {
  cards: CardModel[];
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  emptyState: { title: string; description: string };
}

// ── Sub-components ──

const FirstPlaceCard: FC<{ card: CardModel }> = ({ card }) => {
  const imageUrl = getImageUrl(card);

  return (
    <Link href={`/hotpick/${getSlug(card)}`} className={styles.firstPlace}>
      <div className={styles.firstPlaceBadge}>
        <CrownIcon width={20} height={20} color="#FFD700" />
        <span className={styles.badgeText}>1st</span>
      </div>
      <div className={styles.firstPlaceBody}>
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={getTitle(card)}
            width={80}
            height={80}
            className={styles.firstPlaceImage}
          />
        )}
        <div className={styles.firstPlaceContent}>
          <h3 className={styles.firstPlaceTitle}>{getTitle(card)}</h3>
          <div className={styles.firstPlaceMeta}>
            <div className={styles.tags}>
              {getCategories(card).map((cat) => (
                <span key={cat} className={styles.tag}>
                  {cat}
                </span>
              ))}
            </div>
            <span className={styles.voteCount}>{formatCount(getTotalVoteCount(card))}명 참여</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// ── Component ──

// eslint-disable-next-line react/display-name
export const TopRankingList = memo<TopRankingListProps>(
  ({ cards, isLoading, isError, isFetching, emptyState }) => {
    // Loading state
    if (isLoading && cards.length === 0) {
      return (
        <div className={styles.skeleton} data-testid="top-ranking-list">
          <div className={styles.skeletonTall} />
          <div className={styles.skeletonShort} />
          <div className={styles.skeletonShort} />
          <div className={styles.skeletonShort} />
          <div className={styles.skeletonShort} />
          <div className={styles.skeletonShort} />
        </div>
      );
    }

    // Error state
    if (isError && cards.length === 0) {
      return (
        <div className={styles.errorContainer} data-testid="top-ranking-list">
          <p className={styles.errorText}>랭킹을 불러오는데 실패했습니다.</p>
          <p className={styles.errorHint}>잠시 후 다시 시도해주세요.</p>
        </div>
      );
    }

    // Empty state
    if (!isFetching && cards.length === 0) {
      return (
        <div className={styles.emptyState} data-testid="top-ranking-list">
          <h2 className={styles.emptyTitle}>{emptyState.title}</h2>
          <p className={styles.emptyDescription}>{emptyState.description}</p>
        </div>
      );
    }

    const firstCard = cards[0];
    const podiumCards = cards.slice(1, 3);
    const listCards = cards.slice(3, 15);

    return (
      <div className={styles.container} data-testid="top-ranking-list">
        {/* Header */}
        <div className={styles.header}>
          <CrownIcon width={24} height={24} />
          <span className={styles.headerTitle}>TOP 15</span>
        </div>

        {/* 1st Place */}
        {firstCard && <FirstPlaceCard card={firstCard} />}

        {/* 2nd & 3rd Place */}
        {podiumCards.length > 0 && (
          <div className={styles.podiumGrid}>
            {podiumCards.map((card, index) => {
              const rank = index + 2;
              const color = rank === 2 ? '#C0C0C0' : '#CD7F32';
              const label = rank === 2 ? '2nd' : '3rd';

              const imageUrl = getImageUrl(card);

              return (
                <Link
                  key={getSlug(card)}
                  href={`/hotpick/${getSlug(card)}`}
                  className={styles.podiumCard}
                >
                  <div className={styles.podiumBadge}>
                    <span className={styles.podiumBadgeText} style={{ color }}>
                      {label}
                    </span>
                  </div>
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt={getTitle(card)}
                      width={56}
                      height={56}
                      className={styles.podiumImage}
                    />
                  )}
                  <h4 className={styles.podiumTitle}>{getTitle(card)}</h4>
                  <div className={styles.podiumMeta}>
                    <div className={styles.podiumTags}>
                      {getCategories(card).map((cat) => (
                        <span key={cat} className={styles.podiumTag}>
                          {cat}
                        </span>
                      ))}
                    </div>
                    <span className={styles.podiumVoteCount}>
                      {formatCount(getTotalVoteCount(card))}명 참여
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* 4th~15th List */}
        {listCards.length > 0 && (
          <div className={styles.listContainer}>
            {listCards.map((card, index) => {
              const rank = index + 4;

              const imageUrl = getImageUrl(card);

              return (
                <Link
                  key={getSlug(card)}
                  href={`/hotpick/${getSlug(card)}`}
                  className={styles.listRow}
                >
                  <span className={styles.rankNumber}>{rank}</span>
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt={getTitle(card)}
                      width={36}
                      height={36}
                      className={styles.listImage}
                    />
                  )}
                  <span className={styles.listTitle}>{getTitle(card)}</span>
                  <div className={styles.listTags}>
                    {getCategories(card).map((cat) => (
                      <span key={cat} className={styles.listTag}>
                        {cat}
                      </span>
                    ))}
                  </div>
                  <span className={styles.listVoteCount}>
                    {formatCount(getTotalVoteCount(card))}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

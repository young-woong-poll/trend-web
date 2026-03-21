'use client';

import { type FC } from 'react';

import Link from 'next/link';

import SearchIcon from '@/assets/icon/SearchIcon';
import { addRecentKeyword } from '@/components/features/Search/SearchInitialView';
import styles from '@/components/features/Search/SearchResultList.module.scss';
import { useSearch, type SearchHit } from '@/hooks/api/useSearch';

interface SearchResultListProps {
  query: string;
}

/** 2글자 이상 입력 안내 */
export const SearchMinLengthHint: FC = () => (
  <div className={styles.emptyContainer}>
    <div className={styles.emptyIcon}>
      <SearchIcon width={36} height={36} />
    </div>
    <p className={styles.emptyDescription}>검색어를 2글자 이상 입력해주세요</p>
  </div>
);

export const SearchResultList: FC<SearchResultListProps> = ({ query }) => {
  const { data, isLoading, isError } = useSearch({ q: query, limit: 20 });
  const hotpicks = data?.hits ?? [];

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.resultList}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonThumb} />
              <div className={styles.skeletonInfo}>
                <div className={styles.skeletonCategory} />
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonMeta} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIcon}>
          <SearchIcon width={36} height={36} />
        </div>
        <h3 className={styles.emptyTitle}>검색 중 오류가 발생했어요</h3>
        <p className={styles.emptyDescription}>잠시 후 다시 시도해주세요</p>
      </div>
    );
  }

  if (hotpicks.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIcon}>
          <SearchIcon width={36} height={36} />
        </div>
        <h3 className={styles.emptyTitle}>검색 결과가 없어요</h3>
        <p className={styles.emptyDescription}>
          &ldquo;{query}&rdquo;에 대한
          <br />
          핫픽을 찾지 못했어요.
        </p>
        <p className={styles.emptySuggestion}>다른 키워드로 검색해보세요</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.resultList}>
        {hotpicks.map((item) => (
          <SearchPreviewCard
            key={item.id ?? item.hotpickId ?? item.slug}
            item={item}
            query={query}
          />
        ))}
      </div>
    </div>
  );
};

/** 검색 미리보기 카드 — 썸네일 + 카테고리 + 제목 + 투표수/댓글/공감 */
const SearchPreviewCard: FC<{ item: SearchHit; query: string }> = ({ item, query }) => {
  const categories = item.categories ?? [];
  const election = item.election;
  const title = election?.title ?? '';
  const totalVoteCount = election?.totalVoteCount ?? 0;
  const totalCommentCount = election?.totalCommentCount ?? 0;
  const likeCount = item.likeCount ?? 0;
  const isClosed = item.isExpired === true;

  // IMAGE 타입: election items에서 이미지 2개 추출
  const items = election?.items ?? [];
  const isImageType = item.type === 'IMAGE' || items.filter((it) => it.imageUrl).length >= 2;
  const imageItems = items.filter((it) => it.imageUrl).slice(0, 2);

  // 일반 타입: hotpick 또는 election 이미지
  const singleImageUrl = item.imageUrl ?? election?.imageUrl;

  const handleClick = () => {
    addRecentKeyword(query);
  };

  return (
    <Link
      href={`/hotpick/${item.slug}`}
      className={`${styles.previewCard} ${isClosed ? styles.closed : ''}`}
      onClick={handleClick}
    >
      {isImageType && imageItems.length >= 2 ? (
        <div className={styles.thumbnailSplit}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageItems[0].imageUrl ?? ''} alt="" className={styles.thumbnailHalf} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageItems[1].imageUrl ?? ''} alt="" className={styles.thumbnailHalf} />
        </div>
      ) : singleImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={singleImageUrl} alt="" className={styles.thumbnail} />
      ) : (
        <div className={styles.thumbnailPlaceholder} />
      )}

      <div className={styles.cardInfo}>
        <div className={styles.cardCategories}>
          {categories.map((cat, i) => (
            <span key={cat.slug ?? i}>
              {i > 0 && <span className={styles.categorySeparator}>·</span>}
              <span className={styles.categoryTag}>{cat.name}</span>
            </span>
          ))}
          {isClosed && <span className={styles.closedBadge}>마감</span>}
        </div>

        <h3 className={styles.cardTitle}>{title}</h3>

        <div className={styles.cardMeta}>
          <span>{totalVoteCount.toLocaleString()}명 참여</span>
          <span className={styles.dot} />
          <span>댓글 {totalCommentCount.toLocaleString()}</span>
          <span className={styles.dot} />
          <span>♡ {likeCount.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
};

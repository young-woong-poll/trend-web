'use client';

import { type FC } from 'react';

import SearchIcon from '@/assets/icon/SearchIcon';
import styles from '@/components/features/Search/SearchResultView.module.scss';

interface SearchResultViewProps {
  query: string;
  onSearch: (keyword: string) => void;
}

type MockPreviewItem = {
  id: number;
  title: string;
  formattedTitle: string;
  categories: string[];
  totalVoteCount: number;
  totalCommentCount: number;
  likeCount: number;
  imageUrl?: string;
  status: 'ACTIVE' | 'CLOSED';
};

const MOCK_RESULTS: MockPreviewItem[] = [
  {
    id: 1,
    title: '대통령 탄핵 찬성 vs 반대',
    formattedTitle: '<em>대통령</em> <em>탄핵</em> 찬성 vs 반대',
    categories: ['정치'],
    totalVoteCount: 15234,
    totalCommentCount: 892,
    likeCount: 342,
    imageUrl: 'https://picsum.photos/seed/hp1/96/96',
    status: 'ACTIVE',
  },
  {
    id: 2,
    title: '탄핵 이후 조기 대선, 누가 유리할까?',
    formattedTitle: '<em>탄핵</em> 이후 조기 대선, 누가 유리할까?',
    categories: ['정치'],
    totalVoteCount: 9876,
    totalCommentCount: 456,
    likeCount: 198,
    imageUrl: 'https://picsum.photos/seed/hp2/96/96',
    status: 'ACTIVE',
  },
  {
    id: 3,
    title: '대통령 권한대행 체제, 경제에 악영향?',
    formattedTitle: '<em>대통령</em> 권한대행 체제, 경제에 악영향?',
    categories: ['정치', '경제'],
    totalVoteCount: 7654,
    totalCommentCount: 321,
    likeCount: 156,
    status: 'ACTIVE',
  },
  {
    id: 4,
    title: '탄핵 정국, 주식 시장 어떻게 될까?',
    formattedTitle: '<em>탄핵</em> 정국, 주식 시장 어떻게 될까?',
    categories: ['경제'],
    totalVoteCount: 5432,
    totalCommentCount: 234,
    likeCount: 89,
    imageUrl: 'https://picsum.photos/seed/hp4/96/96',
    status: 'ACTIVE',
  },
  {
    id: 5,
    title: '대통령 탄핵, 역대 몇 번째?',
    formattedTitle: '<em>대통령</em> <em>탄핵</em>, 역대 몇 번째?',
    categories: ['정치', '사회'],
    totalVoteCount: 3210,
    totalCommentCount: 98,
    likeCount: 45,
    status: 'CLOSED',
  },
];

const EMPTY_QUERY_KEYWORDS = ['비트코인', 'AI', '부동산'];

// 빈 결과를 보여줄 키워드 (디자인 확인용)
const isEmptyResult = (q: string) =>
  q.includes('asdfsdf') || q.includes('없는검색어') || q.length > 20;

export const SearchResultView: FC<SearchResultViewProps> = ({ query, onSearch }) => {
  const showEmpty = isEmptyResult(query);

  if (showEmpty) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIcon}>
          <SearchIcon width={64} height={64} />
        </div>
        <h3 className={styles.emptyTitle}>검색 결과가 없어요</h3>
        <p className={styles.emptyDescription}>
          &ldquo;{query}&rdquo;에 대한
          <br />
          핫픽을 찾지 못했어요.
        </p>
        <p className={styles.emptySuggestion}>다른 키워드로 검색해보세요</p>

        <div className={styles.suggestChips}>
          {EMPTY_QUERY_KEYWORDS.map((kw) => (
            <button
              key={kw}
              type="button"
              className={styles.suggestChip}
              onClick={() => onSearch(kw)}
            >
              {kw}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.resultList}>
        {MOCK_RESULTS.map((item) => (
          <div
            key={item.id}
            className={`${styles.previewCard} ${item.status === 'CLOSED' ? styles.closed : ''}`}
          >
            {/* 썸네일 */}
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" className={styles.thumbnail} />
            ) : (
              <div className={styles.thumbnailPlaceholder} />
            )}

            {/* 정보 */}
            <div className={styles.cardInfo}>
              {/* 카테고리 */}
              <div className={styles.cardCategories}>
                {item.categories.map((cat, i) => (
                  <span key={cat}>
                    {i > 0 && <span className={styles.categorySeparator}>·</span>}
                    <span className={styles.categoryTag}>{cat}</span>
                  </span>
                ))}
                {item.status === 'CLOSED' && <span className={styles.closedBadge}>마감</span>}
              </div>

              {/* 제목 (하이라이팅) */}
              <h3
                className={styles.cardTitle}
                dangerouslySetInnerHTML={{ __html: item.formattedTitle }}
              />

              {/* 메타: 투표수 · 댓글 · 공감 */}
              <div className={styles.cardMeta}>
                <span>{item.totalVoteCount.toLocaleString()}명 참여</span>
                <span className={styles.dot} />
                <span>댓글 {item.totalCommentCount.toLocaleString()}</span>
                <span className={styles.dot} />
                <span>♡ {item.likeCount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

'use client';

import { useState, type FC } from 'react';

import SearchIcon from '@/assets/icon/SearchIcon';
import styles from '@/components/features/Search/SearchResultView.module.scss';

interface SearchResultViewProps {
  query: string;
  onSearch: (keyword: string) => void;
}

const MOCK_CATEGORIES = [
  { slug: 'all', label: '전체', count: 12 },
  { slug: 'politics', label: '정치', count: 5 },
  { slug: 'economy', label: '경제', count: 3 },
  { slug: 'society', label: '사회', count: 2 },
  { slug: 'tech', label: '기술', count: 2 },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: '관련도순' },
  { value: 'newest', label: '최신순' },
  { value: 'popular', label: '참여자순' },
];

type MockResult = {
  id: number;
  title: string;
  formattedTitle: string;
  categories: string[];
  totalVoteCount: number;
  totalCommentCount: number;
  likeCount: number;
  expiredAt: string;
  options: { label: string; text: string; percentage: number }[];
  status: 'ACTIVE' | 'CLOSED';
};

const MOCK_RESULTS: MockResult[] = [
  {
    id: 1,
    title: '대통령 탄핵 찬성 vs 반대',
    formattedTitle: '<em>대통령</em> <em>탄핵</em> 찬성 vs 반대',
    categories: ['정치'],
    totalVoteCount: 15234,
    totalCommentCount: 892,
    likeCount: 342,
    expiredAt: '2026-04-01T00:00:00Z',
    options: [
      { label: 'A', text: '찬성', percentage: 62 },
      { label: 'B', text: '반대', percentage: 38 },
    ],
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
    expiredAt: '2026-03-28T00:00:00Z',
    options: [
      { label: 'A', text: '이재명', percentage: 45 },
      { label: 'B', text: '김문수', percentage: 32 },
      { label: 'C', text: '이준석', percentage: 23 },
    ],
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
    expiredAt: '2026-04-15T00:00:00Z',
    options: [
      { label: 'A', text: '영향 크다', percentage: 71 },
      { label: 'B', text: '별로 없다', percentage: 29 },
    ],
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
    expiredAt: '2026-03-20T00:00:00Z',
    options: [
      { label: 'A', text: '상승', percentage: 35 },
      { label: 'B', text: '하락', percentage: 48 },
      { label: 'C', text: '횡보', percentage: 17 },
    ],
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
    expiredAt: '2026-05-01T00:00:00Z',
    options: [
      { label: 'A', text: '이번이 심각', percentage: 67 },
      { label: 'B', text: '과거가 심각', percentage: 33 },
    ],
    status: 'CLOSED',
  },
];

const EMPTY_QUERY_KEYWORDS = ['비트코인', 'AI', '부동산'];

// 빈 결과를 보여줄 키워드 (디자인 확인용)
const isEmptyResult = (q: string) =>
  q.includes('asdfsdf') || q.includes('없는검색어') || q.length > 20;

export const SearchResultView: FC<SearchResultViewProps> = ({ query, onSearch }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('relevance');
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
      {/* 카테고리 필터 */}
      <div className={styles.categoryFilter}>
        {MOCK_CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            className={`${styles.categoryChip} ${selectedCategory === cat.slug ? styles.categoryChipActive : ''}`}
            onClick={() => setSelectedCategory(cat.slug)}
          >
            {cat.label}
            <span className={styles.categoryCount}>{cat.count}</span>
          </button>
        ))}
      </div>

      {/* 결과 메타 */}
      <div className={styles.resultMeta}>
        <span className={styles.resultCount}>검색 결과 {MOCK_RESULTS.length}건</span>
        <select
          className={styles.sortSelect}
          value={selectedSort}
          onChange={(e) => setSelectedSort(e.target.value)}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 검색 결과 카드 리스트 */}
      <div className={styles.resultList}>
        {MOCK_RESULTS.map((result) => (
          <div
            key={result.id}
            className={`${styles.resultCard} ${result.status === 'CLOSED' ? styles.closed : ''}`}
          >
            {/* 상단: 카테고리 */}
            <div className={styles.cardTopRow}>
              <div className={styles.cardCategories}>
                {result.categories.map((cat, i) => (
                  <span key={cat}>
                    {i > 0 && <span className={styles.categorySeparator}>·</span>}
                    <span className={styles.categoryTag}>{cat}</span>
                  </span>
                ))}
              </div>
              {result.status === 'CLOSED' && <span className={styles.closedBadge}>마감</span>}
            </div>

            {/* 제목 (하이라이팅) */}
            <h3
              className={styles.cardTitle}
              dangerouslySetInnerHTML={{ __html: result.formattedTitle }}
            />

            {/* 투표 결과 바 */}
            <div className={styles.voteResults}>
              {result.options.map((opt) => (
                <div key={opt.label} className={styles.resultBar}>
                  <div className={styles.barFill} style={{ width: `${opt.percentage}%` }} />
                  <div className={styles.barContent}>
                    <span className={styles.barText}>
                      <span className={styles.barLabel}>{opt.label}</span> {opt.text}
                    </span>
                    <span className={styles.barPercent}>{opt.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 하단 메타 */}
            <div className={styles.cardBottom}>
              <span className={styles.participants}>
                {result.totalVoteCount.toLocaleString()}명 참여
              </span>
              <span className={styles.dot} />
              <span className={styles.comments}>댓글 {result.totalCommentCount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

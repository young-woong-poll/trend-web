'use client';

import { useState, type FC } from 'react';

import CloseIcon from '@/assets/icon/CloseIcon';
import styles from '@/components/features/Search/SearchInitialView.module.scss';

interface SearchInitialViewProps {
  onSearch: (keyword: string) => void;
}

const MOCK_RECENT_KEYWORDS = ['대통령 탄핵', '부동산 vs 주식', '연봉 협상', 'AI 대체 직업'];

const MOCK_TRENDING_KEYWORDS = [
  '이재명 vs 김문수',
  '비트코인 10만달러',
  '부동산 폭락',
  'AI 대체 직업',
  '연봉 1억',
  '전세 vs 월세',
  '주4일제',
  '삼성 vs 애플',
  '결혼 적정 나이',
  '해외 이민',
];

const MOCK_HOT_PICKS = [
  {
    slug: 'bitcoin-100k',
    title: '비트코인이 올해 안에 10만 달러를 돌파할까?',
    participants: 8432,
    category: '경제',
  },
  {
    slug: 'ai-jobs',
    title: 'AI가 5년 안에 내 직업을 대체할 수 있을까?',
    participants: 12891,
    category: '기술',
  },
  {
    slug: 'housing-crash',
    title: '2026년 부동산 가격, 폭락할까 반등할까?',
    participants: 15234,
    category: '부동산',
  },
];

export const SearchInitialView: FC<SearchInitialViewProps> = ({ onSearch }) => {
  const [recentKeywords, setRecentKeywords] = useState(MOCK_RECENT_KEYWORDS);

  const removeRecent = (keyword: string) => {
    setRecentKeywords((prev) => prev.filter((k) => k !== keyword));
  };

  const clearAllRecent = () => {
    setRecentKeywords([]);
  };

  return (
    <div className={styles.container}>
      {/* 최근 검색어 */}
      {recentKeywords.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>최근 검색어</h3>
            <button type="button" className={styles.clearAllButton} onClick={clearAllRecent}>
              전체 삭제
            </button>
          </div>
          <ul className={styles.recentList}>
            {recentKeywords.map((keyword) => (
              <li key={keyword} className={styles.recentItem}>
                <button
                  type="button"
                  className={styles.recentKeyword}
                  onClick={() => onSearch(keyword)}
                >
                  {keyword}
                </button>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => removeRecent(keyword)}
                  aria-label={`검색어 '${keyword}' 삭제`}
                >
                  <CloseIcon width={12} height={12} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 인기 검색어 */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>인기 검색어</h3>
        <ol className={styles.trendingList}>
          {MOCK_TRENDING_KEYWORDS.map((keyword, index) => (
            <li key={keyword} className={styles.trendingItem}>
              <button
                type="button"
                className={styles.trendingKeyword}
                onClick={() => onSearch(keyword)}
              >
                <span className={`${styles.rank} ${index < 3 ? styles.rankTop : ''}`}>
                  {index + 1}
                </span>
                <span className={styles.trendingText}>{keyword}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      {/* 추천 핫픽 */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>지금 HOT한 핫픽</h3>
        <div className={styles.hotPickList}>
          {MOCK_HOT_PICKS.map((pick) => (
            <div key={pick.slug} className={styles.hotPickCard}>
              <span className={styles.hotPickCategory}>{pick.category}</span>
              <h4 className={styles.hotPickTitle}>{pick.title}</h4>
              <span className={styles.hotPickParticipants}>
                {pick.participants.toLocaleString()}명 참여
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

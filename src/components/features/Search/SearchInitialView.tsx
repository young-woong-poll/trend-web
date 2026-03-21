'use client';

import { useCallback, useEffect, useState, type FC } from 'react';

import CloseIcon from '@/assets/icon/CloseIcon';
import styles from '@/components/features/Search/SearchInitialView.module.scss';

interface SearchInitialViewProps {
  onSearch: (keyword: string) => void;
}

const STORAGE_KEY = 'hotpick_recent_search';
const MAX_RECENT = 10;

function loadRecentKeywords(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecentKeywords(keywords: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keywords.slice(0, MAX_RECENT)));
  } catch {
    // localStorage full or unavailable
  }
}

/** 최근 검색어에 추가 (중복 시 최상단 이동) */
export function addRecentKeyword(keyword: string) {
  const keywords = loadRecentKeywords();
  const filtered = keywords.filter((k) => k !== keyword);
  saveRecentKeywords([keyword, ...filtered]);
}

export const SearchInitialView: FC<SearchInitialViewProps> = ({ onSearch }) => {
  const [recentKeywords, setRecentKeywords] = useState<string[]>([]);

  useEffect(() => {
    setRecentKeywords(loadRecentKeywords());
  }, []);

  const removeRecent = useCallback((keyword: string) => {
    setRecentKeywords((prev) => {
      const next = prev.filter((k) => k !== keyword);
      saveRecentKeywords(next);
      return next;
    });
  }, []);

  const clearAllRecent = useCallback(() => {
    setRecentKeywords([]);
    saveRecentKeywords([]);
  }, []);

  return (
    <div className={styles.container}>
      {recentKeywords.length > 0 ? (
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
      ) : (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>최근 검색어가 없습니다</p>
        </div>
      )}
    </div>
  );
};

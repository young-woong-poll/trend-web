'use client';

import { useEffect, useRef, type FC } from 'react';

import BackIcon from '@/assets/icon/BackIcon';
import CloseIcon from '@/assets/icon/CloseIcon';
import styles from '@/components/features/Search/SearchHeader.module.scss';

interface SearchHeaderProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: (keyword: string) => void;
  onClear: () => void;
  onBack: () => void;
}

const MIN_SEARCH_LENGTH = 2;

export const SearchHeader: FC<SearchHeaderProps> = ({
  query,
  onQueryChange,
  onSearch,
  onClear,
  onBack,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (value: string) => {
    onQueryChange(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (value.trim().length >= MIN_SEARCH_LENGTH) {
      debounceRef.current = setTimeout(() => {
        onSearch(value.trim());
      }, 300);
    } else if (value.trim().length === 0) {
      onClear();
    }
  };

  return (
    <header className={styles.header}>
      <button type="button" className={styles.backButton} onClick={onBack} aria-label="뒤로가기">
        <BackIcon width={24} height={24} />
      </button>

      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder="핫픽 검색"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          role="searchbox"
          aria-label="핫픽 검색"
          maxLength={50}
        />
        {query && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={onClear}
            aria-label="검색어 삭제"
          >
            <CloseIcon width={16} height={16} />
          </button>
        )}
      </div>
    </header>
  );
};

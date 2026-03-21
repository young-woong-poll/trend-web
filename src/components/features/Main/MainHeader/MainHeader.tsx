'use client';

import { useCallback, useEffect, useRef, useState, type FC } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import CloseIcon from '@/assets/icon/CloseIcon';
import SearchIcon from '@/assets/icon/SearchIcon';
import mainLogo1x from '@/assets/img/main-logo@1x.png';
import styles from '@/components/features/Main/MainHeader/MainHeader.module.scss';
import { SearchInitialView } from '@/components/features/Search/SearchInitialView';
import { SearchResultList } from '@/components/features/Search/SearchResultList';

const MIN_SEARCH_LENGTH = 2;

export const MainHeader: FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleSearch = useCallback((keyword: string) => {
    setQuery(keyword);
    setActiveQuery(keyword);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    setActiveQuery('');
  }, []);

  const openModal = useCallback(() => {
    setModalOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    handleClear();
  }, [handleClear]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (value.trim().length >= MIN_SEARCH_LENGTH) {
      debounceRef.current = setTimeout(() => {
        setActiveQuery(value.trim());
      }, 300);
    } else {
      setActiveQuery('');
    }
  };

  // ESC로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalOpen) {
        closeModal();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, closeModal]);

  // 모달 바깥 클릭으로 닫기
  useEffect(() => {
    if (!modalOpen) {
      return;
    }
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        closeModal();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [modalOpen, closeModal]);

  return (
    <>
      <header className={styles.header}>
        <Link href="/" className={styles.logoContainer} aria-label="메인으로 이동">
          <Image src={mainLogo1x} alt="HotPick" className={styles.logo} priority height={24} />
        </Link>

        {/* PC: 검색 입력 필드 + 모달 (≥768px) */}
        <div className={styles.searchBarWrapper} ref={wrapperRef}>
          <div className={styles.searchBar} onClick={openModal}>
            <SearchIcon width={16} height={16} className={styles.searchBarIcon} />
            {modalOpen ? (
              <input
                ref={inputRef}
                type="text"
                className={styles.searchBarInput}
                placeholder="핫픽 검색"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                role="searchbox"
                aria-label="핫픽 검색"
                maxLength={50}
              />
            ) : (
              <span className={styles.searchBarPlaceholder}>핫픽 검색</span>
            )}
            {query && modalOpen && (
              <button
                type="button"
                className={styles.searchBarClear}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                  inputRef.current?.focus();
                }}
                aria-label="검색어 삭제"
              >
                <CloseIcon width={14} height={14} />
              </button>
            )}
          </div>

          {/* PC 검색 모달 (드롭다운) */}
          {modalOpen && (
            <div className={styles.searchModal}>
              {activeQuery ? (
                <SearchResultList query={activeQuery} />
              ) : (
                <SearchInitialView onSearch={handleSearch} />
              )}
            </div>
          )}
        </div>

        {/* Mobile: 돋보기 아이콘 (<768px) → /search 페이지 이동 */}
        <Link href="/search" className={styles.searchIconButton} aria-label="검색">
          <SearchIcon width={20} height={20} />
        </Link>
      </header>

      {/* backdrop */}
      {modalOpen && <div className={styles.backdrop} />}
    </>
  );
};

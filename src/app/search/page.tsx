'use client';

import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { SearchHeader } from '@/components/features/Search/SearchHeader';
import { SearchInitialView } from '@/components/features/Search/SearchInitialView';
import {
  SearchMinLengthHint,
  SearchResultList,
} from '@/components/features/Search/SearchResultList';

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

  const handleSearch = useCallback((keyword: string) => {
    setQuery(keyword);
    setActiveQuery(keyword);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    setActiveQuery('');
  }, []);

  const handleBack = useCallback(() => {
    if (activeQuery) {
      handleClear();
    } else {
      router.back();
    }
  }, [activeQuery, handleClear, router]);

  // 1글자만 입력된 상태 판별
  const trimmed = query.trim();
  const showHint = trimmed.length === 1;

  return (
    <>
      <SearchHeader
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        onClear={handleClear}
        onBack={handleBack}
      />
      <FlexibleLayout>
        {showHint ? (
          <SearchMinLengthHint />
        ) : activeQuery ? (
          <SearchResultList query={activeQuery} />
        ) : (
          <SearchInitialView onSearch={handleSearch} />
        )}
      </FlexibleLayout>
    </>
  );
}

'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { SearchHeader } from '@/components/features/Search/SearchHeader';
import { SearchInitialView } from '@/components/features/Search/SearchInitialView';
import { SearchResultView } from '@/components/features/Search/SearchResultView';

export default function MockSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

  const handleSearch = (keyword: string) => {
    setQuery(keyword);
    setActiveQuery(keyword);
  };

  const handleClear = () => {
    setQuery('');
    setActiveQuery('');
  };

  const handleBack = () => {
    if (activeQuery) {
      handleClear();
    } else {
      router.push('/');
    }
  };

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
        {activeQuery ? (
          <SearchResultView query={activeQuery} onSearch={handleSearch} />
        ) : (
          <SearchInitialView onSearch={handleSearch} />
        )}
      </FlexibleLayout>
    </>
  );
}

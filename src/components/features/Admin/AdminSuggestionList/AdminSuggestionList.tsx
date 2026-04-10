'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import styles from '@/components/features/Admin/AdminSuggestionList/AdminSuggestionList.module.scss';
import { GetSuggestionsStatus } from '@/generated/models';
import { useSuggestions } from '@/hooks/api/useAdmin';

const STATUS_FILTERS = [
  { value: undefined, label: '전체' },
  { value: GetSuggestionsStatus.PENDING, label: '대기중' },
  { value: GetSuggestionsStatus.APPROVED, label: '승인' },
  { value: GetSuggestionsStatus.REJECTED, label: '거절' },
] as const;

const STATUS_LABEL: Record<string, string> = {
  PENDING: '대기중',
  APPROVED: '승인',
  REJECTED: '거절',
};

const getStatusClass = (status?: string) => {
  switch (status) {
    case 'PENDING':
      return styles.statusPending;
    case 'APPROVED':
      return styles.statusApproved;
    case 'REJECTED':
      return styles.statusRejected;
    default:
      return '';
  }
};

export default function AdminSuggestionList() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<GetSuggestionsStatus | undefined>(undefined);
  const { data: suggestions, isLoading } = useSuggestions(statusFilter);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>제안 목록</h1>
          {suggestions && suggestions.length > 0 && (
            <span className={styles.totalCount}>총 {suggestions.length}개</span>
          )}
        </div>
      </header>

      {/* 상태 필터 */}
      <div className={styles.filterGroup}>
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.label}
            type="button"
            className={`${styles.filterButton} ${statusFilter === filter.value ? styles.filterButtonActive : ''}`}
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* 목록 테이블 */}
      {suggestions && suggestions.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>제목</th>
                <th>선택지</th>
                <th>카테고리</th>
                <th>상태</th>
                <th>제출일</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((suggestion, index) => (
                <tr
                  key={suggestion.id}
                  onClick={() => router.push(`/admin/suggestion/${suggestion.id}`)}
                >
                  <td>{suggestions.length - index}</td>
                  <td>{suggestion.title}</td>
                  <td>{suggestion.items?.map((item) => item.title).join(', ')}</td>
                  <td>
                    {suggestion.categories?.map((cat) => (
                      <span key={cat.id} className={styles.categoryChip}>
                        {cat.name}
                      </span>
                    ))}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(suggestion.status)}`}>
                      {STATUS_LABEL[suggestion.status ?? ''] ?? suggestion.status}
                    </span>
                  </td>
                  <td>
                    {suggestion.createdAt
                      ? new Date(suggestion.createdAt).toLocaleDateString('ko-KR')
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.empty}>
          <p>제안이 없습니다.</p>
        </div>
      )}
    </div>
  );
}

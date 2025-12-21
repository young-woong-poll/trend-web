'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/common/Button/Button';
import styles from '@/components/features/Admin/AdminTrendList/AdminTrendList.module.scss';
import TrendListItem from '@/components/features/Admin/AdminTrendList/TrendListItem';
import { useGetTrends } from '@/services/hooks/useAdmin';

export default function AdminTrendList() {
  const router = useRouter();
  const { data: trends, isLoading } = useGetTrends();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <header className={styles.header}>
        <h1>트렌드 목록</h1>
        <Button onClick={() => router.push('/admin/trend/create')} variant="primary">
          + 트렌드 생성
        </Button>
      </header>

      {/* 목록 테이블 */}
      {trends && trends.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>썸네일</th>
                <th>제목</th>
                <th>Alias</th>
                <th>상태</th>
                <th>생성일</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {trends.map((trend) => (
                <TrendListItem
                  key={trend.id}
                  trend={trend}
                  onEdit={(id) => router.push(`/admin/trend/edit/${id}`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.empty}>
          <p>등록된 트렌드가 없습니다.</p>
          <Button onClick={() => router.push('/admin/trend/create')}>트렌드 생성하기</Button>
        </div>
      )}
    </div>
  );
}

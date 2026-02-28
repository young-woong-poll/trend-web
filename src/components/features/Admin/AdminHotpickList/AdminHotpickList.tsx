'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/common/Button/Button';
import styles from '@/components/features/Admin/AdminHotpickList/AdminHotpickList.module.scss';
import HotpickListItem from '@/components/features/Admin/AdminHotpickList/HotpickListItem';
import { useHotpicks } from '@/hooks/api/useAdmin';

export default function AdminHotpickList() {
  const router = useRouter();
  const { data: hotpicks, isLoading } = useHotpicks();

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
        <div>
          <h1>핫픽 목록</h1>
          {hotpicks && hotpicks.length > 0 && (
            <span className={styles.totalCount}>총 {hotpicks.length}개</span>
          )}
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/hotpick/create')}>
          + 핫픽 생성
        </Button>
      </header>

      {/* 목록 테이블 */}
      {hotpicks && hotpicks.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>썸네일</th>
                <th>제목</th>
                <th>Alias</th>
                <th>상태</th>
                <th>생성일</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {hotpicks.map((hotpick, index) => (
                <HotpickListItem
                  key={hotpick.id}
                  hotpick={hotpick}
                  orderNumber={hotpicks.length - index}
                  onEdit={(id) => router.push(`/admin/hotpick/edit/${id}`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.empty}>
          <p>등록된 핫픽이 없습니다.</p>
          <Button variant="outline" onClick={() => router.push('/admin/hotpick/create')}>
            핫픽 생성하기
          </Button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/common/Button/Button';
import styles from '@/components/features/Admin/AdminElectionList/AdminElectionList.module.scss';
import ElectionListItem from '@/components/features/Admin/AdminElectionList/ElectionListItem';
import { useElectionList } from '@/hooks/api/useElection';

export default function AdminElectionList() {
  const router = useRouter();
  const { data: electionData, isLoading } = useElectionList();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  const elections = electionData?.content ?? [];

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <header className={styles.header}>
        <h1>선거 목록</h1>
        <Button variant="outline" onClick={() => router.push('/admin/election/create')}>
          + 선거 생성
        </Button>
      </header>

      {/* 목록 테이블 */}
      {elections.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>제목</th>
                <th>투표 유형</th>
                <th>옵션 수</th>
                <th>연결된 핫픽</th>
                <th>생성일</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {elections.map((election) => (
                <ElectionListItem
                  key={election.id}
                  election={election}
                  onEdit={(id) => router.push(`/admin/election/edit/${id}`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.empty}>
          <p>등록된 선거가 없습니다.</p>
          <Button variant="outline" onClick={() => router.push('/admin/election/create')}>
            선거 생성하기
          </Button>
        </div>
      )}
    </div>
  );
}

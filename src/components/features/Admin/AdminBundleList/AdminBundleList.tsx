'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/common/Button/Button';
import styles from '@/components/features/Admin/AdminBundleList/AdminBundleList.module.scss';
import { useAdminBundleList } from '@/hooks/api/useAdminBundle';

export default function AdminBundleList() {
  const router = useRouter();
  const { data: bundles, isLoading } = useAdminBundleList();

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
          <h1>번들 관리</h1>
          {bundles && bundles.length > 0 && (
            <span className={styles.totalCount}>총 {bundles.length}개</span>
          )}
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/hotpick/create?type=BUNDLE')}>
          + 번들 생성
        </Button>
      </header>

      {bundles && bundles.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>slug</th>
                <th>제목</th>
                <th>카테고리</th>
                <th>질문 수</th>
                <th>참여자</th>
                <th>비교 링크</th>
                <th>상태</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {bundles.map((bundle) => (
                <tr key={bundle.bundleId}>
                  <td>
                    <code className={styles.slug}>{bundle.slug}</code>
                  </td>
                  <td>{bundle.title}</td>
                  <td>
                    <span className={styles.categoryBadge}>{bundle.categoryCode}</span>
                  </td>
                  <td>{bundle.questionCount}</td>
                  <td>{bundle.participantCount.toLocaleString()}</td>
                  <td>{bundle.compareLinkCount}</td>
                  <td>
                    <span
                      className={
                        bundle.status === 'ACTIVE' ? styles.statusActive : styles.statusClosed
                      }
                    >
                      {bundle.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.detailButton}
                        onClick={() => router.push(`/admin/bundle/${bundle.slug}`)}
                      >
                        상세 →
                      </button>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => router.push(`/admin/hotpick/edit/${bundle.hotpickId}`)}
                      >
                        수정
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.empty}>
          <p>등록된 번들이 없습니다.</p>
        </div>
      )}
    </div>
  );
}

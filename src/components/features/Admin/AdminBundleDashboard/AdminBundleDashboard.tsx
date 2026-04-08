'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/common/Button/Button';
import styles from '@/components/features/Admin/AdminBundleDashboard/AdminBundleDashboard.module.scss';
import CompareLinksTab from '@/components/features/Admin/AdminBundleDashboard/CompareLinksTab';
import ParticipationTab from '@/components/features/Admin/AdminBundleDashboard/ParticipationTab';
import QuestionStatsTab from '@/components/features/Admin/AdminBundleDashboard/QuestionStatsTab';
import { useAdminBundleStats, useUpdateBundle, useDeleteBundle } from '@/hooks/api/useAdminBundle';

type TabKey = 'participation' | 'compareLinks' | 'questionStats';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'participation', label: '참여 현황' },
  { key: 'compareLinks', label: '비교 링크' },
  { key: 'questionStats', label: '질문별 통계' },
];

interface AdminBundleDashboardProps {
  slug: string;
}

export default function AdminBundleDashboard({ slug }: AdminBundleDashboardProps) {
  const router = useRouter();
  const { data: stats, isLoading } = useAdminBundleStats(slug);
  const { mutate: updateBundle, isPending: isUpdating } = useUpdateBundle();
  const { mutate: deleteBundle, isPending: isDeleting } = useDeleteBundle();
  const [activeTab, setActiveTab] = useState<TabKey>('participation');

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>번들을 찾을 수 없습니다.</div>
      </div>
    );
  }

  const handleToggleStatus = () => {
    const newStatus = stats.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    const message =
      newStatus === 'CLOSED'
        ? `"${stats.title}" 번들을 CLOSED로 변경하시겠습니까?\n유저가 더 이상 참여할 수 없게 됩니다.`
        : `"${stats.title}" 번들을 다시 ACTIVE로 변경하시겠습니까?`;
    if (!window.confirm(message)) {
      return;
    }
    updateBundle({ slug, data: { status: newStatus } });
  };

  const handleDelete = () => {
    if (
      !window.confirm(`"${stats.title}" 번들을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)
    ) {
      return;
    }
    deleteBundle(slug, {
      onSuccess: () => router.push('/admin/bundle'),
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => router.push('/admin/bundle')}
          >
            ← 번들 목록
          </button>
          <h1>{stats.title}</h1>
          <span className={styles.slug}>{stats.slug}</span>
        </div>
        <div className={styles.headerRight}>
          <span className={stats.status === 'ACTIVE' ? styles.statusActive : styles.statusClosed}>
            {stats.status}
          </span>
          <Button
            variant="outline"
            size="small"
            onClick={() => router.push(`/admin/hotpick/edit/${stats.hotpickId}`)}
          >
            수정
          </Button>
        </div>
      </header>

      <nav className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className={styles.tabContent}>
        {activeTab === 'participation' && (
          <ParticipationTab
            participation={stats.participation}
            compareLinkCount={stats.compareLinks.totalCount}
          />
        )}
        {activeTab === 'compareLinks' && <CompareLinksTab compareLinks={stats.compareLinks} />}
        {activeTab === 'questionStats' && <QuestionStatsTab questionStats={stats.questionStats} />}
      </div>

      <div className={styles.dangerZone}>
        <h3 className={styles.dangerTitle}>위험 영역</h3>
        <div className={styles.dangerActions}>
          <div className={styles.dangerItem}>
            <div>
              <p className={styles.dangerLabel}>상태 변경</p>
              <p className={styles.dangerDesc}>
                {stats.status === 'ACTIVE'
                  ? 'CLOSED로 변경하면 유저가 더 이상 참여할 수 없습니다.'
                  : '다시 ACTIVE로 변경하면 유저가 참여할 수 있습니다.'}
              </p>
            </div>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={handleToggleStatus}
              disabled={isUpdating}
            >
              {stats.status === 'ACTIVE' ? 'CLOSED로 변경' : 'ACTIVE로 변경'}
            </button>
          </div>
          <div className={styles.dangerItem}>
            <div>
              <p className={styles.dangerLabel}>번들 삭제</p>
              <p className={styles.dangerDesc}>
                이 번들을 영구적으로 삭제합니다. 되돌릴 수 없습니다.
              </p>
            </div>
            <button
              type="button"
              className={`${styles.dangerButton} ${styles.dangerButtonRed}`}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

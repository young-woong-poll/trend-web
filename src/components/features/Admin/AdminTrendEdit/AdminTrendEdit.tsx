'use client';

import { Button } from '@/components/common/Button/Button';
import styles from '@/components/features/Admin/AdminTrendEdit/AdminTrendEdit.module.scss';
import { AdminTrendForm } from '@/components/features/Admin/AdminTrendForm/AdminTrendForm';
import { useConfirm } from '@/hooks/useConfirm';
import { useGetTrendDetail, useUpdateTrend, useDeleteTrend } from '@/services/hooks/useAdmin';

interface AdminTrendEditProps {
  trendId: number;
}

export default function AdminTrendEdit({ trendId }: AdminTrendEditProps) {
  const { data: trend, isLoading } = useGetTrendDetail(trendId);
  const { mutate: updateTrend, isPending: isUpdating } = useUpdateTrend();
  const { mutate: deleteTrend, isPending: isDeleting } = useDeleteTrend();
  const { showConfirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  if (!trend) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>트렌드를 찾을 수 없습니다.</div>
      </div>
    );
  }

  const handleDelete = () => {
    showConfirm('트렌드 삭제', {
      message: `정말 "${trend.title}" 트렌드를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      confirmText: '삭제',
      cancelText: '취소',
      onConfirm: () => {
        deleteTrend(trendId);
      },
    });
  };

  return (
    <div className={styles.container}>
      <AdminTrendForm
        mode="edit"
        trend={trend}
        onSubmit={(data) => updateTrend({ trendId, data })}
        isSubmitting={isUpdating}
      />

      {/* 위험 영역 (Danger Zone) */}
      <div className={styles.dangerZone}>
        <h3 className={styles.dangerTitle}>위험 영역</h3>
        <p className={styles.dangerDescription}>
          이 트렌드를 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
        </p>
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={isDeleting}
          className={styles.deleteButton}
        >
          {isDeleting ? '삭제 중...' : '트렌드 삭제'}
        </Button>
      </div>

      {/* Confirm 모달 */}
      {confirmState.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>{confirmState.title}</h2>
            {confirmState.message && <p className={styles.modalMessage}>{confirmState.message}</p>}
            <div className={styles.modalActions}>
              <Button variant="outline" onClick={handleCancel}>
                {confirmState.cancelText}
              </Button>
              <Button variant="primary" onClick={handleConfirm} className={styles.confirmButton}>
                {confirmState.confirmText}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

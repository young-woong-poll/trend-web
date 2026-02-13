'use client';

import { Button } from '@/components/common/Button/Button';
import styles from '@/components/features/Admin/AdminHotpickEdit/AdminHotpickEdit.module.scss';
import { AdminHotpickForm } from '@/components/features/Admin/AdminHotpickForm/AdminHotpickForm';
import { useGetHotpickDetail, useUpdateHotpick, useDeleteHotpick } from '@/hooks/api/useAdmin';
import { useConfirm } from '@/hooks/useConfirm';

interface AdminHotpickEditProps {
  hotpickId: number;
}

export default function AdminHotpickEdit({ hotpickId }: AdminHotpickEditProps) {
  const { data: hotpick, isLoading } = useGetHotpickDetail(hotpickId);
  const { mutate: updateHotpick, isPending: isUpdating } = useUpdateHotpick();
  const { mutate: deleteHotpick, isPending: isDeleting } = useDeleteHotpick();
  const { showConfirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  if (!hotpick) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>핫픽을 찾을 수 없습니다.</div>
      </div>
    );
  }

  const handleDelete = () => {
    showConfirm('핫픽 삭제', {
      message: `정말 "${hotpick.title}" 핫픽을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      confirmText: '삭제',
      cancelText: '취소',
      onConfirm: () => {
        deleteHotpick(hotpickId);
      },
    });
  };

  return (
    <div className={styles.container}>
      <AdminHotpickForm
        mode="edit"
        hotpick={hotpick}
        onSubmit={(data) => updateHotpick({ hotpickId, data })}
        isSubmitting={isUpdating}
      />

      {/* 위험 영역 (Danger Zone) */}
      <div className={styles.dangerZone}>
        <h3 className={styles.dangerTitle}>위험 영역</h3>
        <p className={styles.dangerDescription}>
          이 핫픽을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
        </p>
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={isDeleting}
          className={styles.deleteButton}
        >
          {isDeleting ? '삭제 중...' : '핫픽 삭제'}
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

'use client';

import { Button } from '@/components/common/Button/Button';
import styles from '@/components/features/Admin/AdminElectionEdit/AdminElectionEdit.module.scss';
import { AdminElectionForm } from '@/components/features/Admin/AdminElectionForm/AdminElectionForm';
import { useElectionDetail, useDeleteElection } from '@/hooks/api/useElection';
import { useConfirm } from '@/hooks/useConfirm';

interface AdminElectionEditProps {
  electionId: string;
}

export default function AdminElectionEdit({ electionId }: AdminElectionEditProps) {
  const { data: election, isLoading } = useElectionDetail(electionId);
  const { mutate: deleteElection, isPending: isDeleting } = useDeleteElection();
  const { showConfirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>선거를 찾을 수 없습니다.</div>
      </div>
    );
  }

  const handleDelete = () => {
    showConfirm('선거 삭제', {
      message: `정말 "${election.title}" 선거를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.${
        (election.linkedHotpickCount ?? 0) > 0
          ? `\n\n이 선거를 사용 중인 핫픽이 ${election.linkedHotpickCount}개 있어 삭제가 불가능할 수 있습니다.`
          : ''
      }`,
      confirmText: '삭제',
      cancelText: '취소',
      onConfirm: () => {
        deleteElection(electionId);
      },
    });
  };

  return (
    <div className={styles.container}>
      <AdminElectionForm mode="edit" election={election} />

      {/* 위험 영역 (Danger Zone) */}
      <div className={styles.dangerZone}>
        <h3 className={styles.dangerTitle}>위험 영역</h3>
        <p className={styles.dangerDescription}>
          이 선거를 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
          {(election.linkedHotpickCount ?? 0) > 0 && (
            <>
              <br />
              현재 이 선거를 사용 중인 핫픽이 {election.linkedHotpickCount}개 있습니다.
            </>
          )}
        </p>
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={isDeleting}
          className={styles.deleteButton}
        >
          {isDeleting ? '삭제 중...' : '선거 삭제'}
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

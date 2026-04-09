'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/common/Button/Button';
import styles from '@/components/features/Admin/AdminSuggestionDetail/AdminSuggestionDetail.module.scss';
import {
  useAdminSuggestion,
  useApproveSuggestion,
  useRejectSuggestion,
} from '@/hooks/api/useAdmin';
import { useConfirm } from '@/hooks/useConfirm';

interface AdminSuggestionDetailProps {
  suggestionId: number;
}

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

export default function AdminSuggestionDetail({ suggestionId }: AdminSuggestionDetailProps) {
  const router = useRouter();
  const { data: suggestion, isLoading } = useAdminSuggestion(suggestionId);
  const { mutate: approve, isPending: isApproving } = useApproveSuggestion();
  const { mutate: reject, isPending: isRejecting } = useRejectSuggestion();
  const { showConfirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  const [adminMemo, setAdminMemo] = useState('');

  const isPending = suggestion?.status === 'PENDING';
  const isProcessing = isApproving || isRejecting;

  const handleApprove = () => {
    showConfirm('제안을 승인하시겠습니까?', {
      message: '승인하면 핫픽이 자동으로 생성됩니다.',
      confirmText: '승인',
      cancelText: '취소',
      onConfirm: () => {
        approve(
          { id: suggestionId, data: { adminMemo: adminMemo.trim() || undefined } },
          { onSuccess: () => router.push('/admin/suggestion') }
        );
      },
    });
  };

  const handleReject = () => {
    showConfirm('제안을 거절하시겠습니까?', {
      message: '거절된 제안은 되돌릴 수 없습니다.',
      confirmText: '거절',
      cancelText: '취소',
      onConfirm: () => {
        reject(
          { id: suggestionId, data: { adminMemo: adminMemo.trim() || undefined } },
          { onSuccess: () => router.push('/admin/suggestion') }
        );
      },
    });
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  if (!suggestion) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>제안을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.backButton}
        onClick={() => router.push('/admin/suggestion')}
      >
        &larr; 목록으로
      </button>

      <div className={styles.card}>
        {/* 제목 + 상태 */}
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{suggestion.title}</h1>
          <span className={`${styles.statusBadge} ${getStatusClass(suggestion.status)}`}>
            {STATUS_LABEL[suggestion.status ?? ''] ?? suggestion.status}
          </span>
        </div>

        {/* 선택지 */}
        <div className={styles.section}>
          <p className={styles.sectionLabel}>선택지</p>
          <ul className={styles.itemList}>
            {suggestion.items
              ?.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
              .map((item) => (
                <li key={item.id} className={styles.item}>
                  {item.title}
                </li>
              ))}
          </ul>
        </div>

        {/* 카테고리 */}
        <div className={styles.section}>
          <p className={styles.sectionLabel}>카테고리</p>
          <div className={styles.categoryChips}>
            {suggestion.categories?.map((cat) => (
              <span key={cat.id} className={styles.categoryChip}>
                {cat.name}
              </span>
            ))}
          </div>
        </div>

        {/* 날짜 정보 */}
        <div className={styles.section}>
          <div className={styles.metaRow}>
            <span>
              제출일:{' '}
              {suggestion.createdAt ? new Date(suggestion.createdAt).toLocaleString('ko-KR') : '-'}
            </span>
            {suggestion.reviewedAt && (
              <span>처리일: {new Date(suggestion.reviewedAt).toLocaleString('ko-KR')}</span>
            )}
          </div>
        </div>

        {/* 기존 어드민 메모 */}
        {suggestion.adminMemo && (
          <div className={styles.section}>
            <p className={styles.sectionLabel}>어드민 메모</p>
            <div className={styles.memoDisplay}>{suggestion.adminMemo}</div>
          </div>
        )}

        {/* 액션 영역: PENDING일 때만 */}
        {isPending && (
          <>
            <hr className={styles.divider} />
            <div className={styles.actionSection}>
              <p className={styles.sectionLabel}>어드민 메모 (선택)</p>
              <textarea
                className={styles.memoInput}
                value={adminMemo}
                onChange={(e) => setAdminMemo(e.target.value)}
                placeholder="승인/거절 사유를 남겨주세요 (선택사항)"
              />
              <div className={styles.actionButtons}>
                <button
                  type="button"
                  className={styles.rejectButton}
                  onClick={handleReject}
                  disabled={isProcessing}
                >
                  거절
                </button>
                <button
                  type="button"
                  className={styles.approveButton}
                  onClick={handleApprove}
                  disabled={isProcessing}
                >
                  승인
                </button>
              </div>
            </div>
          </>
        )}
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
              <button
                type="button"
                className={
                  confirmState.confirmText === '거절'
                    ? styles.modalConfirmReject
                    : styles.modalConfirmApprove
                }
                onClick={handleConfirm}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

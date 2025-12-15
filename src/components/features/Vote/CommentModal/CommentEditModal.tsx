'use client';

import { useState, useEffect, type FC } from 'react';

import { Portal } from '@/components/common/Portal/Portal';
import styles from '@/components/features/Vote/CommentModal/CommentEditModal.module.scss';
import { useModal } from '@/contexts/ModalContext';
import { useUpdateComment } from '@/hooks/api/useComment';
import type { CommentItem } from '@/types/comment';

interface CommentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  comment: CommentItem;
  editToken: string;
}

const COMMENT_MAX_LENGTH = 200;

export const CommentEditModal: FC<CommentEditModalProps> = ({
  isOpen,
  onClose,
  comment,
  editToken,
}) => {
  const [content, setContent] = useState(comment.content);

  const { showToast } = useModal();
  const { mutate: updateComment, isPending } = useUpdateComment();

  // 댓글 내용이 변경되면 초기화
  useEffect(() => {
    setContent(comment.content);
  }, [comment.content]);

  // 내용 변경 핸들러
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;

    // 최대 길이 제한
    if (value.length > COMMENT_MAX_LENGTH) {
      value = value.slice(0, COMMENT_MAX_LENGTH);
    }

    setContent(value);
  };

  // 수정 버튼 클릭 핸들러
  const handleUpdate = () => {
    const trimmedContent = content.trim();

    // 유효성 검증
    if (!trimmedContent) {
      showToast('댓글 내용을 입력해주세요');
      return;
    }

    // 내용이 변경되지 않았으면 중단
    if (trimmedContent === comment.content) {
      showToast('변경된 내용이 없습니다');
      return;
    }

    // 댓글 수정 API 호출
    updateComment(
      {
        commentId: comment.id,
        data: {
          editToken,
          content: trimmedContent,
        },
      },
      {
        onSuccess: () => {
          showToast('댓글이 수정되었습니다');
          onClose();
        },
        onError: () => {
          showToast('댓글 수정에 실패했습니다');
        },
      }
    );
  };

  // Dimmed 클릭 핸들러
  const handleDimmedClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 닫기 버튼 클릭 핸들러
  const handleClose = () => {
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const isContentChanged = content.trim() !== comment.content;

  return (
    <Portal>
      <div className={styles.dimmed} onClick={handleDimmedClick}>
        <div className={styles.modal}>
          {/* 헤더 */}
          <div className={styles.header}>
            <h2 className={styles.title}>댓글 수정</h2>
            <button
              type="button"
              className={styles.closeButton}
              onClick={handleClose}
              aria-label="닫기"
              disabled={isPending}
            >
              ✕
            </button>
          </div>

          {/* 닉네임 표시 (수정 불가) */}
          <div className={styles.nicknameRow}>
            <span className={styles.nicknameLabel}>작성자:</span>
            <span className={styles.nickname}>{comment.nickname}</span>
          </div>

          {/* 댓글 내용 수정 */}
          <div className={styles.content}>
            <textarea
              className={styles.textarea}
              placeholder="댓글을 입력하세요 (최대 200자)"
              value={content}
              onChange={handleContentChange}
              maxLength={COMMENT_MAX_LENGTH}
              rows={5}
              disabled={isPending}
              autoFocus
            />
            <div className={styles.counter}>
              {content.length} / {COMMENT_MAX_LENGTH}
            </div>
          </div>

          {/* 수정 버튼 */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.updateButton}
              onClick={handleUpdate}
              disabled={isPending || !isContentChanged || !content.trim()}
            >
              {isPending ? '수정 중...' : '수정'}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

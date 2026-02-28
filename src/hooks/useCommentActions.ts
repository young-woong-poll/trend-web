import { useState, useCallback } from 'react';

import { useModal } from '@/contexts/ModalContext';
import { useDeleteComment } from '@/hooks/api';
import type { CommentItem } from '@/types/comment';

interface UseCommentActionsParams {
  slug: string;
  electionId: string;
}

/**
 * 댓글 수정/삭제 상태 관리 및 핸들러를 통합 제공합니다.
 * CommentBottomSheet, InlineCommentSection에서 공통으로 사용됩니다.
 */
export function useCommentActions({ slug, electionId }: UseCommentActionsParams) {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<CommentItem | null>(null);
  const [editToken, setEditToken] = useState('');
  const [actionType, setActionType] = useState<'edit' | 'delete'>('edit');

  const { showToast, showConfirm } = useModal();
  const { mutate: deleteComment } = useDeleteComment();

  const handleEditRequest = useCallback((comment: CommentItem) => {
    setSelectedComment(comment);
    setActionType('edit');
    setIsPasswordModalOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((comment: CommentItem) => {
    setSelectedComment(comment);
    setActionType('delete');
    setIsPasswordModalOpen(true);
  }, []);

  const resetState = useCallback(() => {
    setSelectedComment(null);
    setEditToken('');
  }, []);

  const handlePasswordVerified = useCallback(
    (token: string) => {
      setEditToken(token);
      setIsPasswordModalOpen(false);

      if (actionType === 'edit') {
        setIsEditModalOpen(true);
        return;
      }

      if (actionType === 'delete') {
        showConfirm('댓글 삭제', {
          message: '정말로 이 댓글을 삭제하시겠습니까?',
          confirmText: '삭제',
          cancelText: '취소',
          onConfirm: () => {
            if (!selectedComment) {
              return;
            }
            deleteComment(
              {
                commentId: selectedComment.id ?? '',
                slug,
                electionId,
                data: { verifyToken: token },
              },
              {
                onSuccess: () => {
                  showToast('댓글이 삭제되었습니다');
                  resetState();
                },
                onError: () => showToast('댓글 삭제에 실패했습니다'),
              }
            );
          },
          onCancel: resetState,
        });
      }
    },
    [
      actionType,
      selectedComment,
      slug,
      electionId,
      deleteComment,
      showConfirm,
      showToast,
      resetState,
    ]
  );

  const handlePasswordModalClose = useCallback(() => {
    setIsPasswordModalOpen(false);
    setSelectedComment(null);
    setActionType('edit');
  }, []);

  const handleEditModalClose = useCallback(() => {
    setIsEditModalOpen(false);
    resetState();
  }, [resetState]);

  return {
    selectedComment,
    editToken,
    isPasswordModalOpen,
    isEditModalOpen,
    handleEditRequest,
    handleDeleteRequest,
    handlePasswordVerified,
    handlePasswordModalClose,
    handleEditModalClose,
  };
}

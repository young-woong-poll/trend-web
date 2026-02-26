'use client';

import { useState } from 'react';

import { Button } from '@/components/common/Button/Button';
import styles from '@/components/features/Admin/AdminCategoryList/AdminCategoryList.module.scss';
import { useModal } from '@/contexts/ModalContext';
import type { AdminCategoryResponse } from '@/generated/models';
import {
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/api/useAdmin';
import { useConfirm } from '@/hooks/useConfirm';

export default function AdminCategoryList() {
  const { data: categories, isLoading } = useAdminCategories();
  const { mutateAsync: createCat, isPending: isCreating } = useCreateCategory();
  const { mutateAsync: updateCat, isPending: isUpdating } = useUpdateCategory();
  const { mutate: deleteCat } = useDeleteCategory();
  const { showAlert } = useModal();
  const { showConfirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  // 인라인 추가
  const [isAddMode, setIsAddMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');

  // 인라인 수정
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');

  // ── 추가 핸들러 ──

  const handleStartAdd = () => {
    setIsAddMode(true);
    setNewName('');
    setNewSlug('');
    // 수정 모드 해제
    setEditingId(null);
  };

  const handleCancelAdd = () => {
    setIsAddMode(false);
    setNewName('');
    setNewSlug('');
  };

  const handleCreate = async () => {
    const trimmedName = newName.trim();
    const trimmedSlug = newSlug.trim();

    if (!trimmedName || !trimmedSlug) {
      showAlert('이름과 Slug를 모두 입력해주세요.');
      return;
    }

    try {
      await createCat({ name: trimmedName, slug: trimmedSlug });
      setIsAddMode(false);
      setNewName('');
      setNewSlug('');
    } catch (error) {
      const msg = error instanceof Error ? error.message : '알 수 없는 오류';
      showAlert(`카테고리 생성 실패: ${msg}`);
    }
  };

  // ── 수정 핸들러 ──

  const handleStartEdit = (cat: AdminCategoryResponse) => {
    setEditingId(cat.id ?? null);
    setEditName(cat.name ?? '');
    setEditSlug(cat.slug ?? '');
    // 추가 모드 해제
    setIsAddMode(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditSlug('');
  };

  const handleUpdate = async () => {
    if (editingId === null) {
      return;
    }

    const trimmedName = editName.trim();
    const trimmedSlug = editSlug.trim();

    if (!trimmedName || !trimmedSlug) {
      showAlert('이름과 Slug를 모두 입력해주세요.');
      return;
    }

    try {
      await updateCat({ categoryId: editingId, data: { name: trimmedName, slug: trimmedSlug } });
      setEditingId(null);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '알 수 없는 오류';
      showAlert(`카테고리 수정 실패: ${msg}`);
    }
  };

  // ── 삭제 핸들러 ──

  const handleDelete = (cat: AdminCategoryResponse) => {
    showConfirm('카테고리 삭제', {
      message: `"${cat.name}" 카테고리를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      confirmText: '삭제',
      cancelText: '취소',
      onConfirm: () => {
        if (cat.id !== undefined) {
          deleteCat(cat.id);
        }
      },
    });
  };

  // ── 렌더링 ──

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
        <h1>카테고리 관리</h1>
        {!isAddMode && (
          <Button variant="outline" onClick={handleStartAdd}>
            + 카테고리 추가
          </Button>
        )}
      </header>

      {/* 테이블 */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>이름</th>
              <th>Slug</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {/* 인라인 추가 행 */}
            {isAddMode && (
              <tr className={styles.addRow}>
                <td>—</td>
                <td>
                  <input
                    type="text"
                    className={styles.input}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="카테고리 이름"
                    autoFocus
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className={styles.input}
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                    placeholder="SLUG"
                  />
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.saveButton}
                      onClick={handleCreate}
                      disabled={isCreating || !newName.trim() || !newSlug.trim()}
                    >
                      {isCreating ? '저장 중...' : '저장'}
                    </button>
                    <button type="button" className={styles.cancelButton} onClick={handleCancelAdd}>
                      취소
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* 카테고리 목록 */}
            {(categories ?? []).map((cat) => {
              const isEditing = editingId === cat.id;

              return (
                <tr key={cat.id}>
                  <td>{cat.id}</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className={styles.input}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      cat.name
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className={styles.input}
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                      />
                    ) : (
                      cat.slug
                    )}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            className={styles.saveButton}
                            onClick={handleUpdate}
                            disabled={isUpdating || !editName.trim() || !editSlug.trim()}
                          >
                            {isUpdating ? '저장 중...' : '저장'}
                          </button>
                          <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={handleCancelEdit}
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={styles.editButton}
                            onClick={() => handleStartEdit(cat)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={() => handleDelete(cat)}
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* 빈 상태 */}
            {!isAddMode && (!categories || categories.length === 0) && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>
                  등록된 카테고리가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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

'use client';

import { useEffect, useRef, useState, type FC } from 'react';

import MoreVerticalIcon from '@/assets/icon/MoreVerticalIcon';
import styles from '@/components/features/Hotpick/CommentModal/CommentMenu.module.scss';

interface CommentMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

export const CommentMenu: FC<CommentMenuProps> = ({ onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleEdit = () => {
    setOpen(false);
    onEdit();
  };

  const handleDelete = () => {
    setOpen(false);
    onDelete();
  };

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="댓글 메뉴"
        aria-expanded={open}
      >
        <MoreVerticalIcon className={styles.triggerIcon} />
      </button>
      {open && (
        <div role="menu" className={styles.menu}>
          <button type="button" role="menuitem" className={styles.item} onClick={handleEdit}>
            수정
          </button>
          <button type="button" role="menuitem" className={styles.item} onClick={handleDelete}>
            삭제
          </button>
        </div>
      )}
    </div>
  );
};

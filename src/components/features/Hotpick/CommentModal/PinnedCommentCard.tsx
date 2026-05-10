'use client';

import { type FC } from 'react';

import styles from '@/components/features/Hotpick/CommentModal/PinnedCommentCard.module.scss';
import type { CommentItem } from '@/generated/models';

interface PinnedCommentCardProps {
  comment: CommentItem | null | undefined;
  parent?: CommentItem | null | undefined;
  /** "리스트에서 보기" 클릭 — 부모 페이지가 highlight + auto-scroll 처리. */
  onJump: (commentId: string) => void;
  /** 해당 댓글이 다른 election에 속해 보이지 않을 때 등 caller 측에서 별도 안내 문구를 줄 수도 있음. */
  emptyMessage?: string;
}

const truncate = (text: string | undefined, max = 80): string => {
  if (!text) {
    return '';
  }
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max)}…`;
};

export const PinnedCommentCard: FC<PinnedCommentCardProps> = ({
  comment,
  parent,
  onJump,
  emptyMessage = '이 댓글은 더 이상 볼 수 없어요',
}) => {
  // 댓글이 없거나 삭제되어 BE가 빈 응답을 준 경우 안내 메시지로 대체.
  if (!comment || !comment.id) {
    return (
      <div className={styles.empty} role="status">
        <span className={styles.emptyLabel}>알림</span>
        <p className={styles.emptyText}>{emptyMessage}</p>
      </div>
    );
  }

  const heading = parent ? `${parent.nickname ?? '익명'}님의 댓글에 답글` : '알림에서 진입한 댓글';

  const body = comment.content ?? '';
  const author = comment.nickname ?? '익명';

  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => onJump(comment.id ?? '')}
      aria-label={`${heading} — ${truncate(body, 40)}. 리스트에서 보기`}
    >
      <span className={styles.label}>{heading}</span>
      {parent?.content && (
        <p className={styles.parentPreview}>
          <span className={styles.parentMark} aria-hidden>
            ↳
          </span>
          {truncate(parent.content, 60)}
        </p>
      )}
      <p className={styles.body}>
        <span className={styles.author}>{author}</span>
        <span className={styles.dot} aria-hidden>
          ·
        </span>
        <span className={styles.content}>{truncate(body, 100)}</span>
      </p>
      <span className={styles.cta}>리스트에서 보기 →</span>
    </button>
  );
};

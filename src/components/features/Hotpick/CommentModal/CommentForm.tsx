'use client';

import type { FC } from 'react';

import DiceIcon from '@/assets/icon/DiceIcon';
import styles from '@/components/features/Hotpick/CommentModal/CommentForm.module.scss';
import { useCommentForm, COMMENT_FORM_LIMITS } from '@/hooks/useCommentForm';

interface CommentFormProps {
  slug: string;
  electionId: string;
  onSuccess: () => void;
}

export const CommentForm: FC<CommentFormProps> = ({ slug, electionId, onSuccess }) => {
  const {
    isLoggedIn,
    nickname,
    password,
    content,
    errors,
    isPending,
    handleGenerateNickname,
    handleNicknameChange,
    handleNicknameBlur,
    handlePasswordChange,
    handleContentChange,
    handleSubmit,
  } = useCommentForm({ slug, electionId, onSuccess });

  return (
    <div className={styles.commentForm}>
      {/* 댓글 입력 */}
      <div className={styles.textareaWrapper}>
        <textarea
          className={`${styles.textarea} ${errors.content ? styles.error : ''}`}
          placeholder="댓글을 입력하세요..."
          value={content}
          onChange={handleContentChange}
          maxLength={COMMENT_FORM_LIMITS.COMMENT_MAX_LENGTH}
          rows={2}
          disabled={isPending}
        />
        <span className={styles.charCount}>
          {content.length}/{COMMENT_FORM_LIMITS.COMMENT_MAX_LENGTH}
        </span>
      </div>

      {/* 닉네임 + 비밀번호 + 게시 */}
      <div className={styles.bottomRow}>
        {!isLoggedIn && (
          <>
            <div className={`${styles.nicknameWrapper} ${errors.nickname ? styles.error : ''}`}>
              <input
                type="text"
                className={`${styles.input} ${styles.nicknameInput}`}
                placeholder="닉네임"
                value={nickname}
                onChange={handleNicknameChange}
                onBlur={handleNicknameBlur}
                maxLength={COMMENT_FORM_LIMITS.NICKNAME_MAX_LENGTH}
                disabled={isPending}
              />
              <button
                type="button"
                className={styles.generateButton}
                onClick={handleGenerateNickname}
                disabled={isPending}
                aria-label="닉네임 자동생성"
              >
                <DiceIcon className={styles.generateIcon} />
                <span className={styles.generateLabel}>랜덤</span>
              </button>
            </div>
            <input
              type="password"
              className={`${styles.input} ${styles.passwordInput} ${errors.password ? styles.error : ''}`}
              placeholder="비밀번호"
              value={password}
              onChange={handlePasswordChange}
              maxLength={COMMENT_FORM_LIMITS.PASSWORD_MAX_LENGTH}
              disabled={isPending}
              autoComplete="new-password"
              data-1p-ignore
              data-lpignore="true"
            />
          </>
        )}
        <button
          type="button"
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={isPending}
          aria-label="댓글 게시"
        >
          게시
        </button>
      </div>
    </div>
  );
};

'use client';

import { useRef, useState, type FC } from 'react';

import DiceIcon from '@/assets/icon/DiceIcon';
import styles from '@/components/features/Hotpick/SingleDetailView/InlineCommentForm.module.scss';
import { useCommentForm, COMMENT_FORM_LIMITS } from '@/hooks/useCommentForm';

interface InlineCommentFormProps {
  slug: string;
  electionId: string;
  onSuccess: () => void;
}

export const InlineCommentForm: FC<InlineCommentFormProps> = ({ slug, electionId, onSuccess }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    nickname,
    password,
    content,
    errors,
    isPending,
    handleGenerateNickname,
    handleNicknameChange,
    handleNicknameBlur,
    handlePasswordChange,
    handleContentChange: baseHandleContentChange,
    handleSubmit,
    resetForm,
  } = useCommentForm({
    slug,
    electionId,
    onSuccess: () => {
      setIsExpanded(false);
      onSuccess();
    },
  });

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleCancel = () => {
    setIsExpanded(false);
    resetForm();
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    baseHandleContentChange(e);

    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const hasContent = content.trim().length > 0;

  return (
    <div className={styles.formWrapper}>
      <textarea
        ref={textareaRef}
        className={`${styles.commentInput} ${isExpanded ? styles.expanded : ''} ${errors.content ? styles.error : ''}`}
        placeholder="댓글 추가..."
        value={content}
        onChange={handleContentChange}
        onFocus={handleFocus}
        maxLength={COMMENT_FORM_LIMITS.COMMENT_MAX_LENGTH}
        rows={1}
        disabled={isPending}
      />

      {isExpanded && (
        <div className={styles.expandedArea}>
          <div className={styles.metaInputs}>
            <div className={`${styles.nicknameWrapper} ${errors.nickname ? styles.error : ''}`}>
              <input
                type="text"
                className={`${styles.metaInput} ${styles.nicknameInput}`}
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
              className={`${styles.metaInput} ${styles.passwordInput} ${errors.password ? styles.error : ''}`}
              placeholder="비밀번호"
              value={password}
              onChange={handlePasswordChange}
              maxLength={COMMENT_FORM_LIMITS.PASSWORD_MAX_LENGTH}
              disabled={isPending}
              autoComplete="new-password"
              data-1p-ignore
              data-lpignore="true"
            />
          </div>
          <div className={styles.formActions}>
            <span className={styles.charCount}>
              {content.length}/{COMMENT_FORM_LIMITS.COMMENT_MAX_LENGTH}
            </span>
            <div className={styles.actionButtons}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancel}
                disabled={isPending}
              >
                취소
              </button>
              <button
                type="button"
                className={`${styles.submitButton} ${hasContent ? styles.active : ''}`}
                onClick={handleSubmit}
                disabled={isPending || !hasContent}
              >
                {isPending ? '게시 중...' : '댓글'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

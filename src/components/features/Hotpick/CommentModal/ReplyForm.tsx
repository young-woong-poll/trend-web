'use client';

import { useState, type FC } from 'react';

import styles from '@/components/features/Hotpick/CommentModal/ReplyForm.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { useCreateReply } from '@/hooks/api';
import { COMMENT_FORM_LIMITS } from '@/hooks/useCommentForm';

interface ReplyFormProps {
  commentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ReplyForm: FC<ReplyFormProps> = ({ commentId, onSuccess, onCancel }) => {
  const { isLoggedIn } = useAuth();
  const { showToast } = useModal();
  const [content, setContent] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ content: false, nickname: false, password: false });

  const { mutate: createReply, isPending } = useCreateReply();

  const handleSubmit = () => {
    const nextErrors = {
      content: content.trim().length === 0,
      nickname: !isLoggedIn && nickname.trim().length === 0,
      password: !isLoggedIn && password.trim().length < COMMENT_FORM_LIMITS.PASSWORD_MIN_LENGTH,
    };
    setErrors(nextErrors);
    if (nextErrors.content || nextErrors.nickname || nextErrors.password) {
      return;
    }

    createReply(
      {
        commentId,
        content: content.trim(),
        nickname: isLoggedIn ? undefined : nickname.trim(),
        password: isLoggedIn ? undefined : password.trim(),
        isLoggedIn,
      },
      {
        onSuccess: () => {
          setContent('');
          setNickname('');
          setPassword('');
          onSuccess();
        },
        onError: () => showToast('답글 작성에 실패했습니다'),
      }
    );
  };

  return (
    <div className={styles.replyForm}>
      <div className={styles.textareaWrapper}>
        <textarea
          className={`${styles.textarea} ${errors.content ? styles.error : ''}`}
          placeholder="답글을 입력하세요..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={COMMENT_FORM_LIMITS.COMMENT_MAX_LENGTH}
          rows={2}
          disabled={isPending}
        />
        <span className={styles.charCount}>
          {content.length}/{COMMENT_FORM_LIMITS.COMMENT_MAX_LENGTH}
        </span>
      </div>

      <div className={styles.bottomRow}>
        {!isLoggedIn && (
          <>
            <input
              type="text"
              className={`${styles.input} ${styles.nicknameInput} ${errors.nickname ? styles.error : ''}`}
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={COMMENT_FORM_LIMITS.NICKNAME_MAX_LENGTH}
              disabled={isPending}
            />
            <input
              type="password"
              className={`${styles.input} ${styles.passwordInput} ${errors.password ? styles.error : ''}`}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          className={styles.cancelButton}
          onClick={onCancel}
          disabled={isPending}
        >
          취소
        </button>
        <button
          type="button"
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={isPending}
        >
          답글
        </button>
      </div>
    </div>
  );
};

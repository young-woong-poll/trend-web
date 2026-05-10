'use client';

import { useEffect, useRef, useState, type FC } from 'react';

import styles from '@/components/features/Hotpick/CommentModal/ReplyForm.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { useCreateReply } from '@/hooks/api';
import { COMMENT_FORM_LIMITS } from '@/hooks/useCommentForm';
import { sanitizeComment, validateNickname } from '@/lib/utils';

interface ReplyFormProps {
  commentId: string;
  onSuccess: () => void;
  // 취소 버튼 — 로그인 사용자에게만 노출. 미지정이면 취소 버튼 숨김.
  onCancel?: () => void;
  // mount 직후 textarea 자동 focus — 답글 클릭 → 즉시 작성 흐름.
  autoFocus?: boolean;
}

interface ReplyFormErrors {
  content?: boolean;
  nickname?: boolean;
  password?: boolean;
}

export const ReplyForm: FC<ReplyFormProps> = ({
  commentId,
  onSuccess,
  onCancel,
  autoFocus = false,
}) => {
  const { isLoggedIn } = useAuth();
  const { showToast } = useModal();
  const [content, setContent] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 마운트 시점에 자동 focus — 답글 버튼 클릭 → 즉시 입력 가능.
  // commentId가 바뀌면(다른 답글로 전환) 다시 focus.
  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus, commentId]);
  const [errors, setErrors] = useState<ReplyFormErrors>({});

  const { mutate: createReply, isPending } = useCreateReply();

  const handleSubmit = () => {
    const trimmedContent = sanitizeComment(content);

    if (!trimmedContent) {
      setErrors({ content: true });
      showToast('답글 내용을 입력해주세요');
      return;
    }

    let trimmedNickname: string | undefined;
    let trimmedPassword: string | undefined;

    if (!isLoggedIn) {
      trimmedNickname = nickname.trim();
      trimmedPassword = password.trim();

      const nicknameValidation = validateNickname(trimmedNickname);
      if (!nicknameValidation.isValid) {
        setErrors({ nickname: true });
        showToast(nicknameValidation.error || '닉네임을 입력해주세요');
        return;
      }

      if (!trimmedPassword) {
        setErrors({ password: true });
        showToast('비밀번호를 입력해주세요');
        return;
      }

      if (trimmedPassword.length < COMMENT_FORM_LIMITS.PASSWORD_MIN_LENGTH) {
        setErrors({ password: true });
        showToast(
          `비밀번호는 최소 ${COMMENT_FORM_LIMITS.PASSWORD_MIN_LENGTH}자리 이상이어야 합니다`
        );
        return;
      }
    }

    createReply(
      {
        commentId,
        content: trimmedContent,
        nickname: isLoggedIn ? undefined : trimmedNickname,
        password: isLoggedIn ? undefined : trimmedPassword,
        isLoggedIn,
      },
      {
        onSuccess: () => {
          setContent('');
          setNickname('');
          setPassword('');
          setErrors({});
          onSuccess();
        },
        onError: (error) => {
          showToast('답글 작성에 실패했습니다');
          console.error('Failed to create reply:', error);
        },
      }
    );
  };

  return (
    <div className={styles.replyForm}>
      <div className={styles.textareaWrapper}>
        <textarea
          ref={textareaRef}
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
        {isLoggedIn && onCancel && (
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={isPending}
            aria-label="답글 취소"
          >
            취소
          </button>
        )}
        <button
          type="button"
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={isPending}
          aria-label="답글 작성"
        >
          답글
        </button>
      </div>
    </div>
  );
};

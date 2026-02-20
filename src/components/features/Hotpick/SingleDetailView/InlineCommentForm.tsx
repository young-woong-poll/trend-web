'use client';

import { useRef, useState, type FC } from 'react';

import styles from '@/components/features/Hotpick/SingleDetailView/InlineCommentForm.module.scss';
import { useModal } from '@/contexts/ModalContext';
import type { CreateCommentRequest } from '@/generated/models';
import { useCreateComment } from '@/hooks/api/useComment';
import { isValidNicknameCharacters, NICKNAME_MAX_LENGTH, validateNickname } from '@/lib/utils';

interface InlineCommentFormProps {
  hotpickId: string;
  electionId: string;
  onSuccess: () => void;
}

const COMMENT_MAX_LENGTH = 200;
const PASSWORD_MIN_LENGTH = 4;
const PASSWORD_MAX_LENGTH = 15;

export const InlineCommentForm: FC<InlineCommentFormProps> = ({
  hotpickId,
  electionId,
  onSuccess,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<{
    nickname?: boolean;
    password?: boolean;
    content?: boolean;
  }>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useModal();
  const { mutate: createComment, isPending } = useCreateComment();

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setNickname('');
    setPassword('');
    setContent('');
    setErrors({});
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value.length > NICKNAME_MAX_LENGTH) {
      value = value.slice(0, NICKNAME_MAX_LENGTH);
    }
    if (value && !isValidNicknameCharacters(value)) {
      return;
    }
    setNickname(value);
    setErrors((prev) => ({ ...prev, nickname: false }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value.length > PASSWORD_MAX_LENGTH) {
      value = value.slice(0, PASSWORD_MAX_LENGTH);
    }
    setPassword(value);
    setErrors((prev) => ({ ...prev, password: false }));
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;
    if (value.length > COMMENT_MAX_LENGTH) {
      value = value.slice(0, COMMENT_MAX_LENGTH);
    }
    setContent(value);
    setErrors((prev) => ({ ...prev, content: false }));

    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const handleSubmit = () => {
    const trimmedNickname = nickname.trim();
    const trimmedPassword = password.trim();
    const trimmedContent = content.trim();

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

    if (trimmedPassword.length < PASSWORD_MIN_LENGTH) {
      setErrors({ password: true });
      showToast(`비밀번호는 최소 ${PASSWORD_MIN_LENGTH}자리 이상이어야 합니다`);
      return;
    }

    if (!trimmedContent) {
      setErrors({ content: true });
      showToast('댓글 내용을 입력해주세요');
      return;
    }

    const requestData: CreateCommentRequest = {
      trendId: Number(hotpickId),
      itemId: electionId,
      nickname: trimmedNickname,
      password: trimmedPassword,
      content: trimmedContent,
    };

    createComment(requestData, {
      onSuccess: () => {
        handleCancel();
        onSuccess();
      },
      onError: (error) => {
        showToast('댓글 작성에 실패했습니다');
        console.error('Failed to create comment:', error);
      },
    });
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
        maxLength={COMMENT_MAX_LENGTH}
        rows={1}
        disabled={isPending}
      />

      {isExpanded && (
        <div className={styles.expandedArea}>
          <div className={styles.metaInputs}>
            <input
              type="text"
              className={`${styles.metaInput} ${errors.nickname ? styles.error : ''}`}
              placeholder="닉네임"
              value={nickname}
              onChange={handleNicknameChange}
              onBlur={() => setNickname(nickname.trim())}
              maxLength={NICKNAME_MAX_LENGTH}
              disabled={isPending}
            />
            <input
              type="password"
              className={`${styles.metaInput} ${errors.password ? styles.error : ''}`}
              placeholder="비밀번호"
              value={password}
              onChange={handlePasswordChange}
              maxLength={PASSWORD_MAX_LENGTH}
              disabled={isPending}
              autoComplete="new-password"
              data-1p-ignore
              data-lpignore="true"
            />
          </div>
          <div className={styles.formActions}>
            <span className={styles.charCount}>
              {content.length}/{COMMENT_MAX_LENGTH}
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

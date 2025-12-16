'use client';

import { useState, type FC } from 'react';

import styles from '@/components/features/Vote/CommentModal/CommentForm.module.scss';
import { useModal } from '@/contexts/ModalContext';
import { useCreateComment } from '@/hooks/api/useComment';
import { validateNickname, isValidNicknameCharacters, NICKNAME_MAX_LENGTH } from '@/lib/utils';
import type { CreateCommentRequest } from '@/types/comment';

interface CommentFormProps {
  trendId: string;
  itemId: string;
  onSuccess: () => void;
}

const COMMENT_MAX_LENGTH = 200;
const PASSWORD_MIN_LENGTH = 4;
const PASSWORD_MAX_LENGTH = 15;

export const CommentForm: FC<CommentFormProps> = ({ trendId, itemId, onSuccess }) => {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<{
    nickname?: boolean;
    password?: boolean;
    content?: boolean;
  }>({});

  const { showToast } = useModal();
  const { mutate: createComment, isPending } = useCreateComment();

  // 닉네임 변경 핸들러
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // 최대 길이 제한
    if (value.length > NICKNAME_MAX_LENGTH) {
      value = value.slice(0, NICKNAME_MAX_LENGTH);
    }

    // 문자 유효성 검사
    if (value && !isValidNicknameCharacters(value)) {
      return;
    }

    setNickname(value);
    setErrors((prev) => ({ ...prev, nickname: false }));
  };

  // 비밀번호 변경 핸들러
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // 최대 길이 제한
    if (value.length > PASSWORD_MAX_LENGTH) {
      value = value.slice(0, PASSWORD_MAX_LENGTH);
    }

    setPassword(value);
    setErrors((prev) => ({ ...prev, password: false }));
  };

  // 댓글 내용 변경 핸들러
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;

    // 최대 길이 제한
    if (value.length > COMMENT_MAX_LENGTH) {
      value = value.slice(0, COMMENT_MAX_LENGTH);
    }

    setContent(value);
    setErrors((prev) => ({ ...prev, content: false }));
  };

  // 게시 버튼 클릭 핸들러
  const handleSubmit = () => {
    // 유효성 검증
    const trimmedNickname = nickname.trim();
    const trimmedPassword = password.trim();
    const trimmedContent = content.trim();

    // 닉네임 검증
    const nicknameValidation = validateNickname(trimmedNickname);
    if (!nicknameValidation.isValid) {
      setErrors({ nickname: true });
      showToast(nicknameValidation.error || '닉네임을 입력해주세요');
      return;
    }

    // 비밀번호 검증
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

    // 댓글 내용 검증
    if (!trimmedContent) {
      setErrors({ content: true });
      showToast('댓글 내용을 입력해주세요');
      return;
    }

    // 댓글 작성 API 호출
    const requestData: CreateCommentRequest = {
      trendId,
      itemId,
      nickname: trimmedNickname,
      password: trimmedPassword,
      content: trimmedContent,
    };

    createComment(requestData, {
      onSuccess: () => {
        // 폼 초기화
        setNickname('');
        setPassword('');
        setContent('');
        setErrors({});

        // 성공 토스트
        showToast('댓글이 작성되었습니다');

        // 부모 컴포넌트에 성공 알림
        onSuccess();
      },
      onError: (error) => {
        showToast('댓글 작성에 실패했습니다');
        console.error('Failed to create comment:', error);
      },
    });
  };

  return (
    <div className={styles.commentForm}>
      {/* 닉네임 & 비밀번호 입력 */}
      <div className={styles.inputRow}>
        <input
          type="text"
          className={`${styles.input} ${styles.nicknameInput} ${errors.nickname ? styles.error : ''}`}
          placeholder="닉네임"
          value={nickname}
          onChange={handleNicknameChange}
          onBlur={() => setNickname(nickname.trim())}
          maxLength={NICKNAME_MAX_LENGTH}
          disabled={isPending}
        />
        <input
          type="password"
          className={`${styles.input} ${styles.passwordInput} ${errors.password ? styles.error : ''}`}
          placeholder="비밀번호"
          value={password}
          onChange={handlePasswordChange}
          maxLength={PASSWORD_MAX_LENGTH}
          disabled={isPending}
        />
      </div>

      {/* 댓글 내용 & 게시 버튼 */}
      <div className={styles.contentRow}>
        <textarea
          className={`${styles.textarea} ${errors.content ? styles.error : ''}`}
          placeholder="댓글을 입력하세요 (최대 200자)"
          value={content}
          onChange={handleContentChange}
          maxLength={COMMENT_MAX_LENGTH}
          rows={3}
          disabled={isPending}
        />
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

      {/* 글자 수 카운터 */}
      <div className={styles.counter}>
        {content.length} / {COMMENT_MAX_LENGTH}
      </div>
    </div>
  );
};

'use client';

import { useState, useCallback } from 'react';

import { useModal } from '@/contexts/ModalContext';
import { useCreateComment } from '@/hooks/api/useComment';
import {
  validateNickname,
  isValidNicknameCharacters,
  NICKNAME_MAX_LENGTH,
  sanitizeComment,
} from '@/lib/utils';

const COMMENT_MAX_LENGTH = 200;
const PASSWORD_MIN_LENGTH = 4;
const PASSWORD_MAX_LENGTH = 15;

interface UseCommentFormParams {
  slug: string;
  electionId: string;
  onSuccess: () => void;
}

interface CommentFormErrors {
  nickname?: boolean;
  password?: boolean;
  content?: boolean;
}

export const COMMENT_FORM_LIMITS = {
  COMMENT_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  NICKNAME_MAX_LENGTH,
} as const;

export function useCommentForm({ slug, electionId, onSuccess }: UseCommentFormParams) {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<CommentFormErrors>({});

  const { showToast } = useModal();
  const { mutate: createComment, isPending } = useCreateComment();

  const resetForm = useCallback(() => {
    setNickname('');
    setPassword('');
    setContent('');
    setErrors({});
  }, []);

  const handleNicknameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value.length > NICKNAME_MAX_LENGTH) {
      value = value.slice(0, NICKNAME_MAX_LENGTH);
    }
    if (value && !isValidNicknameCharacters(value)) {
      return;
    }
    setNickname(value);
    setErrors((prev) => ({ ...prev, nickname: false }));
  }, []);

  const handleNicknameBlur = useCallback(() => {
    setNickname((prev) => prev.trim());
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value.length > PASSWORD_MAX_LENGTH) {
      value = value.slice(0, PASSWORD_MAX_LENGTH);
    }
    setPassword(value);
    setErrors((prev) => ({ ...prev, password: false }));
  }, []);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;
    if (value.length > COMMENT_MAX_LENGTH) {
      value = value.slice(0, COMMENT_MAX_LENGTH);
    }
    setContent(value);
    setErrors((prev) => ({ ...prev, content: false }));
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmedNickname = nickname.trim();
    const trimmedPassword = password.trim();
    const trimmedContent = sanitizeComment(content);

    if (!trimmedContent) {
      setErrors({ content: true });
      showToast('댓글 내용을 입력해주세요');
      return;
    }

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

    createComment(
      {
        slug,
        electionId,
        nickname: trimmedNickname,
        password: trimmedPassword,
        content: trimmedContent,
      },
      {
        onSuccess: () => {
          resetForm();
          onSuccess();
        },
        onError: (error) => {
          showToast('댓글 작성에 실패했습니다');
          console.error('Failed to create comment:', error);
        },
      }
    );
  }, [
    nickname,
    password,
    content,
    slug,
    electionId,
    showToast,
    createComment,
    resetForm,
    onSuccess,
  ]);

  return {
    nickname,
    password,
    content,
    errors,
    isPending,
    handleNicknameChange,
    handleNicknameBlur,
    handlePasswordChange,
    handleContentChange,
    handleSubmit,
    resetForm,
  };
}

'use client';

import { useState, type FC } from 'react';

import { Portal } from '@/components/common/Portal/Portal';
import styles from '@/components/features/Vote/CommentModal/CommentPasswordModal.module.scss';
import { useVerifyComment } from '@/hooks/api/useComment';

interface CommentPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  commentId: string;
  onVerified: (editToken: string) => void;
}

const PASSWORD_MIN_LENGTH = 4;
const PASSWORD_MAX_LENGTH = 15;

export const CommentPasswordModal: FC<CommentPasswordModalProps> = ({
  isOpen,
  onClose,
  commentId,
  onVerified,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();

  const { mutate: verifyComment, isPending } = useVerifyComment();

  // 비밀번호 변경 핸들러
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // 최대 길이 제한
    if (value.length > PASSWORD_MAX_LENGTH) {
      value = value.slice(0, PASSWORD_MAX_LENGTH);
    }

    setPassword(value);
    setError(undefined); // 입력 시 에러 초기화
  };

  // 확인 버튼 클릭 핸들러
  const handleConfirm = () => {
    const trimmedPassword = password.trim();

    // 유효성 검증
    if (!trimmedPassword) {
      setError('비밀번호를 입력해주세요');
      return;
    }

    if (trimmedPassword.length < PASSWORD_MIN_LENGTH) {
      setError(`비밀번호는 최소 ${PASSWORD_MIN_LENGTH}자리 이상이어야 합니다`);
      return;
    }

    // 비밀번호 검증 API 호출
    verifyComment(
      { commentId, data: { password: trimmedPassword } },
      {
        onSuccess: (response) => {
          // 검증 성공
          setPassword('');
          setError(undefined);
          onVerified(response.editToken);
        },
        onError: () => {
          // 검증 실패
          setError('잘못된 비밀번호입니다');
        },
      }
    );
  };

  // Dimmed 클릭 핸들러
  const handleDimmedClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
      setPassword('');
      setError(undefined);
    }
  };

  // 닫기 버튼 클릭 핸들러
  const handleClose = () => {
    onClose();
    setPassword('');
    setError(undefined);
  };

  // Enter 키 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isPending) {
      handleConfirm();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Portal>
      <div className={styles.dimmed} onClick={handleDimmedClick}>
        <div className={styles.modal}>
          {/* 헤더 */}
          <div className={styles.header}>
            <h2 className={styles.title}>비밀번호 입력</h2>
            <button
              type="button"
              className={styles.closeButton}
              onClick={handleClose}
              aria-label="닫기"
              disabled={isPending}
            >
              ✕
            </button>
          </div>

          {/* 비밀번호 입력 */}
          <div className={styles.content}>
            <input
              type="password"
              className={`${styles.input} ${error ? styles.error : ''}`}
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={handlePasswordChange}
              onKeyDown={handleKeyDown}
              maxLength={PASSWORD_MAX_LENGTH}
              disabled={isPending}
              autoFocus
            />
            {error && <p className={styles.errorMessage}>{error}</p>}
          </div>

          {/* 확인 버튼 */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.confirmButton}
              onClick={handleConfirm}
              disabled={isPending || !password.trim()}
            >
              {isPending ? '확인 중...' : '확인'}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

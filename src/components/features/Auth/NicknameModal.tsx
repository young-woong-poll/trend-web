'use client';

import { useCallback, useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';

import { Modal } from '@/components/common/Modal/Modal';
import styles from '@/components/features/Auth/NicknameModal.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import {
  checkNicknameAvailability,
  getSuggestedNickname,
  updateNickname,
} from '@/hooks/api/useNickname';

interface NicknameForm {
  nickname: string;
}

interface NicknameModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

const NicknameModal = ({ isOpen, onClose }: NicknameModalProps) => {
  const { setUser, user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<NicknameForm>();

  const nicknameValue = watch('nickname');

  const loadSuggestion = useCallback(async () => {
    try {
      const suggested = await getSuggestedNickname();
      setValue('nickname', suggested);
      clearErrors('nickname');
    } catch {
      // 실패 시 유저가 직접 입력
    }
  }, [setValue, clearErrors]);

  useEffect(() => {
    if (isOpen) {
      void loadSuggestion();
    }
  }, [isOpen, loadSuggestion]);

  const handleBlur = async () => {
    if (!nicknameValue?.trim()) {
      return;
    }
    setIsChecking(true);
    try {
      const available = await checkNicknameAvailability(nicknameValue.trim());
      if (!available) {
        setError('nickname', { message: '중복된 닉네임입니다' });
      } else {
        clearErrors('nickname');
      }
    } catch {
      // 검사 실패 시 submit에서 재확인
    } finally {
      setIsChecking(false);
    }
  };

  const onSubmit = async (data: NicknameForm) => {
    const trimmed = data.nickname.trim();
    if (!trimmed) {
      return;
    }

    setIsSubmitting(true);
    try {
      const available = await checkNicknameAvailability(trimmed);
      if (!available) {
        setError('nickname', { message: '중복된 닉네임입니다' });
        return;
      }
      await updateNickname(trimmed);
      setUser(user ? { ...user, nickname: trimmed } : null);
      onClose?.();
    } catch {
      setError('nickname', { message: '닉네임 설정에 실패했습니다' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnDimmedClick={!!onClose}
      showCloseButton={!!onClose}
      maxWidth={400}
    >
      <form className={styles.container} onSubmit={handleSubmit(onSubmit)}>
        <h2 className={styles.title}>닉네임을 설정해주세요</h2>

        <div className={styles.inputWrapper}>
          <input
            {...register('nickname', { required: '닉네임을 입력해주세요' })}
            className={`${styles.input} ${errors.nickname ? styles.error : ''}`}
            placeholder="닉네임 입력"
            maxLength={20}
            onBlur={handleBlur}
          />
          <button
            type="button"
            className={styles.refreshButton}
            onClick={loadSuggestion}
            aria-label="닉네임 재생성"
          >
            🔄
          </button>
        </div>

        <p className={styles.errorText}>{errors.nickname?.message ?? ''}</p>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting || isChecking || !nicknameValue?.trim()}
        >
          {isSubmitting ? '설정 중...' : '시작하기'}
        </button>
      </form>
    </Modal>
  );
};

export default NicknameModal;

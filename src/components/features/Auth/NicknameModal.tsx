'use client';

import { useEffect, useState } from 'react';

import { type AxiosError } from 'axios';
import { useForm } from 'react-hook-form';

import { Modal } from '@/components/common/Modal/Modal';
import styles from '@/components/features/Auth/NicknameModal.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { updateNickname } from '@/hooks/api/useNickname';
import { validateNickname } from '@/lib/utils';

interface NicknameForm {
  nickname: string;
}

interface NicknameModalProps {
  isOpen: boolean;
  onClose?: () => void;
  mode?: 'signup' | 'edit';
}

const NicknameModal = ({ isOpen, onClose, mode = 'signup' }: NicknameModalProps) => {
  const { setUser, user } = useAuth();
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

  useEffect(() => {
    if (isOpen && mode === 'edit' && user?.nickname) {
      setValue('nickname', user.nickname);
      clearErrors('nickname');
    }
  }, [isOpen, mode, user?.nickname, setValue, clearErrors]);

  const handleBlur = () => {
    if (!nicknameValue?.trim()) {
      return;
    }
    if (mode === 'edit' && nicknameValue.trim() === user?.nickname) {
      clearErrors('nickname');
      return;
    }
    const result = validateNickname(nicknameValue);
    if (!result.isValid) {
      setError('nickname', { message: result.error });
    } else {
      clearErrors('nickname');
    }
  };

  const onSubmit = async (data: NicknameForm) => {
    const trimmed = data.nickname.trim();
    if (!trimmed) {
      return;
    }

    const validation = validateNickname(trimmed);
    if (!validation.isValid) {
      setError('nickname', { message: validation.error });
      return;
    }

    if (mode === 'edit' && trimmed === user?.nickname) {
      onClose?.();
      return;
    }

    setIsSubmitting(true);
    try {
      await updateNickname(trimmed);
      setUser(
        user
          ? { ...user, nickname: trimmed, lastNicknameChangedAt: new Date().toISOString() }
          : null
      );
      onClose?.();
    } catch (err) {
      const axiosError = err as AxiosError<{ data?: { nextAvailableAt?: string } }>;
      const nextAvailableAt = axiosError.response?.data?.data?.nextAvailableAt;

      if (axiosError.response?.status === 400 && nextAvailableAt) {
        const date = new Date(nextAvailableAt).toLocaleDateString('ko-KR', {
          month: 'long',
          day: 'numeric',
        });
        setError('nickname', { message: `닉네임은 ${date}부터 변경할 수 있어요` });
      } else {
        setError('nickname', { message: '닉네임 설정에 실패했습니다' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const title = mode === 'edit' ? '닉네임 변경' : '닉네임을 설정해주세요';
  const submitLabel = mode === 'edit' ? '변경하기' : '시작하기';
  const submittingLabel = mode === 'edit' ? '변경 중...' : '설정 중...';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnDimmedClick={!!onClose}
      showCloseButton={!!onClose}
      maxWidth={400}
    >
      <form className={styles.container} onSubmit={handleSubmit(onSubmit)}>
        <h2 className={styles.title}>{title}</h2>
        {mode === 'edit' && (
          <p className={styles.policyNotice}>* 닉네임은 30일에 1회만 변경할 수 있어요</p>
        )}

        <div className={styles.inputWrapper}>
          <input
            {...register('nickname', { required: '닉네임을 입력해주세요' })}
            className={`${styles.input} ${errors.nickname ? styles.error : ''}`}
            placeholder={mode === 'signup' ? '나를 나타내는 이름을 입력해주세요' : '새 닉네임 입력'}
            maxLength={20}
            onBlur={handleBlur}
          />
        </div>

        <p className={styles.errorText}>{errors.nickname?.message ?? ''}</p>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting || !nicknameValue?.trim()}
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      </form>
    </Modal>
  );
};

export default NicknameModal;

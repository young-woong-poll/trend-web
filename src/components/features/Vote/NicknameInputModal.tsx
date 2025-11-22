'use client';

import { useState } from 'react';

import { Button } from '@/components/common/Button';
import styles from '@/components/features/Vote/NicknameInputModal.module.scss';
import { useModal } from '@/contexts/ModalContext';
import { isValidNicknameCharacters, NICKNAME_MAX_LENGTH, validateNickname } from '@/lib/utils';

export const NicknameInputModal = ({
  onSubmit,
  onSkip,
}: {
  onSubmit: (nickname: string) => Promise<void>;
  onSkip: () => Promise<void>;
}) => {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | undefined>();
  const { hideModal } = useModal();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setError(undefined); // 입력 시 에러 초기화
  };

  const handleBlur = () => {
    setNickname(nickname.trim());
  };

  const handleConfirm = async () => {
    const trimmedNickname = nickname.trim();
    const validationResult = validateNickname(trimmedNickname);

    if (!validationResult.isValid) {
      setError(validationResult.error);
      return;
    }

    hideModal();

    await onSubmit(trimmedNickname);
  };

  const handleCancel = async () => {
    hideModal();

    await onSkip();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>닉네임 입력</h2>
        <p className={styles.description}>
          링크를 보낸 친구에게 보여질 이름을 입력해주세요! <br />
          (최대 10자)
        </p>
      </div>

      <div className={styles.inputWrapper}>
        <input
          type="text"
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          placeholder="닉네임을 입력해주세요"
          value={nickname}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={NICKNAME_MAX_LENGTH}
        />
        {error && <p className={styles.errorMessage}>{error}</p>}
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={handleCancel} fullWidth height={48}>
          나중에 하기
        </Button>
        <Button variant="primary" onClick={handleConfirm} fullWidth height={48}>
          확인
        </Button>
      </div>
    </div>
  );
};

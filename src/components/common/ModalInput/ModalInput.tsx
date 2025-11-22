'use client';

import { type FC, useEffect, useState } from 'react';

import styles from '@/components/common/ModalInput/ModalInput.module.scss';

interface ModalInputProps {
  value?: string;
  placeholder?: string;
  maxLength?: number;
  error?: string;
  type?: 'text' | 'number';
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
  validateCharacters?: (value: string) => boolean;
}

export const ModalInput: FC<ModalInputProps> = ({
  value: externalValue = '',
  placeholder,
  maxLength,
  error,
  type = 'text',
  onChange,
  onBlur,
  validateCharacters,
}) => {
  const [internalValue, setInternalValue] = useState(externalValue);

  useEffect(() => {
    setInternalValue(externalValue);
  }, [externalValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // 최대 길이 제한
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength);
    }

    // 문자 유효성 검사 (실시간) - 잘못된 문자 입력 차단
    if (validateCharacters && !validateCharacters(newValue)) {
      return;
    }

    setInternalValue(newValue);

    // 부모에게 값 전달
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleBlur = () => {
    // Blur 시 trim 처리
    const trimmedValue = internalValue.trim();
    setInternalValue(trimmedValue);

    // 부모에게 trim된 값 전달
    if (onBlur) {
      onBlur(trimmedValue);
    } else if (onChange && trimmedValue !== internalValue) {
      onChange(trimmedValue);
    }
  };

  return (
    <div className={styles.inputWrapper}>
      <input
        type={type}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        placeholder={placeholder}
        value={internalValue}
        onChange={handleChange}
        onBlur={handleBlur}
        maxLength={maxLength}
      />
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
};

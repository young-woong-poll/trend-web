'use client';

import { type FC, useState } from 'react';

import styles from '@/components/features/TetoEgen/LinkGenerateForm.module.scss';
import type { TetoEgenAnswer, TetoEgenPrediction } from '@/types/ask-teto-egen';

const NAME_MAX_LENGTH = 10;

type LinkGenerateFormProps = {
  defaultName: string;
  // 현재 화면에서 표시는 안 하지만 caller(PrimaryFlow)와의 계약 호환성을 위해 유지.
  // 추후 AnswerPairRow 복구 시 다시 사용 예정.
  selfAnswer: TetoEgenAnswer;
  selfPrediction: TetoEgenPrediction;
  onSubmit: (displayName: string) => void;
  isSubmitting?: boolean;
};

const LinkGenerateForm: FC<LinkGenerateFormProps> = ({
  defaultName,
  selfAnswer: _selfAnswer,
  selfPrediction: _selfPrediction,
  onSubmit,
  isSubmitting,
}) => {
  // defaultName이 새 제한을 초과할 경우 잘라서 시작
  const [name, setName] = useState(defaultName.slice(0, NAME_MAX_LENGTH));

  const trimmed = name.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= NAME_MAX_LENGTH;

  return (
    <div className={styles.root}>
      {/* <AnswerPairRow
        left={{ label: '내 선택', value: selfAnswer === 'TETO' ? '테토' : '에겐' }}
        right={{ label: '친구들 예상', value: selfPrediction === 'TETO' ? '테토' : '에겐' }}
      /> */}

      <div className={styles.titleArea}>
        <h2 className={styles.title}>친구들에게 어떤 이름으로 물어볼까요?</h2>
        <p className={styles.helper}>친구들에게 보여지는 이름이에요</p>
      </div>

      <div className={styles.inputWrapper}>
        <input
          className={styles.input}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력해주세요"
          maxLength={NAME_MAX_LENGTH}
          aria-label="친구들에게 보일 이름"
        />
        <span className={styles.counter} aria-live="polite">
          {name.length}/{NAME_MAX_LENGTH}
        </span>
      </div>

      <button
        type="button"
        className={styles.cta}
        onClick={() => onSubmit(trimmed)}
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? '생성 중...' : '링크 생성하기'}
      </button>

      <p className={styles.notice}>링크가 생성되면 변경이 어려워요</p>
    </div>
  );
};

export default LinkGenerateForm;

'use client';

import { type FC, useState } from 'react';

import styles from '@/components/features/TetoEgen/LinkGenerateForm.module.scss';
import SelfPredictionRow from '@/components/features/TetoEgen/SelfPredictionRow';
import type { TetoEgenAnswer, TetoEgenPrediction } from '@/types/ask-teto-egen';

type LinkGenerateFormProps = {
  defaultName: string;
  selfAnswer: TetoEgenAnswer;
  selfPrediction: TetoEgenPrediction;
  onSubmit: (displayName: string) => void;
  isSubmitting?: boolean;
};

const LinkGenerateForm: FC<LinkGenerateFormProps> = ({
  defaultName,
  selfAnswer,
  selfPrediction,
  onSubmit,
  isSubmitting,
}) => {
  const [name, setName] = useState(defaultName);

  const trimmed = name.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= 12;

  return (
    <div className={styles.root}>
      <SelfPredictionRow selfAnswer={selfAnswer} selfPrediction={selfPrediction} />

      <div className={styles.titleArea}>
        <h2 className={styles.title}>친구들에게 한 번 물어볼까요?</h2>
        <p className={styles.helper}>어떤 이름으로 물어볼까요?</p>
      </div>

      <input
        className={styles.input}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="이름을 입력해주세요"
        maxLength={12}
        aria-label="친구들에게 보일 이름"
      />

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

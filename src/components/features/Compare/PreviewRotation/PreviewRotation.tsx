'use client';

import { useState, useEffect, type FC } from 'react';

import styles from '@/components/features/Compare/PreviewRotation/PreviewRotation.module.scss';

const GRADE_COLORS: Record<string, string> = {
  S: '#3B82F6',
  A: '#22C55E',
  B: '#FACC15',
  C: '#F97316',
  D: '#EF4444',
};

const ROTATION_DATA = [
  { name: '지우', grade: 'A', title: '꽤 잘 맞는' },
  { name: '태우', grade: 'S', title: '말 안 해도 통하는' },
  { name: '하은', grade: 'C', title: '각자의 세계' },
  { name: '민준', grade: 'B', title: '같을 때도 다를 때도' },
  { name: '서연', grade: 'D', title: '정반대의 가치관' },
];

interface PreviewRotationProps {
  nickname: string;
  headerText?: string;
  /** true면 카드 배경 없이 내용만 렌더 (부모 카드 안에 중첩될 때) */
  embedded?: boolean;
  /** true면 컴팩트 모드 (등급 작게, feature chips 숨김) */
  compact?: boolean;
}

export const PreviewRotation: FC<PreviewRotationProps> = ({
  nickname,
  headerText = '완료하면 이런 결과를 볼 수 있어요',
  embedded = false,
  compact = false,
}) => {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ROTATION_DATA.length);
        setFading(false);
      }, 300);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const current = ROTATION_DATA[index];

  return (
    <div className={embedded ? styles.previewEmbedded : styles.previewCard}>
      {!compact && <div className={styles.previewHeader}>{headerText}</div>}

      {/* 닉네임 + 등급 로테이션 */}
      <div className={styles.previewNames}>
        <span className={styles.previewMyName}>{nickname}</span>
        <span className={styles.previewVs}>×</span>
        <span className={`${styles.previewTargetName} ${fading ? styles.fadeOut : styles.fadeIn}`}>
          {current.name}
        </span>
      </div>

      <div
        className={`${compact ? styles.previewGradeAreaCompact : styles.previewGradeArea} ${fading ? styles.fadeOut : styles.fadeIn}`}
      >
        <span
          className={compact ? styles.previewGradeLetterCompact : styles.previewGradeLetter}
          style={{ color: GRADE_COLORS[current.grade] }}
        >
          {current.grade}
        </span>
        <span className={styles.previewGradeTitle} style={{ color: GRADE_COLORS[current.grade] }}>
          {current.title}
        </span>
      </div>
    </div>
  );
};

import { type FC } from 'react';

import styles from '@/components/features/TetoEgen/SelfPredictionRow.module.scss';

type SelfPredictionRowProps = {
  selfAnswer: 'TETO' | 'EGEN';
  selfPrediction: 'TETO' | 'EGEN';
};

const labelOf = (a: 'TETO' | 'EGEN') => (a === 'TETO' ? '테토' : '에겐');

const SelfPredictionRow: FC<SelfPredictionRowProps> = ({ selfAnswer, selfPrediction }) => (
  <div className={styles.root}>
    <div className={styles.cell}>
      <span className={styles.label}>내 선택</span>
      <span className={styles.chip}>{labelOf(selfAnswer)}</span>
    </div>
    <div className={styles.divider} aria-hidden />
    <div className={styles.cell}>
      <span className={styles.label}>친구들 예상</span>
      <span className={styles.chip}>{labelOf(selfPrediction)}</span>
    </div>
  </div>
);

export default SelfPredictionRow;

import { type FC } from 'react';

import styles from '@/components/features/TetoEgen/AnswerPairRow.module.scss';

type Cell = {
  label: string;
  value: string;
};

type AnswerPairRowProps = {
  left: Cell;
  right: Cell;
};

// 두 답을 좌우로 비교하는 4-column key/value 카드 (토스 004 패턴).
// my 페이지: "내 선택 / 친구들 예상", friend 페이지: "OOO 본인의 답 / 내 답" 등에 재사용.
const AnswerPairRow: FC<AnswerPairRowProps> = ({ left, right }) => (
  <div className={styles.root}>
    <div className={styles.cell}>
      <span className={styles.label}>{left.label}</span>
      <span className={styles.value}>{left.value}</span>
    </div>
    <div className={styles.divider} aria-hidden />
    <div className={styles.cell}>
      <span className={styles.label}>{right.label}</span>
      <span className={styles.value}>{right.value}</span>
    </div>
  </div>
);

export default AnswerPairRow;

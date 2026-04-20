'use client';

import type { FC } from 'react';

import styles from '@/components/features/Main/ChemParticipationSegment/ChemParticipationSegment.module.scss';

type ParticipationMode = 'all' | 'unparticipated';

interface ChemParticipationSegmentProps {
  selected: ParticipationMode;
  onSelect: (mode: ParticipationMode) => void;
  totalCount: number;
  unparticipatedCount: number;
}

export const ChemParticipationSegment: FC<ChemParticipationSegmentProps> = ({
  selected,
  onSelect,
  totalCount,
  unparticipatedCount,
}) => (
  <div
    className={styles.segment}
    role="tablist"
    aria-label="표시 범위"
    data-testid="chem-participation-segment"
  >
    <button
      type="button"
      role="tab"
      aria-selected={selected === 'all'}
      className={`${styles.tab} ${selected === 'all' ? styles.tabActive : ''}`}
      onClick={() => onSelect('all')}
      data-testid="chem-segment-all"
    >
      <span className={styles.label}>전체</span>
      <span className={styles.count}>{totalCount}</span>
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={selected === 'unparticipated'}
      className={`${styles.tab} ${selected === 'unparticipated' ? styles.tabActive : ''}`}
      onClick={() => onSelect('unparticipated')}
      data-testid="chem-segment-unparticipated"
    >
      <span className={styles.label}>안 해본 것만</span>
      <span className={styles.count}>{unparticipatedCount}</span>
    </button>
  </div>
);

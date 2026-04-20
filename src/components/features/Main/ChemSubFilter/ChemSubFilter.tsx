'use client';

import type { FC } from 'react';

import { ChemParticipationSegment } from '@/components/features/Main/ChemParticipationSegment/ChemParticipationSegment';
import styles from '@/components/features/Main/ChemSubFilter/ChemSubFilter.module.scss';
import { CHEM_SORTS, type ChemSort } from '@/constants/contentTab';

type ParticipationMode = 'all' | 'unparticipated';

interface ChemSubFilterProps {
  selectedSort: ChemSort;
  onSortChange: (sort: ChemSort) => void;
  participationMode: ParticipationMode;
  onParticipationModeChange: (mode: ParticipationMode) => void;
  totalCount: number;
  unparticipatedCount: number;
}

export const ChemSubFilter: FC<ChemSubFilterProps> = ({
  selectedSort,
  onSortChange,
  participationMode,
  onParticipationModeChange,
  totalCount,
  unparticipatedCount,
}) => (
  <div className={styles.container} data-testid="chem-sub-filter">
    <div className={styles.selectRow}>
      <div className={styles.segmentWrapper}>
        <ChemParticipationSegment
          selected={participationMode}
          onSelect={onParticipationModeChange}
          totalCount={totalCount}
          unparticipatedCount={unparticipatedCount}
        />
      </div>

      <select
        className={styles.select}
        value={selectedSort}
        onChange={(e) => onSortChange(e.target.value as ChemSort)}
        aria-label="정렬"
        data-testid="chem-sort-select"
      >
        {CHEM_SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  </div>
);

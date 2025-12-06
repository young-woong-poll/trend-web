import { useState, type FC } from 'react';

import { Button } from '@/components/common/Button';
import { ElectionCard } from '@/components/features/Admin/AdminTrendForm/ElectionCard';
import styles from '@/components/features/Admin/AdminTrendForm/ElectionListSection.module.scss';
import type { TElectionDataset } from '@/hooks/useElectionList';

interface ElectionListSectionProps {
  electionDataset: TElectionDataset;
  isFetchingElection: boolean;
  addElectionId: (id: string) => Promise<void>;
  removeElectionId: (electionId: string) => void;
}

export const ElectionListSection: FC<ElectionListSectionProps> = ({
  electionDataset,
  isFetchingElection,
  addElectionId,
  removeElectionId,
}) => {
  const [electionIdInput, setElectionIdInput] = useState('');

  const handleAdd = async () => {
    if (electionIdInput.trim()) {
      await addElectionId(electionIdInput);
      setElectionIdInput('');
    }
  };

  const { electionIdList, electionDetailMap } = electionDataset;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>연결된 선거 ID</h2>
      <p className={styles.sectionDescription}>각 선거는 정확히 2개의 옵션을 가져야 합니다</p>

      <div className={styles.arrayInput}>
        <input
          type="text"
          value={electionIdInput}
          onChange={(e) => setElectionIdInput(e.target.value)}
          className={styles.input}
          placeholder="선거 ID 입력"
          onKeyPress={async (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              await handleAdd();
            }
          }}
        />
        <Button
          type="button"
          onClick={handleAdd}
          variant="primary"
          height={40}
          disabled={isFetchingElection || !electionIdInput.trim()}
        >
          {isFetchingElection ? '조회 중...' : '추가'}
        </Button>
      </div>

      <div className={styles.electionList}>
        {electionIdList.map((id) => (
          <ElectionCard
            key={id}
            id={id}
            detail={electionDetailMap[id]}
            removeElectionId={removeElectionId}
          />
        ))}
      </div>
    </section>
  );
};

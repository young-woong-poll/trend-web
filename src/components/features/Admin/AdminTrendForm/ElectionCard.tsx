import type { FC } from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import styles from '@/components/features/Admin/AdminTrendForm/ElectionCard.module.scss';
import type { ElectionDetail } from '@/types/election';

interface ElectionCardProps {
  id: string;
  detail: ElectionDetail;
  handleRemoveClick: (electionId: string) => void;
}

export const ElectionCard: FC<ElectionCardProps> = ({ id, detail, handleRemoveClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.electionCard}>
      <div className={styles.electionHeader}>
        <button type="button" className={styles.dragHandle} {...attributes} {...listeners}>
          ⋮⋮
        </button>
        <span className={styles.electionId}>ID: {id}</span>
        <button type="button" onClick={() => handleRemoveClick(id)} className={styles.removeButton}>
          삭제
        </button>
      </div>

      {typeof detail === 'object' && (
        <div className={styles.electionInfo}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>제목:</span>
            <span className={styles.infoValue}>{detail.title}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>기간:</span>
            <span className={styles.infoValue}>
              {new Date(detail.startTime).toLocaleString('ko-KR')} ~{' '}
              {new Date(detail.endTime).toLocaleString('ko-KR')}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>옵션:</span>
            <span className={styles.infoValue}>
              {detail.options.map((c) => c.title).join(', ')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

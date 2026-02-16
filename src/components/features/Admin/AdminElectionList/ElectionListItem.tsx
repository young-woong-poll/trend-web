'use client';

import { Button } from '@/components/common/Button/Button';
import styles from '@/components/features/Admin/AdminElectionList/ElectionListItem.module.scss';
import type { Election } from '@/types/election';

interface ElectionListItemProps {
  election: Election;
  onEdit: (id: string) => void;
}

export default function ElectionListItem({ election, onEdit }: ElectionListItemProps) {
  return (
    <tr className={styles.row}>
      {/* ID */}
      <td>
        <code className={styles.id}>{election.id}</code>
      </td>

      {/* 제목 */}
      <td>
        <span className={styles.title}>{election.title}</span>
      </td>

      {/* 투표 유형 */}
      <td>
        <span
          className={`${styles.badge} ${election.voteType === 'IMAGE' ? styles.image : styles.text}`}
        >
          {election.voteType}
        </span>
      </td>

      {/* 옵션 수 */}
      <td>
        <span className={styles.optionCount}>{election.options.length}개</span>
      </td>

      {/* 상태 */}
      <td>
        <span
          className={`${styles.badge} ${election.status === 'OPEN' ? styles.open : styles.closed}`}
        >
          {election.status}
        </span>
      </td>

      {/* 연결된 핫픽 */}
      <td>
        <span className={styles.linkedCount}>{election.linkedHotpickCount ?? 0}</span>
      </td>

      {/* 생성일 */}
      <td>
        <span className={styles.date}>
          {new Date(election.createdAt)
            .toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })
            .replace(/\. /g, '.')
            .replace(/\.$/, '')}
        </span>
      </td>

      {/* 액션 */}
      <td>
        <div className={styles.actions}>
          <Button variant="outline" size="small" onClick={() => onEdit(election.id)}>
            수정
          </Button>
        </div>
      </td>
    </tr>
  );
}

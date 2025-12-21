'use client';

import Image from 'next/image';

import { Button } from '@/components/common/Button/Button';
import styles from '@/components/features/Admin/AdminTrendList/TrendListItem.module.scss';
import type { AdminTrendResponse } from '@/types/trend';

interface TrendListItemProps {
  trend: AdminTrendResponse;
  onEdit: (id: number) => void;
}

export default function TrendListItem({ trend, onEdit }: TrendListItemProps) {
  return (
    <tr className={styles.row}>
      {/* 썸네일 */}
      <td>
        <div className={styles.thumbnail}>
          <Image
            src={trend.imageUrl || '/images/default-trend.png'}
            alt={trend.title}
            width={40}
            height={40}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
          />
        </div>
      </td>

      {/* 제목 */}
      <td>
        <span className={styles.title}>{trend.title}</span>
      </td>

      {/* Alias */}
      <td>
        <code className={styles.alias}>@{trend.alias}</code>
      </td>

      {/* 상태 */}
      <td>
        <span className={`${styles.badge} ${trend.visible ? styles.visible : styles.hidden}`}>
          {trend.visible ? '공개' : '비공개'}
        </span>
      </td>

      {/* 생성일 */}
      <td>
        <span className={styles.date}>
          {new Date(trend.createdAt)
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
          <Button variant="primary" size="small" onClick={() => onEdit(trend.id)}>
            수정
          </Button>
        </div>
      </td>
    </tr>
  );
}

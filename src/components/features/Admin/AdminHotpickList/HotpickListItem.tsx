'use client';

import Image from 'next/image';

import { Button } from '@/components/common/Button/Button';
import styles from '@/components/features/Admin/AdminHotpickList/HotpickListItem.module.scss';
import type { AdminHotpickSummaryResponse } from '@/generated/models';

interface HotpickListItemProps {
  hotpick: AdminHotpickSummaryResponse;
  orderNumber: number;
  onEdit: (id: number) => void;
}

export default function HotpickListItem({ hotpick, orderNumber, onEdit }: HotpickListItemProps) {
  return (
    <tr className={styles.row}>
      {/* 순서 */}
      <td>
        <span className={styles.orderNumber}>{orderNumber}</span>
      </td>

      {/* 썸네일 */}
      <td>
        <div className={styles.thumbnailGroup}>
          <div className={styles.thumbnail}>
            {hotpick.election?.imageUrl && (
              <Image
                src={hotpick.election.imageUrl}
                alt={`${hotpick.slug} 이미지`}
                width={40}
                height={40}
                style={{ objectFit: 'cover', borderRadius: '4px' }}
              />
            )}
          </div>
        </div>
      </td>

      {/* 제목 */}
      <td>
        <span className={styles.title}>{hotpick.election?.title || hotpick.slug}</span>
      </td>

      {/* Slug */}
      <td>
        <code className={styles.alias}>@{hotpick.slug}</code>
      </td>

      {/* 상태 */}
      <td>
        <span className={`${styles.badge} ${hotpick.visible ? styles.visible : styles.hidden}`}>
          {hotpick.visible ? '공개' : '비공개'}
        </span>
      </td>

      {/* 생성일 */}
      <td>
        <span className={styles.date}>
          {hotpick.createdAt
            ? new Date(hotpick.createdAt)
                .toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })
                .replace(/\. /g, '.')
                .replace(/\.$/, '')
            : '-'}
        </span>
      </td>

      {/* 액션 */}
      <td>
        <div className={styles.actions}>
          <Button variant="outline" size="small" onClick={() => onEdit(hotpick.id ?? 0)}>
            수정
          </Button>
        </div>
      </td>
    </tr>
  );
}

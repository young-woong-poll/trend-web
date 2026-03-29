import { Skeleton } from '@/components/common/Skeleton/Skeleton';
import styles from '@/components/features/MyPage/MyPageView.module.scss';

/** 프로필 영역 스켈레톤 */
export const ProfileSkeleton = () => (
  <>
    <div className={styles.profileSection}>
      <Skeleton variant="dark" width={72} height={72} borderRadius="50%" />
      <div style={{ marginTop: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
        <Skeleton variant="dark" width={80} height={20} borderRadius={4} />
      </div>
    </div>
    <div className={styles.actionButtons}>
      <Skeleton variant="dark" width={110} height={34} borderRadius={9999} />
      <Skeleton variant="dark" width={110} height={34} borderRadius={9999} />
    </div>
  </>
);

/** 카드 리스트 스켈레톤 */
export const CardListSkeleton = () => (
  <div className={styles.listContainer}>
    {Array.from({ length: 4 }, (_, i) => (
      <div key={i} className={styles.card} style={{ pointerEvents: 'none' }}>
        <Skeleton variant="dark" width="60%" height={14} borderRadius={4} />
        <div style={{ marginTop: 8 }}>
          <Skeleton variant="dark" width="90%" height={16} borderRadius={4} />
        </div>
        <div style={{ marginTop: 8 }}>
          <Skeleton variant="dark" width={80} height={12} borderRadius={4} />
        </div>
      </div>
    ))}
  </div>
);

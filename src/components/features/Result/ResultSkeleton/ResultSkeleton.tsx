import { Header } from '@/components/common/Header/Header';
import { Skeleton } from '@/components/common/Skeleton/Skeleton';
import styles from '@/components/features/Result/ResultContent.module.scss';
import skeletonStyles from '@/components/features/Result/ResultSkeleton/ResultSkeleton.module.scss';

export const ResultSkeleton = () => (
  <div className={styles.container}>
    <Header />

    <div className={styles.content}>
      {/* TypeCard / ComparisonCard Skeleton */}
      <div className={skeletonStyles.typeCardSkeleton}>
        {/* 제목 영역 */}
        <div className={skeletonStyles.titleArea}>
          <div className={skeletonStyles.titleSubtitle}>
            <Skeleton height={20} width="40%" borderRadius={4} />
          </div>
          <div className={skeletonStyles.titleMain}>
            <Skeleton height={36} width="70%" borderRadius={4} />
          </div>
        </div>

        {/* 5개의 질문 섹션 */}
        {[...Array(5)].map((_, index) => (
          <div key={index} className={skeletonStyles.questionSection}>
            {/* 질문 */}
            <div className={skeletonStyles.questionText}>
              <Skeleton height={24} width="80%" borderRadius={4} />
            </div>
            {/* 옵션 2개 */}
            <div className={skeletonStyles.optionsRow}>
              <Skeleton height={50} borderRadius={10} />
              <Skeleton height={50} borderRadius={10} />
            </div>
          </div>
        ))}
      </div>

      {/* CompareLinkCard Skeleton */}
      <div className={skeletonStyles.compareLinkCardSkeleton}>
        <div className={skeletonStyles.compareTitle}>
          <Skeleton height={24} width="50%" borderRadius={4} />
        </div>
        <div className={skeletonStyles.compareDescription}>
          <Skeleton height={20} width="100%" borderRadius={4} />
        </div>

        {/* 결과 레이블 */}
        <div className={skeletonStyles.compareLabel}>
          <Skeleton height={20} width="60%" borderRadius={4} />
        </div>

        {/* 빈 박스 또는 친구 목록 */}
        <div className={skeletonStyles.emptyBox}>
          <Skeleton height={80} borderRadius={10} />
        </div>
      </div>

      {/* CopyUrlCard Skeleton */}
      <div className={skeletonStyles.copyUrlCardSkeleton}>
        <div className={skeletonStyles.copyTitle}>
          <Skeleton height={24} width="70%" borderRadius={4} />
        </div>
        <div className={skeletonStyles.copyDescription}>
          <Skeleton height={20} width="100%" borderRadius={4} />
        </div>
        <div className={skeletonStyles.copyButton}>
          <Skeleton height={48} borderRadius={12} />
        </div>
      </div>
    </div>
  </div>
);

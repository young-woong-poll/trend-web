'use client';

import { useState, useEffect, type FC } from 'react';

import { CreateCompareLink } from '@/components/features/Bundle/BundleResult/CreateCompareLink';
import { BundleAccordion } from '@/components/features/Main/MyBundleList/BundleAccordion';
import styles from '@/components/features/Main/MyBundleList/MyBundleList.module.scss';
import type { BundleDetail } from '@/types/bundle';

interface MyBundleListProps {
  bundles: BundleDetail[];
}

export const MyBundleList: FC<MyBundleListProps> = ({ bundles }) => {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  // 번들 데이터가 도착하면 첫 번째 아코디언을 애니메이션으로 열기
  useEffect(() => {
    if (!hasAutoOpened && bundles.length > 0) {
      const timer = setTimeout(() => {
        setOpenSlug(bundles[0]?.slug ?? null);
        setHasAutoOpened(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [bundles, hasAutoOpened]);
  const [compareSlug, setCompareSlug] = useState<string | null>(null);
  const [groupSlug, setGroupSlug] = useState<string | null>(null);

  if (bundles.length === 0) {
    return <div className={styles.emptyState}>아직 참여한 테스트가 없어요</div>;
  }

  return (
    <div className={styles.container}>
      {bundles.map((bundle) => {
        const slug = bundle.slug ?? '';
        return (
          <BundleAccordion
            key={slug}
            slug={slug}
            title={bundle.title ?? ''}
            categoryCode={bundle.categoryCode}
            categoryMeta={bundle.categoryMeta}
            category={bundle.category}
            isOpen={openSlug === slug}
            onToggle={() => setOpenSlug((prev) => (prev === slug ? null : slug))}
            onNewOneToOne={() => setCompareSlug(slug)}
            onNewGroup={() => setGroupSlug(slug)}
          />
        );
      })}

      {compareSlug && (
        <CreateCompareLink
          slug={compareSlug}
          categoryCode={bundles.find((b) => b.slug === compareSlug)?.categoryCode}
          categoryMeta={bundles.find((b) => b.slug === compareSlug)?.categoryMeta}
          category={bundles.find((b) => b.slug === compareSlug)?.category}
          bundleTitle={bundles.find((b) => b.slug === compareSlug)?.title}
          onClose={() => setCompareSlug(null)}
        />
      )}
      {groupSlug && (
        <CreateCompareLink
          slug={groupSlug}
          categoryCode={bundles.find((b) => b.slug === groupSlug)?.categoryCode}
          categoryMeta={bundles.find((b) => b.slug === groupSlug)?.categoryMeta}
          category={bundles.find((b) => b.slug === groupSlug)?.category}
          bundleTitle={bundles.find((b) => b.slug === groupSlug)?.title}
          onClose={() => setGroupSlug(null)}
        />
      )}
    </div>
  );
};

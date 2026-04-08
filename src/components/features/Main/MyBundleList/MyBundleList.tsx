'use client';

import { useState, type FC } from 'react';

import { CreateCompareLink } from '@/components/features/Bundle/BundleResult/CreateCompareLink';
import { CreateGroupLink } from '@/components/features/Bundle/BundleResult/CreateGroupLink';
import { BundleAccordion } from '@/components/features/Main/MyBundleList/BundleAccordion';
import styles from '@/components/features/Main/MyBundleList/MyBundleList.module.scss';
import type { BundleDetail } from '@/types/bundle';

interface MyBundleListProps {
  bundles: BundleDetail[];
}

export const MyBundleList: FC<MyBundleListProps> = ({ bundles }) => {
  const [openSlug, setOpenSlug] = useState<string | null>(bundles[0]?.slug ?? null);
  const [compareSlug, setCompareSlug] = useState<string | null>(null);
  const [groupSlug, setGroupSlug] = useState<string | null>(null);

  if (bundles.length === 0) {
    return <div className={styles.emptyState}>아직 참여한 테스트가 없어요</div>;
  }

  return (
    <div className={styles.container}>
      {bundles.map((bundle) => (
        <BundleAccordion
          key={bundle.slug}
          slug={bundle.slug}
          title={bundle.title}
          categoryCode={bundle.categoryCode}
          isOpen={openSlug === bundle.slug}
          onToggle={() => setOpenSlug((prev) => (prev === bundle.slug ? null : bundle.slug))}
          onNewOneToOne={() => setCompareSlug(bundle.slug)}
          onNewGroup={() => setGroupSlug(bundle.slug)}
        />
      ))}

      {compareSlug && (
        <CreateCompareLink
          slug={compareSlug}
          categoryCode={bundles.find((b) => b.slug === compareSlug)?.categoryCode}
          bundleTitle={bundles.find((b) => b.slug === compareSlug)?.title}
          onClose={() => setCompareSlug(null)}
        />
      )}
      {groupSlug && (
        <CreateGroupLink
          slug={groupSlug}
          categoryCode={bundles.find((b) => b.slug === groupSlug)?.categoryCode}
          bundleTitle={bundles.find((b) => b.slug === groupSlug)?.title}
          onClose={() => setGroupSlug(null)}
        />
      )}
    </div>
  );
};

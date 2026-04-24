'use client';

import { type FC } from 'react';

import styles from '@/components/features/Compare/MyResultView/MyMedalSection.module.scss';
import { getMyMedals, type MyMedal, type MyMedals } from '@/constants/my-medals';
import type { GroupAward } from '@/types/group-compare';

interface MyMedalSectionProps {
  myNickname: string;
  awards: GroupAward[];
  currentUserId: string;
  /** 성향 라벨 — Task 10에서 bundleSlug 기반 계산으로 교체 */
  personaLabel: MyMedal;
}

export const MyMedalSection: FC<MyMedalSectionProps> = ({
  myNickname,
  awards,
  currentUserId,
  personaLabel,
}) => {
  const medals: MyMedals = getMyMedals(awards, currentUserId, personaLabel);

  // TOP이 쌍 어워드(SOUL_CONNECTION / POLAR_OPPOSITES)이면 "OOO님은 유진님과 [라벨]예요" 포맷.
  // 그 외(단독 어워드, 성향 라벨 폴백)는 "OOO님은 [라벨]예요" 포맷.
  const partner = medals.top.partnerNickname;

  return (
    <section className={styles.section} aria-labelledby="my-result-label">
      <p id="my-result-label" className={styles.sectionLabel}>
        MY RESULT
      </p>
      <h2 className={styles.title}>
        {partner ? (
          <>
            {myNickname}님은 {partner}님과{' '}
            <span className={styles.highlight}>{medals.top.title}</span>예요
          </>
        ) : (
          <>
            {myNickname}님은 <span className={styles.highlight}>{medals.top.title}</span>예요
          </>
        )}
      </h2>
      <p className={styles.subtitle}>{medals.top.oneLiner}</p>

      <div className={styles.medalList} role="list">
        {/* TOP 카드는 선언 타이틀이 이미 파트너를 노출하므로 카드 내 with 라인은 숨김 */}
        <MedalCard medal={medals.top} variant="primary" showPartner={false} />
        {medals.chemistryPartner && (
          <MedalCard medal={medals.chemistryPartner} variant="secondary" showPartner />
        )}
        <MedalCard medal={medals.personaLabel} variant="secondary" showPartner={false} />
      </div>
    </section>
  );
};

interface MedalCardProps {
  medal: MyMedal;
  variant: 'primary' | 'secondary';
  showPartner: boolean;
}

function MedalCard({ medal, variant, showPartner }: MedalCardProps) {
  return (
    <article className={`${styles.card} ${styles[variant]}`} role="listitem">
      <h3 className={styles.cardTitle}>{medal.title}</h3>
      <p className={styles.cardOneLiner}>{medal.oneLiner}</p>
      {showPartner && medal.partnerNickname && (
        <p className={styles.cardPartner}>with {medal.partnerNickname}</p>
      )}
    </article>
  );
}

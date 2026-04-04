import { useMemo, type FC } from 'react';

import Image from 'next/image';

import kingOfViralImg from '@/assets/img/characters/king-of-viral.png';
import troubleMakerImg from '@/assets/img/characters/trouble-maker.png';
import styles from '@/components/features/Compare/GroupResult/GroupAwards.module.scss';
import type { GroupAward, GroupAwardType } from '@/types/group-compare';

interface GroupAwardsProps {
  awards: GroupAward[];
}

/** 표시할 어워드만 필터 */
const VISIBLE_AWARDS: GroupAwardType[] = ['CONTROVERSY_MAKER', 'PEOPLES_CHAMPION'];

const AWARD_IMAGES: Record<string, typeof troubleMakerImg> = {
  CONTROVERSY_MAKER: troubleMakerImg,
  PEOPLES_CHAMPION: kingOfViralImg,
};

export const GroupAwards: FC<GroupAwardsProps> = ({ awards }) => {
  const filtered = useMemo(() => awards.filter((a) => VISIBLE_AWARDS.includes(a.type)), [awards]);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>그룹 어워드</span>
        <div className={styles.sectionLine} />
      </div>

      <div className={styles.awardList}>
        {filtered.map((award) => (
          <div key={award.type} className={styles.awardCard}>
            <Image
              src={AWARD_IMAGES[award.type]}
              alt={award.title}
              width={56}
              height={56}
              className={`${styles.awardImage} ${award.type === 'PEOPLES_CHAMPION' ? styles.zoomIn : ''}`}
            />
            <div className={styles.awardTextGroup}>
              <span className={styles.awardTitle}>{award.title}</span>
              <span className={styles.awardWinners}>{award.winnerNicknames.join(' & ')}</span>
              <span className={styles.awardDescription}>{award.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

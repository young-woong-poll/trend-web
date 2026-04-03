import type { FC } from 'react';

import styles from '@/components/features/Compare/GroupResult/GroupAwards.module.scss';
import type { GroupAward, GroupAwardType } from '@/types/group-compare';

interface GroupAwardsProps {
  awards: GroupAward[];
}

const AWARD_GRADIENTS: Record<GroupAwardType, string> = {
  GROUP_LEADER: 'linear-gradient(135deg, #FFD700, #FFA500)',
  GROUP_OUTSIDER: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
  SOUL_CONNECTION: 'linear-gradient(135deg, #FF00FF, #FF4500)',
  POLAR_OPPOSITES: 'linear-gradient(135deg, #4FC3F7, #00BCD4)',
  CONTROVERSY_MAKER: 'linear-gradient(135deg, #FF6B35, #FF00FF)',
  PEOPLES_CHAMPION: 'linear-gradient(135deg, #66BB6A, #FFD700)',
};

const AWARD_ICONS: Record<GroupAwardType, string> = {
  GROUP_LEADER: '👑',
  GROUP_OUTSIDER: '🌀',
  SOUL_CONNECTION: '💫',
  POLAR_OPPOSITES: '⚡',
  CONTROVERSY_MAKER: '🔥',
  PEOPLES_CHAMPION: '🦁',
};

export const GroupAwards: FC<GroupAwardsProps> = ({ awards }) => (
  <div className={styles.container}>
    <div className={styles.sectionHeader}>
      <span className={styles.sectionTitle}>그룹 어워드</span>
      <div className={styles.sectionLine} />
    </div>

    <div className={styles.awardGrid}>
      {awards.map((award) => (
        <div key={award.type} className={styles.awardCard}>
          <div className={styles.awardIcon} style={{ background: AWARD_GRADIENTS[award.type] }}>
            {AWARD_ICONS[award.type]}
          </div>
          <span className={styles.awardTitle}>{award.title}</span>
          <span className={styles.awardWinners}>{award.winnerNicknames.join(' & ')}</span>
          <span className={styles.awardOneLiner}>{award.oneLiner}</span>
          {award.type === 'SOUL_CONNECTION' || award.type === 'POLAR_OPPOSITES' ? (
            <span className={styles.awardValue}>일치율 {award.value}%</span>
          ) : award.type === 'PEOPLES_CHAMPION' ? (
            <span className={styles.awardValue}>대중성 {award.value}%</span>
          ) : null}
        </div>
      ))}
    </div>
  </div>
);

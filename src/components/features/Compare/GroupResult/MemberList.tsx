'use client';

import type { FC } from 'react';

import { useRouter } from 'next/navigation';

import styles from '@/components/features/Compare/GroupResult/MemberList.module.scss';
import { getChemistryByRate } from '@/constants/bundle';
import type { PairChemistry } from '@/types/group-compare';

interface MemberListProps {
  currentUserId: string;
  members: Array<{ userId: string; nickname: string }>;
  pairs: PairChemistry[];
  token: string;
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #ff00ff, #ff4500)',
  'linear-gradient(135deg, #4FC3F7, #00BCD4)',
  'linear-gradient(135deg, #FFD700, #FFA500)',
  'linear-gradient(135deg, #66BB6A, #00BCD4)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #FF6B35, #FF00FF)',
];

export const MemberList: FC<MemberListProps> = ({ currentUserId, members, pairs, token }) => {
  const router = useRouter();

  const otherMembers = members.filter((m) => m.userId !== currentUserId);

  const getMemberChemistry = (targetUserId: string): PairChemistry | undefined =>
    pairs.find(
      (p) =>
        (p.memberA === currentUserId && p.memberB === targetUserId) ||
        (p.memberB === currentUserId && p.memberA === targetUserId)
    );

  const handleMemberClick = (targetUserId: string) => {
    router.push(`/compare/match/${token}?targetUserId=${targetUserId}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>멤버별 1:1 비교</span>
        <div className={styles.sectionLine} />
      </div>

      <div className={styles.memberCards}>
        {otherMembers.map((member, i) => {
          const chemistry = getMemberChemistry(member.userId);
          const matchRate = chemistry?.matchRate ?? 0;
          const grade = getChemistryByRate(matchRate);

          return (
            <div
              key={member.userId}
              className={styles.memberCard}
              onClick={() => handleMemberClick(member.userId)}
            >
              <div
                className={styles.memberAvatar}
                style={{ background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length] }}
              >
                {member.nickname[0]}
              </div>
              <div className={styles.memberInfo}>
                <span className={styles.memberName}>{member.nickname}</span>
                <span className={styles.memberGrade}>
                  {grade.grade} · {grade.title}
                </span>
              </div>
              <div>
                <span className={styles.memberRate}>{matchRate}</span>
                <span className={styles.memberRateUnit}>%</span>
              </div>
              <span className={styles.arrow}>›</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

'use client';

import { useMemo, type FC } from 'react';

import styles from '@/components/features/Compare/GroupResult/HiddenMatch.module.scss';
import { getGradientByIndex } from '@/constants/profileColors';
import type { PairChemistry } from '@/types/group-compare';

interface HiddenMatchProps {
  currentUserId: string;
  members: Array<{ userId: string; nickname: string }>;
  pairs: PairChemistry[];
}

interface DiscoveryCard {
  emoji: string;
  title: string;
  caption: string;
  userIdA: string;
  nicknameA: string;
  userIdB: string;
  nicknameB: string;
  matchRate: number;
}

export const HiddenMatch: FC<HiddenMatchProps> = ({ currentUserId, members, pairs }) => {
  const getGradient = (userId: string) => {
    const idx = members.findIndex((m) => m.userId === userId);
    return getGradientByIndex(idx >= 0 ? idx : 0);
  };

  const discoveries = useMemo(() => {
    const myPairs = pairs.filter((p) => p.memberA === currentUserId || p.memberB === currentUserId);

    const cards: DiscoveryCard[] = [];

    if (myPairs.length > 0) {
      // 1. 의외의 소울메이트 — 나와 가장 높은 matchRate
      const bestMyPair = [...myPairs].sort((a, b) => b.matchRate - a.matchRate)[0];
      const bestIsA = bestMyPair.memberA === currentUserId;
      cards.push({
        emoji: '💫',
        title: '의외의 소울메이트',
        caption: '생각보다 잘 통하는 사이!',
        userIdA: currentUserId,
        nicknameA: bestIsA ? bestMyPair.nicknameA : bestMyPair.nicknameB,
        userIdB: bestIsA ? bestMyPair.memberB : bestMyPair.memberA,
        nicknameB: bestIsA ? bestMyPair.nicknameB : bestMyPair.nicknameA,
        matchRate: bestMyPair.matchRate,
      });

      // 2. 숨은 라이벌 — 나와 가장 낮은 matchRate
      const worstMyPair = [...myPairs].sort((a, b) => a.matchRate - b.matchRate)[0];
      const worstIsA = worstMyPair.memberA === currentUserId;
      cards.push({
        emoji: '⚡',
        title: '숨은 라이벌',
        caption: '거의 매번 반대편!',
        userIdA: currentUserId,
        nicknameA: worstIsA ? worstMyPair.nicknameA : worstMyPair.nicknameB,
        userIdB: worstIsA ? worstMyPair.memberB : worstMyPair.memberA,
        nicknameB: worstIsA ? worstMyPair.nicknameB : worstMyPair.nicknameA,
        matchRate: worstMyPair.matchRate,
      });
    }

    // 3. 그룹 내 베스트 조합 — 전체 페어 중 최고
    if (pairs.length > 0) {
      const bestOverall = [...pairs].sort((a, b) => b.matchRate - a.matchRate)[0];
      cards.push({
        emoji: '🏆',
        title: '그룹 내 베스트 조합',
        caption: '이 그룹에서 가장 잘 통하는 조합',
        userIdA: bestOverall.memberA,
        nicknameA: bestOverall.nicknameA,
        userIdB: bestOverall.memberB,
        nicknameB: bestOverall.nicknameB,
        matchRate: bestOverall.matchRate,
      });
    }

    return cards;
  }, [currentUserId, pairs, members]);

  if (discoveries.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>숨은 궁합 발견</span>
        <div className={styles.sectionLine} />
      </div>

      <div className={styles.cardList}>
        {discoveries.map((card) => (
          <div key={card.title} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardEmoji}>{card.emoji}</span>
              <span className={styles.cardTitle}>{card.title}</span>
            </div>

            <div className={styles.matchRow}>
              {/* Member A */}
              <div className={styles.member}>
                <div className={styles.avatar} style={{ background: getGradient(card.userIdA) }}>
                  {card.nicknameA[0]}
                </div>
                <span className={styles.nickname}>{card.nicknameA}</span>
              </div>

              {/* Match rate */}
              <div className={styles.rateCenter}>
                <span className={styles.rateValue}>{card.matchRate}</span>
                <span className={styles.rateUnit}>%</span>
              </div>

              {/* Member B */}
              <div className={styles.member}>
                <div className={styles.avatar} style={{ background: getGradient(card.userIdB) }}>
                  {card.nicknameB[0]}
                </div>
                <span className={styles.nickname}>{card.nicknameB}</span>
              </div>
            </div>

            <span className={styles.caption}>{card.caption}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

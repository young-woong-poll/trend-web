'use client';

import { useMemo, type FC } from 'react';

import { GenderBadge } from '@/components/features/Compare/GroupResult/GenderBadge';
import styles from '@/components/features/Compare/GroupResult/MyRelationCard.module.scss';
import { getMemberGradient } from '@/constants/profileColors';
import type { GroupCompareResult, PairChemistry } from '@/types/group-compare';

interface MyRelationCardProps {
  currentUserId: string;
  result: GroupCompareResult;
  pairs: PairChemistry[];
}

export const MyRelationCard: FC<MyRelationCardProps> = ({ currentUserId, result, pairs }) => {
  const me = (result.members ?? []).find((m) => m.userId === currentUserId);
  const myIndex = (result.members ?? []).findIndex((m) => m.userId === currentUserId);

  /** 나의 모든 페어 (matchRate 높은 순 정렬) */
  const myPairs = useMemo(() => {
    const filtered = pairs
      .filter((p) => p.memberA === currentUserId || p.memberB === currentUserId)
      .map((p) => {
        const isA = p.memberA === currentUserId;
        const targetId = isA ? p.memberB : p.memberA;
        const targetNickname = isA ? p.nicknameB : p.nicknameA;
        const targetMember = (result.members ?? []).find((m) => m.userId === targetId);
        const targetIndex = (result.members ?? []).findIndex((m) => m.userId === targetId);
        return {
          targetId,
          targetNickname,
          targetIndex,
          targetGender: targetMember?.gender,
          targetProfileColor: targetMember?.displayProfileColor,
          matchRate: p.matchRate,
        };
      });
    return [...filtered].sort((a, b) => b.matchRate - a.matchRate);
  }, [currentUserId, pairs, result.members]);

  /** 그룹 평균 일치율 (나의 모든 pair matchRate 평균) */
  const avgMatchRate = useMemo(() => {
    if (myPairs.length === 0) {
      return 0;
    }
    const sum = myPairs.reduce((acc, p) => acc + p.matchRate, 0);
    return Math.round(sum / myPairs.length);
  }, [myPairs]);

  /** 베스트 매치 */
  const bestMatch = myPairs.length > 0 ? myPairs[0] : null;

  /** 워스트 매치 */
  const worstMatch = myPairs.length > 1 ? myPairs[myPairs.length - 1] : null;

  /** 가장 많이 갈린 질문: 내가 선택한 것과 다른 멤버가 가장 많은 질문 */
  const mostDisagreedQuestion = useMemo(() => {
    if (!me) {
      return null;
    }

    const myAnswerMap = new Map((me.answers ?? []).map((a) => [a.electionId, a.electionItemId]));
    const otherMembers = (result.members ?? []).filter((m) => m.userId !== currentUserId);

    let maxDisagree = 0;
    let maxQuestion: { electionId: string; title: string; disagreeCount: number } | null = null;

    for (const stat of result.questionStats ?? []) {
      const myAnswer = myAnswerMap.get(stat.electionId ?? '');
      if (!myAnswer) {
        continue;
      }

      let disagreeCount = 0;
      for (const other of otherMembers) {
        const otherAnswer = (other.answers ?? []).find((a) => a.electionId === stat.electionId);
        if (otherAnswer && otherAnswer.electionItemId !== myAnswer) {
          disagreeCount++;
        }
      }

      if (disagreeCount > maxDisagree) {
        maxDisagree = disagreeCount;
        maxQuestion = { electionId: stat.electionId ?? '', title: stat.title ?? '', disagreeCount };
      }
    }

    return maxQuestion;
  }, [me, currentUserId, result.members, result.questionStats]);

  /** 이성 베스트 매치 */
  const oppositeGenderBest = useMemo(() => {
    if (!me?.gender) {
      return null;
    }

    for (const pair of myPairs) {
      const target = (result.members ?? []).find((m) => m.userId === pair.targetId);
      if (target?.gender && target.gender !== me.gender) {
        const currentYear = new Date().getFullYear();
        const age = target.birthYear ? currentYear - target.birthYear + 1 : null;
        const genderLabel = target.gender === 'MALE' ? '남' : '여';
        const tag = age ? `${genderLabel} / ${age}세` : genderLabel;
        return { ...pair, tag };
      }
    }

    return null;
  }, [me, myPairs, result.members]);

  const getGradient = (memberIndex: number, userId?: string, profileColor?: string) =>
    getMemberGradient(memberIndex, userId, profileColor);

  if (!me) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>나의 그룹 리포트</span>
        <div className={styles.sectionLine} />
      </div>

      <div className={styles.cardBorder}>
        <div className={styles.card}>
          {/* 1. 프로필 */}
          <div className={styles.profileSection}>
            <div className={styles.profileAvatarWrap}>
              <div
                className={styles.profileAvatar}
                style={{
                  background:
                    myIndex >= 0 ? getGradient(myIndex, me.userId, me.displayProfileColor) : '#333',
                }}
              >
                {(me.nickname ?? '')[0]}
              </div>
              <GenderBadge gender={me.gender} size={16} iconSize={9} />
            </div>
            <span className={styles.profileNickname}>{me.nickname}</span>
            <span className={styles.syncText}>
              그룹 평균과 <strong>{avgMatchRate}%</strong> 일치
            </span>
          </div>

          <div className={styles.divider} />

          {/* 2. 베스트 매치 */}
          {bestMatch && (
            <div className={styles.matchSection}>
              <span className={`${styles.matchLabel} ${styles.matchLabelBest}`}>베스트 매치</span>
              <div className={styles.matchRow}>
                <div className={styles.matchAvatarWrap}>
                  <div
                    className={styles.matchAvatar}
                    style={{
                      background: getGradient(
                        bestMatch.targetIndex,
                        bestMatch.targetId,
                        bestMatch.targetProfileColor
                      ),
                    }}
                  >
                    {bestMatch.targetNickname[0]}
                  </div>
                  <GenderBadge gender={bestMatch.targetGender} />
                </div>
                <div className={styles.matchInfo}>
                  <span className={styles.matchName}>{bestMatch.targetNickname}</span>
                </div>
                <div className={styles.matchRate}>
                  <span className={styles.matchRateValue}>{bestMatch.matchRate}</span>
                  <span className={styles.matchRateUnit}>%</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. 워스트 매치 */}
          {worstMatch && (
            <div className={styles.matchSection}>
              <span className={`${styles.matchLabel} ${styles.matchLabelWorst}`}>워스트 매치</span>
              <div className={styles.matchRow}>
                <div className={styles.matchAvatarWrap}>
                  <div
                    className={styles.matchAvatar}
                    style={{
                      background: getGradient(
                        worstMatch.targetIndex,
                        worstMatch.targetId,
                        worstMatch.targetProfileColor
                      ),
                    }}
                  >
                    {worstMatch.targetNickname[0]}
                  </div>
                  <GenderBadge gender={worstMatch.targetGender} />
                </div>
                <div className={styles.matchInfo}>
                  <span className={styles.matchName}>{worstMatch.targetNickname}</span>
                </div>
                <div className={styles.matchRate}>
                  <span className={styles.matchRateValue}>{worstMatch.matchRate}</span>
                  <span className={styles.matchRateUnit}>%</span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.divider} />

          {/* 4. 가장 많이 갈린 질문 */}
          {mostDisagreedQuestion && mostDisagreedQuestion.disagreeCount > 0 && (
            <div className={styles.questionSection}>
              <span className={styles.questionLabel}>가장 많이 갈린 질문</span>
              <div className={styles.questionCard}>
                <span className={styles.questionTitle}>{mostDisagreedQuestion.title}</span>
                <span className={styles.questionDisagree}>
                  {mostDisagreedQuestion.disagreeCount}명과 다른 선택
                </span>
              </div>
            </div>
          )}

          {/* 5. 이성 베스트 매치 */}
          {oppositeGenderBest && (
            <>
              <div className={styles.divider} />
              <div className={styles.matchSection}>
                <span className={`${styles.matchLabel} ${styles.matchLabelOpposite}`}>
                  이성 베스트 매치
                </span>
                <div className={styles.matchRow}>
                  <div className={styles.matchAvatarWrap}>
                    <div
                      className={styles.matchAvatar}
                      style={{
                        background: getGradient(
                          oppositeGenderBest.targetIndex,
                          oppositeGenderBest.targetId,
                          oppositeGenderBest.targetProfileColor
                        ),
                      }}
                    >
                      {oppositeGenderBest.targetNickname[0]}
                    </div>
                    <GenderBadge gender={oppositeGenderBest.targetGender} />
                  </div>
                  <div className={styles.matchInfo}>
                    <span className={styles.matchName}>{oppositeGenderBest.targetNickname}</span>
                    <span className={styles.matchTag}>{oppositeGenderBest.tag}</span>
                  </div>
                  <div className={styles.matchRate}>
                    <span className={styles.matchRateValue}>{oppositeGenderBest.matchRate}</span>
                    <span className={styles.matchRateUnit}>%</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

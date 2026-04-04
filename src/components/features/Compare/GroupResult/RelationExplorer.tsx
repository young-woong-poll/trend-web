'use client';

import { useState, useMemo, type FC } from 'react';

import styles from '@/components/features/Compare/GroupResult/RelationExplorer.module.scss';
import { getChemistryByRate, type ChemistryGrade } from '@/constants/bundle';
import type { GroupCompareResult, PairChemistry } from '@/types/group-compare';

const GRADE_COLORS: Record<ChemistryGrade, string> = {
  S: '#3B82F6',
  A: '#22C55E',
  B: '#FACC15',
  C: '#F97316',
  D: '#EF4444',
};

interface RelationExplorerProps {
  currentUserId: string;
  result: GroupCompareResult;
  pairs: PairChemistry[];
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #ff00ff, #ff4500)',
  'linear-gradient(135deg, #4FC3F7, #00BCD4)',
  'linear-gradient(135deg, #FFD700, #FFA500)',
  'linear-gradient(135deg, #66BB6A, #00BCD4)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #FF6B35, #FF00FF)',
];

export const RelationExplorer: FC<RelationExplorerProps> = ({ currentUserId, result, pairs }) => {
  const { members, questionStats } = result;

  /** 특정 멤버와 가장 케미가 높은 상대 찾기 */
  const findBestMatch = (userId: string): string | undefined => {
    const myPairs = pairs.filter((p) => p.memberA === userId || p.memberB === userId);
    if (myPairs.length === 0) {
      return undefined;
    }
    const best = myPairs.reduce((a, b) => (a.matchRate >= b.matchRate ? a : b));
    return best.memberA === userId ? best.memberB : best.memberA;
  };

  const [personAId, setPersonAId] = useState(currentUserId);
  const [personBId, setPersonBId] = useState(
    () =>
      findBestMatch(currentUserId) ?? members.find((m) => m.userId !== currentUserId)?.userId ?? ''
  );

  const handlePersonAChange = (newId: string) => {
    setPersonAId(newId);
    // 같은 사람 선택 방지
    if (newId === personBId) {
      const fallback = members.find((m) => m.userId !== newId)?.userId ?? '';
      setPersonBId(fallback);
    }
  };

  const handlePersonBChange = (newId: string) => {
    if (newId === personAId) {
      return;
    }
    setPersonBId(newId);
  };

  /** 두 사람의 1:1 케미 정보 */
  const pairInfo = useMemo(
    () =>
      pairs.find(
        (p) =>
          (p.memberA === personAId && p.memberB === personBId) ||
          (p.memberA === personBId && p.memberB === personAId)
      ),
    [pairs, personAId, personBId]
  );

  /** 질문별 비교 리스트 */
  const questionComparison = useMemo(() => {
    const memberA = members.find((m) => m.userId === personAId);
    const memberB = members.find((m) => m.userId === personBId);
    if (!memberA || !memberB) {
      return [];
    }

    return questionStats.map((q) => {
      const answerA = memberA.answers.find((a) => a.electionId === q.electionId);
      const answerB = memberB.answers.find((a) => a.electionId === q.electionId);
      const selectedA = answerA?.selected ?? null;
      const selectedB = answerB?.selected ?? null;
      const isMatch = selectedA !== null && selectedB !== null && selectedA === selectedB;

      return {
        electionId: q.electionId,
        title: q.title,
        optionA: q.optionA,
        optionB: q.optionB,
        selectedA,
        selectedB,
        isMatch,
      };
    });
  }, [members, questionStats, personAId, personBId]);

  const matchCount = questionComparison.filter((q) => q.isMatch).length;
  const mismatchCount = questionComparison.filter((q) => !q.isMatch).length;

  const getGradient = (userId: string) => {
    const idx = members.findIndex((m) => m.userId === userId);
    return idx >= 0 ? AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length] : '#333';
  };

  const getNickname = (userId: string) => {
    const member = members.find((m) => m.userId === userId);
    return member?.nickname ?? '?';
  };

  const getDisplayLabel = (answer: string, optionA: string, optionB: string) =>
    answer === 'A' ? optionA : optionB;

  return (
    <div className={styles.container}>
      {/* 섹션 헤더 */}
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>관계 탐색기</span>
        <div className={styles.sectionLine} />
      </div>

      {/* 두 사람 선택 + 일치율 */}
      <div className={styles.selectorArea}>
        {/* Person A */}
        <div className={styles.selectorCard}>
          <div className={styles.selectorAvatar} style={{ background: getGradient(personAId) }}>
            {getNickname(personAId)[0]}
          </div>
          <select
            className={styles.selector}
            value={personAId}
            onChange={(e) => handlePersonAChange(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.nickname}
                {m.userId === currentUserId ? ' (나)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 등급 */}
        <div className={styles.matchRateCenter}>
          <span
            className={styles.matchRateValue}
            style={{ color: GRADE_COLORS[getChemistryByRate(pairInfo?.matchRate ?? 0).grade] }}
          >
            {getChemistryByRate(pairInfo?.matchRate ?? 0).grade}
          </span>
        </div>

        {/* Person B */}
        <div className={styles.selectorCard}>
          <div className={styles.selectorAvatar} style={{ background: getGradient(personBId) }}>
            {getNickname(personBId)[0]}
          </div>
          <select
            className={styles.selector}
            value={personBId}
            onChange={(e) => handlePersonBChange(e.target.value)}
          >
            {members
              .filter((m) => m.userId !== personAId)
              .map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.nickname}
                  {m.userId === currentUserId ? ' (나)' : ''}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* 질문별 비교 리스트 */}
      <div className={styles.questionList}>
        {questionComparison.map((q) => (
          <div key={q.electionId} className={styles.questionRow}>
            <div className={styles.questionTitle}>{q.title}</div>
            <div className={styles.answerRow}>
              {/* Person A 답변 */}
              <div className={styles.answerSide}>
                <div className={styles.answerAvatar} style={{ background: getGradient(personAId) }}>
                  {getNickname(personAId)[0]}
                </div>
                <span
                  className={`${styles.answerText} ${q.isMatch ? styles.answerMatch : styles.answerDiffer}`}
                >
                  {q.selectedA ? getDisplayLabel(q.selectedA, q.optionA, q.optionB) : '-'}
                </span>
              </div>

              {/* 일치/불일치 배지 */}
              <div
                className={`${styles.badge} ${q.isMatch ? styles.badgeMatch : styles.badgeMismatch}`}
              >
                {q.isMatch ? '일치' : '불일치'}
              </div>

              {/* Person B 답변 */}
              <div className={`${styles.answerSide} ${styles.answerSideRight}`}>
                <span
                  className={`${styles.answerText} ${q.isMatch ? styles.answerMatch : styles.answerDiffer}`}
                >
                  {q.selectedB ? getDisplayLabel(q.selectedB, q.optionA, q.optionB) : '-'}
                </span>
                <div className={styles.answerAvatar} style={{ background: getGradient(personBId) }}>
                  {getNickname(personBId)[0]}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 하단 요약 */}
      <div className={styles.summary}>
        <span className={styles.summaryText}>
          {questionComparison.length}문제 중{' '}
          <span className={styles.summaryMatch}>{matchCount}개 일치</span>,{' '}
          <span className={styles.summaryMismatch}>{mismatchCount}개 불일치</span>
        </span>
      </div>
    </div>
  );
};

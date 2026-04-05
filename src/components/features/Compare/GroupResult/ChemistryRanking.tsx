'use client';

import { useState, useRef, useEffect, useMemo, type FC } from 'react';

import styles from '@/components/features/Compare/GroupResult/ChemistryRanking.module.scss';
import { getChemistryByRate, type ChemistryGrade } from '@/constants/bundle';
import { getMemberGradient } from '@/constants/profileColors';
import type { PairChemistry } from '@/types/group-compare';

const GRADE_COLORS: Record<ChemistryGrade, string> = {
  S: '#3B82F6',
  A: '#22C55E',
  B: '#FACC15',
  C: '#F97316',
  D: '#EF4444',
};

interface ChemistryRankingProps {
  currentUserId: string;
  members: Array<{ userId: string; nickname: string }>;
  pairs: PairChemistry[];
}

const TOP_COUNT = 3;

const GRADE_INFO = [
  { grade: 'S', range: '80% 이상', title: '말 안 해도 통하는', color: '#3B82F6' },
  { grade: 'A', range: '60~79%', title: '꽤 잘 맞는', color: '#22C55E' },
  { grade: 'B', range: '40~59%', title: '같을 때도 다를 때도', color: '#FACC15' },
  { grade: 'C', range: '20~39%', title: '각자의 세계', color: '#F97316' },
  { grade: 'D', range: '19% 이하', title: '정반대의 가치관', color: '#EF4444' },
];

export const ChemistryRanking: FC<ChemistryRankingProps> = ({ currentUserId, members, pairs }) => {
  const [selectedUserId, setSelectedUserId] = useState(currentUserId);
  const [showGradeInfo, setShowGradeInfo] = useState(false);
  const gradeInfoRef = useRef<HTMLDivElement>(null);
  const gradeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showGradeInfo) {
      return;
    }
    const handleOutside = (e: MouseEvent) => {
      if (gradeBtnRef.current?.contains(e.target as Node)) {
        return;
      }
      if (gradeInfoRef.current?.contains(e.target as Node)) {
        return;
      }
      setShowGradeInfo(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showGradeInfo]);

  const selectedMember = members.find((m) => m.userId === selectedUserId);

  /** 선택된 멤버 기준으로 다른 멤버들과의 케미를 정렬 */
  const ranked = useMemo(() => {
    const myPairs = pairs
      .filter((p) => p.memberA === selectedUserId || p.memberB === selectedUserId)
      .map((p) => {
        const isA = p.memberA === selectedUserId;
        const targetId = isA ? p.memberB : p.memberA;
        const targetNickname = isA ? p.nicknameB : p.nicknameA;
        const memberIndex = members.findIndex((m) => m.userId === targetId);
        return { targetId, targetNickname, memberIndex, matchRate: p.matchRate };
      });

    const sorted = [...myPairs].sort((a, b) => b.matchRate - a.matchRate);
    return {
      best: sorted.slice(0, TOP_COUNT),
      worst: sorted.slice(-TOP_COUNT).reverse(),
    };
  }, [selectedUserId, pairs, members]);

  /** 멤버 원본 인덱스로 gradient 가져오기 */
  const getGradient = (memberIndex: number, userId?: string) =>
    getMemberGradient(memberIndex, userId);

  const selectedIndex = members.findIndex((m) => m.userId === selectedUserId);

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>케미 랭킹</span>
        <div className={styles.gradeInfoWrap}>
          <button
            ref={gradeBtnRef}
            type="button"
            className={styles.gradeInfoBtn}
            onClick={() => setShowGradeInfo((v) => !v)}
            aria-label="등급 기준 보기"
          >
            ?
          </button>
          {showGradeInfo && (
            <div ref={gradeInfoRef} className={styles.gradeInfoTooltip}>
              <span className={styles.gradeInfoTitle}>등급 기준</span>
              <span className={styles.gradeInfoSub}>그룹 멤버 간 답변 일치율로 산출</span>
              {GRADE_INFO.map((g) => (
                <div key={g.grade} className={styles.gradeInfoRow}>
                  <span className={styles.gradeInfoGrade} style={{ color: g.color }}>
                    {g.grade}
                  </span>
                  <span className={styles.gradeInfoRange}>{g.range}</span>
                  <span className={styles.gradeInfoLabel}>{g.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={styles.sectionLine} />
      </div>

      {/* 기준 멤버 선택 */}
      <div className={styles.selectorRow}>
        <span className={styles.selectorPrefix}>기준</span>
        <div
          className={styles.selectorAvatar}
          style={{ background: selectedIndex >= 0 ? getGradient(selectedIndex) : '#333' }}
        >
          {selectedMember?.nickname[0] ?? '?'}
        </div>
        <select
          className={styles.selector}
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
        >
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.nickname}
              {m.userId === currentUserId ? ' (나)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* 베스트 케미 */}
      <div className={styles.rankSection}>
        <span className={styles.rankLabel}>베스트 케미</span>
        <div className={styles.rankList}>
          {ranked.best.map((item, i) => {
            const grade = getChemistryByRate(item.matchRate);
            return (
              <div key={item.targetId} className={styles.rankCard}>
                <span className={styles.rankNumber}>{i + 1}</span>
                <div
                  className={styles.rankAvatar}
                  style={{ background: getGradient(item.memberIndex) }}
                >
                  {item.targetNickname[0]}
                </div>
                <div className={styles.rankInfo}>
                  <span className={styles.rankName}>
                    {item.targetNickname}
                    {item.targetId === currentUserId && (
                      <span className={styles.nicknameBadgeMe}>나</span>
                    )}
                  </span>
                  <span className={styles.rankSub}>{grade.title}</span>
                </div>
                <span
                  className={styles.rankGradeLabel}
                  style={{ color: GRADE_COLORS[grade.grade] }}
                >
                  {grade.grade}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 워스트 케미 */}
      <div className={styles.rankSection}>
        <span className={`${styles.rankLabel} ${styles.rankLabelWorst}`}>워스트 케미</span>
        <div className={styles.rankList}>
          {ranked.worst.map((item, i) => {
            const grade = getChemistryByRate(item.matchRate);
            return (
              <div key={item.targetId} className={styles.rankCard}>
                <span className={`${styles.rankNumber} ${styles.rankNumberWorst}`}>
                  {members.length - 1 - i}
                </span>
                <div
                  className={styles.rankAvatar}
                  style={{ background: getGradient(item.memberIndex) }}
                >
                  {item.targetNickname[0]}
                </div>
                <div className={styles.rankInfo}>
                  <span className={styles.rankName}>
                    {item.targetNickname}
                    {item.targetId === currentUserId && (
                      <span className={styles.nicknameBadgeMe}>나</span>
                    )}
                  </span>
                  <span className={styles.rankSub}>{grade.title}</span>
                </div>
                <span
                  className={styles.rankGradeLabel}
                  style={{ color: GRADE_COLORS[grade.grade] }}
                >
                  {grade.grade}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

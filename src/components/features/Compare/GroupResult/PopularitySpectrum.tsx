'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';

import Image from 'next/image';

import { createPortal } from 'react-dom';

import styles from '@/components/features/Compare/GroupResult/PopularitySpectrum.module.scss';
import { getPopularityByScore } from '@/constants/bundle';
import type { GroupCompareResult } from '@/types/group-compare';

interface PopularitySpectrumProps {
  result: GroupCompareResult;
  currentUserId: string;
}

interface MemberScore {
  userId: string;
  nickname: string;
  score: number;
  grade: ReturnType<typeof getPopularityByScore>;
}

interface Cluster {
  members: MemberScore[];
  avgScore: number;
}

/** 멤버별 대중성 점수 계산 */
function calcMemberPopularityScores(result: GroupCompareResult): MemberScore[] {
  return result.members.map((member) => {
    let totalRate = 0;
    let matched = 0;
    for (const answer of member.answers) {
      const stat = result.questionStats.find((s) => s.electionId === answer.electionId);
      if (!stat) {
        continue;
      }
      totalRate += answer.selected === 'A' ? stat.optionARate : stat.optionBRate;
      matched++;
    }
    const score = matched > 0 ? Math.round(totalRate / matched) : 50;
    return {
      userId: member.userId,
      nickname: member.nickname,
      score,
      grade: getPopularityByScore(score),
    };
  });
}

/** 근접 멤버 클러스터링 */
function clusterMembers(members: MemberScore[], threshold: number = 6): Cluster[] {
  const sorted = [...members].sort((a, b) => a.score - b.score);
  const clusters: Cluster[] = [];
  for (const member of sorted) {
    const last = clusters[clusters.length - 1];
    if (last && Math.abs(member.score - last.avgScore) <= threshold) {
      last.members.push(member);
      last.avgScore = last.members.reduce((sum, m) => sum + m.score, 0) / last.members.length;
    } else {
      clusters.push({ members: [member], avgScore: member.score });
    }
  }
  return clusters;
}

/** 점수 → 바 위 퍼센트 위치 */
function scoreToPercent(score: number, min: number = 25, max: number = 85): number {
  const clamped = Math.max(min, Math.min(max, score));
  return 8 + ((clamped - min) / (max - min)) * 84;
}

export const PopularitySpectrum: FC<PopularitySpectrumProps> = ({ result, currentUserId }) => {
  const [activeCluster, setActiveCluster] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    x: number;
    y: number;
    arrowX: number;
  } | null>(null);
  const nodeRefs = useRef<Map<number, HTMLElement>>(new Map());
  const tooltipRef = useRef<HTMLDivElement>(null);

  const scores = useMemo(() => calcMemberPopularityScores(result), [result]);
  const clusters = useMemo(() => clusterMembers(scores), [scores]);

  const TOOLTIP_WIDTH = 200;
  const SCREEN_PAD = 12;

  const handleNodeClick = useCallback(
    (idx: number) => {
      if (activeCluster === idx) {
        setActiveCluster(null);
        setTooltipPos(null);
        return;
      }
      const el = nodeRefs.current.get(idx);
      if (el) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const half = TOOLTIP_WIDTH / 2;
        const vw = window.innerWidth;
        let left = centerX - half;
        if (left < SCREEN_PAD) {
          left = SCREEN_PAD;
        }
        if (left + TOOLTIP_WIDTH > vw - SCREEN_PAD) {
          left = vw - SCREEN_PAD - TOOLTIP_WIDTH;
        }
        setTooltipPos({
          x: left,
          y: rect.bottom + 8,
          arrowX: centerX - left,
        });
      }
      setActiveCluster(idx);
    },
    [activeCluster]
  );

  // 외부 클릭으로 닫기
  useEffect(() => {
    if (activeCluster === null) {
      return;
    }
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const nodeEl = nodeRefs.current.get(activeCluster);
      if (nodeEl?.contains(target)) {
        return;
      }
      if (tooltipRef.current?.contains(target)) {
        return;
      }
      setActiveCluster(null);
      setTooltipPos(null);
    };
    const handleScroll = (e: Event) => {
      if (tooltipRef.current?.contains(e.target as Node)) {
        return;
      }
      setActiveCluster(null);
      setTooltipPos(null);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeCluster]);

  const activeData = activeCluster !== null ? clusters[activeCluster] : null;

  const [showInfo, setShowInfo] = useState(false);
  const infoBtnRef = useRef<HTMLButtonElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showInfo) {
      return;
    }
    const handleOutside = (e: MouseEvent) => {
      if (infoBtnRef.current?.contains(e.target as Node)) {
        return;
      }
      if (infoRef.current?.contains(e.target as Node)) {
        return;
      }
      setShowInfo(false);
    };
    const handleScroll = () => setShowInfo(false);
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showInfo]);

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>대중성 분포</span>
        <div className={styles.infoWrap}>
          <button
            ref={infoBtnRef}
            type="button"
            className={styles.infoBtn}
            onClick={() => setShowInfo((v) => !v)}
            aria-label="대중성 산출 기준 보기"
          >
            ?
          </button>
          {showInfo && (
            <div ref={infoRef} className={styles.infoTooltip}>
              <span className={styles.infoTitle}>대중성 점수란?</span>
              <p className={styles.infoBody}>
                각 질문에서 내가 고른 답이 전체 투표에서 몇 %인지를 평균 낸 값입니다.
              </p>
              <p className={styles.infoBody}>
                예: 5문제에서 내 선택이 전체의 80%, 60%, 70%, 50%, 40%였다면 → 평균 60%가 대중성
                점수입니다.
              </p>
              <p className={styles.infoBody}>
                점수가 높을수록 다수와 같은 선택을, 낮을수록 소수 의견을 많이 골랐다는 뜻입니다.
              </p>
            </div>
          )}
        </div>
        <div className={styles.sectionLine} />
      </div>
      <p className={styles.sectionDesc}>
        핫픽 전체 투표수를 기준으로 대중성을 산출합니다.
        <br />
        참여자가 늘면 업데이트 됩니다.
      </p>

      <div className={styles.spectrumArea}>
        <div className={styles.axisLabels}>
          <span className={styles.axisLabel}>소신파</span>
          <span className={styles.axisLabel}>대중파</span>
        </div>

        <div className={styles.bar}>
          <div className={styles.barFill} />

          {[38, 48, 58, 68].map((t) => (
            <div key={t} className={styles.tickMark} style={{ left: `${scoreToPercent(t)}%` }}>
              <span className={styles.tickLabel}>{t}%</span>
            </div>
          ))}

          {clusters.map((cluster, idx) => {
            const position = scoreToPercent(cluster.avgScore);
            const isMulti = cluster.members.length > 1;
            const member = cluster.members[0];
            const isActive = activeCluster === idx;

            return (
              <button
                key={idx}
                ref={(el) => {
                  if (el) {
                    nodeRefs.current.set(idx, el);
                  }
                }}
                type="button"
                className={`${styles.node} ${isActive ? styles.nodeActive : ''}`}
                style={{ left: `${position}%` }}
                onClick={() => handleNodeClick(idx)}
              >
                {member.grade.imagePath ? (
                  <Image
                    src={member.grade.imagePath}
                    alt={member.grade.title}
                    width={36}
                    height={36}
                    className={styles.nodeImage}
                  />
                ) : (
                  <div className={styles.nodeFallback}>{member.nickname[0]}</div>
                )}
                {isMulti && <span className={styles.clusterCount}>{cluster.members.length}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 말풍선 툴팁 (포탈) */}
      {activeData &&
        tooltipPos &&
        createPortal(
          <div
            ref={tooltipRef}
            className={styles.tooltip}
            style={{ top: tooltipPos.y, left: tooltipPos.x }}
          >
            <div className={styles.tooltipArrow} style={{ marginLeft: tooltipPos.arrowX - 6 }} />
            <div className={styles.tooltipBody}>
              {activeData.members.map((member) => (
                <div key={member.userId} className={styles.tooltipRow}>
                  {member.grade.imagePath ? (
                    <Image
                      src={member.grade.imagePath}
                      alt={member.grade.title}
                      width={28}
                      height={28}
                      className={styles.tooltipImage}
                    />
                  ) : (
                    <div className={styles.tooltipFallback}>{member.nickname[0]}</div>
                  )}
                  <span className={styles.tooltipName}>
                    {member.nickname}
                    {member.userId === currentUserId && (
                      <span className={styles.nicknameBadgeMe}>나</span>
                    )}
                  </span>
                  <span className={styles.tooltipGrade}>{member.score}%</span>
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

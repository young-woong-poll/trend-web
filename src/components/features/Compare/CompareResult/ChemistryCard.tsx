import { useState, useEffect, useRef, type FC } from 'react';

import styles from '@/components/features/Compare/CompareResult/ChemistryCard.module.scss';
import { getChemistryByRate, type ChemistryGrade } from '@/constants/bundle';
import { IDENTITY_COLORS } from '@/constants/compare';

const GRADE_COLORS: Record<ChemistryGrade, string> = {
  SS: '#E040FB',
  S: '#3B82F6',
  A: '#22C55E',
  B: '#FACC15',
  C: '#F97316',
  D: '#EF4444',
  X: '#00E5FF',
};

const GRADE_INFO = [
  { grade: 'SS', range: '100%', title: '도플갱어' },
  { grade: 'S', range: '80~99%', title: '말 안 해도 통하는' },
  { grade: 'A', range: '60~79%', title: '꽤 잘 맞는' },
  { grade: 'B', range: '40~59%', title: '같을 때도 다를 때도' },
  { grade: 'C', range: '20~39%', title: '각자의 세계' },
  { grade: 'D', range: '1~19%', title: '정반대의 가치관' },
  { grade: 'X', range: '0%', title: '완벽한 반대' },
];

interface ChemistryCardProps {
  matchRate: number;
  myNickname: string;
  targetNickname: string;
  isTargetWithdrawn?: boolean;
}

export const ChemistryCard: FC<ChemistryCardProps> = ({
  matchRate,
  myNickname,
  targetNickname,
  isTargetWithdrawn,
}) => {
  const chemistry = getChemistryByRate(matchRate);
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
    const handleScroll = () => setShowGradeInfo(false);
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showGradeInfo]);

  return (
    <div className={styles.container}>
      {/* 닉네임 */}
      <div className={styles.names}>
        <span className={styles.myName} style={{ color: IDENTITY_COLORS.me.main }}>
          {myNickname}
        </span>
        <span className={styles.vs}>×</span>
        <span
          className={styles.targetName}
          style={{
            color: isTargetWithdrawn ? '#666' : IDENTITY_COLORS.target.main,
            opacity: isTargetWithdrawn ? 0.6 : 1,
          }}
        >
          {targetNickname}
        </span>
      </div>

      {/* 등급 히어로 */}
      <div className={styles.gradeArea}>
        <span className={styles.gradeLetter} style={{ color: GRADE_COLORS[chemistry.grade] }}>
          {chemistry.grade}
        </span>
        <span className={styles.gradeTitle} style={{ color: GRADE_COLORS[chemistry.grade] }}>
          {chemistry.title}
        </span>
        <span className={styles.gradeDescription}>{chemistry.description}</span>
        <div className={styles.gradeInfoWrap}>
          <button
            ref={gradeBtnRef}
            type="button"
            className={styles.gradeInfoBtn}
            onClick={() => setShowGradeInfo((v) => !v)}
            aria-label="등급 기준 보기"
          >
            등급 기준이란?
          </button>
          {showGradeInfo && (
            <div ref={gradeInfoRef} className={styles.gradeInfoTooltip}>
              <span className={styles.gradeInfoTitle}>등급 기준</span>
              <span className={styles.gradeInfoSub}>답변 일치율 기준으로 산출</span>
              {GRADE_INFO.map((g) => (
                <div key={g.grade} className={styles.gradeInfoRow}>
                  <span
                    className={styles.gradeInfoGrade}
                    style={{ color: GRADE_COLORS[g.grade as ChemistryGrade] }}
                  >
                    {g.grade}
                  </span>
                  <span className={styles.gradeInfoRange}>{g.range}</span>
                  <span className={styles.gradeInfoLabel}>{g.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 분포 곡선 — 별도 카드 */}
      <div className={styles.distributionCard}>
        <div className={styles.distributionHeader}>
          <span className={styles.distributionLabel}>우리의 케미는</span>
          <span className={styles.distributionHighlight}>
            {matchRate >= 70 ? '상위권' : matchRate >= 40 ? '중간쯤' : '독특한 편'}
          </span>
        </div>

        <div className={styles.curveWrap}>
          <svg viewBox="0 0 200 80" className={styles.curveSvg}>
            <defs>
              <linearGradient id="curveFill" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ff00ff" stopOpacity="0.06" />
                <stop offset="50%" stopColor="#ff4500" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#ff00ff" stopOpacity="0.06" />
              </linearGradient>
            </defs>
            <path
              d="M0,75 C30,72 50,48 75,22 C90,8 100,3 100,3 C100,3 110,8 125,22 C150,48 170,72 200,75 L200,80 L0,80 Z"
              fill="url(#curveFill)"
            />
            <path
              d="M0,75 C30,72 50,48 75,22 C90,8 100,3 100,3 C100,3 110,8 125,22 C150,48 170,72 200,75"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1.5"
            />
            <line
              x1={matchRate * 2}
              y1={
                (() => {
                  const x = matchRate * 2;
                  const n = (x - 100) / 50;
                  return 3 + 72 * (1 - Math.exp((-n * n) / 2));
                })() - 8
              }
              x2={matchRate * 2}
              y2="80"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            <circle
              cx={matchRate * 2}
              cy={(() => {
                const x = matchRate * 2;
                const n = (x - 100) / 50;
                return 3 + 72 * (1 - Math.exp((-n * n) / 2));
              })()}
              r="5"
              fill="#fff"
            />
          </svg>
          <div className={styles.curveAxis}>
            <span>완전 다름</span>
            <span>완전 똑같음</span>
          </div>
        </div>
      </div>
    </div>
  );
};

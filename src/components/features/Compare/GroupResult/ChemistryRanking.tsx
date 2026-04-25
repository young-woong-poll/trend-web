'use client';

import { useState, useMemo, useRef, useEffect, useCallback, type FC } from 'react';

import styles from '@/components/features/Compare/GroupResult/ChemistryRanking.module.scss';
import { GenderBadge } from '@/components/features/Compare/GroupResult/GenderBadge';
import { getChemistryByRate, type ChemistryGrade } from '@/constants/bundle';
import { getMemberGradient, isGhostUser } from '@/constants/profileColors';
import type { PairChemistry } from '@/types/group-compare';

const GRADE_COLORS: Record<ChemistryGrade, string> = {
  SS: '#E040FB',
  S: '#3B82F6',
  A: '#22C55E',
  B: '#FACC15',
  C: '#F97316',
  D: '#EF4444',
  X: '#00E5FF',
};

const GRADE_ORDER: ChemistryGrade[] = ['SS', 'S', 'A', 'B', 'C', 'D', 'X'];

const GRADE_TITLES: Record<ChemistryGrade, string> = {
  SS: '도플갱어',
  S: '말 안 해도 통하는',
  A: '꽤 잘 맞는',
  B: '같을 때도 다를 때도',
  C: '각자의 세계',
  D: '정반대의 가치관',
  X: '완벽한 반대',
};

const GRADE_INFO = [
  { grade: 'SS', range: '100%', title: '도플갱어', color: '#E040FB' },
  { grade: 'S', range: '80~99%', title: '말 안 해도 통하는', color: '#3B82F6' },
  { grade: 'A', range: '60~79%', title: '꽤 잘 맞는', color: '#22C55E' },
  { grade: 'B', range: '40~59%', title: '같을 때도 다를 때도', color: '#FACC15' },
  { grade: 'C', range: '20~39%', title: '각자의 세계', color: '#F97316' },
  { grade: 'D', range: '1~19%', title: '정반대의 가치관', color: '#EF4444' },
  { grade: 'X', range: '0%', title: '완벽한 반대', color: '#00E5FF' },
];

const STACK_MAX = 5;

interface ChemistryRankingProps {
  currentUserId: string;
  members: Array<{
    userId: string;
    nickname: string;
    gender?: 'MALE' | 'FEMALE';
    displayProfileColor?: string;
    isWithdrawn?: boolean;
  }>;
  pairs: PairChemistry[];
  onCompareRequest?: (targetUserId: string) => void;
  /** 내 프로필 편집 콜백 */
  onEditProfile?: () => void;
}

// ─── PC 드래그 스크롤 훅 ───
function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) {
      return;
    }
    drag.current = { active: true, startX: e.pageX, scrollLeft: el.scrollLeft };
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag.current.active) {
      return;
    }
    const el = ref.current;
    if (!el) {
      return;
    }
    e.preventDefault();
    el.scrollLeft = drag.current.scrollLeft - (e.pageX - drag.current.startX);
  }, []);

  const onMouseUp = useCallback(() => {
    drag.current.active = false;
    const el = ref.current;
    if (!el) {
      return;
    }
    el.style.cursor = 'grab';
    el.style.userSelect = '';
  }, []);

  const onMouseLeave = useCallback(() => {
    if (drag.current.active) {
      drag.current.active = false;
      const el = ref.current;
      if (!el) {
        return;
      }
      el.style.cursor = 'grab';
      el.style.userSelect = '';
    }
  }, []);

  return { ref, handlers: { onMouseDown, onMouseMove, onMouseUp, onMouseLeave } };
}

// ─── 등급별 아코디언 섹션 ───
interface GradeSectionProps {
  grade: ChemistryGrade;
  items: Array<{
    targetId: string;
    targetNickname: string;
    matchRate: number;
    memberIndex: number;
    gender?: 'MALE' | 'FEMALE';
    isWithdrawn?: boolean;
  }>;
  isOpen: boolean;
  onToggle: () => void;
  isMyView: boolean;
  onCompareRequest?: (targetUserId: string) => void;
}

const GradeSection: FC<GradeSectionProps> = ({
  grade,
  items,
  isOpen,
  onToggle,
  isMyView,
  onCompareRequest,
}) => {
  const { ref: scrollRef, handlers: dragHandlers } = useDragScroll();

  if (items.length === 0) {
    return null;
  }

  const stackItems = items.slice(0, STACK_MAX);
  const overflow = items.length - STACK_MAX;

  return (
    <div className={`${styles.gradeCard} ${isOpen ? styles.gradeCardOpen : ''}`}>
      <button type="button" className={styles.gradeHeader} onClick={onToggle}>
        <span className={styles.gradeBadge} style={{ color: GRADE_COLORS[grade] }}>
          {grade}
        </span>

        {/* 겹침 아바타 스택 */}
        <div className={`${styles.avatarStack} ${isOpen ? styles.avatarStackFaded : ''}`}>
          {stackItems.map((item, i) => (
            <div
              key={item.targetId}
              className={styles.stackAvatar}
              style={{
                background: getMemberGradient(item.memberIndex, item.targetId),
                marginLeft: i === 0 ? 0 : -10,
                zIndex: STACK_MAX - i,
              }}
            >
              {item.targetNickname[0]}
            </div>
          ))}
          {overflow > 0 && (
            <div className={styles.stackOverflow} style={{ marginLeft: -10 }}>
              +{overflow}
            </div>
          )}
        </div>

        <div className={styles.gradeInfo}>
          <span className={styles.gradeInfoText}>
            {GRADE_TITLES[grade]} · {items.length}명
          </span>
        </div>

        <span className={`${styles.gradeArrow} ${isOpen ? styles.gradeArrowOpen : ''}`}>›</span>
      </button>

      {/* 펼쳐지는 가로 스크롤 영역 */}
      <div className={`${styles.gradeContent} ${isOpen ? styles.gradeContentOpen : ''}`}>
        <div ref={scrollRef} {...dragHandlers} className={styles.chipScroller}>
          {items.map((item) => {
            const itemGrade = getChemistryByRate(item.matchRate);
            const canCompare =
              isMyView && onCompareRequest && !isGhostUser(item.targetId) && !item.isWithdrawn;
            return (
              <div
                key={item.targetId}
                role={canCompare ? 'button' : undefined}
                tabIndex={canCompare ? 0 : undefined}
                onClick={canCompare ? () => onCompareRequest(item.targetId) : undefined}
                className={`${styles.chip} ${canCompare ? styles.chipTappable : ''}`}
                style={{
                  borderColor: `${GRADE_COLORS[grade]}22`,
                  opacity: item.isWithdrawn ? 0.5 : undefined,
                }}
              >
                <div className={styles.chipAvatarWrap}>
                  <div
                    className={styles.chipAvatar}
                    style={{
                      background: getMemberGradient(
                        item.memberIndex,
                        item.targetId,
                        undefined,
                        item.isWithdrawn
                      ),
                    }}
                  >
                    {item.targetNickname[0]}
                  </div>
                  <GenderBadge gender={item.gender} />
                </div>
                <div className={styles.chipInfo}>
                  <span className={styles.chipName}>{item.targetNickname}</span>
                  <span
                    className={styles.chipRate}
                    style={{ color: GRADE_COLORS[itemGrade.grade] }}
                  >
                    {item.isWithdrawn ? '탈퇴' : `${item.matchRate}%`}
                  </span>
                </div>
                {canCompare && <span className={styles.chipArrow}>›</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── 메��� 컴포넌트 ───
export const ChemistryRanking: FC<ChemistryRankingProps> = ({
  currentUserId,
  members,
  pairs,
  onCompareRequest,
  onEditProfile,
}) => {
  const [selectedUserId, setSelectedUserId] = useState(currentUserId);
  const [openGrade, setOpenGrade] = useState<ChemistryGrade | null>(null);
  const [showGradeInfo, setShowGradeInfo] = useState(false);
  const gradeInfoRef = useRef<HTMLDivElement>(null);
  const gradeBtnRef = useRef<HTMLButtonElement>(null);
  const { ref: memberScrollRef, handlers: memberDragHandlers } = useDragScroll();

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

  // 기준 멤버 변경 시 열린 아코디언 초기화
  useEffect(() => {
    setOpenGrade(null);
  }, [selectedUserId]);

  const grouped = useMemo(() => {
    const myPairs = pairs
      .filter((p) => p.memberA === selectedUserId || p.memberB === selectedUserId)
      .map((p) => {
        const isA = p.memberA === selectedUserId;
        const targetId = isA ? p.memberB : p.memberA;
        const targetNickname = isA ? p.nicknameB : p.nicknameA;
        const targetMember = members.find((m) => m.userId === targetId);
        const memberIndex = members.findIndex((m) => m.userId === targetId);
        return {
          targetId,
          targetNickname,
          matchRate: p.matchRate,
          memberIndex,
          gender: targetMember?.gender,
          grade: getChemistryByRate(p.matchRate).grade,
          isWithdrawn: targetMember?.isWithdrawn,
        };
      });

    const groups: Record<ChemistryGrade, typeof myPairs> = {
      SS: [],
      S: [],
      A: [],
      B: [],
      C: [],
      D: [],
      X: [],
    };
    myPairs.forEach((p) => groups[p.grade].push(p));
    GRADE_ORDER.forEach((g) => groups[g].sort((a, b) => b.matchRate - a.matchRate));
    return groups;
  }, [selectedUserId, pairs, members]);

  const avgRate = useMemo(() => {
    const rates = pairs
      .filter((p) => p.memberA === selectedUserId || p.memberB === selectedUserId)
      .map((p) => p.matchRate);
    return rates.length ? Math.round(rates.reduce((s, r) => s + r, 0) / rates.length) : 0;
  }, [selectedUserId, pairs]);

  const avgGrade = getChemistryByRate(avgRate);
  const selectedMember = members.find((m) => m.userId === selectedUserId);
  const isMyView = selectedUserId === currentUserId;

  return (
    <div className={styles.container}>
      {/* 섹션 헤더 */}
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>일치율 랭킹</span>
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

      {/* 기준 멤버 가로 스크롤 */}
      <div ref={memberScrollRef} {...memberDragHandlers} className={styles.memberScroller}>
        {members.map((m, i) => {
          const isActive = m.userId === selectedUserId;
          return (
            <button
              key={m.userId}
              type="button"
              className={`${styles.memberChip} ${isActive ? styles.memberChipActive : ''}`}
              style={m.isWithdrawn ? { opacity: 0.5 } : undefined}
              onClick={() => setSelectedUserId(m.userId)}
            >
              <div className={styles.memberAvatarWrap}>
                <div
                  className={`${styles.memberAvatar} ${isActive ? styles.memberAvatarActive : ''}`}
                  style={{
                    background: getMemberGradient(
                      i,
                      m.userId,
                      m.displayProfileColor,
                      m.isWithdrawn
                    ),
                  }}
                >
                  {m.nickname[0]}
                </div>
                <GenderBadge gender={m.gender} />
              </div>
              <span className={styles.memberName}>
                {m.userId === currentUserId ? '나' : m.nickname}
              </span>
            </button>
          );
        })}
      </div>

      {/* 요약: 등급 분포 바 */}
      <div className={styles.summaryCard}>
        <div className={styles.summaryTop}>
          <span className={styles.summaryName}>{selectedMember?.nickname ?? '?'}의 그룹 궁합</span>
          <span className={styles.summaryAvg} style={{ color: GRADE_COLORS[avgGrade.grade] }}>
            평균 {avgRate}% ({avgGrade.grade})
          </span>
        </div>
        <div className={styles.distBar}>
          {GRADE_ORDER.map((g) => {
            const count = grouped[g].length;
            if (count === 0) {
              return null;
            }
            const pct = (count / (members.length - 1)) * 100;
            return (
              <div
                key={g}
                className={styles.distSegment}
                style={{ width: `${pct}%`, background: GRADE_COLORS[g] }}
              />
            );
          })}
        </div>
        <div className={styles.distLabels}>
          {GRADE_ORDER.map((g) => {
            const count = grouped[g].length;
            if (count === 0) {
              return null;
            }
            return (
              <span key={g} className={styles.distLabel} style={{ color: GRADE_COLORS[g] }}>
                {g} {count}명
              </span>
            );
          })}
        </div>
      </div>

      {/* 등급별 아코디언 */}
      <div className={styles.gradeList}>
        {GRADE_ORDER.map((grade) => (
          <GradeSection
            key={grade}
            grade={grade}
            items={grouped[grade]}
            isOpen={openGrade === grade}
            onToggle={() => setOpenGrade((prev) => (prev === grade ? null : grade))}
            isMyView={isMyView}
            onCompareRequest={onCompareRequest}
          />
        ))}
      </div>

      <p className={styles.hint}>등급을 탭하면 멤버를 확인할 수 있어요</p>

      {/* 내 기준 뷰에서 프로필 수정 패널 — ChemistryNetwork와 동일 디자인 */}
      {isMyView && onEditProfile && (
        <div className={styles.comparePanel}>
          <div className={styles.comparePanelText}>
            <span className={styles.comparePanelNames}>참여 프로필</span>
            <span className={styles.comparePanelTitle}>표시 이름 · 프로필 색상</span>
          </div>
          <button type="button" className={styles.comparePanelBtn} onClick={onEditProfile}>
            수정하기
          </button>
        </div>
      )}
    </div>
  );
};

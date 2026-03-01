'use client';

import { useCallback, useEffect, useRef, useState, type FC } from 'react';

import Image from 'next/image';

import { AnimatePresence, motion } from 'framer-motion';

import CheckIcon from '@/assets/icon/CheckIcon';
import ShortLogo from '@/assets/icon/ShortLogo';
import styles from '@/components/features/OfflineVote/OfflineVotePage.module.scss';
import { getDetail, vote } from '@/generated/api/client/hotpick/hotpick';
import type { ElectionItemViewResponse, ElectionViewResponse } from '@/generated/models';
import { useFullscreen } from '@/hooks/useFullscreen';
import { getTKUID } from '@/lib/tkuid';
import { calcPercentage, OPTION_LABELS } from '@/types/singleVote';

/** 투표 후 결과 표시 시간 (ms) */
const RESULT_DISPLAY_MS = 3000;

type Phase = 'setup' | 'ready' | 'voting' | 'result';

interface ElectionState {
  election: ElectionViewResponse;
  title: string;
  imageUrl?: string;
  categories: string[];
}

export const OfflineVotePage: FC = () => {
  const { isFullscreen, enterFullscreen } = useFullscreen();

  const [phase, setPhase] = useState<Phase>('setup');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [electionState, setElectionState] = useState<ElectionState | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [votedOptionId, setVotedOptionId] = useState<number | null>(null);
  const [voteResults, setVoteResults] = useState<Record<number, number>>({});

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const tkuIdRef = useRef('');

  useEffect(() => {
    tkuIdRef.current = getTKUID();
  }, []);

  // 투표 데이터 로드
  const loadHotpick = useCallback(async (hotpickSlug: string) => {
    setLoading(true);
    setError('');

    try {
      // customInstance가 BaseResponse.data를 자동 추출하므로 res = HotpickDetailResponse
      const res = await getDetail(hotpickSlug);
      const hotpick = res?.hotpick;
      const election = hotpick?.election;

      if (!election || !election.items?.length) {
        setError('투표 데이터를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      setElectionState({
        election,
        title: election.title ?? '',
        imageUrl: election.imageUrl ?? hotpick.imageUrl,
        categories: (hotpick.categories ?? []).map((c) => c.name ?? ''),
      });
      setTotalCount(election.totalVoteCount ?? 0);
      setVoteResults({});
      setVotedOptionId(null);
      setPhase('ready');
    } catch {
      setError('핫픽을 불러올 수 없습니다. slug를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 투표 시작
  const handleStart = useCallback(async () => {
    if (!slug.trim()) {
      setError('핫픽 slug를 입력해주세요.');
      return;
    }

    await loadHotpick(slug.trim());
  }, [slug, loadHotpick]);

  // 풀스크린 진입 + 투표 화면 전환
  const handleEnterVoting = useCallback(async () => {
    await enterFullscreen();
    setPhase('voting');
  }, [enterFullscreen]);

  // 투표 처리
  const handleVote = useCallback(
    async (optionId: number) => {
      if (votedOptionId !== null || !electionState) {
        return;
      }

      setVotedOptionId(optionId);

      try {
        // customInstance가 BaseResponse.data를 자동 추출하므로 result = VoteResultResponse
        const result = await vote(
          slug,
          { electionItemId: optionId },
          { headers: { 'x-tku-id': tkuIdRef.current } }
        );

        if (result) {
          const counts: Record<number, number> = {};
          let total = 0;
          for (const item of result.items ?? []) {
            if (item.electionItemId !== undefined && item.electionItemId !== null) {
              counts[item.electionItemId] = item.voteCount ?? 0;
              total += item.voteCount ?? 0;
            }
          }
          setVoteResults(counts);
          setTotalCount(total);
        }
      } catch {
        // 409 중복 등 에러 시에도 결과 표시
        setTotalCount((prev) => prev + 1);
      }

      setPhase('result');

      // 자동 리셋: 다음 사람 투표 대기
      timerRef.current = setTimeout(() => {
        // 새 TKUID 생성 (다음 투표자용)
        tkuIdRef.current = crypto.randomUUID();
        setVotedOptionId(null);
        setVoteResults({});
        setPhase('voting');
      }, RESULT_DISPLAY_MS);
    },
    [votedOptionId, electionState, slug]
  );

  // cleanup
  // eslint-disable-next-line arrow-body-style
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const items = electionState?.election.items ?? [];
  const isImageType = items.some((item) => !!item.imageUrl);

  // ── 1. 셋업 화면 ──
  if (phase === 'setup') {
    return (
      <div className={styles.setupContainer}>
        <div className={styles.setupCard}>
          <div className={styles.setupLogo}>
            <ShortLogo />
          </div>
          <h1 className={styles.setupTitle}>오프라인 투표</h1>
          <p className={styles.setupDesc}>핫픽 slug를 입력하고 투표를 시작하세요</p>

          <input
            className={styles.slugInput}
            type="text"
            placeholder="핫픽 slug 입력 (예: my-vote-slug)"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                void handleStart();
              }
            }}
          />

          {error && <p className={styles.errorText}>{error}</p>}

          <button
            className={styles.startButton}
            onClick={handleStart}
            disabled={loading || !slug.trim()}
          >
            {loading ? '불러오는 중...' : '투표 불러오기'}
          </button>
        </div>
      </div>
    );
  }

  // ── 2. 준비 화면 (미리보기 + 풀스크린 진입) ──
  if (phase === 'ready' && electionState) {
    return (
      <div className={styles.setupContainer}>
        <div className={styles.previewCard}>
          <div className={styles.previewHeader}>
            {electionState.categories.map((cat) => (
              <span key={cat} className={styles.categoryTag}>
                {cat}
              </span>
            ))}
          </div>
          <h2 className={styles.previewTitle}>{electionState.title}</h2>
          <div className={styles.previewOptions}>
            {items.map((item, i) => (
              <div key={item.electionItemId} className={styles.previewOption}>
                <span className={styles.previewLabel}>{OPTION_LABELS[i]}</span>
                <span>{item.title}</span>
              </div>
            ))}
          </div>
          <button className={styles.fullscreenButton} onClick={handleEnterVoting}>
            투표 시작 (전체화면)
          </button>
          <button
            className={styles.backButton}
            onClick={() => {
              setPhase('setup');
              setElectionState(null);
            }}
          >
            다른 투표 선택
          </button>
        </div>
      </div>
    );
  }

  // ── 3. 투표 화면 + 4. 결과 화면 ──
  return (
    <div className={`${styles.voteContainer} ${isFullscreen ? styles.fullscreen : ''}`}>
      {/* 상단 로고 + 참여자 수 */}
      <div className={styles.voteTopBar}>
        <div className={styles.voteLogoMini}>
          <ShortLogo />
        </div>
        <span className={styles.voteParticipants}>{totalCount.toLocaleString()}명 참여</span>
      </div>

      {/* 질문 */}
      <div className={styles.voteQuestionArea}>
        {electionState?.imageUrl && !isImageType && (
          <Image
            src={electionState.imageUrl}
            alt={electionState.title}
            width={56}
            height={56}
            className={styles.voteQuestionLogo}
          />
        )}
        <h1 className={styles.voteQuestion}>{electionState?.title}</h1>
      </div>

      {/* 투표 옵션 / 결과 */}
      <div className={styles.voteBody}>
        <AnimatePresence mode="wait">
          {phase === 'voting' ? (
            <motion.div
              key="options"
              className={items.length === 2 ? styles.optionGridTwo : styles.optionGridMulti}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {items.map((item, i) => (
                <VoteOptionButton
                  key={item.electionItemId}
                  item={item}
                  label={OPTION_LABELS[i]}
                  isImageType={isImageType}
                  onClick={() => handleVote(item.electionItemId ?? 0)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              className={styles.resultList}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {items.map((item, i) => {
                const count = voteResults[item.electionItemId ?? 0] ?? 0;
                const percentage = totalCount > 0 ? calcPercentage(count, totalCount) : 0;
                const isMyChoice = item.electionItemId === votedOptionId;

                return (
                  <div
                    key={item.electionItemId}
                    className={`${styles.resultBar} ${isMyChoice ? styles.myChoice : ''}`}
                  >
                    <motion.div
                      className={styles.resultFill}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                    />
                    <div className={styles.resultContent}>
                      {isImageType && item.imageUrl && (
                        <Image
                          src={item.imageUrl}
                          alt={item.title ?? ''}
                          width={36}
                          height={36}
                          className={styles.resultImage}
                        />
                      )}
                      <span className={styles.resultText}>
                        {isMyChoice && (
                          <span className={styles.myBadge}>
                            <CheckIcon width={16} height={16} />
                          </span>
                        )}
                        <span className={styles.resultLabel}>{OPTION_LABELS[i]}</span>
                        {item.title}
                      </span>
                      <span className={styles.resultPercent}>{percentage}%</span>
                    </div>
                  </div>
                );
              })}

              {/* 자동 리셋 카운트다운 */}
              <div className={styles.autoResetBar}>
                <motion.div
                  className={styles.autoResetFill}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: RESULT_DISPLAY_MS / 1000, ease: 'linear' }}
                />
              </div>
              <p className={styles.autoResetText}>잠시 후 다음 투표자를 위해 초기화됩니다</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 하단 안내 */}
      {phase === 'voting' && (
        <div className={styles.voteFooter}>
          <p className={styles.voteFooterText}>원하는 항목을 탭하세요</p>
        </div>
      )}
    </div>
  );
};

// ── 옵션 버튼 서브 컴포넌트 ──
interface VoteOptionButtonProps {
  item: ElectionItemViewResponse;
  label: string;
  isImageType: boolean;
  onClick: () => void;
}

const VoteOptionButton: FC<VoteOptionButtonProps> = ({ item, label, isImageType, onClick }) => (
  <motion.button
    className={styles.optionCard}
    onClick={onClick}
    whileTap={{ scale: 0.96 }}
    whileHover={{ scale: 1.02 }}
  >
    {isImageType && item.imageUrl && (
      <div className={styles.optionImageWrap}>
        <Image
          src={item.imageUrl}
          alt={item.title ?? ''}
          fill
          className={styles.optionImage}
          sizes="(max-width: 768px) 50vw, 33vw"
        />
      </div>
    )}
    <div className={styles.optionInfo}>
      <span className={styles.optionLabel}>{label}</span>
      <span className={styles.optionText}>{item.title}</span>
    </div>
  </motion.button>
);

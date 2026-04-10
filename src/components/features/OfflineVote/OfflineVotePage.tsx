'use client';

import { useCallback, useEffect, useRef, useState, type FC } from 'react';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

import { AnimatePresence, motion } from 'framer-motion';

import CheckIcon from '@/assets/icon/CheckIcon';
import ShortLogo from '@/assets/icon/ShortLogo';
import styles from '@/components/features/OfflineVote/OfflineVotePage.module.scss';
import { getDetail, vote } from '@/generated/api/client/hotpick/hotpick';
// TODO: server-meta API removed - needs BE replacement
import type { ElectionItemViewResponse, ElectionViewResponse } from '@/generated/models';
import { useFullscreen } from '@/hooks/useFullscreen';
import { getTKUID } from '@/lib/tkuid';
import { calcPercentage, OPTION_LABELS } from '@/types/singleVote';

/** 투표 후 결과 표시 시간 (ms) */
const RESULT_DISPLAY_MS = 3000;

type Phase = 'loading' | 'error' | 'ready' | 'voting' | 'result';

interface LocationMeta {
  code: string;
  sido: string;
  sigungu: string;
  eupmyeondong?: string;
}

interface ServerMeta {
  id: string;
  location?: LocationMeta;
  from?: string;
  to?: string;
}

interface ElectionState {
  election: ElectionViewResponse;
  title: string;
  imageUrl?: string;
  categories: string[];
}

export const OfflineVotePage: FC = () => {
  const searchParams = useSearchParams();
  const { isFullscreen, enterFullscreen } = useFullscreen();

  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [electionState, setElectionState] = useState<ElectionState | null>(null);
  const [serverMeta, setServerMeta] = useState<ServerMeta | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [votedOptionId, setVotedOptionId] = useState<number | null>(null);
  const [voteResults, setVoteResults] = useState<Record<number, number>>({});

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const tkuIdRef = useRef('');
  const slugRef = useRef('');
  const serverMetaIdRef = useRef('');

  useEffect(() => {
    tkuIdRef.current = getTKUID();
  }, []);

  // URL 파라미터에서 slug, serverMetaId 추출 후 검증 및 데이터 로드
  useEffect(() => {
    const slug = searchParams.get('slug');
    const serverMetaId = searchParams.get('serverMetaId');

    if (!slug || !serverMetaId) {
      setError(
        '유효하지 않은 투표 링크입니다.\n필수 파라미터(slug, serverMetaId)가 누락되었습니다.'
      );
      setPhase('error');
      return;
    }

    slugRef.current = slug;
    serverMetaIdRef.current = serverMetaId;

    const init = async () => {
      try {
        // TODO: server-meta API removed - needs BE replacement
        // Previously validated serverMetaId via get1() and extracted location/time metadata.
        // For now, store the serverMetaId as-is without server validation.
        setServerMeta({ id: serverMetaId });

        // 핫픽 데이터 로드
        const res = await getDetail(slug);
        const hotpick = res.hotpick;
        const election = hotpick?.election;

        if (!election || !election.items?.length) {
          setError('투표 데이터를 찾을 수 없습니다.');
          setPhase('error');
          return;
        }

        setElectionState({
          election,
          title: election.title ?? '',
          imageUrl: election.imageUrl ?? hotpick.imageUrl,
          categories: (hotpick.categories ?? []).map((c) => c.category ?? ''),
        });
        setTotalCount(election.totalVoteCount ?? 0);
        setPhase('ready');
      } catch {
        setError('투표 정보를 불러올 수 없습니다.\n관리자에게 문의해주세요.');
        setPhase('error');
      }
    };

    void init();
  }, [searchParams]);

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
        // TODO: server-meta API removed - serverMetaId was removed from CreateVoteRequest, passing via clientMeta for now
        const result = await vote(
          slugRef.current,
          {
            electionItemId: optionId,
            clientMeta: { serverMetaId: serverMetaIdRef.current },
          },
          { headers: { 'x-tku-id': tkuIdRef.current } }
        );

        const counts: Record<number, number> = {};
        let total = 0;
        for (const item of result.items ?? []) {
          if (item.electionItemId !== undefined) {
            counts[item.electionItemId] = item.voteCount ?? 0;
            total += item.voteCount ?? 0;
          }
        }
        setVoteResults(counts);
        setTotalCount(total);
      } catch {
        // 409 중복 등 에러 시에도 결과 표시
        setTotalCount((prev) => prev + 1);
      }

      setPhase('result');

      // 자동 리셋: 다음 사람 투표 대기
      timerRef.current = setTimeout(() => {
        tkuIdRef.current = crypto.randomUUID();
        setVotedOptionId(null);
        setVoteResults({});
        setPhase('voting');
      }, RESULT_DISPLAY_MS);
    },
    [votedOptionId, electionState]
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
  const locationLabel = serverMeta?.location
    ? [serverMeta.location.sido, serverMeta.location.sigungu, serverMeta.location.eupmyeondong]
        .filter(Boolean)
        .join(' ')
    : null;
  const locationShort = serverMeta?.location?.sigungu || serverMeta?.location?.sido || null;

  // ── 1. 로딩 화면 ──
  if (phase === 'loading') {
    return (
      <div className={styles.setupContainer}>
        <div className={styles.setupCard}>
          <div className={styles.setupLogo}>
            <ShortLogo />
          </div>
          <h1 className={styles.setupTitle}>투표 준비 중</h1>
          <p className={styles.setupDesc}>투표 정보를 불러오고 있습니다...</p>
          <div className={styles.loadingSpinner} />
        </div>
      </div>
    );
  }

  // ── 2. 에러 화면 ──
  if (phase === 'error') {
    return (
      <div className={styles.setupContainer}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>!</div>
          <h1 className={styles.errorTitle}>투표 링크 오류</h1>
          <p className={styles.errorMessage}>{error}</p>
          <p className={styles.errorHint}>관리자에게 올바른 투표 링크를 요청해주세요.</p>
        </div>
      </div>
    );
  }

  // ── 3. 준비 화면 (미리보기 + 풀스크린 진입) ──
  if (phase === 'ready' && electionState) {
    return (
      <div className={styles.setupContainer}>
        <div className={styles.previewCard}>
          {locationLabel && (
            <div className={styles.locationBadge}>
              <span className={styles.locationIcon}>&#x1F4CD;</span>
              {locationLabel}
            </div>
          )}
          {serverMeta?.from && serverMeta.to && (
            <div className={styles.timeBadge}>
              {serverMeta.from} ~ {serverMeta.to}
            </div>
          )}
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
        </div>
      </div>
    );
  }

  // ── 4. 투표 화면 + 5. 결과 화면 ──
  return (
    <div className={`${styles.voteContainer} ${isFullscreen ? styles.fullscreen : ''}`}>
      {/* 상단 로고 + 위치 + 참여자 수 */}
      <div className={styles.voteTopBar}>
        <div className={styles.voteTopLeft}>
          <div className={styles.voteLogoMini}>
            <ShortLogo />
          </div>
          {locationShort && <span className={styles.voteLocation}>{locationShort}</span>}
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

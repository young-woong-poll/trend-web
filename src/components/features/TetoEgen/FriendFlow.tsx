'use client';

import { type FC, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import CheckIcon from '@/assets/icon/CheckIcon';
import SparkleIcon from '@/assets/icon/SparkleIcon';
import { Alert } from '@/components/common/Alert/Alert';
import AnswerPairRow from '@/components/features/TetoEgen/AnswerPairRow';
import BinaryChoiceCard from '@/components/features/TetoEgen/BinaryChoiceCard';
import FriendAnswersCollapse from '@/components/features/TetoEgen/FriendAnswersCollapse';
import styles from '@/components/features/TetoEgen/FriendFlow.module.scss';
import TetoEgenLayout from '@/components/features/TetoEgen/TetoEgenLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useMyTetoEgenLink, useSubmitFriendVote } from '@/hooks/api/useAskTetoEgen';
import { useAlert } from '@/hooks/useAlert';
import { trackAskFriendLanding, trackAskFriendVote } from '@/lib/analytics';
import type {
  FriendTetoEgenMetaResponse,
  TetoEgenAnswer,
  TetoEgenFriendVotes,
} from '@/types/ask-teto-egen';

type FriendFlowProps = {
  token: string;
  meta: FriendTetoEgenMetaResponse;
};

const labelOf = (a: TetoEgenAnswer) => (a === 'TETO' ? '테토' : '에겐');

const FriendFlow: FC<FriendFlowProps> = ({ token, meta }) => {
  const router = useRouter();
  const { isLoggedIn, requireLogin } = useAuth();
  const { alertState, showAlert, handleConfirm } = useAlert();

  const submit = useSubmitFriendVote(token);

  // 친구 결과 화면에 진입한 시점에 본인 링크 보유 여부를 조회 → CTA 카피 분기.
  // - 데이터 있음(200) → "내 결과 보러 가기"
  // - 404 → "나도 투표 받아보기"
  // 비로그인이거나 아직 투표 전이면 fetch 안 함.
  const myLink = useMyTetoEgenLink(isLoggedIn);

  useEffect(() => {
    trackAskFriendLanding('teto-egen', meta.isOwn);
  }, [meta.isOwn]);

  // 이미 참여한 사용자면 meta에 myVote/friendVotes/ownerSelfAnswer가 동봉되므로 초기 state로 채움 → 즉시 결과 화면.
  const [submittedVote, setSubmittedVote] = useState<TetoEgenAnswer | null>(meta.myVote ?? null);
  const [friendVotes, setFriendVotes] = useState<TetoEgenFriendVotes | null>(
    meta.friendVotes ?? null
  );
  const [ownerDisplayName, setOwnerDisplayName] = useState<string>(meta.ownerDisplayName);
  const [ownerSelfAnswer, setOwnerSelfAnswer] = useState<TetoEgenAnswer | null>(
    meta.ownerSelfAnswer ?? null
  );

  const handleSelect = (vote: TetoEgenAnswer) => {
    if (!isLoggedIn) {
      requireLogin('ask');
      return;
    }

    if (meta.isOwn) {
      // 자기 토큰: 평가 화면은 보여주되 투표 시점에 차단
      showAlert('자신에게 투표할 수 없습니다', {
        confirmText: '내 결과 보기',
        onConfirm: () => {
          router.replace('/ask/teto-egen/my');
        },
      });
      return;
    }

    submit.mutate(
      { vote },
      {
        onSuccess: (data) => {
          setSubmittedVote(data.myVote);
          setFriendVotes(data.friendVotes);
          setOwnerDisplayName(data.ownerDisplayName);
          setOwnerSelfAnswer(data.ownerSelfAnswer);
          trackAskFriendVote('teto-egen', data.myVote, data.myVote === data.ownerSelfAnswer);
        },
        onError: (err: unknown) => {
          const status = (
            err as {
              response?: {
                status?: number;
                data?: { code?: string; data?: { myVote?: TetoEgenAnswer } };
              };
            }
          ).response?.status;
          const body = (
            err as { response?: { data?: { code?: string; data?: { myVote?: TetoEgenAnswer } } } }
          ).response?.data;
          if (status === 403) {
            showAlert('자신에게 투표할 수 없습니다');
            return;
          }
          if (status === 409 && body?.data?.myVote) {
            showAlert('이미 참여했습니다', {
              confirmText: '확인',
              showCloseButton: false,
              onConfirm: () => window.location.reload(),
            });
            setSubmittedVote(body.data.myVote);
            return;
          }
          showAlert('일시적인 에러가 발생했어요', {
            message: '다시 시도해주세요',
            confirmText: '확인',
            showCloseButton: false,
            onConfirm: () => window.location.reload(),
          });
        },
      }
    );
  };

  const handleNext = () => {
    // from=friend 쿼리로 친구 화면에서 넘어왔음을 표시 → /my에서 뒤로가기 버튼 노출 트리거.
    router.push('/ask/teto-egen/my?from=friend');
  };

  // 결과 화면 (vote 직후 또는 이미 참여한 사용자)
  if (submittedVote && friendVotes) {
    const ownerName = ownerDisplayName || meta.ownerDisplayName;
    // 친구의 답이 owner 본인의 자기평가와 일치하는지 — owner 자기평가가 없으면 verdict 미노출.
    const verdict: 'hit' | 'miss' | null = ownerSelfAnswer
      ? submittedVote === ownerSelfAnswer
        ? 'hit'
        : 'miss'
      : null;
    return (
      <>
        <TetoEgenLayout showClose>
          <div className={styles.resultBody}>
            {verdict && (
              <section
                className={`${styles.verdictHero} ${verdict === 'hit' ? styles.verdictHit : styles.verdictMiss}`}
              >
                <span
                  className={`${styles.verdictBadge} ${verdict === 'hit' ? styles.verdictBadgeHit : ''}`}
                >
                  {verdict === 'hit' ? (
                    <CheckIcon width={14} height={14} />
                  ) : (
                    <SparkleIcon className={styles.verdictBadgeIcon} />
                  )}
                  <span>{verdict === 'hit' ? '적중' : '의외'}</span>
                </span>
                <h2 className={styles.verdictHeadline}>
                  {verdict === 'hit' ? (
                    <>
                      <strong>{ownerName}님의 생각과 같아요!</strong>
                      <br />
                      본인도 {labelOf(ownerSelfAnswer!)}
                      {ownerSelfAnswer === 'EGEN' ? '이라고' : '라고'} 봤어요
                    </>
                  ) : (
                    <>
                      <strong>{ownerName}님의 생각과 달라요</strong>
                      <br />
                      본인을 {labelOf(ownerSelfAnswer!)}
                      {ownerSelfAnswer === 'EGEN' ? '이라고' : '라고'} 봤어요
                    </>
                  )}
                </h2>
              </section>
            )}

            <div className={styles.answersGroup}>
              <AnswerPairRow
                left={{
                  label: `${ownerName}님 본인의 답`,
                  value: ownerSelfAnswer ? labelOf(ownerSelfAnswer) : '-',
                }}
                right={{
                  label: '내 답',
                  value: labelOf(submittedVote),
                }}
              />

              <div className={styles.collapseWrapper}>
                <FriendAnswersCollapse friendVotes={friendVotes} highlightSelfId="me" />
              </div>
            </div>

            <div className={styles.nextArea}>
              <button type="button" className={styles.nextCta} onClick={handleNext}>
                {myLink.isLoading
                  ? '내 결과로 가기'
                  : myLink.data
                    ? '내 결과 보러 가기'
                    : '나도 투표 받아보기'}
              </button>
            </div>
          </div>
        </TetoEgenLayout>
        <Alert
          isOpen={alertState.isOpen}
          title={alertState.title}
          message={alertState.message}
          confirmText={alertState.confirmText}
          onConfirm={handleConfirm}
          showCloseButton={alertState.showCloseButton}
          closeOnDimmedClick={alertState.showCloseButton}
        />
      </>
    );
  }

  // 평가 진입 화면
  return (
    <>
      <TetoEgenLayout showClose>
        <BinaryChoiceCard
          question={
            <>
              <strong>{meta.ownerDisplayName}</strong>님은
              <br />
              테토인가요? 에겐인가요?
            </>
          }
          helper={`답하면 ${meta.ownerDisplayName}님 + 친구들의 답변이 공개됩니다`}
          left={{ value: 'TETO', label: '테토' }}
          right={{ value: 'EGEN', label: '에겐' }}
          onSelect={(v) => handleSelect(v as TetoEgenAnswer)}
          disabled={submit.isPending}
        />
      </TetoEgenLayout>
      <Alert
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        confirmText={alertState.confirmText}
        onConfirm={handleConfirm}
      />
    </>
  );
};

export default FriendFlow;

'use client';

import { type FC, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Alert } from '@/components/common/Alert/Alert';
import BinaryChoiceCard from '@/components/features/TetoEgen/BinaryChoiceCard';
import FriendAnswersCollapse from '@/components/features/TetoEgen/FriendAnswersCollapse';
import styles from '@/components/features/TetoEgen/FriendFlow.module.scss';
import TetoEgenLayout from '@/components/features/TetoEgen/TetoEgenLayout';
import { useScenario } from '@/components/features/TetoEgen/useScenario';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendTetoEgenMeta, useSubmitFriendVote } from '@/hooks/api/useAskTetoEgen';
import { useAlert } from '@/hooks/useAlert';
import { useToast } from '@/hooks/useToast';
import type { TetoEgenAnswer, TetoEgenFriendVotes } from '@/types/ask-teto-egen';

type FriendFlowProps = {
  token: string;
};

const labelOf = (a: TetoEgenAnswer) => (a === 'TETO' ? '테토' : '에겐');

const FriendFlow: FC<FriendFlowProps> = ({ token }) => {
  const router = useRouter();
  const scenario = useScenario();
  const { isLoggedIn, isLoading: isAuthLoading, requireLogin } = useAuth();
  const { toast, showToast } = useToast();
  const { alertState, showAlert, handleConfirm } = useAlert();

  const { data: meta, isLoading: isMetaLoading, error: metaError } = useFriendTetoEgenMeta(token);

  const submit = useSubmitFriendVote(token, scenario);

  const [submittedVote, setSubmittedVote] = useState<TetoEgenAnswer | null>(null);
  const [friendVotes, setFriendVotes] = useState<TetoEgenFriendVotes | null>(null);
  const [ownerDisplayName, setOwnerDisplayName] = useState<string>('');

  // 자기 토큰 진입 차단
  useEffect(() => {
    if (meta?.isOwn) {
      showAlert('자신에게 투표할 수 없습니다', {
        confirmText: '내 결과 보기',
        onConfirm: () => {
          router.replace(scenario ? `/ask/teto-egen/my?mock=${scenario}` : '/ask/teto-egen/my');
        },
      });
    }
  }, [meta?.isOwn, router, scenario, showAlert]);

  // 잘못된 토큰
  useEffect(() => {
    const status = (metaError as { response?: { status?: number } } | null)?.response?.status;
    if (status === 404) {
      showAlert('이 테스트 링크가 더 이상 유효하지 않아요', {
        confirmText: '나도 만들어보기',
        onConfirm: () => router.replace('/ask/teto-egen'),
      });
    }
  }, [metaError, router, showAlert]);

  const handleSelect = (vote: TetoEgenAnswer) => {
    if (!isLoggedIn) {
      requireLogin('default');
      return;
    }
    if (meta?.isOwn) {
      return;
    }

    submit.mutate(
      { vote },
      {
        onSuccess: (data) => {
          setSubmittedVote(data.myVote);
          setFriendVotes(data.friendVotes);
          setOwnerDisplayName(data.ownerDisplayName);
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
            });
            setSubmittedVote(body.data.myVote);
            return;
          }
          showToast('일시적인 에러가 발생했어요. 다시 시도해주세요');
        },
      }
    );
  };

  const handleNext = () => {
    router.push(scenario ? `/ask/teto-egen?mock=${scenario}` : '/ask/teto-egen');
  };

  if (isAuthLoading || isMetaLoading || !meta) {
    return (
      <TetoEgenLayout showClose>
        <div className={styles.loading}>잠시만요...</div>
      </TetoEgenLayout>
    );
  }

  // 결과 화면
  if (submittedVote && friendVotes) {
    return (
      <>
        <TetoEgenLayout showClose>
          <div className={styles.resultBody}>
            <div className={styles.resultHeader}>
              <p className={styles.label}>{ownerDisplayName || meta.displayName}님의 선택</p>
              <p className={styles.note}>
                나는 <strong>{labelOf(submittedVote)}</strong>로 봤어요
              </p>
            </div>

            <div className={styles.collapseWrapper}>
              <FriendAnswersCollapse friendVotes={friendVotes} highlightSelfId="me" />
            </div>

            <button type="button" className={styles.nextCta} onClick={handleNext}>
              다음
            </button>
            <p className={styles.nextHint}>당신은 어떤 사람일까요?</p>
          </div>
        </TetoEgenLayout>
        {toast.isVisible && <div className={styles.toast}>{toast.message}</div>}
        <Alert
          isOpen={alertState.isOpen}
          title={alertState.title}
          message={alertState.message}
          confirmText={alertState.confirmText}
          onConfirm={handleConfirm}
        />
      </>
    );
  }

  // 평가 진입 화면
  return (
    <>
      <TetoEgenLayout showClose>
        <div className={styles.intro}>
          <h1 className={styles.title}>
            <strong className={styles.name}>{meta.displayName}</strong>님은
            <br />
            테토인가요? 에겐인가요?
          </h1>
          <p className={styles.helper}>답하면 {meta.displayName}님 + 친구들의 답변이 공개됩니다</p>
        </div>

        <BinaryChoiceCard
          question=""
          left={{ value: 'TETO', label: '테토' }}
          right={{ value: 'EGEN', label: '에겐' }}
          onSelect={(v) => handleSelect(v as TetoEgenAnswer)}
          disabled={submit.isPending || meta.isOwn}
        />
      </TetoEgenLayout>
      {toast.isVisible && <div className={styles.toast}>{toast.message}</div>}
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

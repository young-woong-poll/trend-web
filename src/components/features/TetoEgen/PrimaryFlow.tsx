'use client';

import { type FC, useState } from 'react';

import { useRouter } from 'next/navigation';

import BinaryChoiceCard from '@/components/features/TetoEgen/BinaryChoiceCard';
import LinkGenerateForm from '@/components/features/TetoEgen/LinkGenerateForm';
import LinkShareCard from '@/components/features/TetoEgen/LinkShareCard';
import styles from '@/components/features/TetoEgen/PrimaryFlow.module.scss';
import TetoEgenLayout from '@/components/features/TetoEgen/TetoEgenLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateTetoEgenLink } from '@/hooks/api/useAskTetoEgen';
import { useToast } from '@/hooks/useToast';
import type { TetoEgenAnswer, TetoEgenPrediction } from '@/types/ask-teto-egen';

type Step = 'q1' | 'q2' | 'form' | 'share';

const labelOf = (a: TetoEgenAnswer) => (a === 'TETO' ? '테토' : '에겐');

// 한글 마지막 글자 받침 유무로 '이라고' / '라고' 분기
const withRago = (label: string) => {
  const last = label.charCodeAt(label.length - 1);
  const hasFinal = (last - 0xac00) % 28 !== 0;
  return `${label}${hasFinal ? '이라고' : '라고'}`;
};

const PrimaryFlow: FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { toast, showToast } = useToast();

  const [step, setStep] = useState<Step>('q1');
  const [selfAnswer, setSelfAnswer] = useState<TetoEgenAnswer | null>(null);
  const [selfPrediction, setSelfPrediction] = useState<TetoEgenPrediction | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const createLink = useCreateTetoEgenLink();

  const handleQ1 = (value: TetoEgenAnswer) => {
    setSelfAnswer(value);
    setStep('q2');
  };

  const handleQ2 = (value: 'YES' | 'NO') => {
    if (!selfAnswer) {
      return;
    }
    // UI 답변 → API 도메인 변환:
    // "그렇다" = 친구들도 내가 본 것과 같이 봄 → selfAnswer 그대로
    // "아니다" = 친구들은 반대로 봄 → 반대 값
    const opposite: TetoEgenAnswer = selfAnswer === 'TETO' ? 'EGEN' : 'TETO';
    setSelfPrediction(value === 'YES' ? selfAnswer : opposite);
    setStep('form');
  };

  const handleSubmit = (displayName: string) => {
    if (!selfAnswer || !selfPrediction) {
      return;
    }
    createLink.mutate(
      { displayName, selfAnswer, selfPrediction },
      {
        onSuccess: (data) => {
          setShareUrl(data.shareUrl);
          setStep('share');
        },
        onError: (err: unknown) => {
          const status = (
            err as {
              response?: {
                status?: number;
                data?: { code?: string; data?: { shareUrl?: string } };
              };
            }
          ).response?.status;
          const body = (
            err as { response?: { data?: { code?: string; data?: { shareUrl?: string } } } }
          ).response?.data;
          if (status === 409 && body?.data?.shareUrl) {
            // 이미 있는 링크 → 결과 화면으로
            router.replace('/ask/teto-egen/my');
            return;
          }
          showToast('일시적인 에러가 발생했어요. 다시 시도해주세요');
        },
      }
    );
  };

  const handleCopy = async () => {
    if (!shareUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('링크가 복사됐어요');
    } catch {
      showToast('복사에 실패했어요');
    }
  };

  return (
    <>
      <TetoEgenLayout
        showBack={step !== 'share'}
        showClose
        onBack={() => {
          if (step === 'q2') {
            setStep('q1');
          } else if (step === 'form') {
            setStep('q2');
          } else {
            // q1에서 뒤로 → 랜딩
            router.push('/ask/teto-egen');
          }
        }}
      >
        {step === 'q1' && (
          <BinaryChoiceCard
            question="당신은 테토인가요? 에겐인가요?"
            left={{ value: 'TETO', label: '테토' }}
            right={{ value: 'EGEN', label: '에겐' }}
            onSelect={(v) => handleQ1(v as TetoEgenAnswer)}
          />
        )}

        {step === 'q2' && selfAnswer && (
          <BinaryChoiceCard
            question={`친구들도 ${user?.nickname ? `${user.nickname}님을 ` : ''}${withRago(labelOf(selfAnswer))} 생각할까요?`}
            helper="다음 단계에서 친구들이 직접 답할 거예요"
            left={{ value: 'NO', label: '아니다' }}
            right={{ value: 'YES', label: '그렇다' }}
            onSelect={(v) => handleQ2(v as 'YES' | 'NO')}
          />
        )}

        {step === 'form' && selfAnswer && selfPrediction && (
          <LinkGenerateForm
            defaultName={user?.nickname ?? ''}
            selfAnswer={selfAnswer}
            selfPrediction={selfPrediction}
            onSubmit={handleSubmit}
            isSubmitting={createLink.isPending}
          />
        )}

        {step === 'share' && shareUrl && <LinkShareCard shareUrl={shareUrl} onCopy={handleCopy} />}
      </TetoEgenLayout>

      {toast.isVisible && <div className={styles.toast}>{toast.message}</div>}
    </>
  );
};

export default PrimaryFlow;

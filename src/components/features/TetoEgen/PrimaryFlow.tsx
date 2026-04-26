'use client';

import { type FC, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import BinaryChoiceCard from '@/components/features/TetoEgen/BinaryChoiceCard';
import LandingHero from '@/components/features/TetoEgen/LandingHero';
import LinkGenerateForm from '@/components/features/TetoEgen/LinkGenerateForm';
import LinkShareCard from '@/components/features/TetoEgen/LinkShareCard';
import styles from '@/components/features/TetoEgen/PrimaryFlow.module.scss';
import TetoEgenLayout from '@/components/features/TetoEgen/TetoEgenLayout';
import { useScenario } from '@/components/features/TetoEgen/useScenario';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateTetoEgenLink, useMyTetoEgenLink } from '@/hooks/api/useAskTetoEgen';
import { useToast } from '@/hooks/useToast';
import type { TetoEgenAnswer, TetoEgenPrediction } from '@/types/ask-teto-egen';

type Step = 'landing' | 'q1' | 'q2' | 'form' | 'share';

const labelOf = (a: TetoEgenAnswer) => (a === 'TETO' ? '테토' : '에겐');

const PrimaryFlow: FC = () => {
  const router = useRouter();
  const scenario = useScenario();
  const { isLoggedIn, isLoading: isAuthLoading, requireLogin, user } = useAuth();
  const { toast, showToast } = useToast();

  const [step, setStep] = useState<Step>('landing');
  const [selfAnswer, setSelfAnswer] = useState<TetoEgenAnswer | null>(null);
  const [selfPrediction, setSelfPrediction] = useState<TetoEgenPrediction | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // 로그인된 사용자: 이미 링크가 있는지 확인 → 있으면 /my 로 자동 이동
  const { data: myLink } = useMyTetoEgenLink(scenario, isLoggedIn);

  useEffect(() => {
    if (myLink) {
      router.replace(scenario ? `/ask/teto-egen/my?mock=${scenario}` : '/ask/teto-egen/my');
    }
  }, [myLink, router, scenario]);

  const createLink = useCreateTetoEgenLink();

  const handleStart = () => {
    if (!isLoggedIn) {
      requireLogin('default');
      return;
    }
    setStep('q1');
  };

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
            router.replace(scenario ? `/ask/teto-egen/my?mock=${scenario}` : '/ask/teto-egen/my');
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

  // 인증 로딩 중
  if (isAuthLoading) {
    return (
      <TetoEgenLayout showClose>
        <div className={styles.loading}>잠시만요...</div>
      </TetoEgenLayout>
    );
  }

  return (
    <>
      <TetoEgenLayout
        showBack={step !== 'landing' && step !== 'share'}
        showClose
        onBack={() => {
          if (step === 'q2') {
            setStep('q1');
          } else if (step === 'form') {
            setStep('q2');
          } else {
            setStep('landing');
          }
        }}
      >
        {step === 'landing' && <LandingHero onStart={handleStart} />}

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
            question={`친구들도 ${labelOf(selfAnswer)}라고 생각할까요?`}
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

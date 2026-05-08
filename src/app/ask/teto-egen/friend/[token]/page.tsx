'use client';

import { use, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Alert } from '@/components/common/Alert/Alert';
import FriendFlow from '@/components/features/TetoEgen/FriendFlow';
import TetoEgenLoading from '@/components/features/TetoEgen/TetoEgenLoading';
import { useFriendTetoEgenMeta } from '@/hooks/api/useAskTetoEgen';
import { useAlert } from '@/hooks/useAlert';

type PageProps = {
  params: Promise<{ token: string }>;
};

// 마운트 직후 GET /friend/{token} 결과 1회 평가:
// - pending: spinner
// - invalid: 404 alert → 랜딩으로
// - self: 자기 토큰 → /my로 즉시 replace
// - resolved: FriendFlow에 meta 넘겨 평가/결과 화면 분기
type Decision = 'pending' | 'invalid' | 'self' | 'resolved';

export default function AskTetoEgenFriendPage({ params }: PageProps) {
  const { token } = use(params);
  const router = useRouter();
  const { alertState, showAlert, handleConfirm } = useAlert();

  const { data: meta, isFetched, error } = useFriendTetoEgenMeta(token);

  const [decision, setDecision] = useState<Decision>('pending');

  useEffect(() => {
    if (decision !== 'pending') {
      return;
    }
    if (!isFetched) {
      return;
    }

    const status = (error as { response?: { status?: number } } | null)?.response?.status;
    if (status === 404) {
      setDecision('invalid');
      showAlert('이 테스트 링크가 더 이상 유효하지 않아요', {
        confirmText: '나도 만들어보기',
        onConfirm: () => router.replace('/ask/teto-egen'),
      });
      return;
    }
    if (meta?.isOwn) {
      setDecision('self');
      router.replace('/ask/teto-egen/my');
      return;
    }
    setDecision('resolved');
  }, [decision, isFetched, error, meta, router, showAlert]);

  if (decision !== 'resolved' || !meta) {
    return (
      <>
        <TetoEgenLoading />
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

  return <FriendFlow token={token} meta={meta} />;
}

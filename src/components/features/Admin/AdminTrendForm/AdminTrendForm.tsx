'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useForm } from 'react-hook-form';

import { Button } from '@/components/common/Button';
import styles from '@/components/features/Admin/AdminTrendForm/AdminTrendForm.module.scss';
import { AnswerTypeSection } from '@/components/features/Admin/AdminTrendForm/AnswerTypeSection';
import { BasicInfoSection } from '@/components/features/Admin/AdminTrendForm/BasicInfoSection';
import { ElectionListSection } from '@/components/features/Admin/AdminTrendForm/ElectionListSection';
import { ResultLabelSection } from '@/components/features/Admin/AdminTrendForm/ResultLabelSection';
import { ResultTypeSection } from '@/components/features/Admin/AdminTrendForm/ResultTypeSection';
import { useModal } from '@/contexts/ModalContext';
import { useCreateTrend } from '@/hooks/api/useAdmin';
import { useElectionList } from '@/hooks/useElectionList';
import type { ElectionDetail } from '@/types';
import type { CreateTrendRequest } from '@/types/trend';

type TFormData = {
  title: string;
  label: string;
  imageUrl: string;
  electionIdList: string[];
  electionDetailMap: Record<string, ElectionDetail>;
  resultLabel: string;
  resultType: { key: string; label: string }[];
  answerType: string[];
};

export const AdminTrendForm = () => {
  const { showAlert } = useModal();
  const router = useRouter();
  const { mutateAsync: createTrend, isPending } = useCreateTrend();

  const { register, handleSubmit, setValue, watch } = useForm<CreateTrendRequest>({
    defaultValues: {
      title: '',
      label: '',
      imageUrl: '',
      electionIds: [],
      meta: {
        resultLabel: '당신의 성향은',
        resultType: [],
        answerType: [],
      },
    },
  });

  // 선거 목록 관리 (공유 필요)
  const { electionDataset, combinations, addElectionId, removeElectionId, isFetchingElection } =
    useElectionList();

  useEffect(() => {
    if (combinations.length > 0) {
      const initialResultType = combinations.map((combination) => ({
        key: combination.join('/'),
        label: '',
      }));

      setValue('meta.resultType', initialResultType);
    }
  }, [combinations.length]);

  const onSubmit = async (data: CreateTrendRequest) => {
    // ResultType 검증 (조합 개수와 resultType 개수가 일치하는지)
    if (data.meta.resultType.length !== combinations.length) {
      showAlert(`모든 결과 타입의 Label을 입력해주세요.`);
      return;
    }

    // 빈 label 검증
    const emptyLabels = data.meta.resultType.filter((rt) => !rt.label.trim());
    if (emptyLabels.length > 0) {
      showAlert(`모든 결과 타입의 Label을 입력해주세요. (${emptyLabels.length}개 미입력)`);
      return;
    }

    // 이미지 검증, 답변타입 검증 추가

    try {
      await createTrend(data);

      showAlert(`트렌드가 생성되었습니다! 제목: ${data.title}`, {
        onConfirm: () => {
          router.push('/admin/trend');
        },
      });
    } catch (error: any) {
      showAlert(`트렌드 생성 실패: ${error?.message || '알 수 없는 오류'}`);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>트렌드 생성</h1>
        <p className={styles.subtitle}>새로운 트렌드를 생성합니다</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {/* 기본 정보 */}
        <BasicInfoSection register={register} setValue={setValue} watch={watch} />

        {/* 연결된 선거 ID */}
        <ElectionListSection
          electionDataset={electionDataset}
          isFetchingElection={isFetchingElection}
          addElectionId={addElectionId}
          removeElectionId={removeElectionId}
        />

        {/* 결과 상단문구 */}
        <ResultLabelSection register={register} />

        {/* 결과 타입 */}
        <ResultTypeSection
          electionDataset={electionDataset}
          combinations={combinations}
          register={register}
          setValue={setValue}
          watch={watch}
        />

        {/* 답변 타입 */}
        <AnswerTypeSection setValue={setValue} watch={watch} />

        {/* Submit */}
        <div className={styles.actions}>
          <Button type="submit" variant="gradient" height={48} fullWidth disabled={isPending}>
            {isPending ? '생성 중...' : '트렌드 생성'}
          </Button>
        </div>
      </form>
    </div>
  );
};

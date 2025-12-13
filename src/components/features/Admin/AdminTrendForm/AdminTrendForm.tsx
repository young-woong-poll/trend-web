'use client';

import { useState } from 'react';

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
import { generateCombinations } from '@/lib/trendCombinations';
import type { ElectionDetail } from '@/types';
import type { LabelRequest } from '@/types/trend';

export type TrendAliasCheckStatus = 'idle' | 'checking' | 'available' | 'duplicate' | 'unchecked';

export type TFormData = {
  alias: string;
  title: string;
  label: string;
  imageUrl: string;
  electionIdList: string[];
  electionDetailMap: Record<string, ElectionDetail>;
  resultLabel: string;
  resultType: Record<string, string>;
  answerType: LabelRequest[];
};

export const AdminTrendForm = () => {
  const { showAlert } = useModal();
  const { mutateAsync: createTrend, isPending } = useCreateTrend();
  const [trendAliasCheckStatus, setTrendAliasCheckStatus] = useState<TrendAliasCheckStatus>('idle');

  const { register, handleSubmit, setValue, watch } = useForm<TFormData>({
    defaultValues: {
      alias: '',
      title: '',
      label: '',
      imageUrl: '',
      electionIdList: [],
      electionDetailMap: {},
      resultLabel: '당신의 성향은',
      resultType: {},
      answerType: [],
    },
  });

  const onSubmit = async (data: TFormData) => {
    const { alias, imageUrl, electionIdList, electionDetailMap, resultType, answerType } = data;

    if (!alias.trim()) {
      showAlert('Trend Alias를 입력해주세요.');

      return;
    }

    if (trendAliasCheckStatus !== 'available') {
      showAlert('Trend Alias 중복 확인이 필요합니다.');

      return;
    }

    if (!imageUrl) {
      showAlert('썸네일 이미지를 등록해주세요.');

      return;
    }

    if (electionIdList.length === 0) {
      showAlert('최소 하나 이상의 선거를 추가해주세요.');

      return;
    }

    const combinations = generateCombinations(electionIdList.map((id) => electionDetailMap[id]));

    const newResultType = Object.entries(resultType).map(([key, label]) => ({ key, label }));
    const hasEmptyLabel = newResultType.some((rt) => !rt.label.trim());

    if (newResultType.length !== combinations.length || hasEmptyLabel) {
      showAlert(`모든 결과 타입의 Label을 입력해주세요.`);

      return;
    }

    // 답변타입 검증 추가)
    if (
      answerType.length < electionIdList.length + 1 ||
      answerType.some((at) => !at.label.trim())
    ) {
      showAlert(
        `모든 답변 타입의 Label을 입력해주세요. (${answerType.length}/${electionIdList.length + 1}개 입력됨)`
      );

      return;
    }

    try {
      const request = {
        alias: data.alias.trim(),
        title: data.title,
        label: data.label,
        imageUrl: data.imageUrl,
        electionIds: electionIdList,
        meta: {
          resultLabel: data.resultLabel,
          resultType: newResultType,
          answerType: data.answerType,
        },
      };

      await createTrend(request);

      showAlert(`트렌드가 생성되었습니다! 제목: ${data.title}`, {
        onConfirm: () => window.location.reload(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      showAlert(`트렌드 생성 실패: ${errorMessage}`);
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
        <BasicInfoSection
          register={register}
          setValue={setValue}
          watch={watch}
          checkStatus={trendAliasCheckStatus}
          setCheckStatus={setTrendAliasCheckStatus}
        />

        {/* 연결된 선거 ID */}
        <ElectionListSection setValue={setValue} watch={watch} />

        {watch('electionIdList').length === 0 ? (
          <div className={styles.noElectionBanner}>
            <p>선거 ID를 입력하시오</p>
          </div>
        ) : (
          <>
            {/* 결과 상단문구 */}
            <ResultLabelSection register={register} />

            {/* 결과 타입 */}
            <ResultTypeSection setValue={setValue} watch={watch} />

            {/* 답변 타입 */}
            <AnswerTypeSection setValue={setValue} watch={watch} />
          </>
        )}

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

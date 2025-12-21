'use client';

import { useState, useEffect } from 'react';

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
import { useFetchElection } from '@/hooks/api';
import { useCreateTrend } from '@/hooks/api/useAdmin';
import { generateCombinations } from '@/lib/trendCombinations';
import type { ElectionDetail } from '@/types';
import type { LabelRequest, UpdateTrendRequest, AdminTrendResponse } from '@/types/trend';

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
  visible?: boolean;
};

interface AdminTrendFormProps {
  mode?: 'create' | 'edit';
  trend?: AdminTrendResponse;
  onSubmit?: (data: UpdateTrendRequest) => void;
  isSubmitting?: boolean;
}

export const AdminTrendForm = ({
  mode = 'create',
  trend,
  onSubmit: onSubmitProp,
  isSubmitting: isSubmittingProp,
}: AdminTrendFormProps = {}) => {
  const router = useRouter();
  const { showAlert } = useModal();
  const { mutateAsync: createTrend, isPending } = useCreateTrend();
  const { mutateAsync: fetchElection } = useFetchElection();
  const [trendAliasCheckStatus, setTrendAliasCheckStatus] = useState<TrendAliasCheckStatus>(
    mode === 'edit' ? 'available' : 'idle'
  );

  const { register, handleSubmit, setValue, watch, reset } = useForm<TFormData>({
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
      visible: true,
    },
  });

  // Edit 모드일 때 초기 데이터 로드
  useEffect(() => {
    if (mode === 'edit' && trend) {
      // resultType을 Record<string, string> 형태로 변환
      const resultTypeMap =
        trend.meta?.resultTypes?.reduce(
          (acc, rt) => {
            acc[rt.key] = rt.label;
            return acc;
          },
          {} as Record<string, string>
        ) || {};

      // 선거 상세 정보 로드
      const loadElectionDetails = async () => {
        const electionDetailMap: Record<string, ElectionDetail> = {};

        for (const electionId of trend.electionIds) {
          try {
            const detail = await fetchElection(electionId);
            electionDetailMap[electionId] = detail;
          } catch (error) {
            console.error(`Failed to load election ${electionId}:`, error);
          }
        }

        reset({
          alias: trend.alias,
          title: trend.title,
          label: trend.label || '',
          imageUrl: trend.imageUrl || '',
          electionIdList: trend.electionIds,
          electionDetailMap,
          resultLabel: trend.meta?.resultLabel || '당신의 성향은',
          resultType: resultTypeMap,
          answerType: trend.meta?.compareTypes || [],
          visible: trend.visible,
        });
      };

      void loadElectionDetails();
    }
  }, [mode, trend, reset, fetchElection]);

  const onSubmit = async (data: TFormData) => {
    const { alias, imageUrl, electionIdList, electionDetailMap, resultType, answerType } = data;

    if (!alias.trim()) {
      showAlert('Trend Alias를 입력해주세요.');

      return;
    }

    if (mode === 'create' && trendAliasCheckStatus !== 'available') {
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

    const electionDetails = electionIdList
      .map((id) => electionDetailMap[id])
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      .filter((detail): detail is ElectionDetail => detail !== undefined);

    if (electionDetails.length !== electionIdList.length) {
      showAlert('일부 선거 정보를 불러오지 못했습니다. 페이지를 새로고침해주세요.');

      return;
    }

    const combinations = generateCombinations(electionDetails);

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

    const request: UpdateTrendRequest = {
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
      isVisible: data.visible,
    };

    // Edit 모드일 경우 외부에서 전달된 onSubmit 실행
    if (mode === 'edit' && onSubmitProp) {
      onSubmitProp(request);
      return;
    }

    // Create 모드일 경우 기존 로직 실행
    try {
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
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>{mode === 'edit' ? '트렌드 수정' : '트렌드 생성'}</h1>
            <p className={styles.subtitle}>
              {mode === 'edit' ? '트렌드 정보를 수정합니다' : '새로운 트렌드를 생성합니다'}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin/trend')}>
            트렌드 목록
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {/* 기본 정보 */}
        <BasicInfoSection
          register={register}
          setValue={setValue}
          watch={watch}
          checkStatus={trendAliasCheckStatus}
          setCheckStatus={setTrendAliasCheckStatus}
          mode={mode}
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
          <Button
            type="submit"
            variant="gradient"
            height={48}
            fullWidth
            disabled={mode === 'create' ? isPending : isSubmittingProp}
          >
            {mode === 'edit'
              ? isSubmittingProp
                ? '수정 중...'
                : '트렌드 수정'
              : isPending
                ? '생성 중...'
                : '트렌드 생성'}
          </Button>
        </div>
      </form>
    </div>
  );
};

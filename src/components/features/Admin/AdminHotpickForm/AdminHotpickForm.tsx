'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useForm } from 'react-hook-form';

import BackIcon from '@/assets/icon/BackIcon';
import { Button } from '@/components/common/Button';
import styles from '@/components/features/Admin/AdminHotpickForm/AdminHotpickForm.module.scss';
import { BasicInfoSection } from '@/components/features/Admin/AdminHotpickForm/BasicInfoSection';
import { ElectionListSection } from '@/components/features/Admin/AdminHotpickForm/ElectionListSection';
import { useModal } from '@/contexts/ModalContext';
import { useCreateHotpick } from '@/hooks/api/useAdmin';
import type {
  AdminHotpickResponse,
  UpdateHotpickRequest,
  HotpickType,
  CategoryCode,
} from '@/types/hotpick';

export type HotpickAliasCheckStatus = 'idle' | 'checking' | 'available' | 'duplicate' | 'unchecked';

export type TFormData = {
  alias: string;
  title: string;
  label: string;
  type: HotpickType;
  imageUrls: string[];
  electionIdList: string[];
  categoryCodes: CategoryCode[];
  deadline?: string;
  visible?: boolean;
};

interface AdminHotpickFormProps {
  mode?: 'create' | 'edit';
  hotpick?: AdminHotpickResponse;
  onSubmit?: (data: UpdateHotpickRequest) => void;
  isSubmitting?: boolean;
}

export const AdminHotpickForm = ({
  mode = 'create',
  hotpick,
  onSubmit: onSubmitProp,
  isSubmitting: isSubmittingProp,
}: AdminHotpickFormProps = {}) => {
  const router = useRouter();
  const { showAlert } = useModal();
  const { mutateAsync: createHotpick, isPending } = useCreateHotpick();
  const [hotpickAliasCheckStatus, setHotpickAliasCheckStatus] = useState<HotpickAliasCheckStatus>(
    mode === 'edit' ? 'available' : 'idle'
  );

  const { register, handleSubmit, setValue, watch, reset } = useForm<TFormData>({
    defaultValues: {
      alias: '',
      title: '',
      label: '',
      type: 'SINGLE',
      imageUrls: [],
      electionIdList: [],
      categoryCodes: [],
      deadline: undefined,
      visible: true,
    },
  });

  const hotpickType = watch('type');

  // Edit 모드일 때 초기 데이터 로드
  useEffect(() => {
    if (mode === 'edit' && hotpick) {
      reset({
        alias: hotpick.alias,
        title: hotpick.title,
        label: hotpick.label || '',
        type: hotpick.type || 'SINGLE',
        imageUrls: hotpick.imageUrls || [],
        electionIdList: hotpick.electionIds,
        categoryCodes: hotpick.categoryCodes || [],
        deadline: hotpick.deadline,
        visible: hotpick.visible,
      });
    }
  }, [mode, hotpick, reset]);

  const onSubmit = async (data: TFormData) => {
    const { alias, imageUrls, electionIdList } = data;

    if (!alias.trim()) {
      showAlert('Hotpick Alias를 입력해주세요.');
      return;
    }

    if (mode === 'create' && hotpickAliasCheckStatus !== 'available') {
      showAlert('Hotpick Alias 중복 확인이 필요합니다.');
      return;
    }

    // BUNDLE 타입 검증
    if (data.type === 'BUNDLE') {
      const validImages = imageUrls.filter(Boolean);
      if (validImages.length < 1) {
        showAlert('BUNDLE 타입은 커버 이미지를 1장 이상 등록해주세요.');
        return;
      }

      if (electionIdList.length < 2) {
        showAlert('BUNDLE 타입은 선거를 2개 이상 등록해주세요.');
        return;
      }
    }

    // SINGLE 타입 검증
    if (data.type === 'SINGLE') {
      if (electionIdList.length !== 1) {
        showAlert('SINGLE 타입은 선거를 1개만 등록해주세요.');
        return;
      }
    }

    const request: UpdateHotpickRequest = {
      alias: data.alias.trim(),
      title: data.title,
      label: data.label,
      type: data.type,
      imageUrls: data.type === 'BUNDLE' ? imageUrls.filter(Boolean) : [],
      electionIds: electionIdList,
      categoryCodes: data.categoryCodes.length > 0 ? data.categoryCodes : undefined,
      deadline: data.deadline || undefined,
      isVisible: data.visible,
    };

    // Edit 모드일 경우 외부에서 전달된 onSubmit 실행
    if (mode === 'edit' && onSubmitProp) {
      onSubmitProp(request);
      return;
    }

    // Create 모드일 경우 기존 로직 실행
    try {
      await createHotpick(request);

      showAlert(`핫픽이 생성되었습니다! 제목: ${data.title}`, {
        onConfirm: () => {
          window.location.href = '/admin/hotpick';
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      showAlert(`핫픽 생성 실패: ${errorMessage}`);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>{mode === 'edit' ? '핫픽 수정' : '핫픽 생성'}</h1>
            <p className={styles.subtitle}>
              {mode === 'edit' ? '핫픽 정보를 수정합니다' : '새로운 핫픽을 생성합니다'}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin/hotpick')}>
            <BackIcon />
            뒤로
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {/* 핫픽 유형 선택 */}
        <section className={styles.typeSection}>
          <h2 className={styles.sectionTitle}>핫픽 유형</h2>
          <div className={styles.radioGroup}>
            <label
              className={`${styles.radioLabel} ${hotpickType === 'BUNDLE' ? styles.active : ''}`}
            >
              <input
                type="radio"
                value="BUNDLE"
                checked={hotpickType === 'BUNDLE'}
                onChange={() => setValue('type', 'BUNDLE')}
                className={styles.radioInput}
              />
              <span className={styles.radioText}>BUNDLE</span>
              <span className={styles.radioDesc}>묶음 투표 (선거 2개 이상)</span>
            </label>
            <label
              className={`${styles.radioLabel} ${hotpickType === 'SINGLE' ? styles.active : ''}`}
            >
              <input
                type="radio"
                value="SINGLE"
                checked={hotpickType === 'SINGLE'}
                onChange={() => setValue('type', 'SINGLE')}
                className={styles.radioInput}
              />
              <span className={styles.radioText}>SINGLE</span>
              <span className={styles.radioDesc}>단일 투표 (선거 1개)</span>
            </label>
          </div>
        </section>

        {/* 기본 정보 */}
        <BasicInfoSection
          register={register}
          setValue={setValue}
          watch={watch}
          checkStatus={hotpickAliasCheckStatus}
          setCheckStatus={setHotpickAliasCheckStatus}
          mode={mode}
          hotpickType={hotpickType}
        />

        {/* 연결된 선거 */}
        <ElectionListSection setValue={setValue} watch={watch} hotpickType={hotpickType} />

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
                : '핫픽 수정'
              : isPending
                ? '생성 중...'
                : '핫픽 생성'}
          </Button>
        </div>
      </form>
    </div>
  );
};

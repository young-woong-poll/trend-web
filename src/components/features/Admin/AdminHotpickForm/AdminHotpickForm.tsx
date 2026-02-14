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
import type { AdminHotpickResponse, UpdateHotpickRequest } from '@/types/hotpick';

export type HotpickAliasCheckStatus = 'idle' | 'checking' | 'available' | 'duplicate' | 'unchecked';

export type TFormData = {
  alias: string;
  title: string;
  label: string;
  imageUrls: [string, string];
  electionIdList: string[];
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
      imageUrls: ['', ''],
      electionIdList: [],
      visible: true,
    },
  });

  // Edit 모드일 때 초기 데이터 로드
  useEffect(() => {
    if (mode === 'edit' && hotpick) {
      reset({
        alias: hotpick.alias,
        title: hotpick.title,
        label: hotpick.label || '',
        imageUrls: [hotpick.imageUrls?.[0] || '', hotpick.imageUrls?.[1] || ''],
        electionIdList: hotpick.electionIds,
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

    if (!imageUrls[0] || !imageUrls[1]) {
      showAlert('썸네일 이미지를 모두 등록해주세요.');
      return;
    }

    if (electionIdList.length !== 5) {
      showAlert('선거 5개를 등록해주세요.');
      return;
    }

    const request: UpdateHotpickRequest = {
      alias: data.alias.trim(),
      title: data.title,
      label: data.label,
      imageUrls: data.imageUrls,
      electionIds: electionIdList,
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
        {/* 기본 정보 */}
        <BasicInfoSection
          register={register}
          setValue={setValue}
          watch={watch}
          checkStatus={hotpickAliasCheckStatus}
          setCheckStatus={setHotpickAliasCheckStatus}
          mode={mode}
        />

        {/* 연결된 선거 ID */}
        <ElectionListSection setValue={setValue} watch={watch} />

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

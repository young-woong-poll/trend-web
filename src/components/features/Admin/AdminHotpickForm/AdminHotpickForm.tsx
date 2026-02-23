'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useForm } from 'react-hook-form';

import BackIcon from '@/assets/icon/BackIcon';
import { Button } from '@/components/common/Button';
import styles from '@/components/features/Admin/AdminHotpickForm/AdminHotpickForm.module.scss';
import { BasicInfoSection } from '@/components/features/Admin/AdminHotpickForm/BasicInfoSection';
import { ElectionInlineSection } from '@/components/features/Admin/AdminHotpickForm/ElectionListSection';
import { useModal } from '@/contexts/ModalContext';
import type {
  AdminHotpickDetailResponse,
  CreateHotpickRequest,
  UpdateHotpickRequest,
} from '@/generated/models';
import { useCreateHotpick } from '@/hooks/api/useAdmin';
import type { HotpickType } from '@/types/hotpick';

export type HotpickAliasCheckStatus = 'idle' | 'checking' | 'available' | 'duplicate' | 'unchecked';

/** 인라인 선거 옵션 아이템 */
export type TElectionItem = {
  title: string;
  imageUrl?: string;
};

/** 인라인 선거 데이터 */
export type TElectionData = {
  title: string;
  imageUrl?: string;
  items: TElectionItem[];
};

export type TFormData = {
  slug: string;
  type: HotpickType;
  imageUrl: string;
  categoryIds: number[];
  expiredAt?: string;
  visible?: boolean;
  election: TElectionData;
};

interface AdminHotpickFormProps {
  mode?: 'create' | 'edit';
  hotpick?: AdminHotpickDetailResponse;
  onSubmit?: (data: UpdateHotpickRequest) => void;
  isSubmitting?: boolean;
}

const DEFAULT_ELECTION: TElectionData = {
  title: '',
  items: [{ title: '' }, { title: '' }],
};

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
      slug: '',
      type: 'SINGLE',
      imageUrl: '',
      categoryIds: [],
      expiredAt: undefined,
      visible: true,
      election: DEFAULT_ELECTION,
    },
  });

  const hotpickType = watch('type');

  // Edit 모드일 때 초기 데이터 로드
  useEffect(() => {
    if (mode === 'edit' && hotpick) {
      const election = hotpick.election;
      reset({
        slug: hotpick.slug ?? '',
        type: (hotpick.type as HotpickType) || 'SINGLE',
        imageUrl: hotpick.imageUrl ?? '',
        categoryIds:
          hotpick.categories
            ?.map((c) => c.id)
            .filter((id): id is number => id !== null && id !== undefined) ?? [],
        expiredAt: hotpick.expiredAt,
        visible: hotpick.visible,
        election: election
          ? {
              title: election.title ?? '',
              imageUrl: election.imageUrl,
              items:
                election.items && election.items.length > 0
                  ? election.items.map((item) => ({
                      title: item.title ?? '',
                      imageUrl: item.imageUrl,
                    }))
                  : DEFAULT_ELECTION.items,
            }
          : DEFAULT_ELECTION,
      });
    }
  }, [mode, hotpick, reset]);

  const buildRequest = (data: TFormData): CreateHotpickRequest => ({
    type: data.type as CreateHotpickRequest['type'],
    slug: data.slug.trim(),
    visible: data.visible ?? true,
    imageUrl: data.imageUrl || undefined,
    expiredAt: data.expiredAt || undefined,
    categoryIds: data.categoryIds.length > 0 ? data.categoryIds : undefined,
    election: {
      title: data.election.title,
      imageUrl: data.election.imageUrl || undefined,
      items: data.election.items
        .filter((item) => item.title.trim())
        .map((item, index) => ({
          displayOrder: index,
          title: item.title,
          imageUrl: item.imageUrl || undefined,
        })),
    },
  });

  const onSubmit = async (data: TFormData) => {
    if (!data.slug.trim()) {
      showAlert('Hotpick Slug를 입력해주세요.');
      return;
    }

    if (mode === 'create' && hotpickAliasCheckStatus !== 'available') {
      showAlert('Hotpick Slug 중복 확인이 필요합니다.');
      return;
    }

    // 선거 제목 검증
    if (!data.election.title.trim()) {
      showAlert('선거 제목을 입력해주세요.');
      return;
    }

    // 옵션 검증 (최소 2개)
    const validItems = data.election.items.filter((item) => item.title.trim());
    if (validItems.length < 2) {
      showAlert('선거 옵션을 2개 이상 입력해주세요.');
      return;
    }

    const request = buildRequest(data);

    // Edit 모드일 경우 외부에서 전달된 onSubmit 실행
    if (mode === 'edit' && onSubmitProp) {
      onSubmitProp(request as UpdateHotpickRequest);
      return;
    }

    // Create 모드일 경우 기존 로직 실행
    try {
      await createHotpick(request);

      showAlert('핫픽이 생성되었습니다!', {
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
          hotpickType={hotpickType}
        />

        {/* 인라인 선거 편집 */}
        <ElectionInlineSection setValue={setValue} watch={watch} />

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

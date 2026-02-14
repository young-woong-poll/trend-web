'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useForm, useFieldArray } from 'react-hook-form';

import BackIcon from '@/assets/icon/BackIcon';
import { Button } from '@/components/common/Button';
import { ImageUpload } from '@/components/common/ImageUpload';
import styles from '@/components/features/Admin/AdminElectionForm/AdminElectionForm.module.scss';
import { useModal } from '@/contexts/ModalContext';
import { useCreateElection, useUpdateElection } from '@/hooks/api/useElection';
import type { Election, VoteType } from '@/types/election';

interface OptionFormData {
  title: string;
  imageUrl: string;
  order: number;
}

export interface ElectionFormData {
  title: string;
  voteType: VoteType;
  mainImageUrl: string;
  options: OptionFormData[];
}

interface AdminElectionFormProps {
  mode?: 'create' | 'edit';
  election?: Election;
}

export const AdminElectionForm = ({ mode = 'create', election }: AdminElectionFormProps) => {
  const router = useRouter();
  const { showAlert } = useModal();
  const { mutateAsync: createElection, isPending: isCreating } = useCreateElection();
  const { mutateAsync: updateElection, isPending: isUpdating } = useUpdateElection();

  const { register, handleSubmit, setValue, watch, control, reset } = useForm<ElectionFormData>({
    defaultValues: {
      title: '',
      voteType: 'IMAGE',
      mainImageUrl: '',
      options: [
        { title: '', imageUrl: '', order: 0 },
        { title: '', imageUrl: '', order: 1 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  });

  const voteType = watch('voteType');
  const isPending = mode === 'create' ? isCreating : isUpdating;

  // Edit 모드에서 초기 데이터 로드
  useEffect(() => {
    if (mode === 'edit' && election) {
      reset({
        title: election.title,
        voteType: election.voteType,
        mainImageUrl: election.mainImageUrl || '',
        options: election.options.map((opt) => ({
          title: opt.title,
          imageUrl: opt.imageUrl || '',
          order: opt.order,
        })),
      });
    }
  }, [mode, election, reset]);

  const handleVoteTypeChange = (newType: VoteType) => {
    setValue('voteType', newType);
    if (newType === 'TEXT') {
      // TEXT로 변경 시 옵션 이미지 클리어
      fields.forEach((_, index) => {
        setValue(`options.${index}.imageUrl`, '');
      });
    } else {
      // IMAGE로 변경 시 메인 이미지 클리어
      setValue('mainImageUrl', '');
    }
  };

  const handleAddOption = () => {
    if (fields.length >= 4) {
      showAlert('옵션은 최대 4개까지 추가할 수 있습니다.');
      return;
    }
    append({ title: '', imageUrl: '', order: fields.length });
  };

  const handleRemoveOption = (index: number) => {
    if (fields.length <= 2) {
      showAlert('옵션은 최소 2개 이상이어야 합니다.');
      return;
    }
    remove(index);
    // order 재정렬
    fields.forEach((_, i) => {
      if (i >= index) {
        setValue(`options.${i}.order`, i);
      }
    });
  };

  const onSubmit = async (data: ElectionFormData) => {
    // 검증
    if (!data.title.trim()) {
      showAlert('질문(제목)을 입력해주세요.');
      return;
    }

    if (data.voteType === 'TEXT' && !data.mainImageUrl) {
      showAlert('TEXT 유형은 메인 이미지가 필수입니다.');
      return;
    }

    if (data.voteType === 'IMAGE') {
      const missingImage = data.options.some((opt) => !opt.imageUrl);
      if (missingImage) {
        showAlert('IMAGE 유형은 모든 옵션에 이미지가 필수입니다.');
        return;
      }
    }

    const emptyTitle = data.options.some((opt) => !opt.title.trim());
    if (emptyTitle) {
      showAlert('모든 옵션의 제목을 입력해주세요.');
      return;
    }

    const request = {
      title: data.title.trim(),
      voteType: data.voteType,
      mainImageUrl: data.voteType === 'TEXT' ? data.mainImageUrl : undefined,
      options: data.options.map((opt, index) => ({
        title: opt.title.trim(),
        imageUrl: data.voteType === 'IMAGE' ? opt.imageUrl : undefined,
        order: index,
      })),
    };

    try {
      if (mode === 'edit' && election) {
        await updateElection({ electionId: election.id, data: request });
      } else {
        await createElection(request);
      }
    } catch {
      // 에러는 hook에서 처리
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>{mode === 'edit' ? '선거 수정' : '선거 생성'}</h1>
            <p className={styles.subtitle}>
              {mode === 'edit' ? '선거 정보를 수정합니다' : '새로운 선거를 생성합니다'}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin/election')}>
            <BackIcon />
            뒤로
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {/* 투표 유형 선택 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>투표 유형</h2>
          <div className={styles.radioGroup}>
            <label className={`${styles.radioLabel} ${voteType === 'IMAGE' ? styles.active : ''}`}>
              <input
                type="radio"
                value="IMAGE"
                checked={voteType === 'IMAGE'}
                onChange={() => handleVoteTypeChange('IMAGE')}
                className={styles.radioInput}
              />
              <span className={styles.radioText}>IMAGE</span>
              <span className={styles.radioDesc}>옵션마다 이미지 + 텍스트</span>
            </label>
            <label className={`${styles.radioLabel} ${voteType === 'TEXT' ? styles.active : ''}`}>
              <input
                type="radio"
                value="TEXT"
                checked={voteType === 'TEXT'}
                onChange={() => handleVoteTypeChange('TEXT')}
                className={styles.radioInput}
              />
              <span className={styles.radioText}>TEXT</span>
              <span className={styles.radioDesc}>메인 이미지 1장 + 텍스트 옵션</span>
            </label>
          </div>
        </section>

        {/* 질문 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>질문</h2>
          <div className={styles.field}>
            <input
              type="text"
              {...register('title', { required: true })}
              className={styles.input}
              placeholder="짜장면 vs 짬뽕, 당신의 선택은?"
            />
          </div>
        </section>

        {/* TEXT 유형: 메인 이미지 */}
        {voteType === 'TEXT' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              메인 이미지 <span className={styles.required}>*</span>
            </h2>
            <p className={styles.sectionDescription}>TEXT 유형의 대표 이미지입니다</p>
            <ImageUpload
              value={watch('mainImageUrl') || null}
              onChange={(url) => setValue('mainImageUrl', url || '')}
              uploadOptions={{ prefix: 'election' }}
            />
          </section>
        )}

        {/* 옵션 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>옵션 ({fields.length}/4)</h2>
              <p className={styles.sectionDescription}>최소 2개, 최대 4개의 옵션을 등록합니다</p>
            </div>
            {fields.length < 4 && (
              <Button type="button" variant="outline" size="small" onClick={handleAddOption}>
                + 옵션 추가
              </Button>
            )}
          </div>

          <div className={styles.optionList}>
            {fields.map((field, index) => (
              <div key={field.id} className={styles.optionItem}>
                <div className={styles.optionHeader}>
                  <span className={styles.optionNumber}>옵션 {index + 1}</span>
                  {fields.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className={styles.removeButton}
                    >
                      삭제
                    </button>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>제목</label>
                  <input
                    type="text"
                    {...register(`options.${index}.title`, { required: true })}
                    className={styles.input}
                    placeholder={`옵션 ${index + 1} 제목`}
                  />
                </div>

                {voteType === 'IMAGE' && (
                  <div className={styles.field}>
                    <label className={styles.label}>
                      이미지 <span className={styles.required}>*</span>
                    </label>
                    <ImageUpload
                      value={watch(`options.${index}.imageUrl`) || null}
                      onChange={(url) => setValue(`options.${index}.imageUrl`, url || '')}
                      uploadOptions={{ prefix: 'election' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Submit */}
        <div className={styles.actions}>
          <Button type="submit" variant="gradient" height={48} fullWidth disabled={isPending}>
            {isPending
              ? mode === 'edit'
                ? '수정 중...'
                : '생성 중...'
              : mode === 'edit'
                ? '선거 수정'
                : '선거 생성'}
          </Button>
        </div>
      </form>
    </div>
  );
};

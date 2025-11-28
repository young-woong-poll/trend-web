'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/common/Button';
import styles from '@/components/features/Admin/AdminTrendForm.module.scss';
import { useCreateTrend } from '@/hooks/api/useAdmin';
import { useAlert } from '@/hooks/useAlert';
import type { CreateTrendRequest } from '@/types/trend';

export const AdminTrendForm = () => {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { mutate: createTrend, isPending } = useCreateTrend();

  const [formData, setFormData] = useState<CreateTrendRequest>({
    title: '',
    label: '',
    imageUrl: '',
    electionIds: [],
    meta: {
      resultLabel: '',
      resultType: [],
      answerType: [],
    },
  });

  const [electionIdInput, setElectionIdInput] = useState('');
  const [resultTypeInput, setResultTypeInput] = useState({ key: '', label: '' });
  const [answerTypeInput, setAnswerTypeInput] = useState('');

  const handleInputChange = (field: keyof CreateTrendRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMetaChange = (field: keyof CreateTrendRequest['meta'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      meta: {
        ...prev.meta,
        [field]: value,
      },
    }));
  };

  const addElectionId = () => {
    if (!electionIdInput.trim()) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      electionIds: [...prev.electionIds, electionIdInput.trim()],
    }));
    setElectionIdInput('');
  };

  const removeElectionId = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      electionIds: prev.electionIds.filter((_, i) => i !== index),
    }));
  };

  const addResultType = () => {
    if (!resultTypeInput.key.trim() || !resultTypeInput.label.trim()) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      meta: {
        ...prev.meta,
        resultType: [...prev.meta.resultType, resultTypeInput],
      },
    }));
    setResultTypeInput({ key: '', label: '' });
  };

  const removeResultType = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      meta: {
        ...prev.meta,
        resultType: prev.meta.resultType.filter((_, i) => i !== index),
      },
    }));
  };

  const addAnswerType = () => {
    if (!answerTypeInput.trim()) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      meta: {
        ...prev.meta,
        answerType: [...prev.meta.answerType, { label: answerTypeInput.trim() }],
      },
    }));
    setAnswerTypeInput('');
  };

  const removeAnswerType = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      meta: {
        ...prev.meta,
        answerType: prev.meta.answerType.filter((_, i) => i !== index),
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createTrend(formData, {
      onSuccess: (data) => {
        showAlert(`트렌드가 생성되었습니다! ID: ${data.id}`, {
          onConfirm: () => {
            router.push('/admin/trend');
          },
        });
      },
      onError: (error) => {
        showAlert(`트렌드 생성 실패: ${error.message}`);
      },
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>트렌드 생성</h1>
        <p className={styles.subtitle}>새로운 트렌드를 생성합니다</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* 기본 정보 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>기본 정보</h2>

          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>
              제목 <span className={styles.required}>*</span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={styles.input}
              placeholder="2025 트렌드"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="label" className={styles.label}>
              라벨 <span className={styles.required}>*</span>
            </label>
            <input
              id="label"
              type="text"
              value={formData.label}
              onChange={(e) => handleInputChange('label', e.target.value)}
              className={styles.input}
              placeholder="TREND2025"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="imageUrl" className={styles.label}>
              이미지 URL <span className={styles.required}>*</span>
            </label>
            <input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => handleInputChange('imageUrl', e.target.value)}
              className={styles.input}
              placeholder="https://example.com/image.png"
              required
            />
          </div>
        </section>

        {/* Election IDs */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>연결된 선거 ID</h2>

          <div className={styles.arrayInput}>
            <input
              type="text"
              value={electionIdInput}
              onChange={(e) => setElectionIdInput(e.target.value)}
              className={styles.input}
              placeholder="선거 ID 입력"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addElectionId();
                }
              }}
            />
            <Button type="button" onClick={addElectionId} variant="secondary" height={40}>
              추가
            </Button>
          </div>

          <div className={styles.tagList}>
            {formData.electionIds.map((id, index) => (
              <div key={index} className={styles.tag}>
                <span>{id}</span>
                <button
                  type="button"
                  onClick={() => removeElectionId(index)}
                  className={styles.tagRemove}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Meta - Result Label */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>메타 정보</h2>

          <div className={styles.field}>
            <label htmlFor="resultLabel" className={styles.label}>
              결과 라벨 <span className={styles.required}>*</span>
            </label>
            <input
              id="resultLabel"
              type="text"
              value={formData.meta.resultLabel}
              onChange={(e) => handleMetaChange('resultLabel', e.target.value)}
              className={styles.input}
              placeholder="당신의 결과"
              required
            />
          </div>
        </section>

        {/* Meta - Result Types */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>결과 타입</h2>
          <p className={styles.sectionDescription}>
            옵션 조합에 따른 결과 타입을 정의합니다 (예: 110/210/330 → 열정 타입)
          </p>

          <div className={styles.doubleInput}>
            <input
              type="text"
              value={resultTypeInput.key}
              onChange={(e) => setResultTypeInput({ ...resultTypeInput, key: e.target.value })}
              className={styles.input}
              placeholder="Key (예: 110/210/330)"
            />
            <input
              type="text"
              value={resultTypeInput.label}
              onChange={(e) => setResultTypeInput({ ...resultTypeInput, label: e.target.value })}
              className={styles.input}
              placeholder="Label (예: 열정 타입)"
            />
            <Button type="button" onClick={addResultType} variant="secondary" height={40}>
              추가
            </Button>
          </div>

          <div className={styles.list}>
            {formData.meta.resultType.map((item, index) => (
              <div key={index} className={styles.listItem}>
                <div className={styles.listContent}>
                  <span className={styles.listKey}>{item.key}</span>
                  <span className={styles.listLabel}>{item.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeResultType(index)}
                  className={styles.removeButton}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Meta - Answer Types */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>답변 타입</h2>
          <p className={styles.sectionDescription}>각 질문 항목의 라벨을 정의합니다</p>

          <div className={styles.arrayInput}>
            <input
              type="text"
              value={answerTypeInput}
              onChange={(e) => setAnswerTypeInput(e.target.value)}
              className={styles.input}
              placeholder="답변 타입 라벨 (예: 열정 타입)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAnswerType();
                }
              }}
            />
            <Button type="button" onClick={addAnswerType} variant="secondary" height={40}>
              추가
            </Button>
          </div>

          <div className={styles.tagList}>
            {formData.meta.answerType.map((item, index) => (
              <div key={index} className={styles.tag}>
                <span>{item.label}</span>
                <button
                  type="button"
                  onClick={() => removeAnswerType(index)}
                  className={styles.tagRemove}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Submit */}
        <div className={styles.actions}>
          <Button
            type="button"
            onClick={() => router.back()}
            variant="secondary"
            height={48}
            fullWidth
            disabled={isPending}
          >
            취소
          </Button>
          <Button type="submit" variant="gradient" height={48} fullWidth disabled={isPending}>
            {isPending ? '생성 중...' : '트렌드 생성'}
          </Button>
        </div>
      </form>
    </div>
  );
};

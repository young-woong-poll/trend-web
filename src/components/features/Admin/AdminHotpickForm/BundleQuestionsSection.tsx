import type { FC } from 'react';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type {
  TFormData,
  TBundleQuestion,
} from '@/components/features/Admin/AdminHotpickForm/AdminHotpickForm';
import styles from '@/components/features/Admin/AdminHotpickForm/BundleQuestionsSection.module.scss';

import type { UseFormSetValue, UseFormWatch } from 'react-hook-form';

const MAX_QUESTIONS = 10;
const MIN_QUESTIONS = 2;

interface BundleQuestionsSectionProps {
  setValue: UseFormSetValue<TFormData>;
  watch: UseFormWatch<TFormData>;
}

interface SortableQuestionProps {
  id: string;
  index: number;
  question: TBundleQuestion;
  canRemove: boolean;
  onChange: (index: number, field: keyof TBundleQuestion, value: string) => void;
  onRemove: (index: number) => void;
}

function SortableQuestion({
  id,
  index,
  question,
  canRemove,
  onChange,
  onRemove,
}: SortableQuestionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.questionCard}>
      <div className={styles.questionHeader}>
        <div className={styles.questionLeft}>
          <button type="button" className={styles.dragHandle} {...attributes} {...listeners}>
            ⠿
          </button>
          <span className={styles.questionIndex}>Q{index + 1}</span>
        </div>
        {canRemove && (
          <button type="button" onClick={() => onRemove(index)} className={styles.removeButton}>
            삭제
          </button>
        )}
      </div>
      <input
        type="text"
        value={question.title}
        onChange={(e) => onChange(index, 'title', e.target.value)}
        className={styles.input}
        placeholder="질문 제목 (예: 썸 탈 때)"
      />
      <div className={styles.optionsRow}>
        <div className={styles.optionField}>
          <label className={styles.optionLabel}>A</label>
          <input
            type="text"
            value={question.optionA}
            onChange={(e) => onChange(index, 'optionA', e.target.value)}
            className={styles.input}
            placeholder="선택지 A (예: 먼저 연락)"
          />
        </div>
        <span className={styles.vs}>vs</span>
        <div className={styles.optionField}>
          <label className={styles.optionLabel}>B</label>
          <input
            type="text"
            value={question.optionB}
            onChange={(e) => onChange(index, 'optionB', e.target.value)}
            className={styles.input}
            placeholder="선택지 B (예: 기다리기)"
          />
        </div>
      </div>
    </div>
  );
}

export const BundleQuestionsSection: FC<BundleQuestionsSectionProps> = ({ setValue, watch }) => {
  const questions = watch('bundleQuestions');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // 각 질문에 stable id 부여 (인덱스 기반)
  const questionIds = questions.map((_, i) => `q-${i}`);

  const handleChange = (index: number, field: keyof TBundleQuestion, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setValue('bundleQuestions', updated);
  };

  const handleAdd = () => {
    if (questions.length >= MAX_QUESTIONS) {
      return;
    }
    setValue('bundleQuestions', [...questions, { title: '', optionA: '', optionB: '' }]);
  };

  const handleRemove = (index: number) => {
    if (questions.length <= MIN_QUESTIONS) {
      return;
    }
    setValue(
      'bundleQuestions',
      questions.filter((_, i) => i !== index)
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = questionIds.indexOf(active.id as string);
    const newIndex = questionIds.indexOf(over.id as string);

    const updated = [...questions];
    const [moved] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, moved);
    setValue('bundleQuestions', updated);
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>번들 질문</h2>
      <p className={styles.sectionDescription}>
        A/B 선택 질문을 {MIN_QUESTIONS}~{MAX_QUESTIONS}개 등록할 수 있습니다. 드래그하여 순서를
        변경하세요.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
          <div className={styles.questionList}>
            {questions.map((q, index) => (
              <SortableQuestion
                key={questionIds[index]}
                id={questionIds[index]}
                index={index}
                question={q}
                canRemove={questions.length > MIN_QUESTIONS}
                onChange={handleChange}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {questions.length < MAX_QUESTIONS && (
        <button type="button" onClick={handleAdd} className={styles.addButton}>
          + 질문 추가
        </button>
      )}
    </section>
  );
};

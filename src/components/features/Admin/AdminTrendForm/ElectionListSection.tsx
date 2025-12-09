import { useState, type FC } from 'react';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { Button } from '@/components/common/Button';
import type { TFormData } from '@/components/features/Admin/AdminTrendForm/AdminTrendForm';
import { ElectionCard } from '@/components/features/Admin/AdminTrendForm/ElectionCard';
import styles from '@/components/features/Admin/AdminTrendForm/ElectionListSection.module.scss';
import { useModal } from '@/contexts/ModalContext';
import { useFetchElection } from '@/hooks/api';

import type { UseFormSetValue, UseFormWatch } from 'react-hook-form';
interface ElectionListSectionProps {
  setValue: UseFormSetValue<TFormData>;
  watch: UseFormWatch<TFormData>;
}

export const ElectionListSection: FC<ElectionListSectionProps> = ({ setValue, watch }) => {
  const { showAlert } = useModal();
  const electionIdList = watch('electionIdList');
  const electionDetailMap = watch('electionDetailMap');

  const [electionIdInput, setElectionIdInput] = useState('');
  const electionIdInputTrimmed = electionIdInput.trim();

  const { mutateAsync: fetchElection, isPending } = useFetchElection();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = electionIdList.indexOf(active.id as string);
      const newIndex = electionIdList.indexOf(over.id as string);

      const newElectionIdList = arrayMove(electionIdList, oldIndex, newIndex);
      setValue('electionIdList', newElectionIdList);
    }
  };

  const handleAddClick = async () => {
    if (electionIdInputTrimmed) {
      if (electionIdList.includes(electionIdInputTrimmed)) {
        showAlert('이미 추가된 선거 ID입니다.');

        return;
      }

      try {
        const data = await fetchElection(electionIdInputTrimmed);

        if (data.options.length !== 2) {
          showAlert(
            `선거 ID ${electionIdInputTrimmed}의 옵션 개수가 2개가 아닙니다 (현재: ${data.options.length}개)`
          );

          return;
        }

        setValue('electionIdList', [...electionIdList, electionIdInputTrimmed]);
        setValue('electionDetailMap', {
          ...electionDetailMap,
          [electionIdInputTrimmed]: data,
        });
      } catch {
        showAlert(`선거 정보를 불러올 수 없습니다`);
      } finally {
        setElectionIdInput('');
      }
    }
  };

  const handleRemoveClick = (electionId: string) => {
    const updatedIdList = electionIdList.filter((id) => id !== electionId);
    const updatedDetailMap = { ...electionDetailMap };
    delete updatedDetailMap[electionId];

    setValue('electionIdList', updatedIdList);
    setValue('electionDetailMap', updatedDetailMap);
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>연결된 선거 ID</h2>
      <p className={styles.sectionDescription}>각 선거는 정확히 2개의 옵션을 가져야 합니다</p>

      <div className={styles.arrayInput}>
        <input
          type="text"
          value={electionIdInput}
          onChange={(e) => setElectionIdInput(e.target.value)}
          className={styles.input}
          placeholder="선거 ID 입력"
          onKeyPress={async (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              await handleAddClick();
            }
          }}
        />
        <Button
          type="button"
          onClick={handleAddClick}
          variant="primary"
          height={40}
          disabled={isPending || !electionIdInputTrimmed}
        >
          {isPending ? '조회 중...' : '추가'}
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={electionIdList} strategy={verticalListSortingStrategy}>
          <div className={styles.electionList}>
            {electionIdList.map((id) => (
              <ElectionCard
                key={id}
                id={id}
                detail={electionDetailMap[id]}
                handleRemoveClick={handleRemoveClick}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
};

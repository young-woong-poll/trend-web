import { useState, useEffect, type FC } from 'react';

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
import type { ElectionDetail } from '@/types/election';

import type { UseFormSetValue, UseFormWatch } from 'react-hook-form';
interface ElectionListSectionProps {
  setValue: UseFormSetValue<TFormData>;
  watch: UseFormWatch<TFormData>;
}

export const ElectionListSection: FC<ElectionListSectionProps> = ({ setValue, watch }) => {
  const { showAlert } = useModal();
  const electionIdList = watch('electionIdList');

  // 선거 상세 정보를 로컬 상태로 관리
  const [electionDetailMap, setElectionDetailMap] = useState<Record<string, ElectionDetail>>({});
  const [electionIdInput, setElectionIdInput] = useState('');
  const electionIdInputTrimmed = electionIdInput.trim();

  const { mutateAsync: fetchElection, isPending } = useFetchElection();

  // Edit 모드에서 기존 선거 정보 로드
  useEffect(() => {
    const loadExistingElections = async () => {
      const missingIds = electionIdList.filter((id) => !electionDetailMap[id]);

      if (missingIds.length === 0) {
        return;
      }

      const newDetails: Record<string, ElectionDetail> = {};

      for (const electionId of missingIds) {
        try {
          const detail = await fetchElection(electionId);
          newDetails[electionId] = detail as unknown as ElectionDetail;
        } catch (error) {
          console.error(`Failed to load election ${electionId}:`, error);
        }
      }

      if (Object.keys(newDetails).length > 0) {
        setElectionDetailMap((prev) => ({ ...prev, ...newDetails }));
      }
    };

    void loadExistingElections();
  }, [electionIdList, electionDetailMap, fetchElection]);

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
        const rawData = await fetchElection(electionIdInputTrimmed);
        // Orval 타입을 기존 ElectionDetail 타입으로 캐스팅
        const data = rawData as unknown as ElectionDetail;
        const optionsLength = data.options?.length ?? 0;

        if (optionsLength !== 2) {
          showAlert(
            `선거 ID ${electionIdInputTrimmed}의 옵션 개수가 2개가 아닙니다 (현재: ${optionsLength}개)`
          );

          return;
        }

        setValue('electionIdList', [...electionIdList, electionIdInputTrimmed]);
        setElectionDetailMap((prev) => ({
          ...prev,
          [electionIdInputTrimmed]: data,
        }));
      } catch {
        showAlert(`선거 정보를 불러올 수 없습니다`);
      } finally {
        setElectionIdInput('');
      }
    }
  };

  const handleRemoveClick = (electionId: string) => {
    const updatedIdList = electionIdList.filter((id) => id !== electionId);

    setValue('electionIdList', updatedIdList);
    setElectionDetailMap((prev) => {
      const updated = { ...prev };
      delete updated[electionId];
      return updated;
    });
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
          variant="outline"
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

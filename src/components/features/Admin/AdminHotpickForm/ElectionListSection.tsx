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
import type { TFormData } from '@/components/features/Admin/AdminHotpickForm/AdminHotpickForm';
import { ElectionCard } from '@/components/features/Admin/AdminHotpickForm/ElectionCard';
import styles from '@/components/features/Admin/AdminHotpickForm/ElectionListSection.module.scss';
import { useModal } from '@/contexts/ModalContext';
import { useSearchElections } from '@/hooks/api/useElection';
import type { Election } from '@/types/election';
import type { HotpickType } from '@/types/hotpick';

import type { UseFormSetValue, UseFormWatch } from 'react-hook-form';

interface ElectionListSectionProps {
  setValue: UseFormSetValue<TFormData>;
  watch: UseFormWatch<TFormData>;
  hotpickType: HotpickType;
}

export const ElectionListSection: FC<ElectionListSectionProps> = ({
  setValue,
  watch,
  hotpickType,
}) => {
  const { showAlert } = useModal();
  const electionIdList = watch('electionIdList');

  // 선거 상세 정보를 로컬 상태로 관리
  const [electionDetailMap, setElectionDetailMap] = useState<Record<string, Election>>({});
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Election[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const { mutateAsync: searchElections, isPending } = useSearchElections();

  // Edit 모드에서 기존 선거 정보 로드
  useEffect(() => {
    const loadExistingElections = async () => {
      const missingIds = electionIdList.filter((id) => !(id in electionDetailMap));

      if (missingIds.length === 0) {
        return;
      }

      // 검색으로 기존 선거 정보를 가져옴
      try {
        const result = await searchElections({ size: 100 });
        const newDetails: Record<string, Election> = {};

        for (const election of result.content) {
          if (missingIds.includes(election.id)) {
            newDetails[election.id] = election;
          }
        }

        if (Object.keys(newDetails).length > 0) {
          setElectionDetailMap((prev) => ({ ...prev, ...newDetails }));
        }
      } catch (error) {
        console.error('Failed to load existing elections:', error);
      }
    };

    void loadExistingElections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleSearch = async () => {
    try {
      const result = await searchElections({
        keyword: searchKeyword.trim() || undefined,
        size: 20,
      });
      setSearchResults(result.content);
      setHasSearched(true);
    } catch {
      showAlert('선거 검색에 실패했습니다.');
    }
  };

  const handleSelectElection = (election: Election) => {
    if (electionIdList.includes(election.id)) {
      showAlert('이미 추가된 선거입니다.');
      return;
    }

    // SINGLE 타입은 1개만 허용
    if (hotpickType === 'SINGLE' && electionIdList.length >= 1) {
      showAlert('SINGLE 타입은 선거를 1개만 등록할 수 있습니다.');
      return;
    }

    setValue('electionIdList', [...electionIdList, election.id]);
    setElectionDetailMap((prev) => ({
      ...prev,
      [election.id]: election,
    }));
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

  const isBundleMode = hotpickType === 'BUNDLE';

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>연결된 선거</h2>
      <p className={styles.sectionDescription}>
        {isBundleMode
          ? '선거를 2개 이상 선택하세요. 드래그하여 순서를 변경할 수 있습니다.'
          : '선거를 1개 선택하세요.'}
      </p>

      {/* 검색 영역 */}
      <div className={styles.arrayInput}>
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className={styles.input}
          placeholder="선거 제목으로 검색"
          onKeyDown={async (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              await handleSearch();
            }
          }}
        />
        <Button
          type="button"
          onClick={handleSearch}
          variant="outline"
          height={40}
          disabled={isPending}
        >
          {isPending ? '검색 중...' : '검색'}
        </Button>
      </div>

      {/* 검색 결과 */}
      {hasSearched && (
        <div className={styles.searchResults}>
          {searchResults.length === 0 ? (
            <p className={styles.emptyResults}>검색 결과가 없습니다</p>
          ) : (
            searchResults.map((election) => {
              const isSelected = electionIdList.includes(election.id);
              return (
                <div
                  key={election.id}
                  className={`${styles.searchItem} ${isSelected ? styles.searchItemSelected : ''}`}
                  onClick={() => !isSelected && handleSelectElection(election)}
                >
                  <div className={styles.searchItemInfo}>
                    <span className={styles.searchItemTitle}>{election.title}</span>
                    <div className={styles.searchItemMeta}>
                      <span className={styles.searchItemBadge} data-type={election.voteType}>
                        {election.voteType}
                      </span>
                      <span className={styles.searchItemOptions}>
                        옵션 {election.options.length}개
                      </span>
                    </div>
                  </div>
                  <span className={styles.searchItemAction}>
                    {isSelected ? '선택됨' : '+ 추가'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 선택된 선거 리스트 */}
      {electionIdList.length > 0 && (
        <>
          <h3 className={styles.selectedTitle}>선택된 선거 ({electionIdList.length}개)</h3>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
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
        </>
      )}
    </section>
  );
};

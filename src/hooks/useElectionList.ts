import { useState } from 'react';

import { useModal } from '@/contexts/ModalContext';
import { useFetchElection } from '@/hooks/api/useAdmin';
import { generateCombinations } from '@/lib/trendCombinations';
import type { ElectionDetail } from '@/types/election';

export type TElectionDataset = {
  electionIdList: string[];
  electionDetailMap: Record<string, ElectionDetail>;
};

export const useElectionList = () => {
  const { showAlert } = useModal();
  const { mutateAsync: fetchElection, isPending: isFetchingElection } = useFetchElection();

  const [electionDataset, setElectionDataset] = useState<TElectionDataset>({
    electionIdList: [],
    electionDetailMap: {},
  });

  const combinations = generateCombinations(
    electionDataset.electionIdList.map((id) => electionDataset.electionDetailMap[id])
  );

  const addElectionId = async (electionId: string) => {
    const trimmedId = electionId.trim();

    if (!trimmedId) {
      return;
    }

    // 중복 체크
    if (electionDataset.electionIdList.includes(trimmedId)) {
      showAlert('이미 추가된 선거 ID입니다.');

      return;
    }

    try {
      const data = await fetchElection(trimmedId);

      if (data.options.length !== 2) {
        showAlert(
          `선거 ID ${trimmedId}의 옵션 개수가 2개가 아닙니다 (현재: ${data.options.length}개)`
        );

        return;
      }

      setElectionDataset((prev) => ({
        electionIdList: [...prev.electionIdList, trimmedId],
        electionDetailMap: {
          ...prev.electionDetailMap,
          [trimmedId]: data,
        },
      }));
    } catch {
      showAlert(`선거 정보를 불러올 수 없습니다`);
    }
  };

  const removeElectionId = (electionId: string) =>
    setElectionDataset((prev) => ({
      electionIdList: prev.electionIdList.filter((id) => id !== electionId),
      electionDetailMap: Object.fromEntries(
        Object.entries(prev.electionDetailMap).filter(([id]) => id !== electionId)
      ),
    }));

  return {
    electionDataset,
    isFetchingElection,

    addElectionId,
    removeElectionId,

    combinations,
  };
};

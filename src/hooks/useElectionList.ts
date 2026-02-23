/**
 * BUNDLE 핫픽 선거 목록 관리 Hook — 스텁 처리
 *
 * BUNDLE은 BE 미지원. 기존 인터페이스만 유지하고 기능은 비활성.
 */
import { useState } from 'react';

import type { ElectionDetail } from '@/types/election';

export type TElectionDataset = {
  electionIdList: string[];
  electionDetailMap: Record<string, ElectionDetail>;
};

export const useElectionList = () => {
  const [electionDataset, setElectionDataset] = useState<TElectionDataset>({
    electionIdList: [],
    electionDetailMap: {},
  });

  const addElectionId = async (_electionId: string) => {
    // BUNDLE 미지원 — no-op
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
    isFetchingElection: false,

    addElectionId,
    removeElectionId,

    combinations: [],
  };
};

import { type FC } from 'react';

import { CombinationCard } from '@/components/features/Admin/AdminTrendForm/CombinationCard';
import styles from '@/components/features/Admin/AdminTrendForm/ResultTypeSection.module.scss';
import type { TElectionDataset } from '@/hooks/useElectionList';
import type { ElectionDetail } from '@/types/election';
import type { CreateTrendRequest } from '@/types/trend';

import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

interface ResultTypeSectionProps {
  electionDataset: TElectionDataset;
  combinations: string[][];
  register: UseFormRegister<CreateTrendRequest>;
  setValue: UseFormSetValue<CreateTrendRequest>;
  watch: UseFormWatch<CreateTrendRequest>;
}

export const ResultTypeSection: FC<ResultTypeSectionProps> = ({
  electionDataset,
  combinations,
  register,
  setValue,
  watch,
}) => {
  const resultType = watch('meta.resultType') || [];

  const handleLabelChange = (key: string, label: string) => {
    const newResultType = resultType.map((rt) => (rt.key === key ? { ...rt, label } : rt));
    setValue('meta.resultType', newResultType);
  };

  const electionDetails: ElectionDetail[] = electionDataset.electionIdList.map(
    (id) => electionDataset.electionDetailMap[id]
  );

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>결과 타입</h2>
      <p className={styles.sectionDescription}>
        선거 옵션 조합에 따라 자동으로 생성됩니다. 각 조합에 대한 Label을 입력하세요.
        {combinations.length > 0 && ` (총 ${combinations.length}개 조합)`}
      </p>

      {/* {true && <p className={styles.info}>선거 정보를 불러오는 중...</p>} */}

      {combinations.length > 0 && (
        <div className={styles.combinationGrid}>
          {combinations.map((combination, index) => {
            const key = combination.join('/');
            const currentLabel = resultType.find((rt) => rt.key === key);
            return (
              <CombinationCard
                key={index}
                index={index}
                register={register}
                combination={combination}
                electionDetails={electionDetails}
                resultTypeLabel={currentLabel?.label || ''}
                hasError={false}
                handleLabelChange={handleLabelChange}
              />
            );
          })}
        </div>
      )}
    </section>
  );
};

ResultTypeSection.displayName = 'ResultTypeSection';

import { type FC } from 'react';

import type { TFormData } from '@/components/features/Admin/AdminTrendForm/AdminTrendForm';
import { CombinationCard } from '@/components/features/Admin/AdminTrendForm/CombinationCard';
import styles from '@/components/features/Admin/AdminTrendForm/ResultTypeSection.module.scss';
import { generateCombinations } from '@/lib/trendCombinations';
import type { ElectionDetail } from '@/types/election';

import type { UseFormSetValue, UseFormWatch } from 'react-hook-form';

interface ResultTypeSectionProps {
  setValue: UseFormSetValue<TFormData>;
  watch: UseFormWatch<TFormData>;
}

export const ResultTypeSection: FC<ResultTypeSectionProps> = ({ setValue, watch }) => {
  const resultType = watch('resultType');
  const electionIdList = watch('electionIdList');
  const electionDetailMap = watch('electionDetailMap');

  const handleLabelChange = (key: string, label: string) => {
    const newResultType = { ...resultType };
    newResultType[key] = label;

    setValue('resultType', newResultType);
  };

  const electionDetails = electionIdList
    .map((id) => electionDetailMap[id])
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    .filter((detail): detail is ElectionDetail => detail !== undefined);
  const combinations = generateCombinations(electionDetails);

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>결과 타입</h2>
      <p className={styles.sectionDescription}>
        선거 옵션 조합에 따라 자동으로 생성됩니다. 각 조합에 대한 Label을 입력하세요.
      </p>

      {combinations.length > 0 && (
        <div className={styles.combinationGrid}>
          {combinations.map((combination) => {
            const key = combination.map((item) => item.optionId).join('/');

            return (
              <CombinationCard
                key={key}
                combination={combination}
                resultTypeLabel={resultType[key] || ''}
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

import type { FC } from 'react';

type StructuredDataProps = {
  data: object;
};

export const StructuredData: FC<StructuredDataProps> = ({ data }) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
);

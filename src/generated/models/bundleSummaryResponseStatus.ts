export type BundleSummaryResponseStatus =
  (typeof BundleSummaryResponseStatus)[keyof typeof BundleSummaryResponseStatus];

export const BundleSummaryResponseStatus = {
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
} as const;

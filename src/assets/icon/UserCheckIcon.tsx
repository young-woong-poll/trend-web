import type { FC, SVGProps } from 'react';

/** MY 탭 아이콘 — 투표 체크 */
const VoteCheckIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width={13}
    height={13}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
    <path
      d="M7.5 12.5L10.5 15.5L16.5 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default VoteCheckIcon;

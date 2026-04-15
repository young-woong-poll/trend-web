import type { FC, SVGProps } from 'react';

/** 갈린 순간 — 좌우로 갈라지는 화살표 */
const SplitIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M3 12H9M9 12L14 7M9 12L14 17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M14 7H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M14 17H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default SplitIcon;

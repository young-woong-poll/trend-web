import type { FC, SVGProps } from 'react';

/** 케미 등급 — 하트 */
const HeartLinkIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 21C12 21 3 13.5 3 8.5C3 5.46 5.46 3 8.5 3C10.28 3 11.84 3.88 12 5C12.16 3.88 13.72 3 15.5 3C18.54 3 21 5.46 21 8.5C21 13.5 12 21 12 21Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default HeartLinkIcon;

import type { FC, SVGProps } from 'react';

/** HOT 탭 아이콘 — 불꽃 */
const FlameIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width={13}
    height={13}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 22C7.03 22 3 19.42 3 15V14.91C3 12.79 4.34 11.1 6.38 10C8.32 8.95 9.48 7.01 9.19 5L8.63 2L10.71 2.79C14.47 4.23 17.6 6.71 19.62 9.86C20.53 11.26 21 12.85 21 14.46V15C21 16.56 20.5 17.9 19.62 18.97"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 22C10.34 22 9 20.57 9 18.8C9 17.4 10.02 16.28 10.91 15.25L12 14L13.09 15.25C13.98 16.28 15 17.4 15 18.8C15 20.57 13.66 22 12 22Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default FlameIcon;

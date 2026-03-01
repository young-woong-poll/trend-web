import type { FC, SVGProps } from 'react';

const DiceIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* 윗면 (마름모) */}
    <path
      d="M12 2L21 7.5V8L12 13.5L3 8V7.5L12 2Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    {/* 왼쪽면 */}
    <path
      d="M3 8L12 13.5V22L3 16.5V8Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    {/* 오른쪽면 */}
    <path
      d="M21 8L12 13.5V22L21 16.5V8Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    {/* 윗면 점 (1) */}
    <circle cx="12" cy="7" r="1.2" fill="currentColor" />
    {/* 왼쪽면 점 (2) */}
    <circle cx="6.5" cy="12" r="1" fill="currentColor" />
    <circle cx="8.5" cy="16" r="1" fill="currentColor" />
    {/* 오른쪽면 점 (3) */}
    <circle cx="15.5" cy="11.5" r="1" fill="currentColor" />
    <circle cx="16.5" cy="14.5" r="1" fill="currentColor" />
    <circle cx="17.5" cy="17.5" r="1" fill="currentColor" />
  </svg>
);

export default DiceIcon;

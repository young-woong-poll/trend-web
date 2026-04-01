import type { FC, SVGProps } from 'react';

type CompareGroupIconProps = SVGProps<SVGSVGElement>;

const CompareGroupIcon: FC<CompareGroupIconProps> = (props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* 가운데 사람 */}
    <circle cx="12" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M8 16c0-2.21 1.79-4 4-4s4 1.79 4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* 왼쪽 사람 (작게) */}
    <circle cx="4.5" cy="9" r="1.8" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M1.5 17c0-1.66 1.34-3 3-3s3 1.34 3 3"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    {/* 오른쪽 사람 (작게) */}
    <circle cx="19.5" cy="9" r="1.8" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M16.5 17c0-1.66 1.34-3 3-3s3 1.34 3 3"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

export default CompareGroupIcon;

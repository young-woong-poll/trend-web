import type { FC, SVGProps } from 'react';

type CompareOneIconProps = SVGProps<SVGSVGElement>;

const CompareOneIcon: FC<CompareOneIconProps> = (props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* 왼쪽 사람 */}
    <circle cx="8" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M4 16.5c0-2.21 1.79-4 4-4s4 1.79 4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* 오른쪽 사람 */}
    <circle cx="16" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M12 16.5c0-2.21 1.79-4 4-4s4 1.79 4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* 비교 화살표 */}
    <path d="M10.5 10h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default CompareOneIcon;

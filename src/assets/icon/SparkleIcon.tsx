import type { FC, SVGProps } from 'react';

/** NEW 탭 아이콘 — 반짝임 */
const SparkleIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width={13}
    height={13}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ verticalAlign: 'middle' }}
    {...props}
  >
    <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" fill="currentColor" />
  </svg>
);

export default SparkleIcon;

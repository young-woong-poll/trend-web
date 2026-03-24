import type { FC, SVGProps } from 'react';

interface ChartIconProps extends SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
}

const ChartIcon: FC<ChartIconProps> = ({ width = 24, height = 24, ...props }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M3 20L7.5 14.5L12 16L16.5 9L21 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M3 20H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default ChartIcon;

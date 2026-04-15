import type { FC, SVGProps } from 'react';

interface TrophyIconProps extends SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
}

const TrophyIcon: FC<TrophyIconProps> = ({ width = 13, height = 13, ...props }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M7 4h10v7a5 5 0 0 1-10 0V4Z" fill="currentColor" />
    <path
      d="M5 4H7v4a3 3 0 0 1-3-3 1 1 0 0 1 1-1ZM19 4h-2v4a3 3 0 0 0 3-3 1 1 0 0 0-1-1Z"
      fill="currentColor"
      opacity="0.6"
    />
    <rect x="10" y="15" width="4" height="3" rx="0.5" fill="currentColor" />
    <rect x="8" y="18" width="8" height="2" rx="1" fill="currentColor" />
  </svg>
);

export default TrophyIcon;

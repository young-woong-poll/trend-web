import React from 'react';

interface CrownIconProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

const CrownIcon: React.FC<CrownIconProps> = ({
  width = 36,
  height = 36,
  color = '#E6B861',
  className,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M4.5 28.5C4.5 27.6716 5.17157 27 6 27H30C30.8284 27 31.5 27.6716 31.5 28.5V30C31.5 30.8284 30.8284 31.5 30 31.5H6C5.17157 31.5 4.5 30.8284 4.5 30V28.5Z"
      fill={color}
    />
    <path d="M5.25 25.5L7.5 10.5L12 16.5L18 6L24 16.5L28.5 10.5L30.75 25.5H5.25Z" fill={color} />
    <circle cx="7.5" cy="10.5" r="2.25" fill={color} />
    <circle cx="18" cy="6" r="2.25" fill={color} />
    <circle cx="28.5" cy="10.5" r="2.25" fill={color} />
  </svg>
);

export default CrownIcon;

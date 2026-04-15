import type { FC, SVGProps } from 'react';

interface MaleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

const MaleIcon: FC<MaleIconProps> = ({ size = 16, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="10" cy="14" r="7" stroke="currentColor" strokeWidth="2.2" />
    <path d="M15 9L21 3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path
      d="M17 3H21V7"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default MaleIcon;

import type { FC, SVGProps } from 'react';

interface FemaleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

const FemaleIcon: FC<FemaleIconProps> = ({ size = 16, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="12" cy="10" r="7" stroke="currentColor" strokeWidth="2.2" />
    <path d="M12 17V23" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M9 20H15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export default FemaleIcon;

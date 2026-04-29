import type { FC, SVGProps } from 'react';

interface BellIconProps extends SVGProps<SVGSVGElement> {
  filled?: boolean;
}

const BellIcon: FC<BellIconProps> = ({ filled = false, ...props }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M18 16V11C18 7.13401 14.866 4 11 4H13C16.866 4 20 7.13401 20 11V16L21 17V18H3V17L4 16V11C4 7.68629 6.68629 5 10 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={filled ? 'currentColor' : 'none'}
    />
    <path
      d="M10 21H14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default BellIcon;

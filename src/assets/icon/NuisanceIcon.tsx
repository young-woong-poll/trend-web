import type { FC, SVGProps } from 'react';

const NuisanceIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width={13}
    height={13}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect x="10" y="3" width="4" height="12" rx="2" />
    <circle cx="12" cy="20" r="2" />
  </svg>
);

export default NuisanceIcon;

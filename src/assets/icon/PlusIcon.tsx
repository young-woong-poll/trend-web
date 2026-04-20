import type { FC, SVGProps } from 'react';

type PlusIconProps = SVGProps<SVGSVGElement>;

const PlusIcon: FC<PlusIconProps> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    {...props}
  >
    <path
      d="M12 5v14"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 12h14"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default PlusIcon;

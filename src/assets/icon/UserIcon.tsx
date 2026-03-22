import type { FC, SVGProps } from 'react';

const UserIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="12" cy="8" r="4.5" stroke="currentColor" strokeWidth="2" />
    <path
      d="M3 21c0-3.866 4.03-7 9-7s9 3.134 9 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default UserIcon;

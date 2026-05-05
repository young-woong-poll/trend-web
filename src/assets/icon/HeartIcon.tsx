import type { FC, SVGProps } from 'react';

const HeartIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width={13}
    height={13}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M12 21s-7.5-4.86-9.6-9.6C1.06 7.99 3.39 4 7.2 4c1.92 0 3.6 1.08 4.8 2.64C13.2 5.08 14.88 4 16.8 4c3.81 0 6.14 3.99 4.8 7.4C19.5 16.14 12 21 12 21z" />
  </svg>
);

export default HeartIcon;

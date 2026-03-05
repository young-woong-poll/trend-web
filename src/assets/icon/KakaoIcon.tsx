import type { FC, SVGProps } from 'react';

const KakaoIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 3C6.477 3 2 6.463 2 10.691c0 2.734 1.811 5.126 4.535 6.482-.155.569-.999 3.648-.999 3.648s-.023.189.1.262a.345.345 0 0 0 .284-.01s4.232-2.787 4.88-3.228c.39.056.788.086 1.2.086 5.523 0 10-3.464 10-7.24C22 6.463 17.523 3 12 3Z"
      fill="currentColor"
    />
  </svg>
);

export default KakaoIcon;

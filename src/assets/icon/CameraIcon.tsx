import type { FC, SVGProps } from 'react';

type CameraIconProps = SVGProps<SVGSVGElement>;

const CameraIcon: FC<CameraIconProps> = (props) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M18.3333 15.8333C18.3333 16.2754 18.1577 16.6993 17.8452 17.0118C17.5326 17.3244 17.1087 17.5 16.6667 17.5H3.33333C2.89131 17.5 2.46738 17.3244 2.15482 17.0118C1.84226 16.6993 1.66667 16.2754 1.66667 15.8333V6.66667C1.66667 6.22464 1.84226 5.80072 2.15482 5.48816C2.46738 5.17559 2.89131 5 3.33333 5H6.66667L8.33333 2.5H11.6667L13.3333 5H16.6667C17.1087 5 17.5326 5.17559 17.8452 5.48816C18.1577 5.80072 18.3333 6.22464 18.3333 6.66667V15.8333Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 14.1667C11.841 14.1667 13.3333 12.6743 13.3333 10.8333C13.3333 8.99238 11.841 7.5 10 7.5C8.15905 7.5 6.66667 8.99238 6.66667 10.8333C6.66667 12.6743 8.15905 14.1667 10 14.1667Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default CameraIcon;

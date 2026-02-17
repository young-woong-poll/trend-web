import type { FC, SVGProps } from 'react';

const CommentIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M14 7.667c0 3.13-2.537 5.666-5.667 5.666a5.64 5.64 0 0 1-2.037-.377 1.07 1.07 0 0 0-.22-.076.66.66 0 0 0-.124-.017.77.77 0 0 0-.202.014l-3.416.353a.524.524 0 0 1-.584-.314.524.524 0 0 1 .06-.432l1.09-2.018a.87.87 0 0 0 .155-.33.65.65 0 0 0 .019-.216 5.36 5.36 0 0 1-.408-2.253C2.667 4.537 5.203 2 8.333 2S14 4.537 14 7.667Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default CommentIcon;

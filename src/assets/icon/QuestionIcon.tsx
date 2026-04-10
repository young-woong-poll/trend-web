import type { FC, SVGProps } from 'react';

type QuestionIconProps = SVGProps<SVGSVGElement>;

const QuestionIcon: FC<QuestionIconProps> = (props) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path
      d="M9.09 9C9.325 8.332 9.789 7.768 10.4 7.409C11.011 7.05 11.729 6.919 12.427 7.039C13.126 7.158 13.759 7.522 14.215 8.064C14.671 8.606 14.921 9.292 14.92 10C14.92 12 11.92 13 11.92 13M12 17H12.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default QuestionIcon;

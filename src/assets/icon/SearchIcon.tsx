import type { FC, SVGProps } from 'react';

type SearchIconProps = SVGProps<SVGSVGElement>;

const SearchIcon: FC<SearchIconProps> = (props) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
    <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default SearchIcon;

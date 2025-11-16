type TProps = {
  width?: number;
  height?: number;
  fill?: string;
};

export default function InfoIcon({ width = 20, height = 20, fill }: TProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke={fill || 'white'} strokeWidth="2" />
      <path
        d="M12 16V12M12 8H12.01"
        stroke={fill || 'white'}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

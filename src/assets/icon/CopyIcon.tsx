interface CopyIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function CopyIcon({ width = 20, height = 20, className }: CopyIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Back rectangle (slightly offset) */}
      <rect
        x="4"
        y="4"
        width="10"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Front rectangle */}
      <rect
        x="6"
        y="2"
        width="10"
        height="12"
        rx="2"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

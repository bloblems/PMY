interface PMYLogoProps {
  className?: string;
}

export default function PMYLogo({ className = "" }: PMYLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* P */}
      <path
        d="M 15 20 L 15 80 M 15 20 L 35 20 C 42 20 45 25 45 32.5 C 45 40 42 45 35 45 L 15 45"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* M */}
      <path
        d="M 35 50 L 35 80 M 35 50 L 50 70 M 50 70 L 65 50 M 65 50 L 65 80"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Y */}
      <path
        d="M 70 20 L 82.5 42.5 M 95 20 L 82.5 42.5 M 82.5 42.5 L 82.5 80"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

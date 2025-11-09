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
      {/* P and M merged - top half */}
      {/* P left side */}
      <path
        d="M 15 15 L 15 50"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* P rounded top */}
      <path
        d="M 15 15 L 35 15 C 44 15 48 20 48 27.5 C 48 35 44 40 35 40 L 15 40"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* M right side - merged with P */}
      {/* M left stroke (shared center) */}
      <path
        d="M 52 15 L 52 50"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* M middle peak */}
      <path
        d="M 52 15 L 65 35 L 78 15"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* M right stroke */}
      <path
        d="M 78 15 L 78 50"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Y stretched below - spans full width of P+M */}
      <path
        d="M 15 60 L 46.5 85 M 78 60 L 46.5 85 M 46.5 85 L 46.5 100"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

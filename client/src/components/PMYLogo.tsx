interface PMYLogoProps {
  className?: string;
}

export default function PMYLogo({ className = "" }: PMYLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* P - geometric, helvetica-style */}
      <rect x="10" y="10" width="12" height="38" />
      <rect x="10" y="10" width="22" height="12" />
      <rect x="20" y="10" width="12" height="26" />
      <rect x="10" y="24" width="22" height="12" />
      
      {/* M - geometric, helvetica-style */}
      <rect x="40" y="10" width="12" height="38" />
      <rect x="52" y="10" width="16" height="12" />
      <rect x="68" y="10" width="12" height="38" />
      <rect x="56" y="22" width="8" height="12" />
      
      {/* Y - geometric, helvetica-style, spans full width */}
      <rect x="10" y="56" width="12" height="16" />
      <rect x="68" y="56" width="12" height="16" />
      <rect x="22" y="68" width="46" height="12" />
      <rect x="40" y="68" width="12" height="24" />
    </svg>
  );
}

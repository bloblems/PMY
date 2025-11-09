interface PMYLogoProps {
  className?: string;
}

export default function PMYLogo({ className = "" }: PMYLogoProps) {
  return (
    <div 
      className={`font-bold tracking-tight ${className}`}
      style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
    >
      PMY
    </div>
  );
}

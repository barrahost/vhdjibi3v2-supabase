interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-8 w-auto" }: LogoProps) {
  return (
    <img
      src="/logo-agc-bergerie.svg"
      alt="AGC Bergerie"
      className={className}
    />
  );
}

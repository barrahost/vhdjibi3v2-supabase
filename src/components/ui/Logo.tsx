import { useChurch } from '../../contexts/ChurchContext';

interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-8 w-auto" }: LogoProps) {
  const { church } = useChurch();
  const alt = church?.shortName || church?.name || 'Bergerie';

  return (
    <img
      src={church?.logoUrl || "/logo-agc-bergerie.png"}
      alt={alt}
      className={className}
    />
  );
}

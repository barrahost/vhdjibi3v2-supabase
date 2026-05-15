interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-8 w-auto" }: LogoProps) {
  return (
    <img
      src="/images/LOGO_VH.png"
      alt="Vases d'Honneur Assemblée Grâce Confondante"
      className={className}
    />
  );
}
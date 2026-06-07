export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="A Tu Ritmo">
      {/* rombo */}
      <path d="M32 4 L60 32 L32 60 L4 32 Z" stroke="currentColor" strokeWidth="2.5" />
      {/* reloj */}
      <circle cx="32" cy="34" r="14" stroke="currentColor" strokeWidth="2.5" />
      <rect x="28" y="14" width="8" height="4" rx="1" fill="currentColor" />
      <path d="M32 26 L32 34 L40 38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

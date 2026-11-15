interface DoodleProps {
  className?: string;
  style?: React.CSSProperties;
}

/** Estrella dibujada a mano alzada. */
export function StarDoodle({ className, style }: DoodleProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M12 1.6c.3-.1.7.1.9.5l2.9 6.6 7.2.8c.5.1.7.7.3 1l-5.4 4.9 1.5 7.1c.1.5-.4.9-.9.6L12 19.4l-6.5 3.7c-.5.3-1-.1-.9-.6l1.5-7.1-5.4-4.9c-.4-.3-.2-.9.3-1l7.2-.8 2.9-6.6c.2-.4.6-.6.9-.5z" />
    </svg>
  );
}

/** Subrayado ondulado ancho para títulos. */
export function SquiggleLine({ className, style }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 220 14"
      fill="none"
      preserveAspectRatio="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M3 9 C 30 3, 55 12, 82 7 S 140 3, 168 8 S 205 11, 217 6"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Flecha curva dibujada a mano. */
export function CurvedArrow({ className, style }: DoodleProps) {
  return (
    <svg viewBox="0 0 60 40" fill="none" className={className} style={style} aria-hidden="true">
      <path
        d="M6 6 C 22 30, 34 34, 50 30"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M42 22 L 51 30 L 40 35"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** Balanza de la justicia en trazo de boli. */
export function ScaleDoodle({ className, style }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M24 6v3M24 9v24M15 38h18M24 33v5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M10 13h28" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M10 13l-4.5 9a5.8 5.8 0 0 0 9 0L10 13zM38 13l-4.5 9a5.8 5.8 0 0 0 9 0L38 13z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="24" cy="5" r="2.2" fill="currentColor" />
    </svg>
  );
}

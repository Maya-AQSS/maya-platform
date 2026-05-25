/**
 * Logo Maya por defecto — círculo con gradiente y "M" en blanco.
 * Sirve como fallback cuando el consumidor no aporta `brandLogoUrl`.
 */
export function MayaLogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Maya"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="maya-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#714B67" />
          <stop offset="55%" stopColor="#5A3A52" />
          <stop offset="100%" stopColor="#017E84" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="32" height="32" rx="9" fill="url(#maya-logo-grad)" />
      <path
        d="M8.5 22.5V10.5h2.6l4.4 7.6 4.4-7.6h2.6v12h-2.4v-7.5l-3.6 6.1h-2l-3.6-6.1v7.5z"
        fill="#FFFFFF"
        fillOpacity="0.96"
      />
    </svg>
  )
}

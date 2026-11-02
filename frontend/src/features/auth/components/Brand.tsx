export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <svg
        width="31"
        height="31"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="9" fill="currentColor" />
        <path
          d="M8 12c7 0 8 9 16 9M8 17c5 0 8 8 16 8M8 7c8 0 9 9 16 9"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      {!compact && (
        <span>
          fieldwork<span className="brand-period">.</span>
        </span>
      )}
    </div>
  );
}

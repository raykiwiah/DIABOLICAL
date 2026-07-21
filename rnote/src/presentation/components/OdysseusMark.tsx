/**
 * A small line-art device — a ship on the waves beneath a star — used in
 * Odysseus empty states so a blank page invites a voyage rather than feeling
 * empty. Pure inline SVG in currentColor; no asset weight.
 */
export function OdysseusMark({
  size = 54,
  className,
}: {
  size?: number;
  className?: string;
}): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M46 11l1.5 3.8L51 16l-3.5 1.2L46 21l-1.5-3.8L41 16l3.5-1.2z"
        fill="currentColor"
        opacity="0.85"
      />
      <path d="M32 15v29" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M32 19c6 2 9.5 5 11 10-4.5 1.2-8 1.2-11 0z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M32 21.5c-5 1.6-8 4-9.2 8 3.6 1 6.6 1 9.2 0z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        opacity="0.75"
      />
      <path
        d="M16 44h32l-4.2 7.2A4 4 0 0 1 40.3 53H23.7a4 4 0 0 1-3.5-1.8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 56c3 0 3 2 6 2s3-2 6-2 3 2 6 2 3-2 6-2 3 2 6 2 3-2 6-2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  );
}

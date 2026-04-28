/**
 * Placeholder Mojo mascot — a round purple character with eyes, eyebrow, smile.
 * Drop in the official SVG/PNG when you have it (any square asset works).
 */
export function Mascot({ className }: { className?: string }) {
  return (
    <svg
      class={className}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Fluffy outer body */}
      <circle cx="50" cy="52" r="38" fill="#a39bff" />
      {/* Bottom fluff scallops */}
      <path
        d="M16 70 Q22 82 30 76 Q38 86 46 78 Q54 88 62 78 Q70 86 78 76 Q86 84 92 70 L92 60 L16 60 Z"
        fill="#9690eb"
      />
      {/* Top hair tuft */}
      <path
        d="M30 22 Q34 12 42 18 Q48 8 56 16 Q64 10 70 22 L70 32 L30 32 Z"
        fill="#857aff"
      />
      {/* Single thick eyebrow over both eyes */}
      <path d="M30 38 Q50 28 70 38" stroke="#1a0cb5" stroke-width="4" stroke-linecap="round" fill="none" />
      {/* Eyes */}
      <ellipse cx="40" cy="50" rx="7" ry="9" fill="#fff" />
      <ellipse cx="60" cy="50" rx="7" ry="9" fill="#fff" />
      <circle cx="41" cy="52" r="3.2" fill="#1a1a1a" />
      <circle cx="61" cy="52" r="3.2" fill="#1a1a1a" />
      {/* Highlight in eyes */}
      <circle cx="42.5" cy="50" r="1" fill="#fff" />
      <circle cx="62.5" cy="50" r="1" fill="#fff" />
      {/* Smile */}
      <path d="M44 64 Q50 70 56 64" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" fill="none" />
    </svg>
  );
}

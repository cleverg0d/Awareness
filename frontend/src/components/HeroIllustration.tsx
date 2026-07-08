export function HeroIllustration() {
  return (
    <svg viewBox="0 0 240 200" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="hero-blob-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="hero-blob-b" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="hero-shield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>

      <circle cx="55" cy="150" r="46" fill="url(#hero-blob-a)" opacity="0.16" />
      <circle cx="195" cy="55" r="34" fill="url(#hero-blob-b)" opacity="0.18" />
      <rect x="150" y="130" width="56" height="56" rx="16" fill="url(#hero-blob-b)" opacity="0.14" />

      <g transform="translate(78 28)">
        <path d="M42 0 L82 14 V52 C82 78 63 96 42 104 C21 96 2 78 2 52 V14 Z" fill="url(#hero-shield)" />
        <path d="M42 6 L76 18 V52 C76 74 59 90 42 97 C25 90 8 74 8 52 V18 Z" fill="#fff" opacity="0.12" />
        <path d="M24 52 L37 65 L62 38" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <g transform="translate(18 34)" opacity="0.9">
        <rect x="0" y="10" width="34" height="26" rx="5" fill="#fbbf24" />
        <path d="M6 10 V4 a11 11 0 0 1 22 0 v6" fill="none" stroke="#fbbf24" strokeWidth="5" />
        <circle cx="17" cy="22" r="3" fill="#fff" />
      </g>

      <g transform="translate(178 118)" opacity="0.9">
        <circle cx="18" cy="18" r="18" fill="#f472b6" />
        <path d="M11 18l5 5 10-10" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

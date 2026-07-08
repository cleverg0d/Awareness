const PALETTES = [
  { bg: "from-indigo-500 to-blue-500" },
  { bg: "from-amber-500 to-orange-500" },
  { bg: "from-emerald-500 to-teal-500" },
  { bg: "from-sky-500 to-cyan-500" },
  { bg: "from-rose-500 to-pink-500" },
];

const ICONS = [
  // shield (policy)
  <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z" strokeWidth="1.6" strokeLinejoin="round" />,
  // lock (passwords)
  <path
    d="M6 11V8a6 6 0 1 1 12 0v3M5 11h14v9H5z"
    strokeWidth="1.6"
    strokeLinejoin="round"
  />,
  // monitor (workstation)
  <path
    d="M4 5h16v11H4zM9 20h6M12 16v4"
    strokeWidth="1.6"
    strokeLinejoin="round"
  />,
  // globe (internet)
  <path
    d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.6 9h16.8M3.6 15h16.8M12 3c2.4 2.6 3.6 5.8 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.8-3.6-9S9.6 5.6 12 3Z"
    strokeWidth="1.4"
    strokeLinejoin="round"
  />,
  // envelope (email)
  <path
    d="M4 6h16v12H4zM4 7l8 6 8-6"
    strokeWidth="1.6"
    strokeLinejoin="round"
  />,
];

export function ChapterIcon({ index, className = "w-12 h-12" }: { index: number; className?: string }) {
  const palette = PALETTES[index % PALETTES.length];
  const icon = ICONS[index % ICONS.length];
  return (
    <div className={`shrink-0 rounded-2xl bg-gradient-to-br ${palette.bg} ${className} flex items-center justify-center shadow-sm`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeLinecap="round" className="w-2/3 h-2/3">
        {icon}
      </svg>
    </div>
  );
}

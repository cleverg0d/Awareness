export function ProgressRing({ percent, label, sublabel }: { percent: number; label: string; sublabel: string }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const color = clamped >= 100 ? "text-green-500" : "text-blue-500";

  return (
    <div className="relative w-32 h-32 shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" className="stroke-slate-100 dark:stroke-slate-700" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${color} transition-all duration-500`}
          stroke="currentColor"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{Math.round(clamped)}%</span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-tight px-2">{sublabel}</span>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

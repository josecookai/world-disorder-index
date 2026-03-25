type GaugeSemiCircleProps = {
  score: number;
};

function scoreColor(score: number): string {
  if (score <= 20) return "#2e7d32";
  if (score <= 40) return "#c0a000";
  if (score <= 60) return "#ef6c00";
  if (score <= 80) return "#d84315";
  return "#b71c1c";
}

export function GaugeSemiCircle({ score }: GaugeSemiCircleProps) {
  const radius = 100;
  const circumference = Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const progress = (clamped / 100) * circumference;
  const color = scoreColor(clamped);

  return (
    <div className="w-full max-w-md">
      <svg viewBox="0 0 240 140" className="h-40 w-full">
        <path
          d="M 20 120 A 100 100 0 0 1 220 120"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M 20 120 A 100 100 0 0 1 220 120"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
        />
        <text x="120" y="88" textAnchor="middle" className="fill-zinc-900 text-3xl font-bold">
          {clamped}
        </text>
        <text x="120" y="108" textAnchor="middle" className="fill-zinc-500 text-sm">
          / 100
        </text>
      </svg>
    </div>
  );
}

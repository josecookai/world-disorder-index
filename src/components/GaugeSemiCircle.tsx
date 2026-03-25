type GaugeSemiCircleProps = {
  score: number;
};

function scoreColor(score: number): string {
  if (score <= 20) return "#a8e6cf";
  if (score <= 40) return "#9a9d9f";
  if (score <= 60) return "#ffd3b6";
  if (score <= 80) return "#ff8b94";
  return "#ba1e1e";
}

export function GaugeSemiCircle({ score }: GaugeSemiCircleProps) {
  const radius = 100;
  const circumference = Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const progress = (clamped / 100) * circumference;
  const color = scoreColor(clamped);

  return (
    <div className="w-full max-w-sm">
      <svg viewBox="0 0 240 140" className="h-44 w-full">
        <path
          d="M 20 120 A 100 100 0 0 1 220 120"
          fill="none"
          stroke="#d9e4ea"
          strokeWidth="12"
          strokeLinecap="butt"
        />
        <path
          d="M 20 120 A 100 100 0 0 1 220 120"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="butt"
          strokeDasharray={`${progress} ${circumference}`}
        />
        <text x="120" y="88" textAnchor="middle" className="fill-gdi-on-surface text-5xl font-black">
          {clamped}
        </text>
        <text x="120" y="109" textAnchor="middle" className="fill-gdi-outline text-xs font-bold">
          / 100
        </text>
      </svg>
    </div>
  );
}

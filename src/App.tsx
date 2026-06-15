import { useState } from 'react';
import { calculateVmg, calculateProgress } from './vmg';
import './App.css';

// ── helpers ──────────────────────────────────────────────────────────────────

function parsePositiveFloat(value: string): number {
  const n = parseFloat(value);
  return isNaN(n) || n < 0 ? 0 : n;
}

function parseFloatAllowNegative(value: string): number {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
}

function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

// ── BearingDiagram SVG ────────────────────────────────────────────────────────

interface BearingDiagramProps {
  cogOffsetDeg: number;
  sogA: number;
  sogB: number;
  winner: 'A' | 'B' | 'equal';
}

function BearingDiagram({ cogOffsetDeg, sogA, sogB, winner }: BearingDiagramProps) {
  const cx = 80;
  const cy = 90;
  const maxLen = 64;

  const maxSog = Math.max(sogA, sogB, 0.1);

  const lenA = (sogA / maxSog) * maxLen;
  const lenB = (sogB / maxSog) * maxLen;

  const angleB = cogOffsetDeg; // degrees; 0 = up
  const radB = ((angleB - 90) * Math.PI) / 180; // rotate so 0° points up

  const axA = cx;
  const ayA = cy - lenA;

  const axB = cx + lenB * Math.cos(radB);
  const ayB = cy + lenB * Math.sin(radB);

  // progress arrow: straight up, scaled to progress
  const progressA = calculateProgress(sogA, 0);
  const progressB = calculateProgress(sogB, cogOffsetDeg);
  const maxProgress = Math.max(progressA, progressB, 0.1);
  const pLenA = (progressA / maxProgress) * maxLen;
  const pLenB = (progressB / maxProgress) * maxLen;

  const colorA = winner === 'A' ? '#22d3ee' : '#64748b';
  const colorB = winner === 'B' ? '#22d3ee' : '#64748b';
  const markColor = '#94a3b8';

  function arrowHead(x: number, y: number, angleDeg: number, color: string) {
    const r = ((angleDeg - 90) * Math.PI) / 180;
    const size = 6;
    const tipX = x;
    const tipY = y;
    const l1x = tipX + size * Math.cos(r + 2.5);
    const l1y = tipY + size * Math.sin(r + 2.5);
    const l2x = tipX + size * Math.cos(r - 2.5);
    const l2y = tipY + size * Math.sin(r - 2.5);
    return (
      <polygon
        points={`${tipX},${tipY} ${l1x},${l1y} ${l2x},${l2y}`}
        fill={color}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 160 140"
      className="w-full max-w-[200px] mx-auto"
      aria-label="Bearing diagram"
      role="img"
    >
      {/* Background */}
      <rect width="160" height="140" fill="#0f172a" rx="8" />

      {/* Compass rose — light rings */}
      <circle cx={cx} cy={cy} r="70" fill="none" stroke="#1e293b" strokeWidth="1" />
      <circle cx={cx} cy={cy} r="48" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />

      {/* Mark indicator (windward) */}
      <line
        x1={cx}
        y1={cy - 72}
        x2={cx}
        y2={cy - 60}
        stroke={markColor}
        strokeWidth="1.5"
      />
      <polygon
        points={`${cx},${cy - 74} ${cx - 5},${cy - 62} ${cx + 5},${cy - 62}`}
        fill={markColor}
      />
      <text
        x={cx}
        y={cy - 78}
        textAnchor="middle"
        fontSize="7"
        fill={markColor}
        fontFamily="system-ui"
      >
        MARK
      </text>

      {/* Origin point */}
      <circle cx={cx} cy={cy} r="3" fill="#475569" />

      {/* Course A — Direct */}
      <line
        x1={cx}
        y1={cy}
        x2={axA}
        y2={ayA}
        stroke={colorA}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {arrowHead(axA, ayA, 0, colorA)}

      {/* Progress projection A (dashed, straight up) */}
      <line
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy - pLenA}
        stroke={colorA}
        strokeWidth="1"
        strokeDasharray="3 2"
        opacity="0.5"
      />

      {/* Course B — Offset */}
      <line
        x1={cx}
        y1={cy}
        x2={axB}
        y2={ayB}
        stroke={colorB}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {arrowHead(axB, ayB, angleB, colorB)}

      {/* Progress projection B (dashed, straight up) */}
      <line
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy - pLenB}
        stroke={colorB}
        strokeWidth="1"
        strokeDasharray="3 2"
        opacity="0.5"
      />

      {/* Legend */}
      <circle cx="14" cy="126" r="4" fill={colorA} />
      <text x="21" y="130" fontSize="7.5" fill={colorA} fontFamily="system-ui">
        Direct
      </text>
      <circle cx="70" cy="126" r="4" fill={colorB} />
      <text x="77" y="130" fontSize="7.5" fill={colorB} fontFamily="system-ui">
        Offset
      </text>
    </svg>
  );
}

// ── InputCard ─────────────────────────────────────────────────────────────────

interface InputCardProps {
  title: string;
  subtitle: string;
  sogValue: string;
  onSogChange: (v: string) => void;
  cogOffsetValue?: string;
  onCogOffsetChange?: (v: string) => void;
  progress: number;
  isWinner: boolean;
  isEqual: boolean;
}

function InputCard({
  title,
  subtitle,
  sogValue,
  onSogChange,
  cogOffsetValue,
  onCogOffsetChange,
  progress,
  isWinner,
  isEqual,
}: InputCardProps) {
  const highlight = isEqual
    ? 'border-slate-500'
    : isWinner
      ? 'border-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.25)]'
      : 'border-slate-700';

  return (
    <div
      className={`relative rounded-xl border-2 ${highlight} bg-slate-800 p-4 transition-all duration-300`}
    >
      {isWinner && !isEqual && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-400 px-3 py-0.5 text-xs font-bold text-slate-900 tracking-wider uppercase">
          Best
        </span>
      )}

      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-1">
        {subtitle}
      </h2>
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>

      <div className="space-y-3">
        {/* SOG input */}
        <label className="block">
          <span className="block text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">
            SOG (kn)
          </span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={sogValue}
            onChange={(e) => onSogChange(e.target.value)}
            placeholder="0.0"
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-xl font-mono text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </label>

        {/* COG display or offset input */}
        {onCogOffsetChange ? (
          <label className="block">
            <span className="block text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">
              COG Offset (°)
            </span>
            <input
              type="number"
              step="0.5"
              value={cogOffsetValue}
              onChange={(e) => onCogOffsetChange(e.target.value)}
              placeholder="0.0"
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-xl font-mono text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </label>
        ) : (
          <div>
            <span className="block text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">
              COG
            </span>
            <div className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-xl font-mono text-slate-500 select-none">
              0°&nbsp;
              <span className="text-xs text-slate-600">(fixed)</span>
            </div>
          </div>
        )}
      </div>

      {/* Progress display */}
      <div className="mt-4 rounded-lg bg-slate-900 px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-slate-500 uppercase tracking-wide">
          Effective Progress
        </span>
        <span
          className={`text-2xl font-mono font-bold ${isWinner && !isEqual ? 'text-cyan-400' : 'text-slate-300'}`}
        >
          {fmt(progress)} kn
        </span>
      </div>
    </div>
  );
}

// ── ResultsBanner ─────────────────────────────────────────────────────────────

interface ResultsBannerProps {
  winner: 'A' | 'B' | 'equal';
  advantage: number;
  improvementPct: number;
  progressA: number;
  progressB: number;
  cogOffsetDeg: number;
}

function ResultsBanner({
  winner,
  advantage,
  improvementPct,
  progressA,
  progressB,
  cogOffsetDeg,
}: ResultsBannerProps) {
  if (winner === 'equal') {
    return (
      <div className="rounded-xl border-2 border-slate-600 bg-slate-800 p-5 text-center">
        <p className="text-slate-400 text-sm uppercase tracking-widest mb-1">Result</p>
        <p className="text-xl font-bold text-white">Both courses are equal</p>
        <p className="text-slate-400 mt-1 text-sm">
          Effective progress: {fmt(progressA)} kn
        </p>
      </div>
    );
  }

  const winnerLabel = winner === 'A' ? 'Direct Course' : 'Offset Course';
  const winnerProgress = winner === 'A' ? progressA : progressB;
  const directionNote =
    winner === 'B'
      ? `Sailing ${Math.abs(cogOffsetDeg).toFixed(1)}° ${cogOffsetDeg > 0 ? 'higher' : 'lower'} is more efficient.`
      : 'Sailing directly toward the mark is more efficient.';

  return (
    <div className="rounded-xl border-2 border-cyan-400 bg-slate-800 p-5 shadow-[0_0_24px_rgba(34,211,238,0.2)]">
      {/* Header */}
      <div className="text-center mb-4">
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-0.5">
          Best Option
        </p>
        <p className="text-2xl font-bold text-cyan-400">{winnerLabel}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-slate-900 p-3 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Progress</p>
          <p className="text-lg font-mono font-bold text-white">
            {fmt(winnerProgress)} kn
          </p>
        </div>
        <div className="rounded-lg bg-slate-900 p-3 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Advantage</p>
          <p className="text-lg font-mono font-bold text-cyan-400">
            +{fmt(advantage)} kn
          </p>
        </div>
        <div className="rounded-lg bg-slate-900 p-3 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Improvement</p>
          <p className="text-lg font-mono font-bold text-cyan-400">
            +{fmt(improvementPct, 1)}%
          </p>
        </div>
      </div>

      {/* Direction note */}
      <p className="text-center text-slate-400 text-sm italic">{directionNote}</p>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [sogAStr, setSogAStr] = useState('6.00');
  const [sogBStr, setSogBStr] = useState('6.50');
  const [cogOffsetStr, setCogOffsetStr] = useState('15');

  const sogA = parsePositiveFloat(sogAStr);
  const sogB = parsePositiveFloat(sogBStr);
  const cogOffset = parseFloatAllowNegative(cogOffsetStr);

  const result = calculateVmg(
    { sog: sogA, cogOffset: 0 },
    { sog: sogB, cogOffset },
  );

  return (
    <div className="min-h-svh bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/90 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          {/* Compass icon */}
          <svg
            viewBox="0 0 24 24"
            className="w-7 h-7 text-cyan-400 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polygon points="12,4 14,12 12,20 10,12" fill="currentColor" stroke="none" opacity="0.6" />
            <polygon points="4,12 12,14 20,12 12,10" fill="currentColor" stroke="none" />
          </svg>
          <div>
            <h1 className="text-base font-bold text-white leading-none">
              VMG Calculator
            </h1>
            <p className="text-xs text-slate-400">Velocity Made Good</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5 space-y-5">
        {/* Bearing Diagram */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-widest text-center mb-3">
            Course Diagram
          </p>
          <BearingDiagram
            cogOffsetDeg={cogOffset}
            sogA={sogA}
            sogB={sogB}
            winner={result.winner}
          />
        </div>

        {/* Input cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputCard
            subtitle="Dataset A"
            title="Direct Course"
            sogValue={sogAStr}
            onSogChange={setSogAStr}
            progress={result.progressA}
            isWinner={result.winner === 'A'}
            isEqual={result.winner === 'equal'}
          />
          <InputCard
            subtitle="Dataset B"
            title="Offset Course"
            sogValue={sogBStr}
            onSogChange={setSogBStr}
            cogOffsetValue={cogOffsetStr}
            onCogOffsetChange={setCogOffsetStr}
            progress={result.progressB}
            isWinner={result.winner === 'B'}
            isEqual={result.winner === 'equal'}
          />
        </div>

        {/* Results banner */}
        <ResultsBanner
          winner={result.winner}
          advantage={result.advantage}
          improvementPct={result.improvementPct}
          progressA={result.progressA}
          progressB={result.progressB}
          cogOffsetDeg={cogOffset}
        />

        {/* Formula note */}
        <p className="text-center text-xs text-slate-600 pb-4">
          Progress = SOG × cos(COG offset)
        </p>
      </main>
    </div>
  );
}

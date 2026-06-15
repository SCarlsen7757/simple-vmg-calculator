import { useState, useEffect } from 'react';
import { calculateVmg, type Tack } from './vmg';
import DiagramPage from './DiagramPage';
import './App.css';

// ── helpers ──────────────────────────────────────────────────────────────────

function parsePositiveFloat(value: string): number {
  const n = parseFloat(value);
  return isNaN(n) || n < 0 ? 0 : n;
}

function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

function routeFromHash(hash: string): string {
  const [rawRoute] = hash.split('?');
  const route = rawRoute || '#/';

  if (route === '#') {
    return '#/';
  }

  return route.replace(/\/+$/, '') || '#/';
}

// ── InputCard ─────────────────────────────────────────────────────────────────

interface InputCardProps {
  title: string;
  subtitle: string;
  sogValue: string;
  onSogChange: (v: string) => void;
  cogValue: string;
  onCogChange: (v: string) => void;
  progress: number;
  isWinner: boolean;
  isEqual: boolean;
  tack: Tack;
}

function InputCard({
  title,
  subtitle,
  sogValue,
  onSogChange,
  cogValue,
  onCogChange,
  progress,
  isWinner,
  isEqual,
  tack,
}: InputCardProps) {
  const isStarboard = tack === 'starboard';
  const highlight = isEqual
    ? 'border-slate-500'
    : isWinner
      ? isStarboard
        ? 'border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
        : 'border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
      : 'border-slate-700';

  const handleSogDec = () => {
    const current = parseFloat(sogValue) || 0;
    const next = Math.max(0, current - 0.1);
    onSogChange(next.toFixed(1));
  };

  const handleSogInc = () => {
    const current = parseFloat(sogValue) || 0;
    const next = current + 0.1;
    onSogChange(next.toFixed(1));
  };

  const handleCogDec = () => {
    const current = parseInt(cogValue) || 0;
    const next = (current - 1 + 360) % 360;
    onCogChange(next.toString());
  };

  const handleCogInc = () => {
    const current = parseInt(cogValue) || 0;
    const next = (current + 1) % 360;
    onCogChange(next.toString());
  };

  return (
    <div
      className={`relative rounded-xl border-2 ${highlight} bg-slate-800 p-3 transition-all duration-300`}
    >
      {isWinner && !isEqual && (
        <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full ${isStarboard ? 'bg-emerald-500' : 'bg-rose-500'} px-2 py-0.5 text-[9px] font-black text-white tracking-widest uppercase`}>
          Best
        </span>
      )}

      <div className="flex justify-between items-baseline mb-2">
        <h3 className="text-xs font-black text-slate-200 tracking-tight">{title}</h3>
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
          {subtitle}
        </span>
      </div>

      <div className="space-y-2.5">
        {/* SOG input */}
        <div>
          <span className="block text-[9px] text-slate-400 mb-0.5 font-bold uppercase tracking-wider">
            SOG (kn)
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleSogDec}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 font-black text-lg active:bg-slate-700 select-none hover:bg-slate-850 focus:outline-none"
            >
              -
            </button>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={sogValue}
              onChange={(e) => onSogChange(e.target.value)}
              placeholder="0.0"
              className="w-full h-9 text-center rounded-lg border border-slate-750 bg-slate-950 px-1 text-sm font-mono font-bold text-white placeholder-slate-700 focus:border-slate-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSogInc}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 font-black text-lg active:bg-slate-700 select-none hover:bg-slate-850 focus:outline-none"
            >
              +
            </button>
          </div>
        </div>

        {/* COG input */}
        <div>
          <span className="block text-[9px] text-slate-400 mb-0.5 font-bold uppercase tracking-wider">
            COG (°)
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCogDec}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 font-black text-lg active:bg-slate-700 select-none hover:bg-slate-850 focus:outline-none"
            >
              -
            </button>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              max="359"
              step="1"
              value={cogValue}
              onChange={(e) => onCogChange(e.target.value)}
              placeholder="0"
              className="w-full h-9 text-center rounded-lg border border-slate-750 bg-slate-950 px-1 text-sm font-mono font-bold text-white placeholder-slate-700 focus:border-slate-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCogInc}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 font-black text-lg active:bg-slate-700 select-none hover:bg-slate-850 focus:outline-none"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Progress display */}
      <div className="mt-2.5 rounded-lg bg-slate-950 px-2.5 py-1.5 flex items-center justify-between">
        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">
          VMG Prog
        </span>
        <span
          className={`text-sm font-mono font-bold ${isWinner && !isEqual ? (isStarboard ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-400'}`}
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
  relativeDiff: number;
  tack: Tack;
}

function ResultsBanner({
  winner,
  advantage,
  improvementPct,
  progressA,
  progressB,
  relativeDiff,
  tack,
}: ResultsBannerProps) {
  const isStarboard = tack === 'starboard';
  const borderHighlight = winner === 'equal'
    ? 'border-slate-600'
    : isStarboard
      ? 'border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
      : 'border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.15)]';

  const textTheme = isStarboard ? 'text-emerald-400' : 'text-rose-400';

  if (winner === 'equal') {
    return (
      <div className="rounded-xl border-2 border-slate-700 bg-slate-800 p-3 text-center">
        <p className="text-base font-black text-white uppercase tracking-wider">Equal Performance</p>
        <p className="text-slate-400 text-xs mt-0.5 font-medium">
          Effective progress: <span className="font-mono font-bold text-white">{fmt(progressA)} kn</span> for both.
        </p>
      </div>
    );
  }

  const winnerLabel = winner === 'A' ? 'Course A' : 'Course B';
  const winnerProgress = winner === 'A' ? progressA : progressB;

  const isBRightOfA = relativeDiff > 0;
  let advice: string;
  if (relativeDiff !== 0) {
    const side = tack === 'starboard' 
      ? (isBRightOfA ? 'higher' : 'lower') 
      : (isBRightOfA ? 'lower' : 'higher');
    advice = `B sails ${Math.abs(relativeDiff).toFixed(0)}° ${side} than A.`;
  } else {
    advice = 'Courses are parallel.';
  }

  return (
    <div className={`rounded-xl border-2 ${borderHighlight} bg-slate-800 p-3.5 flex flex-col items-center justify-center text-center transition-all duration-300`}>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-0.5">
        Best Option
      </p>
      <p className={`text-xl font-black uppercase tracking-tight ${textTheme}`}>
        {winnerLabel}
      </p>
      <div className="mt-1 text-xs text-slate-300 space-y-0.5">
        <p className="font-semibold">
          VMG: <span className="font-mono text-white text-sm font-bold">{fmt(winnerProgress)} kn</span> 
          <span className={`${textTheme} ml-2 font-bold`}>
            (+{fmt(advantage)} kn / +{fmt(improvementPct, 1)}%)
          </span>
        </p>
        <p className="text-slate-400 text-[10px] font-semibold italic uppercase tracking-wider mt-1">
          {advice}
        </p>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [path, setPath] = useState(() => routeFromHash(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      setPath(routeFromHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navigateTo = (newHash: string) => {
    window.location.hash = newHash;
  };

  const [sogAStr, setSogAStr] = useState(() => localStorage.getItem('vmg_sogA') ?? '5.6');
  const [sogBStr, setSogBStr] = useState(() => localStorage.getItem('vmg_sogB') ?? '5.8');
  const [cogAStr, setCogAStr] = useState(() => localStorage.getItem('vmg_cogA') ?? '247');
  const [cogBStr, setCogBStr] = useState(() => localStorage.getItem('vmg_cogB') ?? '249');
  const [tack, setTack] = useState<Tack>(() => (localStorage.getItem('vmg_tack') as Tack) ?? 'starboard');

  useEffect(() => {
    localStorage.setItem('vmg_sogA', sogAStr);
  }, [sogAStr]);

  useEffect(() => {
    localStorage.setItem('vmg_sogB', sogBStr);
  }, [sogBStr]);

  useEffect(() => {
    localStorage.setItem('vmg_cogA', cogAStr);
  }, [cogAStr]);

  useEffect(() => {
    localStorage.setItem('vmg_cogB', cogBStr);
  }, [cogBStr]);

  useEffect(() => {
    localStorage.setItem('vmg_tack', tack);
  }, [tack]);

  const sogA = parsePositiveFloat(sogAStr);
  const sogB = parsePositiveFloat(sogBStr);
  const cogA = parsePositiveFloat(cogAStr);
  const cogB = parsePositiveFloat(cogBStr);

  const result = calculateVmg(
    { sog: sogA, cog: cogA },
    { sog: sogB, cog: cogB },
    tack
  );

  const isStarboard = tack === 'starboard';
  const tackColorText = isStarboard ? 'text-emerald-400' : 'text-rose-400';

  if (path === '#/diagram') {
    return <DiagramPage onBack={() => navigateTo('#/')} />;
  }

  return (

    <div className="min-h-svh bg-slate-900 text-white flex flex-col justify-between selection:bg-slate-700">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-md px-4 py-2 flex items-center justify-between">
            <div className='flex items-center gap-2'>
              {/* Compass icon */}
              <svg
                viewBox="0 0 24 24"
                className={`w-6 h-6 ${tackColorText} shrink-0 transition-colors duration-300`}
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
                <h1 className="text-xs font-black text-white leading-none tracking-wider uppercase">
                  VMG Calc
                </h1>
                <p className="text-[9px] text-slate-500 font-bold tracking-wider uppercase">Velocity Made Good</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateTo('#/diagram')}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs uppercase tracking-wider transition-colors duration-200"
              >
                Diagram
              </button>
              <button 
                onClick={() => setTack(tack === 'port' ? 'starboard' : 'port')}
                className={`w-24 py-1.5 rounded-lg font-black text-xs uppercase tracking-wider text-center transition-all duration-300 ${
                  isStarboard 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/20 active:scale-95' 
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/20 active:scale-95'
                }`}
              >
                {tack}
              </button>
            </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-md px-4 py-4 flex flex-col justify-start gap-3">
        {/* Input cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <InputCard
            subtitle="Ref"
            title="Course A"
            sogValue={sogAStr}
            onSogChange={setSogAStr}
            cogValue={cogAStr}
            onCogChange={setCogAStr}
            progress={result.progressA}
            isWinner={result.winner === 'A'}
            isEqual={result.winner === 'equal'}
            tack={tack}
          />
          <InputCard
            subtitle="Rel"
            title="Course B"
            sogValue={sogBStr}
            onSogChange={setSogBStr}
            cogValue={cogBStr}
            onCogChange={setCogBStr}
            progress={result.progressB}
            isWinner={result.winner === 'B'}
            isEqual={result.winner === 'equal'}
            tack={tack}
          />
        </div>

        {/* Results banner */}
        <ResultsBanner
          winner={result.winner}
          advantage={result.advantage}
          improvementPct={result.improvementPct}
          progressA={result.progressA}
          progressB={result.progressB}
          relativeDiff={result.relativeDiff}
          tack={tack}
        />
      </main>

      {/* Footer */}
      <footer className="text-center py-2 border-t border-slate-800 bg-slate-950/35">
        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
          Mobile-First Tactical Sailing Tool
        </p>
      </footer>
    </div>
  );
}

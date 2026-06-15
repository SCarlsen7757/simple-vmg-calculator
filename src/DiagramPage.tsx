import { useState } from 'react';

// Interface for the angle/required SOG data point
interface DiagramPoint {
  angle: number;
  requiredSog: number;
}

interface DiagramPageProps {
  onBack: () => void;
}

export default function DiagramPage({ onBack }: DiagramPageProps) {
  const [baselineSogStr, setBaselineSogStr] = useState('5.5');
  const [maxAngleStr, setMaxAngleStr] = useState('30'); // Default to 30, customizable from 10 to 45

  // Parse baseline SOG and max angle offset
  const baselineSog = Math.max(0.1, parseFloat(baselineSogStr) || 5.5);
  const maxAngle = Math.max(10, Math.min(45, parseInt(maxAngleStr) || 30));

  // Setup graph limits
  const yMin = Math.max(0, baselineSog - 1.0);
  const yMax = Math.max(1.5, baselineSog * 1.5);

  // Generate data points for the curve (from 0 to maxAngle degrees in 1 degree steps for smooth path)
  const pathPoints: string[] = [];
  const tablePoints: DiagramPoint[] = [];

  for (let angle = 0; angle <= maxAngle; angle++) {
    const radians = (angle * Math.PI) / 180;
    const cosVal = Math.cos(radians);
    const reqSog = cosVal > 0.01 ? baselineSog / cosVal : yMax;
    
    // Map to SVG coordinates:
    // Width = 600, Height = 400. Margins: Left = 60, Right = 30, Top = 40, Bottom = 50
    // Plot area: X in [60, 570], Y in [40, 350]
    const px = 60 + (angle / maxAngle) * 510;
    const clampedReqSog = Math.min(reqSog, yMax);
    const py = 350 - ((clampedReqSog - yMin) / (yMax - yMin)) * 310;
    pathPoints.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }

  // Generate table points dynamically (exactly 10 intervals / 11 points)
  const angleStep = maxAngle / 10;
  for (let i = 0; i <= 10; i++) {
    const angle = i * angleStep;
    const radians = (angle * Math.PI) / 180;
    const reqSog = baselineSog / Math.cos(radians);
    tablePoints.push({ angle, requiredSog: reqSog });
  }

  // Generate vertical grid ticks (exactly the same 11 points for 10 intervals)
  const xGridTicks: number[] = [];
  for (let i = 0; i <= 10; i++) {
    xGridTicks.push(i * angleStep);
  }


  // Path SVG coordinates for drawing
  const curvePathD = `M ${pathPoints.join(' L ')}`;


  // Shaded area under curve (Worse VMG / Stay Higher)
  const worseAreaD = `M 60,350 L ${pathPoints.join(' L ')} L 570,350 Z`;

  // Shaded area above curve (Better VMG / Sail Lower with More Speed)
  const betterAreaD = `M 60,40 L ${pathPoints.join(' L ')} L 570,40 Z`;

  // Map arbitrary SOG value to Y coordinate
  const getSogY = (sog: number) => {
    const clamped = Math.max(yMin, Math.min(sog, yMax));
    return 350 - ((clamped - yMin) / (yMax - yMin)) * 310;
  };

  const yBaselinePix = getSogY(baselineSog);

  // Generate Y-axis grid labels (6 steps)
  const yTicks: number[] = [];
  const yStep = (yMax - yMin) / 5;
  for (let i = 0; i <= 5; i++) {
    yTicks.push(yMin + yStep * i);
  }

  // Increment / Decrement baseline SOG
  const handleSogDec = () => {
    const current = parseFloat(baselineSogStr) || 0;
    const next = Math.max(0.1, current - 0.1);
    setBaselineSogStr(next.toFixed(1));
  };

  const handleSogInc = () => {
    const current = parseFloat(baselineSogStr) || 0;
    const next = current + 0.1;
    setBaselineSogStr(next.toFixed(1));
  };

  // Increment / Decrement max angle offset
  const handleAngleDec = () => {
    const current = parseInt(maxAngleStr) || 30;
    const next = Math.max(10, current - 5);
    setMaxAngleStr(next.toString());
  };

  const handleAngleInc = () => {
    const current = parseInt(maxAngleStr) || 30;
    const next = Math.min(45, current + 5);
    setMaxAngleStr(next.toString());
  };


  return (
    <div className="min-h-svh bg-slate-900 text-white flex flex-col justify-between selection:bg-slate-700 print:bg-white print:text-black">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-10 print:hidden">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white transition-colors duration-200"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12,19 5,12 12,5" />
            </svg>
            Back to Calc
          </button>
          
          <h1 className="text-xs font-black text-slate-300 leading-none tracking-widest uppercase">
            SOG TARGET CARD
          </h1>

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all duration-200"
          >
            Print Card
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-6 print:py-0 print:px-0 flex flex-col gap-6">
        
        {/* Input Card - Hidden during printing */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 print:hidden">
          <h3 className="text-sm font-black text-slate-200 tracking-tight mb-3 uppercase">
            Baseline Target Setup
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {/* Baseline SOG Input */}
            <div>
              <span className="block text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">
                Baseline SOG (kn) at 0° offset
              </span>
              <div className="flex items-center gap-1.5 max-w-[240px]">
                <button
                  type="button"
                  onClick={handleSogDec}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 font-black text-xl active:bg-slate-700 select-none hover:bg-slate-800 focus:outline-none"
                >
                  -
                </button>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.1"
                  step="0.1"
                  value={baselineSogStr}
                  onChange={(e) => setBaselineSogStr(e.target.value)}
                  placeholder="5.5"
                  className="w-full h-10 text-center rounded-lg border border-slate-750 bg-slate-950 text-base font-mono font-bold text-white placeholder-slate-700 focus:border-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSogInc}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 font-black text-xl active:bg-slate-700 select-none hover:bg-slate-800 focus:outline-none"
                >
                  +
                </button>
              </div>
            </div>

            {/* Max Angle Input */}
            <div>
              <span className="block text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">
                Max Angle Offset (10° - 45°)
              </span>
              <div className="flex items-center gap-1.5 max-w-[240px]">
                <button
                  type="button"
                  onClick={handleAngleDec}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 font-black text-xl active:bg-slate-700 select-none hover:bg-slate-800 focus:outline-none"
                >
                  -
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min="10"
                  max="45"
                  step="5"
                  value={maxAngleStr}
                  onChange={(e) => setMaxAngleStr(e.target.value)}
                  placeholder="30"
                  className="w-full h-10 text-center rounded-lg border border-slate-750 bg-slate-950 text-base font-mono font-bold text-white placeholder-slate-700 focus:border-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAngleInc}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 font-black text-xl active:bg-slate-700 select-none hover:bg-slate-800 focus:outline-none"
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="text-xs text-slate-400 space-y-1.5 md:col-span-1">
              <p>
                <strong className="text-slate-300">How to use this diagram:</strong> If you are sailing at a baseline SOG (e.g. {baselineSog.toFixed(1)} kn) and decide to sail lower to gain speed, this chart shows exactly how much faster you must sail at any given angle offset to maintain or improve your Velocity Made Good (VMG).
              </p>
            </div>
          </div>
        </div>

        {/* Printable Card Area */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 md:p-6 print:border-0 print:bg-white print:p-0 print:text-black">
          
          {/* Print Header */}
          <div className="mb-4 text-center print:block">
            <h2 className="text-lg font-black tracking-tight text-white print:text-black uppercase">
              VMG SOG Target Reference Card
            </h2>
            <p className="text-xs font-mono font-bold text-slate-400 print:text-slate-800 mt-1 uppercase">
              Baseline SOG: <span className="text-indigo-400 print:text-indigo-900">{baselineSog.toFixed(1)} Knots</span> at 0° offset
            </p>
          </div>

          {/* SVG Line Diagram */}
          <div className="relative w-full aspect-[3/2] bg-slate-950/40 rounded-xl overflow-hidden border border-slate-850 p-1 print:border-2 print:border-black print:rounded-none print:bg-white">
            <svg
              viewBox="0 0 600 400"
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Grid Background Shading */}
              {/* Better VMG Area (Above Curve) */}
              <path
                d={betterAreaD}
                className="fill-emerald-500/5 print:fill-emerald-100/15"
              />
              {/* Worse VMG Area (Below Curve) */}
              <path
                d={worseAreaD}
                className="fill-rose-500/5 print:fill-rose-100/10"
              />

              {/* Grid Lines - Horizontal */}
              {yTicks.map((tickVal, index) => {
                const yPix = getSogY(tickVal);
                return (
                  <g key={`y-grid-${index}`}>
                    <line
                      x1="60"
                      y1={yPix}
                      x2="570"
                      y2={yPix}
                      className="stroke-slate-800/80 print:stroke-slate-300 stroke-1"
                    />
                    <text
                      x="50"
                      y={yPix + 4}
                      textAnchor="end"
                      className="fill-slate-500 print:fill-slate-900 font-mono text-[10px] font-bold"
                    >
                      {tickVal.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Grid Lines - Vertical (Angle offsets up to maxAngle) */}
              {xGridTicks.map((angle, index) => {
                const xPix = 60 + (angle / maxAngle) * 510;
                return (
                  <g key={`x-grid-${index}`}>
                    <line
                      x1={xPix}
                      y1="40"
                      x2={xPix}
                      y2="350"
                      className="stroke-slate-800/80 print:stroke-slate-300 stroke-1"
                    />
                    <text
                      x={xPix}
                      y="368"
                      textAnchor="middle"
                      className="fill-slate-500 print:fill-slate-900 font-mono text-[10px] font-bold"
                    >
                      {angle % 1 === 0 ? angle : angle.toFixed(1)}°
                    </text>
                  </g>
                );
              })}


              {/* Baseline Reference Dashed Line */}
              <line
                x1="60"
                y1={yBaselinePix}
                x2="570"
                y2={yBaselinePix}
                strokeDasharray="5 5"
                className="stroke-slate-400 print:stroke-slate-600 stroke-1.5"
              />
              <text
                x="565"
                y={yBaselinePix - 6}
                textAnchor="end"
                className="fill-slate-400 print:fill-slate-700 font-sans font-bold text-[9px] uppercase tracking-wider"
              >
                Baseline SOG ({baselineSog.toFixed(1)} kn)
              </text>

              {/* Better/Worse Area Labels */}
              <text
                x="315"
                y="100"
                textAnchor="middle"
                className="fill-emerald-500/40 print:fill-emerald-800/85 font-sans font-black text-sm uppercase tracking-widest pointer-events-none"
              >
                BETTER VMG (SAIL LOWER)
              </text>
              <text
                x="315"
                y="300"
                textAnchor="middle"
                className="fill-rose-500/30 print:fill-rose-800/70 font-sans font-black text-sm uppercase tracking-widest pointer-events-none"
              >
                WORSE VMG (SAIL HIGHER)
              </text>

              {/* The Equal VMG Boundary Curve (High-contrast red curve) */}
              <path
                d={curvePathD}
                fill="none"
                className="stroke-rose-500 print:stroke-rose-700"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Axis Titles */}
              <text
                x="315"
                y="392"
                textAnchor="middle"
                className="fill-slate-400 print:fill-slate-900 font-sans font-black text-[10px] uppercase tracking-wider"
              >
                Angle Offset from Baseline Heading (°)
              </text>
              <text
                x="16"
                y="195"
                textAnchor="middle"
                transform="rotate(-90 16 195)"
                className="fill-slate-400 print:fill-slate-900 font-sans font-black text-[10px] uppercase tracking-wider"
              >
                Required Speed SOG (kn)
              </text>

              {/* Legend */}
              <g transform="translate(75, 55)" className="print:translate-x-[75px] print:translate-y-[55px]">
                <rect x="0" y="0" width="165" height="42" className="fill-slate-900/90 stroke-slate-800/80 print:fill-white print:stroke-black print:stroke-1" rx="4" />
                <line x1="8" y1="12" x2="28" y2="12" className="stroke-rose-500 print:stroke-rose-700 stroke-[3]" />
                <text x="34" y="15" className="fill-slate-300 print:fill-black font-sans font-bold text-[9px] uppercase tracking-wider">Equal VMG Curve</text>
                
                <line x1="8" y1="28" x2="28" y2="28" strokeDasharray="3 3" className="stroke-slate-400 print:stroke-slate-600 stroke-[1.5]" />
                <text x="34" y="31" className="fill-slate-300 print:fill-black font-sans font-bold text-[9px] uppercase tracking-wider">Baseline SOG</text>
              </g>
            </svg>
          </div>

          {/* Quick Lookup Data Table */}
          <div className="mt-5 print:mt-4">
            <h3 className="text-[10px] font-black text-slate-400 print:text-slate-800 uppercase tracking-widest mb-2 text-center">
              Quick Reference Table
            </h3>
            <div className="overflow-x-auto rounded-lg border border-slate-850 print:border-black print:border-collapse">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-850 text-[10px] font-black uppercase tracking-wider text-slate-400 print:bg-slate-100 print:border-b-2 print:border-black print:text-black">
                    <th className="p-2.5 text-center">Offset (°)</th>
                    <th className="p-2.5 text-center">Target SOG (kn)</th>
                    <th className="p-2.5 text-center">Diff (kn)</th>
                    <th className="p-2.5 text-center">Diff (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 font-mono font-semibold text-slate-300 print:divide-y print:divide-slate-300 print:text-black">
                  {tablePoints.map((pt, idx) => {
                    const diffSog = pt.requiredSog - baselineSog;
                    const diffPct = (diffSog / baselineSog) * 100;
                    
                    return (
                      <tr key={`table-row-${idx}`} className="hover:bg-slate-900/30 print:hover:bg-transparent">
                        <td className="p-2 text-center text-slate-100 print:text-black font-bold">
                          {pt.angle % 1 === 0 ? pt.angle : pt.angle.toFixed(1)}°
                        </td>
                        <td className="p-2 text-center text-indigo-300 print:text-black font-bold">
                          {pt.requiredSog.toFixed(2)} kn
                        </td>
                        <td className="p-2 text-center font-bold text-slate-400 print:text-black">
                          {idx === 0 ? '-' : `+${diffSog.toFixed(2)} kn`}
                        </td>
                        <td className="p-2 text-center font-bold text-slate-400 print:text-black">
                          {idx === 0 ? '-' : `+${diffPct.toFixed(1)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-3 border-t border-slate-850 bg-slate-950/35 print:hidden">
        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
          Sailing Target Card Generator • Print & Laminate
        </p>
      </footer>
    </div>
  );
}

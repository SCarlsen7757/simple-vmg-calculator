import { useState } from 'react';
import { calculateRequiredSog, type DiagramPoint } from './vmg';

interface QuickLookupTableProps {
  className?: string;
  tablePoints: DiagramPoint[];
  baselineSog: number;
}

function QuickLookupTable({ className = '', tablePoints, baselineSog }: QuickLookupTableProps) {
  return (
    <div className={className}>
      <h3 className="text-[10px] font-mono font-semibold text-magenta-300 print:text-slate-800 uppercase tracking-wide mb-1.5 lg:mb-1 text-center">
        Quick Reference Table
      </h3>
      <div className="overflow-x-auto rounded-sm border border-slate-800 print:border-black print:border-collapse">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-[10px] font-semibold uppercase tracking-wide text-cyan-300 print:bg-slate-100 print:border-b-2 print:border-black print:text-black">
              <th className="p-2.5 lg:px-2 lg:py-1.5 text-center">Offset (°)</th>
              <th className="p-2.5 lg:px-2 lg:py-1.5 text-center">Target SOG (kn)</th>
              <th className="p-2.5 lg:px-2 lg:py-1.5 text-center">Diff (kn)</th>
              <th className="p-2.5 lg:px-2 lg:py-1.5 text-center">Diff (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono font-semibold text-slate-300 print:divide-y print:divide-slate-300 print:text-black">
            {tablePoints.map((pt, idx) => {
              const diffSog = pt.requiredSog - baselineSog;
              const diffPct = (diffSog / baselineSog) * 100;
              
              return (
                <tr key={`table-row-${idx}`} className="hover:bg-slate-950 print:hover:bg-transparent">
                  <td className="p-2 lg:px-2 lg:py-1 text-center text-cyan-100 print:text-black font-semibold">
                    {pt.angle % 1 === 0 ? pt.angle : pt.angle.toFixed(1)}°
                  </td>
                  <td className="p-2 lg:px-2 lg:py-1 text-center text-amber-300 print:text-black font-semibold">
                    {pt.requiredSog.toFixed(2)} kn
                  </td>
                  <td className="p-2 lg:px-2 lg:py-1 text-center font-semibold text-magenta-300/80 print:text-black">
                    {idx === 0 ? '-' : `+${diffSog.toFixed(2)} kn`}
                  </td>
                  <td className="p-2 lg:px-2 lg:py-1 text-center font-semibold text-magenta-300/80 print:text-black">
                    {idx === 0 ? '-' : `+${diffPct.toFixed(1)}%`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
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
    const reqSog = calculateRequiredSog(baselineSog, angle);
    
    // Map to SVG coordinates:
    // Width = 600, Height = 400. Margins: Left = 60, Right = 30, Top = 40, Bottom = 50
    // Plot area: X in [60, 570], Y in [40, 350]
    const px = 60 + (angle / maxAngle) * 510;
    const clampedReqSog = Math.min(reqSog || yMax, yMax);
    const py = 350 - ((clampedReqSog - yMin) / (yMax - yMin)) * 310;
    pathPoints.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }

  // Generate table points dynamically (exactly 10 intervals / 11 points)
  const angleStep = maxAngle / 10;
  for (let i = 0; i <= 10; i++) {
    const angle = i * angleStep;
    const reqSog = calculateRequiredSog(baselineSog, angle);
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
    <div className="min-h-svh bg-black text-white flex flex-col justify-between selection:bg-cyan-800 print:bg-white print:text-black">
      {/* Header */}
      <header className="border-b border-slate-800 bg-black/95 backdrop-blur sticky top-0 z-10 print:hidden">
        <div className="mx-auto w-full max-w-7xl px-4 py-2.5 lg:py-2 flex items-center justify-between">
          <button
            onClick={onBack}
            className="h-8 px-2.5 inline-flex items-center justify-center gap-1.5 rounded-sm border border-slate-700 leading-none bg-black hover:bg-slate-950 text-cyan-200 font-mono font-semibold text-[11px] uppercase tracking-wide transition-colors duration-200 focus:outline-none focus:border-cyan-400"
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
          
          <h1 className="text-xs font-mono font-semibold text-magenta-300 leading-none tracking-wide uppercase">
            SOG TARGET CARD
          </h1>

          <button
            onClick={() => window.print()}
            className="h-8 px-2.5 inline-flex items-center justify-center rounded-sm border border-slate-700 leading-none bg-black hover:bg-slate-950 text-cyan-200 font-mono font-semibold text-[11px] uppercase tracking-wide transition-colors duration-200 focus:outline-none focus:border-cyan-400"
          >
            Print Card
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-4 lg:py-2 print:py-0 print:px-0">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-3 print:block">
          {/* Right Column on Desktop: Setup + Quick Table */}
          <div className="order-1 lg:order-2 space-y-3 print:hidden">
            {/* Input Card - Hidden during printing */}
            <div className="rounded-sm border border-slate-800 bg-slate-950 p-3.5 lg:p-3">
              <h3 className="text-sm font-mono font-semibold text-cyan-200 tracking-wide mb-2.5 uppercase">
                Baseline Target Setup
              </h3>
              <div className="grid grid-cols-1 gap-2.5 items-start">
                <div className="space-y-2.5">
                  {/* Baseline SOG Input */}
                  <div>
                    <span className="flex min-h-[2.25rem] items-end text-[10px] text-cyan-300/80 mb-1.5 font-mono font-semibold uppercase tracking-wide">
                      Baseline SOG (KN) at 0° offset
                    </span>
                    <div className="flex items-center gap-1.5 w-full">
                      <button
                        type="button"
                        onClick={handleSogDec}
                        className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 flex items-center justify-center rounded-sm border border-slate-700 bg-black text-cyan-200 font-mono font-semibold text-2xl leading-none active:bg-slate-900 select-none hover:text-cyan-100 focus:outline-none focus:border-cyan-400"
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
                        className="w-full h-10 sm:h-11 text-center rounded-sm border border-slate-700 bg-black text-base font-mono font-semibold text-white placeholder-slate-700 focus:border-magenta-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSogInc}
                        className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 flex items-center justify-center rounded-sm border border-slate-700 bg-black text-cyan-200 font-mono font-semibold text-2xl leading-none active:bg-slate-900 select-none hover:text-cyan-100 focus:outline-none focus:border-cyan-400"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Max Angle Input */}
                  <div>
                    <span className="flex min-h-[2.25rem] items-end text-[10px] text-magenta-300/80 mb-1.5 font-mono font-semibold uppercase tracking-wide">
                      Max Angle Offset (10° - 45°)
                    </span>
                    <div className="flex items-center gap-1.5 w-full">
                      <button
                        type="button"
                        onClick={handleAngleDec}
                        className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 flex items-center justify-center rounded-sm border border-slate-700 bg-black text-cyan-200 font-mono font-semibold text-2xl leading-none active:bg-slate-900 select-none hover:text-cyan-100 focus:outline-none focus:border-cyan-400"
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
                        className="w-full h-10 sm:h-11 text-center rounded-sm border border-slate-700 bg-black text-base font-mono font-semibold text-white placeholder-slate-700 focus:border-magenta-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAngleInc}
                        className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 flex items-center justify-center rounded-sm border border-slate-700 bg-black text-cyan-200 font-mono font-semibold text-2xl leading-none active:bg-slate-900 select-none hover:text-cyan-100 focus:outline-none focus:border-cyan-400"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 space-y-1.5">
                  <p>
                    <strong className="text-cyan-200 font-mono">How to use this diagram:</strong> If you are sailing at a baseline SOG (e.g. {baselineSog.toFixed(1)} kn) and decide to sail lower to gain speed, this chart shows exactly how much faster you must sail at any given angle offset to maintain or improve your Velocity Made Good (VMG).
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block rounded-sm border border-slate-800 bg-black p-3 lg:p-2.5">
              <QuickLookupTable tablePoints={tablePoints} baselineSog={baselineSog} />
            </div>
          </div>

          {/* Printable Card Area */}
          <div className="order-2 lg:order-1 bg-black rounded-sm border border-slate-800 p-4 lg:p-3 print:border-0 print:bg-white print:p-0 print:text-black">
          
          {/* Print Header */}
          <div className="mb-3 lg:mb-2 text-center print:block">
            <h2 className="text-lg font-mono font-semibold tracking-wide text-cyan-200 print:text-black uppercase">
              VMG SOG Target Reference Card
            </h2>
            <p className="text-xs font-mono font-semibold text-magenta-300/80 print:text-slate-800 mt-1 uppercase">
              Baseline SOG: <span className="text-amber-300 print:text-black">{baselineSog.toFixed(1)} Knots</span> at 0° offset
            </p>
          </div>

          {/* SVG Line Diagram */}
          <div className="relative w-full aspect-[3/2] lg:aspect-[16/9] bg-black rounded-sm overflow-hidden border border-slate-800 p-1 print:border-2 print:border-black print:rounded-none print:bg-white">
            <svg
              viewBox="0 0 600 400"
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <style>{`
                @media print {
                  .print-fill-better { fill: url(#print-stipple-light) !important; }
                  .print-fill-worse { fill: url(#print-stipple-dark) !important; }
                }
              `}</style>
              <defs>
                <pattern
                  id="print-stipple-light"
                  width="10"
                  height="10"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="2.5" cy="2.5" r="0.45" fill="#7a7a7a" />
                  <circle cx="7.5" cy="6.5" r="0.4" fill="#7a7a7a" />
                </pattern>
                <pattern
                  id="print-stipple-dark"
                  width="8"
                  height="8"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="1.5" cy="1.5" r="0.6" fill="#555555" />
                  <circle cx="5.5" cy="2.5" r="0.55" fill="#555555" />
                  <circle cx="2.5" cy="5.5" r="0.55" fill="#555555" />
                  <circle cx="6.5" cy="6.5" r="0.5" fill="#555555" />
                </pattern>
              </defs>

              {/* Grid Background Shading */}
              {/* Better VMG Area (Above Curve) */}
              <path
                d={betterAreaD}
                className="fill-cyan-500/8 print-fill-better"
              />
              {/* Worse VMG Area (Below Curve) */}
              <path
                d={worseAreaD}
                className="fill-magenta-500/8 print-fill-worse"
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
                      className="stroke-slate-800 print:stroke-slate-300 stroke-1"
                    />
                    <text
                      x="50"
                      y={yPix + 4}
                      textAnchor="end"
                      className="fill-cyan-300/80 print:fill-slate-900 font-mono text-[10px] font-semibold"
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
                      className="stroke-slate-800 print:stroke-slate-300 stroke-1"
                    />
                    <text
                      x={xPix}
                      y="368"
                      textAnchor="middle"
                      className="fill-magenta-300/80 print:fill-slate-900 font-mono text-[10px] font-semibold"
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
                className="stroke-cyan-300/70 print:stroke-slate-600 stroke-1.5"
              />
              <text
                x="565"
                y={yBaselinePix - 6}
                textAnchor="end"
                className="fill-cyan-300/80 print:fill-slate-700 font-mono font-semibold text-[9px] uppercase tracking-wide"
              >
                Baseline SOG ({baselineSog.toFixed(1)} kn)
              </text>

              {/* Better/Worse Area Labels */}
              <text
                x="315"
                y="124"
                textAnchor="middle"
                className="fill-cyan-300/65 print:fill-black font-mono font-semibold text-sm uppercase tracking-wide pointer-events-none"
              >
                BETTER VMG (SAIL LOWER)
              </text>
              <text
                x="315"
                y="300"
                textAnchor="middle"
                className="fill-magenta-300/65 print:fill-black font-mono font-semibold text-sm uppercase tracking-wide pointer-events-none"
              >
                WORSE VMG (SAIL HIGHER)
              </text>

              {/* The Equal VMG Boundary Curve */}
              <path
                d={curvePathD}
                fill="none"
                className="stroke-amber-300 print:stroke-black"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Axis Titles */}
              <text
                x="315"
                y="392"
                textAnchor="middle"
                className="fill-cyan-200 print:fill-slate-900 font-mono font-semibold text-[10px] uppercase tracking-wide"
              >
                Angle Offset from Baseline Heading (°)
              </text>
              <text
                x="16"
                y="195"
                textAnchor="middle"
                transform="rotate(-90 16 195)"
                className="fill-magenta-200 print:fill-slate-900 font-mono font-semibold text-[10px] uppercase tracking-wide"
              >
                Required Speed SOG (kn)
              </text>

              {/* Legend */}
              <g transform="translate(390, 55)">
                <rect x="0" y="0" width="165" height="42" className="fill-black stroke-slate-700 print:fill-white print:stroke-black print:stroke-1" rx="0" />
                <line x1="8" y1="12" x2="28" y2="12" className="stroke-amber-300 print:stroke-black stroke-[3]" />
                <text x="34" y="15" className="fill-amber-200 print:fill-black font-mono font-semibold text-[9px] uppercase tracking-wide">Equal VMG Curve</text>
                
                <line x1="8" y1="28" x2="28" y2="28" strokeDasharray="3 3" className="stroke-cyan-300 print:stroke-black stroke-[1.5]" />
                <text x="34" y="31" className="fill-cyan-200 print:fill-black font-mono font-semibold text-[9px] uppercase tracking-wide">Baseline SOG</text>
              </g>
            </svg>
          </div>

          {/* Quick Lookup Data Table */}
          <QuickLookupTable
            className="mt-4 lg:hidden print:block print:mt-4"
            tablePoints={tablePoints}
            baselineSog={baselineSog}
          />

        </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-3 border-t border-slate-800 bg-black/80 print:hidden">
        <p className="text-[9px] font-mono font-semibold text-cyan-300/65 uppercase tracking-wide">
          Sailing Target Card Generator • Print & Laminate
        </p>
      </footer>
    </div>
  );
}

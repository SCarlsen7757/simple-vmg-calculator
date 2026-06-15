/**
 * VMG (Velocity Made Good) calculation utilities.
 *
 * Dataset A is treated as the baseline (0° offset).
 * Progress of B relative to A is calculated as:
 *   progressB = SOG_B × cos(COG_B - COG_A)
 */

export const Tacks = ['port', 'starboard'] as const;
export type Tack = typeof Tacks[number];

export interface Dataset {
  sog: number;
  cog: number;
}

export interface VmgResult {
  progressA: number;
  progressB: number;
  winner: 'A' | 'B' | 'equal';
  /** Absolute advantage of the winning dataset in knots (always ≥ 0). */
  advantage: number;
  /** Percentage improvement of the winner over the loser (always ≥ 0). */
  improvementPct: number;
  relativeDiff: number;
}

export function getRelativeAngleDifference(cogB: number, cogA: number): number {
  let diff = (cogB - cogA + 180) % 360 - 180;
  if (diff < -180) diff += 360;
  return diff;
}

export function calculateVmg(a: Dataset, b: Dataset, tack: Tack): VmgResult {
  const relativeDiff = getRelativeAngleDifference(b.cog, a.cog);
  const radians = (relativeDiff * Math.PI) / 180;

  // Determine which course is sailing "higher" (closer to the wind)
  let isBHigher: boolean;
  if (tack === 'starboard') {
    // Starboard tack: positive relativeDiff (B is clockwise/right of A) is sailing higher
    isBHigher = relativeDiff > 0;
  } else {
    // Port tack: negative relativeDiff (B is counter-clockwise/left of A) is sailing higher
    isBHigher = relativeDiff < 0;
  }

  let progressA: number;
  let progressB: number;

  if (relativeDiff === 0) {
    progressA = a.sog;
    progressB = b.sog;
  } else if (isBHigher) {
    // B is sailing higher (baseline 0 offset for B)
    progressB = b.sog;
    progressA = a.sog * Math.cos(radians);
  } else {
    // A is sailing higher (baseline 0 offset for A)
    progressA = a.sog;
    progressB = b.sog * Math.cos(radians);
  }

  const diff = progressB - progressA;
  const advantage = Math.abs(diff);
  const base = Math.min(progressA, progressB);
  const improvementPct = base > 0 ? (advantage / base) * 100 : 0;

  let winner: VmgResult['winner'];
  if (Math.abs(diff) < 1e-9) {
    winner = 'equal';
  } else if (diff > 0) {
    winner = 'B';
  } else {
    winner = 'A';
  }

  return { progressA, progressB, winner, advantage, improvementPct, relativeDiff };
}

export interface DiagramPoint {
  angle: number;
  requiredSog: number;
}

/**
 * Calculates the required SOG at different angle offsets (0 to maxAngle degrees)
 * to maintain the same VMG as the baseline SOG at 0 degrees offset.
 * SOG_req = SOG_baseline / cos(angle)
 */
export function calculateDiagramData(baselineSog: number, maxAngle = 45, step = 5): DiagramPoint[] {
  const points: DiagramPoint[] = [];
  for (let angle = 0; angle <= maxAngle; angle += step) {
    const radians = (angle * Math.PI) / 180;
    // Handle cos(90) edge cases, though maxAngle is usually 45
    const cosVal = Math.cos(radians);
    const requiredSog = cosVal > 0.01 ? baselineSog / cosVal : 0;
    points.push({ angle, requiredSog });
  }
  return points;
}


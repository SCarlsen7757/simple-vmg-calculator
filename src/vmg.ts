/**
 * VMG (Velocity Made Good) calculation utilities.
 *
 * Dataset A is treated as the baseline (0° offset).
 * Progress of B relative to A is calculated as:
 *   progressB = SOG_B × cos(COG_B - COG_A)
 */

export type Tack = 'port' | 'starboard';

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
  /** User-friendly explanation of performance and recommended action. */
  advice: string;
}

export function getRelativeAngleDifference(cogB: number, cogA: number): number {
  let diff = (cogB - cogA + 180) % 360 - 180;
  if (diff < -180) diff += 360;
  return diff;
}

/**
 * Calculates the required SOG at a given angle offset to maintain the same VMG
 * as the baseline SOG at 0 degrees offset.
 *
 * Formula: SOG_req = SOG_baseline / cos(angle)
 */
export function calculateRequiredSog(baselineSog: number, angleOffset: number): number {
  const radians = (angleOffset * Math.PI) / 180;
  const cosVal = Math.cos(radians);
  return cosVal > 0.01 ? baselineSog / cosVal : 0;
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

  // Generate tactical advice based on relative course difference and tack
  let advice: string;
  if (relativeDiff !== 0) {
    const isBRightOfA = relativeDiff > 0;
    const side = tack === 'starboard' 
      ? (isBRightOfA ? 'higher' : 'lower') 
      : (isBRightOfA ? 'lower' : 'higher');
    advice = `B sails ${Math.abs(relativeDiff).toFixed(0)}° ${side} than A.`;
  } else {
    advice = 'Courses are parallel.';
  }

  return { progressA, progressB, winner, advantage, improvementPct, relativeDiff, advice };
}

export interface DiagramPoint {
  angle: number;
  requiredSog: number;
}




/**
 * VMG (Velocity Made Good) calculation utilities.
 *
 * Progress toward a windward mark is calculated as:
 *   progress = SOG × cos(cogOffset)
 *
 * where cogOffset is in degrees from the direct course (0°).
 */

export interface Dataset {
  sog: number;
  cogOffset: number;
}

export interface VmgResult {
  progressA: number;
  progressB: number;
  winner: 'A' | 'B' | 'equal';
  /** Absolute advantage of the winning dataset in knots (always ≥ 0). */
  advantage: number;
  /** Percentage improvement of the winner over the loser (always ≥ 0). */
  improvementPct: number;
}

export function calculateProgress(sog: number, cogOffsetDeg: number): number {
  const radians = (cogOffsetDeg * Math.PI) / 180;
  return sog * Math.cos(radians);
}

export function calculateVmg(a: Dataset, b: Dataset): VmgResult {
  const progressA = calculateProgress(a.sog, a.cogOffset);
  const progressB = calculateProgress(b.sog, b.cogOffset);

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

  return { progressA, progressB, winner, advantage, improvementPct };
}

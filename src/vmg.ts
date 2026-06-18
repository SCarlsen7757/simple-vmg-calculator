/**
 * VMG (Velocity Made Good) calculation utilities.
 *
 * VMG is calculated relative to the estimated wind direction using a baseline
 * close-hauled tack-to-tack angle. The higher course is assumed to be close-hauled
 * at an optimal True Wind Angle (TWA_opt = tackAngle / 2). The lower course is
 * then evaluated at this TWA_opt plus the course angle offset.
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
 * as the baseline SOG.
 *
 * Formula: SOG_req = SOG_baseline * cos(twaOpt) / cos(twaOpt + angleOffset)
 */
export function calculateRequiredSog(baselineSog: number, angleOffset: number, twaOpt: number): number {
  const radBaseline = (twaOpt * Math.PI) / 180;
  const radTarget = ((twaOpt + angleOffset) * Math.PI) / 180;
  const cosBaseline = Math.cos(radBaseline);
  const cosTarget = Math.cos(radTarget);
  return cosTarget > 0.01 ? (baselineSog * cosBaseline) / cosTarget : 0;
}

export function calculateVmg(a: Dataset, b: Dataset, tack: Tack, tackAngle: number): VmgResult {
  const relativeDiff = getRelativeAngleDifference(b.cog, a.cog);
  const twaOpt = tackAngle / 2;

  // Determine which course is sailing "higher" (closer to the wind)
  let isBHigher: boolean;
  if (tack === 'starboard') {
    // Starboard tack: positive relativeDiff (B is clockwise/right of A) is sailing higher
    isBHigher = relativeDiff > 0;
  } else {
    // Port tack: negative relativeDiff (B is counter-clockwise/left of A) is sailing higher
    isBHigher = relativeDiff < 0;
  }



  // Calculate TWAs for both courses
  let twaA: number;
  let twaB: number;

  if (relativeDiff === 0) {
    twaA = twaOpt;
    twaB = twaOpt;
  } else if (isBHigher) {
    // B is sailing higher (so B is at twaOpt)
    twaB = twaOpt;
    twaA = twaOpt + Math.abs(relativeDiff);
  } else {
    // A is sailing higher (so A is at twaOpt)
    twaA = twaOpt;
    twaB = twaOpt + Math.abs(relativeDiff);
  }

  // Calculate VMG progress relative to the wind
  const radA = (twaA * Math.PI) / 180;
  const radB = (twaB * Math.PI) / 180;

  // cos of TWA is capped at 0 (negative progress means sailing away/downwind, which is 0 upwind VMG)
  const cosA = Math.cos(radA);
  const cosB = Math.cos(radB);

  const progressA = cosA > 0.001 ? a.sog * cosA : 0;
  const progressB = cosB > 0.001 ? b.sog * cosB : 0;

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
    
    if (twaA >= 90 || twaB >= 90) {
      advice = `B sails ${Math.abs(relativeDiff).toFixed(0)}° ${side} than A (sailing past beam reach).`;
    } else {
      advice = `B sails ${Math.abs(relativeDiff).toFixed(0)}° ${side} than A.`;
    }
  } else {
    advice = 'Courses are parallel.';
  }

  return { progressA, progressB, winner, advantage, improvementPct, relativeDiff, advice };
}

export interface DiagramPoint {
  angle: number;
  requiredSog: number;
}




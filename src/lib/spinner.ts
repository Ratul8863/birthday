/**
 * Pure spinner mathematics.
 * Result selection and visual rotation must share the same authoritative index.
 */

export function getSegmentAngle(itemCount: number): number {
  if (itemCount <= 0) throw new Error("itemCount must be > 0");
  return 360 / itemCount;
}

/** Center angle of a segment, measured clockwise from the top (pointer). */
export function getSelectedCenter(selectedIndex: number, itemCount: number): number {
  const segmentAngle = getSegmentAngle(itemCount);
  return selectedIndex * segmentAngle + segmentAngle / 2;
}

export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/**
 * Compute the next cumulative wheel rotation so the selected segment center
 * lands under the fixed 12-o'clock pointer after four steady turns.
 * Wheel rotates clockwise (CSS positive). Segments are laid out clockwise from top.
 */
export function getTargetRotation(
  currentRotation: number,
  selectedIndex: number,
  itemCount: number,
  baseTurns?: number,
): number {
  const selectedCenter = getSelectedCenter(selectedIndex, itemCount);
  // At rotation R, the angle under the pointer is normalize(R).
  // We need normalize(R) === selectedCenter so that segment center sits at top.
  // Wait: if the wheel rotates clockwise by R, a point that was at angle A
  // (clockwise from top) moves to angle A+R. The point now under the pointer
  // is the one that satisfies A+R ≡ 0 (mod 360), i.e. A ≡ -R.
  // So the segment center under the pointer is normalize(-R).
  // We want normalize(-R) === selectedCenter ⇒ normalize(R) === normalize(-selectedCenter).
  const desiredMod = normalizeDegrees(-selectedCenter);
  const currentMod = normalizeDegrees(currentRotation);
  let delta = normalizeDegrees(desiredMod - currentMod);
  if (delta === 0) delta = 360;

  const turns = baseTurns ?? 4;
  const clampedTurns = Math.min(6, Math.max(3, turns));

  return currentRotation + clampedTurns * 360 + delta;
}

/** Given final rotation, which segment index sits under the pointer? */
export function getIndexAtPointer(rotation: number, itemCount: number): number {
  const segmentAngle = getSegmentAngle(itemCount);
  const underPointer = normalizeDegrees(-rotation);
  const index = Math.floor(underPointer / segmentAngle) % itemCount;
  return index;
}

export const TARGET_ROUND_COUNT_OPTIONS = [8, 10, 12, 16] as const;

export type TargetRoundCountOption =
  (typeof TARGET_ROUND_COUNT_OPTIONS)[number];

export const DEFAULT_TARGET_ROUND_COUNT: TargetRoundCountOption = 12;

export function isTargetRoundCountOption(
  value: unknown,
): value is TargetRoundCountOption {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    (TARGET_ROUND_COUNT_OPTIONS as readonly number[]).includes(value)
  );
}

/**
 * Eksik veya geçersiz targetRoundCount için güvenli fallback.
 * Yeni oyunlarda alan her zaman kaydedilmeli; bu yalnızca eski state için.
 */
export function resolveTargetRoundCount(
  targetRoundCount: unknown,
): number {
  if (
    typeof targetRoundCount === 'number' &&
    Number.isInteger(targetRoundCount) &&
    targetRoundCount > 0
  ) {
    return targetRoundCount;
  }
  return DEFAULT_TARGET_ROUND_COUNT;
}

export function remainingRoundCount(
  playedRounds: number,
  targetRoundCount: number,
): number {
  return Math.max(targetRoundCount - playedRounds, 0);
}

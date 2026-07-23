import {
  DEFAULT_TARGET_ROUND_COUNT,
  isTargetRoundCountOption,
  remainingRoundCount,
  resolveTargetRoundCount,
  TARGET_ROUND_COUNT_OPTIONS,
} from '../targetRoundCount';

describe('targetRoundCount', () => {
  it('exposes the quick-select options including the default 12', () => {
    expect(TARGET_ROUND_COUNT_OPTIONS).toEqual([8, 10, 12, 16]);
    expect(DEFAULT_TARGET_ROUND_COUNT).toBe(12);
  });

  it('accepts only the quick-select positive integers', () => {
    expect(isTargetRoundCountOption(12)).toBe(true);
    expect(isTargetRoundCountOption(8)).toBe(true);
    expect(isTargetRoundCountOption(7)).toBe(false);
    expect(isTargetRoundCountOption(12.5)).toBe(false);
    expect(isTargetRoundCountOption(null)).toBe(false);
    expect(isTargetRoundCountOption(undefined)).toBe(false);
  });

  it('falls back to 12 when the stored value is missing or invalid', () => {
    expect(resolveTargetRoundCount(undefined)).toBe(12);
    expect(resolveTargetRoundCount(null)).toBe(12);
    expect(resolveTargetRoundCount(0)).toBe(12);
    expect(resolveTargetRoundCount(-1)).toBe(12);
    expect(resolveTargetRoundCount(1.5)).toBe(12);
    expect(resolveTargetRoundCount('12')).toBe(12);
  });

  it('keeps a valid positive integer targetRoundCount', () => {
    expect(resolveTargetRoundCount(8)).toBe(8);
    expect(resolveTargetRoundCount(16)).toBe(16);
    expect(resolveTargetRoundCount(20)).toBe(20);
  });

  it('computes remaining rounds without going below zero', () => {
    expect(remainingRoundCount(0, 12)).toBe(12);
    expect(remainingRoundCount(5, 12)).toBe(7);
    expect(remainingRoundCount(12, 12)).toBe(0);
    expect(remainingRoundCount(14, 12)).toBe(0);
  });
});

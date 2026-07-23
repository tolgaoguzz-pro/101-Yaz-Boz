import { ExtraPenaltyTiming } from '../rules';

export function applyExtrasWithFinishMultiplier(
  base: number,
  extras: number,
  finishMultiplier: number,
  timing: ExtraPenaltyTiming,
): number {
  switch (timing) {
    case 'beforeFinishMultiplier':
      return (base + extras) * finishMultiplier;
    case 'afterFinishMultiplier':
      return base * finishMultiplier + extras;
  }
}

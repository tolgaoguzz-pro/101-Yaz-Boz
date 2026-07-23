import { CalculateRoundResult } from '../../engine/calculateRound';
import { FinishType } from '../../engine/models';

export type RoundPreviewMeta = {
  finishType: FinishType;
  finisherPlayerId: string | null;
};

export type RoundPreviewState = {
  visible: boolean;
  result: CalculateRoundResult | null;
  meta: RoundPreviewMeta | null;
  error: string | null;
};

export const CLOSED_ROUND_PREVIEW: RoundPreviewState = {
  visible: false,
  result: null,
  meta: null,
  error: null,
};

/**
 * Önizleme sonucunu tek atomik state’e dönüştürür.
 * visible, result ile aynı anda set edilir (stale state / ikinci dokunuş önlenir).
 */
export function buildRoundPreviewState(input: {
  result: CalculateRoundResult;
  meta: RoundPreviewMeta;
}): RoundPreviewState {
  return {
    visible: true,
    result: input.result,
    meta: input.meta,
    error: null,
  };
}

export function buildRoundPreviewError(message: string): RoundPreviewState {
  return {
    visible: false,
    result: null,
    meta: null,
    error: message,
  };
}

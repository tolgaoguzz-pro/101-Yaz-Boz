import { RoundInput } from './models';
import { ScoreRules } from './rules';

export type CalculateRoundResult = {
  // TODO: player round scores
  // TODO: team round scores / finish bonus application
};

export function calculateRound(
  input: RoundInput,
  rules: ScoreRules,
): CalculateRoundResult {
  // TODO: compute each player's base penalty from openType
  // TODO: add okey / wrong-open / playable-discard / manual extras
  // TODO: apply opponent finish multiplier (respect extraPenaltyTiming)
  // TODO: apply finisher partner penalty rule
  // TODO: apply finish team bonus when finishType is not 'none'
  void input;
  void rules;

  return {};
}

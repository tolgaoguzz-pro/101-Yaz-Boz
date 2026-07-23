import { FinishType } from '../models';
import { ScoreRules } from '../rules';

export function opponentFinishMultiplier(
  finishType: FinishType,
  rules: ScoreRules,
): number {
  switch (finishType) {
    case 'normal':
      return rules.opponentFinishMultiplier.normal;
    case 'okey':
      return rules.opponentFinishMultiplier.okey;
    case 'fromHand':
      return rules.opponentFinishMultiplier.fromHand;
    case 'fromHandAndOkey':
      return rules.opponentFinishMultiplier.fromHandAndOkey;
    case 'none':
      return rules.opponentFinishMultiplier.none;
  }
}

export function finishTeamBonusAmount(
  finishType: FinishType,
  rules: ScoreRules,
): number {
  switch (finishType) {
    case 'normal':
      return rules.finishTeamBonus.normal;
    case 'okey':
      return rules.finishTeamBonus.okey;
    case 'fromHand':
      return rules.finishTeamBonus.fromHand;
    case 'fromHandAndOkey':
      return rules.finishTeamBonus.fromHandAndOkey;
    case 'none':
      return 0;
  }
}

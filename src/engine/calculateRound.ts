import { Player, RoundInput } from './models';
import { ScoreRules } from './rules';
import {
  finishTeamBonusAmount,
  opponentFinishMultiplier,
} from './scoring/finishMultiplier';
import { scoreForPlayer } from './scoring/scoreForPlayer';
import { aggregateTeamScores } from './teams/aggregateTeamScores';
import { requireTeamId } from './teams/requireTeamId';
import {
  CalculateRoundResult,
  FinishTeamBonusResult,
} from './types';
import {
  validateRoundInput,
  ValidateRoundInputOptions,
} from './validateRoundInput';

export type {
  CalculateRoundResult,
  FinishTeamBonusResult,
  PlayerRoundScore,
  TeamRoundScore,
} from './types';

export type CalculateRoundOptions = ValidateRoundInputOptions;

/**
 * @param roster Game players with teamId — used for teams, partners, and opponents.
 * @param options.teamStructure paired (default) or any (individual solo teams).
 */
export function calculateRound(
  input: RoundInput,
  rules: ScoreRules,
  roster: Player[],
  options: CalculateRoundOptions = {},
): CalculateRoundResult {
  validateRoundInput(input, roster, options);

  const { finishType, finisherPlayerId } = input.finish;
  const finishMultiplier = opponentFinishMultiplier(finishType, rules);
  const finisherTeamId =
    finisherPlayerId === null
      ? null
      : requireTeamId(roster, finisherPlayerId);

  const players = input.players.map((player) => ({
    playerId: player.playerId,
    score: scoreForPlayer(
      player,
      rules,
      finishType,
      finisherPlayerId,
      finisherTeamId,
      finishMultiplier,
      roster,
    ),
  }));

  const finishTeamBonus: FinishTeamBonusResult = {
    teamId: finishType === 'none' ? null : finisherTeamId,
    amount:
      finishType === 'none' ? 0 : finishTeamBonusAmount(finishType, rules),
  };

  const teams = aggregateTeamScores(players, roster, finishTeamBonus);

  return {
    players,
    teams,
    finishTeamBonus,
  };
}

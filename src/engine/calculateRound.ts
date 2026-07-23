import { PlayerRoundInput, RoundInput } from './models';
import { OpenBaseRules, ScoreRules } from './rules';

export type PlayerRoundScore = {
  playerId: string;
  score: number;
};

export type CalculateRoundResult = {
  players: PlayerRoundScore[];
  /** Applied only when finishType is 'normal'; otherwise 0. */
  finishTeamBonus: number;
};

function basePenalty(
  player: PlayerRoundInput,
  openBase: OpenBaseRules,
): number {
  switch (player.openType) {
    case 'didNotOpen':
      return openBase.didNotOpenPenalty;
    case 'series':
      return player.remainingTilePoints * openBase.seriesTileSumMultiplier;
    case 'doubles':
      return player.remainingTilePoints * openBase.doublesTileSumMultiplier;
  }
}

function normalFinishTeamBonus(
  finishType: RoundInput['finish']['finishType'],
  rules: ScoreRules,
): number {
  if (finishType !== 'normal') {
    return 0;
  }

  return rules.finishTeamBonus.normal;
}

export function calculateRound(
  input: RoundInput,
  rules: ScoreRules,
): CalculateRoundResult {
  const players = input.players.map((player) => ({
    playerId: player.playerId,
    score: basePenalty(player, rules.openBase),
  }));

  return {
    players,
    finishTeamBonus: normalFinishTeamBonus(input.finish.finishType, rules),
  };
}

import { Player, RoundInput } from './models';
import { ScoreRules } from './rules';
import {
  finishTeamBonusAmount,
  opponentFinishMultiplier,
} from './scoring/finishMultiplier';
import { scoreForPlayer } from './scoring/scoreForPlayer';
import { validateRoundInput } from './validateRoundInput';

export type PlayerRoundScore = {
  playerId: string;
  score: number;
};

export type TeamRoundScore = {
  teamId: string;
  score: number;
};

export type FinishTeamBonusResult = {
  teamId: string | null;
  amount: number;
};

export type CalculateRoundResult = {
  players: PlayerRoundScore[];
  teams: TeamRoundScore[];
  finishTeamBonus: FinishTeamBonusResult;
};

function requireTeamId(roster: Player[], playerId: string): string {
  const player = roster.find((entry) => entry.id === playerId);
  if (!player) {
    throw new Error(`Player "${playerId}" is not in the roster.`);
  }
  if (!player.teamId) {
    throw new Error(`Player "${playerId}" is missing a teamId.`);
  }
  return player.teamId;
}

/**
 * @param roster Game players with teamId — used for teams, partners, and opponents.
 */
export function calculateRound(
  input: RoundInput,
  rules: ScoreRules,
  roster: Player[],
): CalculateRoundResult {
  validateRoundInput(input, roster);

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

  const amount =
    finishType === 'none' ? 0 : finishTeamBonusAmount(finishType, rules);
  const finishTeamBonus: FinishTeamBonusResult = {
    teamId: finishType === 'none' ? null : finisherTeamId,
    amount,
  };

  const teamIdsInOrder: string[] = [];
  for (const entry of roster) {
    if (!teamIdsInOrder.includes(entry.teamId)) {
      teamIdsInOrder.push(entry.teamId);
    }
  }

  const scoreByPlayerId = new Map(
    players.map((player) => [player.playerId, player.score]),
  );

  const teams: TeamRoundScore[] = teamIdsInOrder.map((teamId) => {
    const teamPlayerIds = roster
      .filter((entry) => entry.teamId === teamId)
      .map((entry) => entry.id);

    let score = 0;
    for (const playerId of teamPlayerIds) {
      score += scoreByPlayerId.get(playerId) ?? 0;
    }

    if (finishTeamBonus.teamId === teamId) {
      score += finishTeamBonus.amount;
    }

    return { teamId, score };
  });

  return {
    players,
    teams,
    finishTeamBonus,
  };
}

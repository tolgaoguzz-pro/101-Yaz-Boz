import { Player } from '../models';
import {
  FinishTeamBonusResult,
  PlayerRoundScore,
  TeamRoundScore,
} from '../types';

export function aggregateTeamScores(
  players: PlayerRoundScore[],
  roster: Player[],
  finishTeamBonus: FinishTeamBonusResult,
): TeamRoundScore[] {
  const teamIdsInOrder: string[] = [];
  for (const entry of roster) {
    if (!teamIdsInOrder.includes(entry.teamId)) {
      teamIdsInOrder.push(entry.teamId);
    }
  }

  const scoreByPlayerId = new Map(
    players.map((player) => [player.playerId, player.score]),
  );

  return teamIdsInOrder.map((teamId) => {
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
}

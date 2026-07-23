import { Player } from '../engine/models';
import { ActiveGameData } from './screens/ActiveGameScreen';

/**
 * UI ile engine roster için tek kaynaklı id / takım eşleşmesi.
 * Takım 1: player-1 + player-2 (eşler)
 * Takım 2: player-3 + player-4 (eşler)
 */
export const TEAM_IDS = {
  team1: 'team-1',
  team2: 'team-2',
} as const;

export const PLAYER_IDS = {
  player1: 'player-1',
  player2: 'player-2',
  player3: 'player-3',
  player4: 'player-4',
} as const;

export type StablePlayerId =
  (typeof PLAYER_IDS)[keyof typeof PLAYER_IDS];

export type StableTeamId = (typeof TEAM_IDS)[keyof typeof TEAM_IDS];

export type GamePlayerRef = {
  id: StablePlayerId;
  name: string;
  teamId: StableTeamId;
};

export function playersFromActiveGame(
  game: ActiveGameData,
): GamePlayerRef[] {
  return [
    {
      id: PLAYER_IDS.player1,
      name: game.teams[0].players[0].name,
      teamId: TEAM_IDS.team1,
    },
    {
      id: PLAYER_IDS.player2,
      name: game.teams[0].players[1].name,
      teamId: TEAM_IDS.team1,
    },
    {
      id: PLAYER_IDS.player3,
      name: game.teams[1].players[0].name,
      teamId: TEAM_IDS.team2,
    },
    {
      id: PLAYER_IDS.player4,
      name: game.teams[1].players[1].name,
      teamId: TEAM_IDS.team2,
    },
  ];
}

export function buildRosterFromActiveGame(game: ActiveGameData): Player[] {
  return playersFromActiveGame(game).map((player) => ({
    id: player.id,
    name: player.name,
    teamId: player.teamId,
  }));
}

export function teamNameFromActiveGame(
  game: ActiveGameData,
  teamId: string,
): string {
  if (teamId === TEAM_IDS.team1) {
    return game.teams[0].name;
  }
  if (teamId === TEAM_IDS.team2) {
    return game.teams[1].name;
  }
  return teamId;
}

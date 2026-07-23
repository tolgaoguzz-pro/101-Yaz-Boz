import {
  ActiveGameData,
  ActiveGamePlayer,
  ActiveGameTeam,
} from './screens/ActiveGameScreen';
import { GameMode, resolveGameMode } from './gameMode';
import { resolveTargetRoundCount } from './targetRoundCount';

export type GameResultPlayerStanding = {
  rank: number;
  playerId: string;
  name: string;
  totalScore: number;
};

export type PairedWinner =
  | {
      kind: 'winner';
      teamName: string;
      teamScore: number;
      otherTeamName: string;
      otherTeamScore: number;
    }
  | {
      kind: 'tie';
      team1Name: string;
      team1Score: number;
      team2Name: string;
      team2Score: number;
    };

export type IndividualWinner =
  | {
      kind: 'winner';
      playerId: string;
      name: string;
      totalScore: number;
    }
  | {
      kind: 'tie';
      players: { playerId: string; name: string; totalScore: number }[];
    };

export type GameResultSummary = {
  mode: GameMode;
  isTie: boolean;
  /** Düşük ceza puanından yükseğe; eşitlikte roster sırası. */
  standings: GameResultPlayerStanding[];
  /** En düşük bireysel puana sahip tüm oyuncular (Oyun Birincisi). */
  firstPlacePlayers: GameResultPlayerStanding[];
  pairedWinner: PairedWinner | null;
  individualWinner: IndividualWinner | null;
  targetRoundCount: number;
  playedRounds: number;
};

export function rosterPlayersInOrder(
  game: ActiveGameData,
): ActiveGamePlayer[] {
  const team1 = game.teams[0];
  const team2 = game.teams[1];
  return [
    team1?.players?.[0],
    team1?.players?.[1],
    team2?.players?.[0],
    team2?.players?.[1],
  ].filter((player): player is ActiveGamePlayer => Boolean(player));
}

function safeTeamScore(team: ActiveGameTeam | undefined): number {
  return typeof team?.totalScore === 'number' ? team.totalScore : 0;
}

export function safePlayerScore(player: ActiveGamePlayer): number {
  return typeof player.totalScore === 'number' ? player.totalScore : 0;
}

/**
 * Ceza puanı sıralaması: düşük daha iyi.
 * Eşitlikte mevcut roster sırası korunur (stabil).
 */
export function rankPlayersByPenaltyAscending(
  players: ActiveGamePlayer[],
): GameResultPlayerStanding[] {
  const sorted = [...players].sort((a, b) => {
    const scoreDiff = safePlayerScore(a) - safePlayerScore(b);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return players.indexOf(a) - players.indexOf(b);
  });

  return sorted.map((player, index) => ({
    rank: index + 1,
    playerId: player.id,
    name: player.name?.trim() || 'Oyuncu',
    totalScore: safePlayerScore(player),
  }));
}

function calculatePairedWinner(
  team1: ActiveGameTeam | undefined,
  team2: ActiveGameTeam | undefined,
): { winner: PairedWinner; isTie: boolean } {
  const team1Score = safeTeamScore(team1);
  const team2Score = safeTeamScore(team2);
  const team1Name = team1?.name?.trim() || 'Takım 1';
  const team2Name = team2?.name?.trim() || 'Takım 2';

  if (team1Score === team2Score) {
    return {
      isTie: true,
      winner: {
        kind: 'tie',
        team1Name,
        team1Score,
        team2Name,
        team2Score,
      },
    };
  }

  if (team1Score < team2Score) {
    return {
      isTie: false,
      winner: {
        kind: 'winner',
        teamName: team1Name,
        teamScore: team1Score,
        otherTeamName: team2Name,
        otherTeamScore: team2Score,
      },
    };
  }

  return {
    isTie: false,
    winner: {
      kind: 'winner',
      teamName: team2Name,
      teamScore: team2Score,
      otherTeamName: team1Name,
      otherTeamScore: team1Score,
    },
  };
}

function calculateIndividualWinner(
  standings: GameResultPlayerStanding[],
): { winner: IndividualWinner; isTie: boolean; firstPlace: GameResultPlayerStanding[] } {
  if (standings.length === 0) {
    return {
      isTie: false,
      winner: { kind: 'tie', players: [] },
      firstPlace: [],
    };
  }

  const bestScore = standings[0].totalScore;
  const firstPlace = standings.filter((row) => row.totalScore === bestScore);

  if (firstPlace.length > 1) {
    return {
      isTie: true,
      firstPlace,
      winner: {
        kind: 'tie',
        players: firstPlace.map((row) => ({
          playerId: row.playerId,
          name: row.name,
          totalScore: row.totalScore,
        })),
      },
    };
  }

  const sole = firstPlace[0];
  return {
    isTie: false,
    firstPlace,
    winner: {
      kind: 'winner',
      playerId: sole.playerId,
      name: sole.name,
      totalScore: sole.totalScore,
    },
  };
}

export function isGameComplete(game: ActiveGameData): boolean {
  if (game.status === 'completed') {
    return true;
  }
  if (game.status === 'paused' || game.status === 'abandoned') {
    return false;
  }

  const played = game.rounds?.length ?? 0;
  if (played <= 0) {
    return false;
  }
  const target = resolveTargetRoundCount(game.targetRoundCount);
  return played >= target;
}

/**
 * Bireysel toplamlar: player.totalScore (ceza puanı; düşük daha iyi).
 */
export function calculateGameResult(game: ActiveGameData): GameResultSummary {
  const mode = resolveGameMode(game.gameMode);
  const players = rosterPlayersInOrder(game);
  const standings = rankPlayersByPenaltyAscending(players);

  if (mode === 'individual') {
    const { winner, isTie, firstPlace } = calculateIndividualWinner(standings);
    return {
      mode,
      isTie,
      standings,
      firstPlacePlayers: firstPlace,
      pairedWinner: null,
      individualWinner: winner,
      targetRoundCount: resolveTargetRoundCount(game.targetRoundCount),
      playedRounds: game.rounds?.length ?? 0,
    };
  }

  const { winner, isTie } = calculatePairedWinner(game.teams[0], game.teams[1]);
  const bestPlayerScore = standings[0]?.totalScore;
  const firstPlacePlayers =
    typeof bestPlayerScore === 'number'
      ? standings.filter((row) => row.totalScore === bestPlayerScore)
      : [];

  return {
    mode,
    isTie,
    standings,
    firstPlacePlayers,
    pairedWinner: winner,
    individualWinner: null,
    targetRoundCount: resolveTargetRoundCount(game.targetRoundCount),
    playedRounds: game.rounds?.length ?? 0,
  };
}

function resetPlayer(player: ActiveGamePlayer): ActiveGamePlayer {
  return {
    id: player.id,
    name: player.name,
    totalScore: 0,
  };
}

function resetTeam(team: ActiveGameTeam): ActiveGameTeam {
  return {
    name: team.name,
    totalScore: 0,
    players: [resetPlayer(team.players[0]), resetPlayer(team.players[1])],
  };
}

/**
 * Aynı takım/oyuncu eşleşmeleriyle skorları sıfırlanmış yeni oyun.
 * targetRoundCount ve gameMode korunur.
 */
export function createRematchGame(game: ActiveGameData): ActiveGameData {
  const at = new Date().toISOString();
  return {
    teams: [resetTeam(game.teams[0]), resetTeam(game.teams[1])],
    roundNumber: 1,
    rounds: [],
    activityLog: [],
    lastAction: null,
    targetRoundCount: resolveTargetRoundCount(game.targetRoundCount),
    gameMode: resolveGameMode(game.gameMode),
    status: 'active',
    startedAt: at,
    updatedAt: at,
    completedAt: undefined,
    pausedAt: undefined,
    completedGameRecordId: undefined,
  };
}

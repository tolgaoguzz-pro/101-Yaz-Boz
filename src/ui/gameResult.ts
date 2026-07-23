import {
  ActiveGameData,
  ActiveGamePlayer,
  ActiveGameTeam,
} from './screens/ActiveGameScreen';
import { resolveGameMode } from './gameMode';
import { resolveTargetRoundCount } from './targetRoundCount';

export type GameResultPlayerStanding = {
  rank: number;
  playerId: string;
  name: string;
  totalScore: number;
};

export type GameResultWinner =
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

export type GameResultSummary = {
  winner: GameResultWinner;
  standings: GameResultPlayerStanding[];
  topScorer: GameResultPlayerStanding | null;
  targetRoundCount: number;
  playedRounds: number;
};

function rosterPlayersInOrder(game: ActiveGameData): ActiveGamePlayer[] {
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

function safePlayerScore(player: ActiveGamePlayer): number {
  return typeof player.totalScore === 'number' ? player.totalScore : 0;
}

export function isGameComplete(game: ActiveGameData): boolean {
  const played = game.rounds?.length ?? 0;
  if (played <= 0) {
    return false;
  }
  const target = resolveTargetRoundCount(game.targetRoundCount);
  return played >= target;
}

/**
 * Bireysel toplamlar: game state içindeki player.totalScore.
 * Round geçmişi + hızlı ceza güncellemelerini kapsar; takım totalScore ile tutarlıdır.
 */
export function calculateGameResult(game: ActiveGameData): GameResultSummary {
  const team1 = game.teams[0];
  const team2 = game.teams[1];
  const team1Score = safeTeamScore(team1);
  const team2Score = safeTeamScore(team2);
  const team1Name = team1?.name?.trim() || 'Takım 1';
  const team2Name = team2?.name?.trim() || 'Takım 2';

  let winner: GameResultWinner;
  if (team1Score === team2Score) {
    winner = {
      kind: 'tie',
      team1Name,
      team1Score,
      team2Name,
      team2Score,
    };
  } else if (team1Score > team2Score) {
    winner = {
      kind: 'winner',
      teamName: team1Name,
      teamScore: team1Score,
      otherTeamName: team2Name,
      otherTeamScore: team2Score,
    };
  } else {
    winner = {
      kind: 'winner',
      teamName: team2Name,
      teamScore: team2Score,
      otherTeamName: team1Name,
      otherTeamScore: team1Score,
    };
  }

  const players = rosterPlayersInOrder(game);
  const sorted = [...players].sort((a, b) => {
    const scoreDiff = safePlayerScore(b) - safePlayerScore(a);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    // Eşit puanda mevcut roster sırasını koru (stabil).
    return players.indexOf(a) - players.indexOf(b);
  });

  const standings: GameResultPlayerStanding[] = sorted.map((player, index) => ({
    rank: index + 1,
    playerId: player.id,
    name: player.name?.trim() || 'Oyuncu',
    totalScore: safePlayerScore(player),
  }));

  return {
    winner,
    standings,
    topScorer: standings[0] ?? null,
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
 * targetRoundCount korunur (yoksa resolve fallback yazılır).
 */
export function createRematchGame(game: ActiveGameData): ActiveGameData {
  return {
    teams: [resetTeam(game.teams[0]), resetTeam(game.teams[1])],
    roundNumber: 1,
    rounds: [],
    lastAction: null,
    targetRoundCount: resolveTargetRoundCount(game.targetRoundCount),
    gameMode: resolveGameMode(game.gameMode),
  };
}

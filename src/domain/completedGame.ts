import { buildMatchupKey } from './matchupKey';
import { GameActivityEvent } from '../ui/gameActivity';
import { GameMode, resolveGameMode } from '../ui/gameMode';
import {
  calculateGameResult,
  GameResultSummary,
  rosterPlayersInOrder,
} from '../ui/gameResult';
import { resolveActivityLog } from '../ui/gameLifecycle';
import {
  ActiveGameData,
  ActiveGamePlayer,
  ActiveGameTeam,
  SavedRoundSummary,
} from '../ui/screens/ActiveGameScreen';
import { resolveTargetRoundCount } from '../ui/targetRoundCount';

export type CompletedGameWinner =
  | {
      kind: 'paired';
      outcome: 'winner' | 'tie';
      teamName?: string;
      teamScore?: number;
      otherTeamName?: string;
      otherTeamScore?: number;
      team1Name?: string;
      team1Score?: number;
      team2Name?: string;
      team2Score?: number;
    }
  | {
      kind: 'individual';
      outcome: 'winner' | 'tie';
      playerId?: string;
      name?: string;
      totalScore?: number;
      players?: { playerId: string; name: string; totalScore: number }[];
    };

export type CompletedGameRecord = {
  id: string;
  matchupKey: string;
  gameMode: GameMode;
  startedAt: string;
  completedAt: string;
  targetRoundCount: number;
  playedRoundCount: number;
  status: 'completed';
  teams: [ActiveGameTeam, ActiveGameTeam];
  finalPlayerScores: ActiveGamePlayer[];
  finalTeamScores: { teamName: string; totalScore: number }[];
  winner: CompletedGameWinner;
  activityLog: GameActivityEvent[];
  rounds: SavedRoundSummary[];
  resultSummary: GameResultSummary;
  createdAt: string;
};

export function createCompletedGameId(): string {
  return `cg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function playersTupleFromGame(
  game: ActiveGameData,
): [string, string, string, string] {
  const players = rosterPlayersInOrder(game);
  return [
    players[0]?.name ?? 'Oyuncu 1',
    players[1]?.name ?? 'Oyuncu 2',
    players[2]?.name ?? 'Oyuncu 3',
    players[3]?.name ?? 'Oyuncu 4',
  ];
}

export function matchupKeyFromGame(game: ActiveGameData): string {
  return buildMatchupKey({
    gameMode: resolveGameMode(game.gameMode),
    players: playersTupleFromGame(game),
  });
}

function buildWinner(result: GameResultSummary): CompletedGameWinner {
  if (result.mode === 'individual') {
    if (result.individualWinner?.kind === 'tie') {
      return {
        kind: 'individual',
        outcome: 'tie',
        players: result.individualWinner.players,
      };
    }
    if (result.individualWinner?.kind === 'winner') {
      return {
        kind: 'individual',
        outcome: 'winner',
        playerId: result.individualWinner.playerId,
        name: result.individualWinner.name,
        totalScore: result.individualWinner.totalScore,
      };
    }
    return { kind: 'individual', outcome: 'tie', players: [] };
  }

  if (result.pairedWinner?.kind === 'tie') {
    return {
      kind: 'paired',
      outcome: 'tie',
      team1Name: result.pairedWinner.team1Name,
      team1Score: result.pairedWinner.team1Score,
      team2Name: result.pairedWinner.team2Name,
      team2Score: result.pairedWinner.team2Score,
    };
  }
  if (result.pairedWinner?.kind === 'winner') {
    return {
      kind: 'paired',
      outcome: 'winner',
      teamName: result.pairedWinner.teamName,
      teamScore: result.pairedWinner.teamScore,
      otherTeamName: result.pairedWinner.otherTeamName,
      otherTeamScore: result.pairedWinner.otherTeamScore,
    };
  }
  return { kind: 'paired', outcome: 'tie' };
}

/**
 * Aktif oyundan kalıcı geçmiş snapshot’ı üretir.
 * Sonraki aktif oyun değişiklikleri bu kaydı etkilemez.
 */
export function buildCompletedGameRecord(
  game: ActiveGameData,
  id: string,
  nowIso: string = new Date().toISOString(),
): CompletedGameRecord {
  const gameMode = resolveGameMode(game.gameMode);
  const resultSummary = calculateGameResult(game);
  const players = rosterPlayersInOrder(game).map((player) => ({
    id: player.id,
    name: player.name,
    totalScore: player.totalScore,
  }));

  const teams: [ActiveGameTeam, ActiveGameTeam] = [
    {
      name: game.teams[0].name,
      totalScore: game.teams[0].totalScore,
      players: [
        { ...game.teams[0].players[0] },
        { ...game.teams[0].players[1] },
      ],
    },
    {
      name: game.teams[1].name,
      totalScore: game.teams[1].totalScore,
      players: [
        { ...game.teams[1].players[0] },
        { ...game.teams[1].players[1] },
      ],
    },
  ];

  const completedAt = game.completedAt ?? nowIso;
  const startedAt = game.startedAt ?? completedAt;

  return {
    id,
    matchupKey: matchupKeyFromGame(game),
    gameMode,
    startedAt,
    completedAt,
    targetRoundCount: resolveTargetRoundCount(game.targetRoundCount),
    playedRoundCount: game.rounds?.length ?? 0,
    status: 'completed',
    teams,
    finalPlayerScores: players,
    finalTeamScores:
      gameMode === 'paired'
        ? [
            { teamName: teams[0].name, totalScore: teams[0].totalScore },
            { teamName: teams[1].name, totalScore: teams[1].totalScore },
          ]
        : [],
    winner: buildWinner(resultSummary),
    activityLog: resolveActivityLog(game).map((event) => ({ ...event })),
    rounds: (game.rounds ?? []).map((round) => ({
      ...round,
      players: round.players.map((entry) => ({ ...entry })),
      teams: round.teams.map((entry) => ({ ...entry })),
      finishTeamBonus: { ...round.finishTeamBonus },
    })),
    resultSummary,
    createdAt: nowIso,
  };
}

import {
  CompletedGameRecord,
  CompletedGameWinner,
} from '../domain/completedGame';
import { GameActivityEvent } from '../ui/gameActivity';
import { isGameMode, resolveGameMode } from '../ui/gameMode';
import { GameResultSummary } from '../ui/gameResult';
import {
  ActiveGamePlayer,
  ActiveGameTeam,
  SavedRoundSummary,
} from '../ui/screens/ActiveGameScreen';
import { COMPLETED_GAME_SNAPSHOT_SCHEMA_VERSION } from './schema';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parsePlayer(value: unknown): ActiveGamePlayer | null {
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.id !== 'string' || typeof value.name !== 'string') {
    return null;
  }
  if (!isFiniteNumber(value.totalScore)) {
    return null;
  }
  return {
    id: value.id,
    name: value.name,
    totalScore: value.totalScore,
  };
}

function parseTeam(value: unknown): ActiveGameTeam | null {
  if (!isRecord(value) || !Array.isArray(value.players)) {
    return null;
  }
  if (typeof value.name !== 'string' || !isFiniteNumber(value.totalScore)) {
    return null;
  }
  if (value.players.length !== 2) {
    return null;
  }
  const p0 = parsePlayer(value.players[0]);
  const p1 = parsePlayer(value.players[1]);
  if (!p0 || !p1) {
    return null;
  }
  return {
    name: value.name,
    totalScore: value.totalScore,
    players: [p0, p1],
  };
}

function parseRound(value: unknown): SavedRoundSummary | null {
  if (!isRecord(value)) {
    return null;
  }
  if (!isFiniteNumber(value.roundNumber)) {
    return null;
  }
  if (!Array.isArray(value.players) || !Array.isArray(value.teams)) {
    return null;
  }
  if (!isRecord(value.finishTeamBonus)) {
    return null;
  }
  const bonusTeamId = value.finishTeamBonus.teamId;
  if (
    !(bonusTeamId === null || typeof bonusTeamId === 'string') ||
    !isFiniteNumber(value.finishTeamBonus.amount)
  ) {
    return null;
  }

  const players: SavedRoundSummary['players'] = [];
  for (const entry of value.players) {
    if (!isRecord(entry)) {
      return null;
    }
    if (typeof entry.playerId !== 'string' || !isFiniteNumber(entry.score)) {
      return null;
    }
    players.push({ playerId: entry.playerId, score: entry.score });
  }

  const teams: SavedRoundSummary['teams'] = [];
  for (const entry of value.teams) {
    if (!isRecord(entry)) {
      return null;
    }
    if (typeof entry.teamId !== 'string' || !isFiniteNumber(entry.score)) {
      return null;
    }
    teams.push({ teamId: entry.teamId, score: entry.score });
  }

  return {
    roundNumber: value.roundNumber,
    players,
    teams,
    finishTeamBonus: {
      teamId: bonusTeamId,
      amount: value.finishTeamBonus.amount,
    },
  };
}

function parseActivityLog(value: unknown): GameActivityEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is GameActivityEvent => {
    if (!isRecord(entry)) {
      return false;
    }
    return entry.type === 'round' || entry.type === 'penalty';
  });
}

function parseWinner(value: unknown): CompletedGameWinner {
  if (!isRecord(value)) {
    return { kind: 'paired', outcome: 'tie' };
  }
  if (value.kind === 'individual') {
    const players: { playerId: string; name: string; totalScore: number }[] =
      [];
    if (Array.isArray(value.players)) {
      for (const entry of value.players) {
        if (!isRecord(entry)) {
          continue;
        }
        if (
          typeof entry.playerId === 'string' &&
          typeof entry.name === 'string' &&
          isFiniteNumber(entry.totalScore)
        ) {
          players.push({
            playerId: entry.playerId,
            name: entry.name,
            totalScore: entry.totalScore,
          });
        }
      }
    }
    return {
      kind: 'individual',
      outcome: value.outcome === 'winner' ? 'winner' : 'tie',
      playerId: typeof value.playerId === 'string' ? value.playerId : undefined,
      name: typeof value.name === 'string' ? value.name : undefined,
      totalScore: isFiniteNumber(value.totalScore)
        ? value.totalScore
        : undefined,
      players: players.length > 0 ? players : undefined,
    };
  }
  return {
    kind: 'paired',
    outcome: value.outcome === 'winner' ? 'winner' : 'tie',
    teamName: typeof value.teamName === 'string' ? value.teamName : undefined,
    teamScore: isFiniteNumber(value.teamScore) ? value.teamScore : undefined,
    otherTeamName:
      typeof value.otherTeamName === 'string' ? value.otherTeamName : undefined,
    otherTeamScore: isFiniteNumber(value.otherTeamScore)
      ? value.otherTeamScore
      : undefined,
    team1Name: typeof value.team1Name === 'string' ? value.team1Name : undefined,
    team1Score: isFiniteNumber(value.team1Score) ? value.team1Score : undefined,
    team2Name: typeof value.team2Name === 'string' ? value.team2Name : undefined,
    team2Score: isFiniteNumber(value.team2Score) ? value.team2Score : undefined,
  };
}

function parseResultSummary(value: unknown): GameResultSummary | null {
  if (!isRecord(value)) {
    return null;
  }
  const mode = resolveGameMode(value.mode);
  if (typeof value.isTie !== 'boolean') {
    return null;
  }
  if (!Array.isArray(value.standings)) {
    return null;
  }
  if (
    !isFiniteNumber(value.targetRoundCount) ||
    !isFiniteNumber(value.playedRounds)
  ) {
    return null;
  }
  return value as unknown as GameResultSummary;
}

export function serializeCompletedGameSnapshot(
  record: CompletedGameRecord,
): string {
  return JSON.stringify(record);
}

export function parseCompletedGameSnapshot(
  json: string,
): CompletedGameRecord | null {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!isRecord(parsed)) {
      return null;
    }
    if (typeof parsed.id !== 'string' || parsed.id.length === 0) {
      return null;
    }
    if (typeof parsed.matchupKey !== 'string') {
      return null;
    }
    if (typeof parsed.completedAt !== 'string') {
      return null;
    }
    if (typeof parsed.startedAt !== 'string') {
      return null;
    }
    if (typeof parsed.createdAt !== 'string') {
      return null;
    }
    if (!Array.isArray(parsed.teams) || parsed.teams.length !== 2) {
      return null;
    }
    const team0 = parseTeam(parsed.teams[0]);
    const team1 = parseTeam(parsed.teams[1]);
    if (!team0 || !team1) {
      return null;
    }
    if (!Array.isArray(parsed.rounds)) {
      return null;
    }
    const rounds: SavedRoundSummary[] = [];
    for (const round of parsed.rounds) {
      const parsedRound = parseRound(round);
      if (!parsedRound) {
        return null;
      }
      rounds.push(parsedRound);
    }

    if (!Array.isArray(parsed.finalPlayerScores)) {
      return null;
    }
    const finalPlayerScores: ActiveGamePlayer[] = [];
    for (const player of parsed.finalPlayerScores) {
      const parsedPlayer = parsePlayer(player);
      if (!parsedPlayer) {
        return null;
      }
      finalPlayerScores.push(parsedPlayer);
    }

    const resultSummary = parseResultSummary(parsed.resultSummary);
    if (!resultSummary) {
      return null;
    }

    const gameMode = isGameMode(parsed.gameMode)
      ? parsed.gameMode
      : resolveGameMode(parsed.gameMode);

    return {
      id: parsed.id,
      matchupKey: parsed.matchupKey,
      gameMode,
      startedAt: parsed.startedAt,
      completedAt: parsed.completedAt,
      targetRoundCount: isFiniteNumber(parsed.targetRoundCount)
        ? parsed.targetRoundCount
        : resultSummary.targetRoundCount,
      playedRoundCount: isFiniteNumber(parsed.playedRoundCount)
        ? parsed.playedRoundCount
        : rounds.length,
      status: 'completed',
      teams: [team0, team1],
      finalPlayerScores,
      finalTeamScores: Array.isArray(parsed.finalTeamScores)
        ? (parsed.finalTeamScores as CompletedGameRecord['finalTeamScores'])
        : [],
      winner: parseWinner(parsed.winner),
      activityLog: parseActivityLog(parsed.activityLog),
      rounds,
      resultSummary,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}

export { COMPLETED_GAME_SNAPSHOT_SCHEMA_VERSION };

import {
  createActivityId,
  GameActivityEvent,
  GameStatus,
  nextActivitySequence,
  PenaltyActivityEvent,
  RoundActivityEvent,
} from './gameActivity';
import { GameMode, resolveGameMode } from './gameMode';
import { resolveTargetRoundCount } from './targetRoundCount';
import {
  ActiveGameData,
  SavedRoundSummary,
} from './screens/ActiveGameScreen';

export type { GameStatus } from './gameActivity';

export function nowIso(): string {
  return new Date().toISOString();
}

function roundsReachedTarget(game: ActiveGameData): boolean {
  const played = game.rounds?.length ?? 0;
  if (played <= 0) {
    return false;
  }
  return played >= resolveTargetRoundCount(game.targetRoundCount);
}

export function resolveGameStatus(game: ActiveGameData): GameStatus {
  if (
    game.status === 'active' ||
    game.status === 'paused' ||
    game.status === 'completed' ||
    game.status === 'abandoned'
  ) {
    return game.status;
  }

  return roundsReachedTarget(game) ? 'completed' : 'active';
}

export function isContinuableGameStatus(status: GameStatus): boolean {
  return status === 'active' || status === 'paused';
}

/** Eski rounds → activityLog (ceza uydurulmaz). */
export function buildActivityLogFromRounds(
  rounds: SavedRoundSummary[],
  gameMode?: GameMode,
): RoundActivityEvent[] {
  const mode = resolveGameMode(gameMode);
  return rounds.map((round, index) => ({
    id: createActivityId(`legacy-round-${round.roundNumber}`),
    type: 'round' as const,
    createdAt: new Date(0).toISOString(),
    sequence: index + 1,
    roundNumber: round.roundNumber,
    playerScores: round.players.map((entry) => ({ ...entry })),
    teamScores: round.teams.map((entry) => ({ ...entry })),
    finishType: round.finishType ?? 'none',
    finisherPlayerId: round.finisherPlayerId ?? null,
    finishBonusAmount: round.finishTeamBonus.amount,
    finishBonusPlayerId: round.finishBonusPlayerId ?? null,
    finishBonusTeamId: round.finishTeamBonus.teamId,
    gameMode: round.gameMode ?? mode,
  }));
}

export function resolveActivityLog(game: ActiveGameData): GameActivityEvent[] {
  if (Array.isArray(game.activityLog)) {
    return [...game.activityLog].sort((a, b) => a.sequence - b.sequence);
  }
  return buildActivityLogFromRounds(game.rounds ?? [], game.gameMode);
}

export function touchGameTimestamps(
  game: ActiveGameData,
  extras: Partial<
    Pick<ActiveGameData, 'startedAt' | 'completedAt' | 'pausedAt'>
  > = {},
): ActiveGameData {
  return {
    ...game,
    updatedAt: nowIso(),
    ...extras,
  };
}

export function pauseGame(game: ActiveGameData): ActiveGameData {
  const at = nowIso();
  return {
    ...game,
    status: 'paused',
    pausedAt: at,
    updatedAt: at,
  };
}

export function resumeGame(game: ActiveGameData): ActiveGameData {
  return {
    ...game,
    status: 'active',
    pausedAt: undefined,
    updatedAt: nowIso(),
  };
}

export function finishGameEarly(game: ActiveGameData): ActiveGameData {
  const at = nowIso();
  return {
    ...game,
    status: 'completed',
    completedAt: at,
    pausedAt: undefined,
    updatedAt: at,
  };
}

export function abandonGame(game: ActiveGameData): ActiveGameData {
  const at = nowIso();
  return {
    ...game,
    status: 'abandoned',
    completedAt: at,
    pausedAt: undefined,
    updatedAt: at,
  };
}

/**
 * Aynı kadro/mod/hedef el; skorlar ve günlük sıfır.
 */
export function restartGame(game: ActiveGameData): ActiveGameData {
  const at = nowIso();
  return {
    ...game,
    roundNumber: 1,
    rounds: [],
    activityLog: [],
    lastAction: null,
    status: 'active',
    startedAt: at,
    updatedAt: at,
    completedAt: undefined,
    pausedAt: undefined,
    completedGameRecordId: undefined,
    teams: [
      {
        name: game.teams[0].name,
        totalScore: 0,
        players: [
          {
            id: game.teams[0].players[0].id,
            name: game.teams[0].players[0].name,
            totalScore: 0,
          },
          {
            id: game.teams[0].players[1].id,
            name: game.teams[0].players[1].name,
            totalScore: 0,
          },
        ],
      },
      {
        name: game.teams[1].name,
        totalScore: 0,
        players: [
          {
            id: game.teams[1].players[0].id,
            name: game.teams[1].players[0].name,
            totalScore: 0,
          },
          {
            id: game.teams[1].players[1].id,
            name: game.teams[1].players[1].name,
            totalScore: 0,
          },
        ],
      },
    ],
  };
}

export function appendRoundActivity(
  game: ActiveGameData,
  event: Omit<RoundActivityEvent, 'id' | 'sequence' | 'createdAt' | 'type'>,
): GameActivityEvent[] {
  const log = resolveActivityLog(game);
  const next: RoundActivityEvent = {
    ...event,
    id: createActivityId('round'),
    type: 'round',
    createdAt: nowIso(),
    sequence: nextActivitySequence(log),
  };
  return [...log, next];
}

export function appendPenaltyActivity(
  game: ActiveGameData,
  event: Omit<PenaltyActivityEvent, 'id' | 'sequence' | 'createdAt' | 'type'>,
): GameActivityEvent[] {
  const log = resolveActivityLog(game);
  const next: PenaltyActivityEvent = {
    ...event,
    id: createActivityId('penalty'),
    type: 'penalty',
    createdAt: nowIso(),
    sequence: nextActivitySequence(log),
  };
  return [...log, next];
}

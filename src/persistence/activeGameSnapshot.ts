import {
  ActiveGameData,
  ActiveGamePlayer,
  ActiveGameTeam,
  LastGameAction,
  SavedRoundSummary,
} from '../ui/screens/ActiveGameScreen';
import { resolveGameMode, isGameMode } from '../ui/gameMode';
import { isGameComplete } from '../ui/gameResult';

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
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.name !== 'string' || !isFiniteNumber(value.totalScore)) {
    return null;
  }
  if (!Array.isArray(value.players) || value.players.length !== 2) {
    return null;
  }
  const player0 = parsePlayer(value.players[0]);
  const player1 = parsePlayer(value.players[1]);
  if (!player0 || !player1) {
    return null;
  }
  return {
    name: value.name,
    totalScore: value.totalScore,
    players: [player0, player1],
  };
}

function parseRoundSummary(value: unknown): SavedRoundSummary | null {
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

  const bonusTeamId = value.finishTeamBonus.teamId;
  if (
    !(bonusTeamId === null || typeof bonusTeamId === 'string') ||
    !isFiniteNumber(value.finishTeamBonus.amount)
  ) {
    return null;
  }

  const summary: SavedRoundSummary = {
    roundNumber: value.roundNumber,
    players,
    teams,
    finishTeamBonus: {
      teamId: bonusTeamId,
      amount: value.finishTeamBonus.amount,
    },
  };

  if (isGameMode(value.gameMode)) {
    summary.gameMode = value.gameMode;
  }

  if (
    value.finishBonusPlayerId === null ||
    typeof value.finishBonusPlayerId === 'string'
  ) {
    summary.finishBonusPlayerId = value.finishBonusPlayerId;
  }

  return summary;
}

function parseLastAction(value: unknown): LastGameAction | null {
  if (value === null) {
    return null;
  }
  if (!isRecord(value)) {
    return null;
  }
  if (
    typeof value.playerName !== 'string' ||
    typeof value.penaltyLabel !== 'string' ||
    !isFiniteNumber(value.amount)
  ) {
    return null;
  }
  return {
    playerName: value.playerName,
    penaltyLabel: value.penaltyLabel,
    amount: value.amount,
  };
}

/**
 * Bozuk JSON / eksik alanlarda null döner; çağıran kayıtı temizleyebilir.
 */
export function parseActiveGameSnapshot(
  rawJson: string,
): ActiveGameData | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) {
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

  if (!isFiniteNumber(parsed.roundNumber)) {
    return null;
  }
  if (!Array.isArray(parsed.rounds)) {
    return null;
  }

  const rounds: SavedRoundSummary[] = [];
  for (const round of parsed.rounds) {
    const parsedRound = parseRoundSummary(round);
    if (!parsedRound) {
      return null;
    }
    rounds.push(parsedRound);
  }

  const lastAction = parseLastAction(parsed.lastAction);
  if (parsed.lastAction !== null && lastAction === null) {
    return null;
  }

  let targetRoundCount: number | undefined;
  if (parsed.targetRoundCount !== undefined) {
    if (
      !isFiniteNumber(parsed.targetRoundCount) ||
      !Number.isInteger(parsed.targetRoundCount) ||
      parsed.targetRoundCount <= 0
    ) {
      return null;
    }
    targetRoundCount = parsed.targetRoundCount;
  }

  // Eski kayıtlarda yoksa paired; geçersiz değer de paired’e düşer.
  const gameMode = resolveGameMode(parsed.gameMode);

  return {
    teams: [team0, team1],
    roundNumber: parsed.roundNumber,
    rounds,
    lastAction,
    targetRoundCount,
    gameMode,
  };
}

export function serializeActiveGameSnapshot(game: ActiveGameData): string {
  return JSON.stringify(game);
}

/** Home “Devam Et” ve DB’de tutulacak oyunlar. */
export function isContinuableActiveGame(game: ActiveGameData): boolean {
  return !isGameComplete(game);
}

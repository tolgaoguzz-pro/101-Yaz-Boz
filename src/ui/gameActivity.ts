import { FinishType } from '../engine/models';
import { GameMode } from './gameMode';

export type GameStatus = 'active' | 'paused' | 'completed' | 'abandoned';

export type RoundActivityEvent = {
  id: string;
  type: 'round';
  createdAt: string;
  sequence: number;
  roundNumber: number;
  playerScores: { playerId: string; score: number }[];
  teamScores: { teamId: string; score: number }[];
  finishType: FinishType;
  finisherPlayerId: string | null;
  finishBonusAmount: number;
  finishBonusPlayerId?: string | null;
  finishBonusTeamId?: string | null;
  gameMode?: GameMode;
};

export type PenaltyActivityEvent = {
  id: string;
  type: 'penalty';
  createdAt: string;
  sequence: number;
  playerId: string;
  playerName: string;
  penaltyLabel: string;
  amount: number;
  source: 'fixed' | 'manual';
};

export type GameActivityEvent = RoundActivityEvent | PenaltyActivityEvent;

export function createActivityId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function nextActivitySequence(
  log: GameActivityEvent[] | undefined,
): number {
  if (!log || log.length === 0) {
    return 1;
  }
  return Math.max(...log.map((event) => event.sequence)) + 1;
}

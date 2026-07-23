import { RoundInput } from '../../engine/models';
import { GamePlayerRef } from '../gameRoster';
import { applyImpliedOpenTypes } from './playerFieldRules';
import { RoundEntryForm, RoundEntryPlayerForm } from './types';

export function parseNonNegativeNumber(text: string): number {
  const parsed = Number.parseInt(text.replace(/[^\d-]/g, ''), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

export function createInitialRoundEntryForm(
  players: GamePlayerRef[],
): RoundEntryForm {
  return {
    finisherPlayerId: null,
    finishType: 'none',
    players: players.map((player) => ({
      playerId: player.id,
      openType: 'series',
      remainingTilePointsText: '0',
    })),
  };
}

function toPlayerRoundInput(player: RoundEntryPlayerForm) {
  return {
    playerId: player.playerId,
    openType: player.openType,
    remainingTilePoints: parseNonNegativeNumber(player.remainingTilePointsText),
    remainingOkeyCount: 0,
    wrongOpenCount: 0,
    playableTileDiscardCount: 0,
    manualPenalty: 0,
  };
}

export function buildRoundInputFromForm(
  form: RoundEntryForm,
  roundId: string,
): RoundInput {
  const normalized = applyImpliedOpenTypes(form);
  const nobodyFinished = normalized.finisherPlayerId === null;

  return {
    id: roundId,
    players: normalized.players.map(toPlayerRoundInput),
    finish: {
      finisherPlayerId: nobodyFinished ? null : normalized.finisherPlayerId,
      finishType: nobodyFinished ? 'none' : normalized.finishType,
    },
  };
}

import { RoundInput } from '../../engine/models';
import { GamePlayerRef } from '../gameRoster';
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
      remainingOkeyCount: 0,
      wrongOpenCount: 0,
      playableTileDiscardCount: 0,
      manualPenaltyText: '0',
    })),
  };
}

function toPlayerRoundInput(player: RoundEntryPlayerForm) {
  return {
    playerId: player.playerId,
    openType: player.openType,
    remainingTilePoints: parseNonNegativeNumber(player.remainingTilePointsText),
    remainingOkeyCount: player.remainingOkeyCount,
    wrongOpenCount: player.wrongOpenCount,
    playableTileDiscardCount: player.playableTileDiscardCount,
    manualPenalty: parseNonNegativeNumber(player.manualPenaltyText),
  };
}

export function buildRoundInputFromForm(
  form: RoundEntryForm,
  roundId: string,
): RoundInput {
  const nobodyFinished = form.finisherPlayerId === null;

  return {
    id: roundId,
    players: form.players.map(toPlayerRoundInput),
    finish: {
      finisherPlayerId: nobodyFinished ? null : form.finisherPlayerId,
      finishType: nobodyFinished ? 'none' : form.finishType,
    },
  };
}

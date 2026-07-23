import {
  buildRoundPreviewError,
  buildRoundPreviewState,
  CLOSED_ROUND_PREVIEW,
} from '../roundEntry/previewState';
import { CalculateRoundResult } from '../../engine/calculateRound';

const sampleResult = {
  players: [{ playerId: 'player-1', score: 0 }],
  teams: [{ teamId: 'team-1', score: 0 }],
  finishTeamBonus: { teamId: 'team-1', amount: -101 },
} as CalculateRoundResult;

describe('round preview state helper', () => {
  it('opens visible preview on first successful build', () => {
    const state = buildRoundPreviewState({
      result: sampleResult,
      meta: { finishType: 'normal', finisherPlayerId: 'player-1' },
    });
    expect(state.visible).toBe(true);
    expect(state.result).toBe(sampleResult);
    expect(state.meta?.finisherPlayerId).toBe('player-1');
    expect(state.error).toBeNull();
  });

  it('does not open on validation error', () => {
    const state = buildRoundPreviewError('Eksik alan');
    expect(state.visible).toBe(false);
    expect(state.result).toBeNull();
    expect(state.error).toBe('Eksik alan');
  });

  it('starts closed', () => {
    expect(CLOSED_ROUND_PREVIEW.visible).toBe(false);
  });
});

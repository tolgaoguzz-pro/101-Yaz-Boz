import { applyRoundResultToIndividualGame } from '../applyGameUpdates';
import { calculateIndividualRound } from '../individualRound';
import { buildActiveGameFromSetup, DEFAULT_NEW_GAME_FORM } from '../newGameSetup';
import { RoundInput } from '../../engine/models';

function game() {
  return buildActiveGameFromSetup({
    ...DEFAULT_NEW_GAME_FORM,
    player1Name: 'Tolga',
    player2Name: 'Aygül',
    player3Name: 'Şahin',
    player4Name: 'Mashhura',
    gameMode: 'individual',
    targetRoundCount: 12,
  });
}

function input(): RoundInput {
  return {
    id: 'round-preview',
    finish: { finishType: 'normal', finisherPlayerId: 'player-1' },
    players: [
      {
        playerId: 'player-1',
        openType: 'didNotOpen',
        remainingTilePoints: 0,
        remainingOkeyCount: 0,
        wrongOpenCount: 0,
        playableTileDiscardCount: 0,
        manualPenalty: 0,
      },
      {
        playerId: 'player-2',
        openType: 'series',
        remainingTilePoints: 20,
        remainingOkeyCount: 0,
        wrongOpenCount: 0,
        playableTileDiscardCount: 0,
        manualPenalty: 0,
      },
      {
        playerId: 'player-3',
        openType: 'doubles',
        remainingTilePoints: 10,
        remainingOkeyCount: 0,
        wrongOpenCount: 0,
        playableTileDiscardCount: 0,
        manualPenalty: 0,
      },
      {
        playerId: 'player-4',
        openType: 'didNotOpen',
        remainingTilePoints: 0,
        remainingOkeyCount: 0,
        wrongOpenCount: 0,
        playableTileDiscardCount: 0,
        manualPenalty: 0,
      },
    ],
  };
}

describe('round preview save contract', () => {
  it('calculateIndividualRound alone does not mutate game scores', () => {
    const before = game();
    const snapshot = JSON.stringify(before);
    calculateIndividualRound(input(), before);
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it('save applies once and appends one round activity event', () => {
    const before = game();
    const result = calculateIndividualRound(input(), before);
    const meta = {
      finishType: 'normal' as const,
      finisherPlayerId: 'player-1',
    };
    const once = applyRoundResultToIndividualGame(before, result, meta);
    expect(once.rounds).toHaveLength(1);
    expect(once.activityLog).toHaveLength(1);
    expect(once.activityLog?.[0].type).toBe('round');

    const twice = applyRoundResultToIndividualGame(once, result, meta);
    expect(twice.rounds).toHaveLength(2);
    expect(twice.activityLog).toHaveLength(2);
  });
});

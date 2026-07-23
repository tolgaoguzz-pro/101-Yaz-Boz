import { RoundInput } from '../../engine/models';
import { DEFAULT_SCORE_RULES } from '../../engine/rules';
import { calculateRound } from '../../engine/calculateRound';
import {
  applyQuickPenaltyToGame,
  applyQuickPenaltyToIndividualGame,
  applyQuickPenaltyToPairedGame,
  applyRoundResultToGame,
  applyRoundResultToIndividualGame,
  applyRoundResultToPairedGame,
} from '../applyGameUpdates';
import { buildRosterFromActiveGame } from '../gameRoster';
import { calculateIndividualRound } from '../individualRound';
import { buildActiveGameFromSetup, DEFAULT_NEW_GAME_FORM } from '../newGameSetup';
import { ActiveGameData } from '../screens/ActiveGameScreen';
import { QuickPenaltySelection } from '../screens/QuickPenaltyScreen';

function individualGame(): ActiveGameData {
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

function pairedGame(): ActiveGameData {
  return buildActiveGameFromSetup({
    ...DEFAULT_NEW_GAME_FORM,
    team1Name: 'Oğuz Ailesi',
    player1Name: 'Tolga',
    player2Name: 'Aygül',
    team2Name: 'Güldiken Ailesi',
    player3Name: 'Şahin',
    player4Name: 'Mashhura',
    gameMode: 'paired',
    targetRoundCount: 12,
  });
}

function normalFinishInput(finisherId: string): RoundInput {
  return {
    id: 'round-1',
    finish: { finishType: 'normal', finisherPlayerId: finisherId },
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

function fromHandInput(finisherId: string): RoundInput {
  return {
    id: 'round-2',
    finish: { finishType: 'fromHand', finisherPlayerId: finisherId },
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
        openType: 'didNotOpen',
        remainingTilePoints: 0,
        remainingOkeyCount: 0,
        wrongOpenCount: 0,
        playableTileDiscardCount: 0,
        manualPenalty: 0,
      },
      {
        playerId: 'player-3',
        openType: 'didNotOpen',
        remainingTilePoints: 0,
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

function penalty(
  overrides: Partial<QuickPenaltySelection> & Pick<QuickPenaltySelection, 'playerId'>,
): QuickPenaltySelection {
  return {
    playerName: 'Tolga',
    kind: 'remainingOkey',
    label: 'Elde Okey',
    amount: 101,
    ...overrides,
  };
}

describe('calculateIndividualRound', () => {
  it('gives finisher 0 and independent scores to the other three', () => {
    const game = individualGame();
    const result = calculateIndividualRound(
      normalFinishInput('player-1'),
      game,
    );

    const byId = Object.fromEntries(
      result.players.map((entry) => [entry.playerId, entry.score]),
    );

    expect(byId['player-1']).toBe(0);
    // series 20 * 1
    expect(byId['player-2']).toBe(20);
    // doubles 10 * 2
    expect(byId['player-3']).toBe(20);
    // didNotOpen 202
    expect(byId['player-4']).toBe(202);
  });

  it('does not apply partner fixed penalty to the same container player', () => {
    const game = individualGame();
    // player-1 finishes; player-2 shares paired container but must NOT get partner 0 fixed
    const result = calculateIndividualRound(
      normalFinishInput('player-1'),
      game,
    );
    const partnerSeat = result.players.find((p) => p.playerId === 'player-2');
    expect(partnerSeat?.score).toBe(20);
    expect(partnerSeat?.score).not.toBe(
      DEFAULT_SCORE_RULES.finisherPartner.fixedPenalty,
    );
  });

  it('applies didNotOpen with fromHand multiplier to the other three', () => {
    const game = individualGame();
    const result = calculateIndividualRound(fromHandInput('player-1'), game);
    const byId = Object.fromEntries(
      result.players.map((entry) => [entry.playerId, entry.score]),
    );
    expect(byId['player-1']).toBe(0);
    expect(byId['player-2']).toBe(202 * 2);
    expect(byId['player-3']).toBe(202 * 2);
    expect(byId['player-4']).toBe(202 * 2);
    expect(result.finishTeamBonus.amount).toBe(
      DEFAULT_SCORE_RULES.finishTeamBonus.fromHand,
    );
  });
});

describe('applyRoundResultToIndividualGame', () => {
  it('adds finish bonus only to the finisher totalScore', () => {
    const game = individualGame();
    const result = calculateIndividualRound(
      normalFinishInput('player-1'),
      game,
    );
    const next = applyRoundResultToIndividualGame(game, result, {
      finishType: 'normal',
      finisherPlayerId: 'player-1',
    });

    expect(next.teams[0].players[0].totalScore).toBe(
      0 + DEFAULT_SCORE_RULES.finishTeamBonus.normal,
    );
    expect(next.teams[0].players[1].totalScore).toBe(20);
    expect(next.teams[1].players[0].totalScore).toBe(20);
    expect(next.teams[1].players[1].totalScore).toBe(202);
  });

  it('keeps container team.totalScore as the sum of its two players', () => {
    const game = individualGame();
    const result = calculateIndividualRound(
      normalFinishInput('player-1'),
      game,
    );
    const next = applyRoundResultToIndividualGame(game, result, {
      finishType: 'normal',
      finisherPlayerId: 'player-1',
    });

    expect(next.teams[0].totalScore).toBe(
      next.teams[0].players[0].totalScore +
        next.teams[0].players[1].totalScore,
    );
    expect(next.teams[1].totalScore).toBe(
      next.teams[1].players[0].totalScore +
        next.teams[1].players[1].totalScore,
    );
  });

  it('stores four player scores in round history', () => {
    const game = individualGame();
    const result = calculateIndividualRound(
      normalFinishInput('player-1'),
      game,
    );
    const next = applyRoundResultToIndividualGame(game, result, {
      finishType: 'normal',
      finisherPlayerId: 'player-1',
    });
    expect(next.rounds[0].players).toHaveLength(4);
    expect(next.rounds[0].gameMode).toBe('individual');
    expect(next.rounds[0].finishBonusPlayerId).toBe('player-1');
    expect(next.rounds[0].finishTeamBonus.amount).toBe(
      DEFAULT_SCORE_RULES.finishTeamBonus.normal,
    );
  });
});

describe('applyQuickPenaltyToIndividualGame', () => {
  it('changes only the selected player and recalculates that container total', () => {
    const game = individualGame();
    game.teams[0].players[0].totalScore = 10;
    game.teams[0].players[1].totalScore = 20;
    game.teams[0].totalScore = 30;
    game.teams[1].players[0].totalScore = 40;
    game.teams[1].players[1].totalScore = 50;
    game.teams[1].totalScore = 90;

    const next = applyQuickPenaltyToIndividualGame(
      game,
      penalty({ playerId: 'player-1', playerName: 'Tolga' }),
    );

    expect(next.teams[0].players[0].totalScore).toBe(111);
    expect(next.teams[0].players[1].totalScore).toBe(20);
    expect(next.teams[0].totalScore).toBe(131);
    expect(next.teams[1].players[0].totalScore).toBe(40);
    expect(next.teams[1].players[1].totalScore).toBe(50);
    expect(next.teams[1].totalScore).toBe(90);
    expect(next.lastAction).toEqual({
      playerName: 'Tolga',
      penaltyLabel: 'Elde Okey',
      amount: 101,
    });
  });
});

describe('mode-aware dispatch and paired compatibility', () => {
  it('falls back to paired when gameMode is undefined', () => {
    const game = pairedGame();
    delete game.gameMode;
    const result = calculateRound(
      normalFinishInput('player-1'),
      DEFAULT_SCORE_RULES,
      buildRosterFromActiveGame(game),
    );
    const next = applyRoundResultToGame(game, result, {
      finishType: 'normal',
      finisherPlayerId: 'player-1',
    });
    const pairedNext = applyRoundResultToPairedGame(
      { ...pairedGame(), gameMode: undefined },
      result,
      {
        finishType: 'normal',
        finisherPlayerId: 'player-1',
      },
    );
    expect(next.teams).toEqual(pairedNext.teams);
    expect(next.rounds[0].players).toEqual(pairedNext.rounds[0].players);
  });

  it('keeps paired quick penalty adding to team totalScore', () => {
    const game = pairedGame();
    const next = applyQuickPenaltyToPairedGame(
      game,
      penalty({ playerId: 'player-1', playerName: 'Tolga' }),
    );
    expect(next.teams[0].players[0].totalScore).toBe(101);
    expect(next.teams[0].players[1].totalScore).toBe(0);
    expect(next.teams[0].totalScore).toBe(101);
  });

  it('routes individual games through individual helpers', () => {
    const game = individualGame();
    const result = calculateIndividualRound(
      normalFinishInput('player-2'),
      game,
    );
    const viaDispatch = applyRoundResultToGame(game, result, {
      finishType: 'normal',
      finisherPlayerId: 'player-2',
    });
    const viaDirect = applyRoundResultToIndividualGame(game, result, {
      finishType: 'normal',
      finisherPlayerId: 'player-2',
    });
    expect(viaDispatch.teams).toEqual(viaDirect.teams);
    expect(viaDispatch.rounds).toEqual(viaDirect.rounds);
    expect(viaDispatch.activityLog).toHaveLength(1);
    expect(viaDirect.activityLog).toHaveLength(1);
    expect(viaDispatch.activityLog?.[0].type).toBe('round');
    expect(viaDirect.activityLog?.[0].type).toBe('round');

    const penaltyNext = applyQuickPenaltyToGame(
      game,
      penalty({ playerId: 'player-3', playerName: 'Şahin' }),
    );
    expect(penaltyNext.teams[1].players[0].totalScore).toBe(101);
    expect(penaltyNext.teams[1].players[1].totalScore).toBe(0);
    expect(penaltyNext.teams[1].totalScore).toBe(101);
  });
});

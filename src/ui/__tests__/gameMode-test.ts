import {
  DEFAULT_GAME_MODE,
  isGameMode,
  resolveGameMode,
  gameModeLabel,
} from '../gameMode';
import {
  buildActiveGameFromSetup,
  DEFAULT_NEW_GAME_FORM,
  validateNewGameSetup,
} from '../newGameSetup';
import { createRematchGame } from '../gameResult';

describe('gameMode', () => {
  it('resolves undefined and invalid values to paired', () => {
    expect(resolveGameMode(undefined)).toBe('paired');
    expect(resolveGameMode(null)).toBe('paired');
    expect(resolveGameMode('solo')).toBe('paired');
    expect(DEFAULT_GAME_MODE).toBe('paired');
  });

  it('accepts only paired and individual', () => {
    expect(isGameMode('paired')).toBe(true);
    expect(isGameMode('individual')).toBe(true);
    expect(isGameMode('team')).toBe(false);
    expect(gameModeLabel('paired')).toBe('Eşli Oyun');
    expect(gameModeLabel('individual')).toBe('Tekli Oyun');
  });
});

describe('newGameSetup', () => {
  const pairedInput = {
    ...DEFAULT_NEW_GAME_FORM,
    team1Name: 'Oğuz Ailesi',
    player1Name: 'Tolga',
    player2Name: 'Aygül',
    team2Name: 'Güldiken Ailesi',
    player3Name: 'Şahin',
    player4Name: 'Mashhura',
    gameMode: 'paired' as const,
    targetRoundCount: 12,
  };

  const individualInput = {
    ...DEFAULT_NEW_GAME_FORM,
    player1Name: 'Tolga',
    player2Name: 'Aygül',
    player3Name: 'Şahin',
    player4Name: 'Mashhura',
    gameMode: 'individual' as const,
    targetRoundCount: 10,
  };

  it('builds a paired game with teams and gameMode', () => {
    expect(validateNewGameSetup(pairedInput)).toBeNull();
    const game = buildActiveGameFromSetup(pairedInput);
    expect(game.gameMode).toBe('paired');
    expect(game.teams[0].name).toBe('Oğuz Ailesi');
    expect(game.teams[1].name).toBe('Güldiken Ailesi');
    expect(game.teams[0].players.map((p) => p.name)).toEqual([
      'Tolga',
      'Aygül',
    ]);
    expect(game.teams[1].players.map((p) => p.name)).toEqual([
      'Şahin',
      'Mashhura',
    ]);
    expect(game.targetRoundCount).toBe(12);
    expect(game.rounds).toEqual([]);
  });

  it('builds an individual game preserving all four players in seat order', () => {
    expect(validateNewGameSetup(individualInput)).toBeNull();
    const game = buildActiveGameFromSetup(individualInput);
    expect(game.gameMode).toBe('individual');
    expect(game.teams[0].players.map((p) => p.name)).toEqual([
      'Tolga',
      'Aygül',
    ]);
    expect(game.teams[1].players.map((p) => p.name)).toEqual([
      'Şahin',
      'Mashhura',
    ]);
    expect(game.teams[0].players.map((p) => p.id)).toEqual([
      'player-1',
      'player-2',
    ]);
    expect(game.teams[1].players.map((p) => p.id)).toEqual([
      'player-3',
      'player-4',
    ]);
  });

  it('rejects blank player names in individual mode', () => {
    expect(
      validateNewGameSetup({
        ...individualInput,
        player2Name: '   ',
      }),
    ).toBe('Dört oyuncunun adını da doldurmalısın.');
  });

  it('rejects duplicate player names in individual mode', () => {
    expect(
      validateNewGameSetup({
        ...individualInput,
        player1Name: 'Tolga',
        player3Name: 'tolga',
      }),
    ).toBe('Tekli oyunda oyuncu adları birbirinden farklı olmalı.');
  });

  it('rejects blank team names only in paired mode', () => {
    expect(
      validateNewGameSetup({
        ...pairedInput,
        team1Name: ' ',
      }),
    ).toBe('Tüm takım ve oyuncu adlarını doldurmalısın.');

    expect(
      validateNewGameSetup({
        ...individualInput,
        team1Name: ' ',
        team2Name: ' ',
      }),
    ).toBeNull();
  });

  it('keeps player names when rebuilding after a conceptual mode switch', () => {
    const sharedPlayers = {
      player1Name: 'Tolga',
      player2Name: 'Aygül',
      player3Name: 'Şahin',
      player4Name: 'Mashhura',
      team1Name: 'Oğuz Ailesi',
      team2Name: 'Güldiken Ailesi',
      targetRoundCount: 12 as const,
    };

    const asIndividual = buildActiveGameFromSetup({
      ...sharedPlayers,
      gameMode: 'individual',
    });
    const backToPaired = buildActiveGameFromSetup({
      ...sharedPlayers,
      gameMode: 'paired',
    });

    expect(asIndividual.teams[0].players.map((p) => p.name)).toEqual([
      'Tolga',
      'Aygül',
    ]);
    expect(asIndividual.teams[1].players.map((p) => p.name)).toEqual([
      'Şahin',
      'Mashhura',
    ]);
    expect(backToPaired.teams[0].name).toBe('Oğuz Ailesi');
    expect(backToPaired.teams[1].name).toBe('Güldiken Ailesi');
    expect(backToPaired.teams[0].players.map((p) => p.name)).toEqual([
      'Tolga',
      'Aygül',
    ]);
    expect(backToPaired.teams[1].players.map((p) => p.name)).toEqual([
      'Şahin',
      'Mashhura',
    ]);
  });
});

describe('createRematchGame gameMode', () => {
  it('preserves paired gameMode on rematch', () => {
    const rematch = createRematchGame(
      buildActiveGameFromSetup({
        ...DEFAULT_NEW_GAME_FORM,
        gameMode: 'paired',
        targetRoundCount: 12,
      }),
    );
    expect(rematch.gameMode).toBe('paired');
    expect(rematch.rounds).toEqual([]);
  });

  it('preserves individual gameMode and roster on rematch', () => {
    const original = buildActiveGameFromSetup({
      ...DEFAULT_NEW_GAME_FORM,
      player1Name: 'Tolga',
      player2Name: 'Aygül',
      player3Name: 'Şahin',
      player4Name: 'Mashhura',
      gameMode: 'individual',
      targetRoundCount: 8,
    });
    original.teams[0].players[0].totalScore = 40;
    original.teams[0].totalScore = 40;

    const rematch = createRematchGame(original);
    expect(rematch.gameMode).toBe('individual');
    expect(rematch.targetRoundCount).toBe(8);
    expect(rematch.rounds).toEqual([]);
    expect(rematch.teams[0].players.map((p) => p.name)).toEqual([
      'Tolga',
      'Aygül',
    ]);
    expect(rematch.teams[1].players.map((p) => p.name)).toEqual([
      'Şahin',
      'Mashhura',
    ]);
    expect(rematch.teams[0].players[0].totalScore).toBe(0);
    expect(rematch.teams[0].totalScore).toBe(0);
  });
});

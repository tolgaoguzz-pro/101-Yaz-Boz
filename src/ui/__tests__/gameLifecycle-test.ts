import { buildMatchupKey } from '../../domain/matchupKey';
import {
  buildActivityLogFromRounds,
  finishGameEarly,
  pauseGame,
  resolveActivityLog,
  resolveGameStatus,
  restartGame,
  resumeGame,
} from '../gameLifecycle';
import { isGameComplete } from '../gameResult';
import { applyQuickPenaltyToIndividualGame } from '../applyGameUpdates';
import { buildActiveGameFromSetup, DEFAULT_NEW_GAME_FORM } from '../newGameSetup';
import { ActiveGameData } from '../screens/ActiveGameScreen';
import { isContinuableActiveGame } from '../../persistence/activeGameSnapshot';

function baseIndividual(): ActiveGameData {
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

describe('matchupKey', () => {
  it('keeps paired key when teammate order and sides swap', () => {
    const a = buildMatchupKey({
      gameMode: 'paired',
      players: ['Tolga', 'Aygül', 'Şahin', 'Mashhura'],
    });
    const b = buildMatchupKey({
      gameMode: 'paired',
      players: ['Aygül', 'Tolga', 'Mashhura', 'Şahin'],
    });
    const c = buildMatchupKey({
      gameMode: 'paired',
      players: ['Şahin', 'Mashhura', 'Tolga', 'Aygül'],
    });
    expect(a).toBe(b);
    expect(a).toBe(c);
  });

  it('changes paired key when partnership changes', () => {
    const sameTeams = buildMatchupKey({
      gameMode: 'paired',
      players: ['Tolga', 'Aygül', 'Şahin', 'Mashhura'],
    });
    const swappedPartners = buildMatchupKey({
      gameMode: 'paired',
      players: ['Tolga', 'Şahin', 'Aygül', 'Mashhura'],
    });
    expect(sameTeams).not.toBe(swappedPartners);
  });

  it('keeps individual key when player order changes', () => {
    const a = buildMatchupKey({
      gameMode: 'individual',
      players: ['Tolga', 'Aygül', 'Şahin', 'Mashhura'],
    });
    const b = buildMatchupKey({
      gameMode: 'individual',
      players: ['Mashhura', 'Şahin', 'Aygül', 'Tolga'],
    });
    expect(a).toBe(b);
  });

  it('changes individual key for different roster', () => {
    const a = buildMatchupKey({
      gameMode: 'individual',
      players: ['Tolga', 'Aygül', 'Şahin', 'Mashhura'],
    });
    const b = buildMatchupKey({
      gameMode: 'individual',
      players: ['Tolga', 'Aygül', 'Şahin', 'Ali'],
    });
    expect(a).not.toBe(b);
  });
});

describe('gameLifecycle status', () => {
  it('marks new games active and pauses/resumes', () => {
    const game = baseIndividual();
    expect(resolveGameStatus(game)).toBe('active');
    const paused = pauseGame(game);
    expect(paused.status).toBe('paused');
    expect(isContinuableActiveGame(paused)).toBe(true);
    expect(isGameComplete(paused)).toBe(false);
    const resumed = resumeGame(paused);
    expect(resumed.status).toBe('active');
  });

  it('early finish marks completed and is not continuable', () => {
    const finished = finishGameEarly(baseIndividual());
    expect(finished.status).toBe('completed');
    expect(isGameComplete(finished)).toBe(true);
    expect(isContinuableActiveGame(finished)).toBe(false);
  });

  it('restart clears scores/rounds/log and keeps roster/mode', () => {
    const dirty = baseIndividual();
    dirty.teams[0].players[0].totalScore = 40;
    dirty.rounds = [
      {
        roundNumber: 1,
        players: [],
        teams: [],
        finishTeamBonus: { teamId: null, amount: 0 },
      },
    ];
    dirty.activityLog = buildActivityLogFromRounds(dirty.rounds, 'individual');
    const restarted = restartGame(dirty);
    expect(restarted.status).toBe('active');
    expect(restarted.rounds).toEqual([]);
    expect(restarted.activityLog).toEqual([]);
    expect(restarted.gameMode).toBe('individual');
    expect(restarted.targetRoundCount).toBe(12);
    expect(restarted.teams[0].players[0].name).toBe('Tolga');
    expect(restarted.teams[0].players[0].totalScore).toBe(0);
  });
});

describe('activityLog', () => {
  it('builds round events from legacy rounds without inventing penalties', () => {
    const game = baseIndividual();
    delete game.activityLog;
    game.rounds = [
      {
        roundNumber: 1,
        players: [
          { playerId: 'player-1', score: 0 },
          { playerId: 'player-2', score: 20 },
          { playerId: 'player-3', score: 30 },
          { playerId: 'player-4', score: 40 },
        ],
        teams: [
          { teamId: 'team-1', score: 20 },
          { teamId: 'team-2', score: 70 },
        ],
        finishTeamBonus: { teamId: null, amount: -101 },
        finishBonusPlayerId: 'player-1',
        gameMode: 'individual',
      },
    ];
    const log = resolveActivityLog(game);
    expect(log).toHaveLength(1);
    expect(log[0].type).toBe('round');
    if (log[0].type === 'round') {
      expect(log[0].playerScores).toHaveLength(4);
      expect(log[0].finishBonusPlayerId).toBe('player-1');
    }
  });

  it('appends penalty events chronologically after apply', () => {
    const game = baseIndividual();
    const next = applyQuickPenaltyToIndividualGame(game, {
      playerId: 'player-1',
      playerName: 'Tolga',
      kind: 'remainingOkey',
      label: 'Elde Okey',
      amount: 101,
    });
    expect(next.activityLog).toHaveLength(1);
    expect(next.activityLog?.[0].type).toBe('penalty');
  });

  it('does not duplicate round events when activityLog starts empty', () => {
    const game = baseIndividual();
    expect(game.activityLog).toEqual([]);
    game.rounds = [
      {
        roundNumber: 1,
        players: [
          { playerId: 'player-1', score: 0 },
          { playerId: 'player-2', score: 20 },
          { playerId: 'player-3', score: 30 },
          { playerId: 'player-4', score: 40 },
        ],
        teams: [
          { teamId: 'team-1', score: 20 },
          { teamId: 'team-2', score: 70 },
        ],
        finishTeamBonus: { teamId: null, amount: -101 },
        finishBonusPlayerId: 'player-1',
        gameMode: 'individual',
      },
    ];
    // Empty array must win over rounds fallback.
    expect(resolveActivityLog(game)).toEqual([]);
  });
});

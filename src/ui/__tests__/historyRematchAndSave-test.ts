import {
  buildCompletedGameRecord,
  createCompletedGameId,
  matchupKeyFromGame,
} from '../../domain/completedGame';
import {
  createGameFromCompletedRecord,
  createRematchGame,
} from '../gameResult';
import { buildActiveGameFromSetup, DEFAULT_NEW_GAME_FORM } from '../newGameSetup';
import { computeRoundFromForm } from '../roundEntry/computeRound';
import { FINISH_TYPE_LABELS } from '../roundEntry/finishLabels';
import { createInitialRoundEntryForm } from '../roundEntry/buildRoundInput';
import { playersFromActiveGame } from '../gameRoster';
import {
  buildRoundPreviewState,
  CLOSED_ROUND_PREVIEW,
} from '../roundEntry/previewState';

describe('createGameFromCompletedRecord', () => {
  it('preserves paired roster, mode, target and resets scores', () => {
    const source = buildActiveGameFromSetup({
      ...DEFAULT_NEW_GAME_FORM,
      team1Name: 'Oğuz Ailesi',
      player1Name: 'Tolga',
      player2Name: 'Aygül',
      team2Name: 'Güldiken Ailesi',
      player3Name: 'Şahin',
      player4Name: 'Mashhura',
      gameMode: 'paired',
      targetRoundCount: 10,
    });
    source.teams[0].players[0].totalScore = 40;
    source.teams[0].totalScore = 90;
    source.rounds = [
      {
        roundNumber: 1,
        players: [],
        teams: [],
        finishTeamBonus: { teamId: null, amount: 0 },
      },
    ];
    source.status = 'completed';
    source.completedAt = '2026-07-20T12:00:00.000Z';
    const record = buildCompletedGameRecord(source, createCompletedGameId());
    const next = createGameFromCompletedRecord(record);

    expect(next.gameMode).toBe('paired');
    expect(next.targetRoundCount).toBe(10);
    expect(next.status).toBe('active');
    expect(next.rounds).toEqual([]);
    expect(next.activityLog).toEqual([]);
    expect(next.completedGameRecordId).toBeUndefined();
    expect(next.teams[0].name).toBe('Oğuz Ailesi');
    expect(next.teams[1].name).toBe('Güldiken Ailesi');
    expect(next.teams[0].players.map((p) => p.name)).toEqual([
      'Tolga',
      'Aygül',
    ]);
    expect(next.teams[1].players.map((p) => p.name)).toEqual([
      'Şahin',
      'Mashhura',
    ]);
    expect(next.teams[0].players[0].totalScore).toBe(0);
    expect(next.teams[0].totalScore).toBe(0);
    expect(matchupKeyFromGame(next)).toBe(record.matchupKey);
    expect(record.rounds).toHaveLength(1);
  });

  it('preserves individual four players and matchupKey', () => {
    const source = buildActiveGameFromSetup({
      ...DEFAULT_NEW_GAME_FORM,
      player1Name: 'Tolga',
      player2Name: 'Aygül',
      player3Name: 'Şahin',
      player4Name: 'Mashhura',
      gameMode: 'individual',
      targetRoundCount: 8,
    });
    source.status = 'completed';
    source.completedAt = '2026-07-21T12:00:00.000Z';
    source.rounds = [
      {
        roundNumber: 1,
        players: [],
        teams: [],
        finishTeamBonus: { teamId: null, amount: 0 },
      },
    ];
    const record = buildCompletedGameRecord(source, 'cg-ind');
    const next = createGameFromCompletedRecord(record);
    expect(next.gameMode).toBe('individual');
    expect(next.targetRoundCount).toBe(8);
    expect(playersFromActiveGame(next).map((p) => p.name)).toEqual([
      'Tolga',
      'Aygül',
      'Şahin',
      'Mashhura',
    ]);
    expect(matchupKeyFromGame(next)).toBe(record.matchupKey);
  });

  it('matches createRematchGame for the same roster snapshot', () => {
    const source = buildActiveGameFromSetup({
      ...DEFAULT_NEW_GAME_FORM,
      gameMode: 'paired',
      targetRoundCount: 12,
    });
    source.status = 'completed';
    source.completedAt = '2026-07-22T12:00:00.000Z';
    source.rounds = [
      {
        roundNumber: 1,
        players: [],
        teams: [],
        finishTeamBonus: { teamId: null, amount: 0 },
      },
    ];
    const record = buildCompletedGameRecord(source, 'cg-rematch');
    const fromRecord = createGameFromCompletedRecord(record);
    const fromActive = createRematchGame(source);
    expect(fromRecord.teams).toEqual(fromActive.teams);
    expect(fromRecord.gameMode).toBe(fromActive.gameMode);
    expect(fromRecord.targetRoundCount).toBe(fromActive.targetRoundCount);
  });
});

describe('finish labels', () => {
  it('uses full Elden Okey label', () => {
    expect(FINISH_TYPE_LABELS.fromHandAndOkey).toBe('Elden Okey');
    expect(FINISH_TYPE_LABELS.none).toBe('Bitmedi');
  });
});

describe('computeRoundFromForm + preview atomics', () => {
  it('direct compute yields saveable result', () => {
    const game = buildActiveGameFromSetup({
      ...DEFAULT_NEW_GAME_FORM,
      player1Name: 'Tolga',
      player2Name: 'Aygül',
      player3Name: 'Şahin',
      player4Name: 'Mashhura',
      gameMode: 'individual',
      targetRoundCount: 12,
    });
    const form = createInitialRoundEntryForm(playersFromActiveGame(game));
    form.finisherPlayerId = 'player-1';
    form.finishType = 'fromHand';
    const once = computeRoundFromForm(form, game);
    const twice = computeRoundFromForm(form, game);
    expect(once.ok).toBe(true);
    expect(twice.ok).toBe(true);
    if (once.ok && twice.ok) {
      expect(once.result).toEqual(twice.result);
      expect(once.meta).toEqual(twice.meta);
      const preview = buildRoundPreviewState({
        result: once.result,
        meta: once.meta,
      });
      expect(preview.visible).toBe(true);
      expect(preview.result).not.toBeNull();
    }
  });

  it('preview stays closed when payload missing', () => {
    expect(CLOSED_ROUND_PREVIEW.visible).toBe(false);
    expect(CLOSED_ROUND_PREVIEW.result).toBeNull();
  });
});

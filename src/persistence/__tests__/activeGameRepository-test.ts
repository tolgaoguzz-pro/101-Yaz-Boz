import {
  createActiveGameRepository,
  createMemoryActiveGameStore,
} from '../activeGameRepository';
import {
  isContinuableActiveGame,
  parseActiveGameSnapshot,
  serializeActiveGameSnapshot,
} from '../activeGameSnapshot';
import { ActiveGameData } from '../../ui/screens/ActiveGameScreen';
import { ACTIVE_GAME_SNAPSHOT_SCHEMA_VERSION } from '../schema';

function makeGame(
  overrides: Partial<ActiveGameData> = {},
): ActiveGameData {
  const base: ActiveGameData = {
    gameMode: 'paired',
    roundNumber: 3,
    targetRoundCount: 12,
    lastAction: null,
    rounds: [
      {
        roundNumber: 1,
        players: [
          { playerId: 'player-1', score: 10 },
          { playerId: 'player-2', score: 20 },
          { playerId: 'player-3', score: 30 },
          { playerId: 'player-4', score: 40 },
        ],
        teams: [
          { teamId: 'team-1', score: 30 },
          { teamId: 'team-2', score: 70 },
        ],
        finishTeamBonus: { teamId: 'team-1', amount: -101 },
      },
      {
        roundNumber: 2,
        players: [
          { playerId: 'player-1', score: 5 },
          { playerId: 'player-2', score: 5 },
          { playerId: 'player-3', score: 5 },
          { playerId: 'player-4', score: 5 },
        ],
        teams: [
          { teamId: 'team-1', score: 10 },
          { teamId: 'team-2', score: 10 },
        ],
        finishTeamBonus: { teamId: null, amount: 0 },
      },
    ],
    teams: [
      {
        name: 'Oğuz Ailesi',
        totalScore: 45,
        players: [
          { id: 'player-1', name: 'Tolga', totalScore: 20 },
          { id: 'player-2', name: 'Aygül', totalScore: 25 },
        ],
      },
      {
        name: 'Güldiken Ailesi',
        totalScore: 90,
        players: [
          { id: 'player-3', name: 'Şahin', totalScore: 40 },
          { id: 'player-4', name: 'Mashhura', totalScore: 50 },
        ],
      },
    ],
  };

  return {
    ...base,
    ...overrides,
    teams: overrides.teams ?? base.teams,
    rounds: overrides.rounds ?? base.rounds,
  };
}

describe('activeGameSnapshot', () => {
  it('round-trips a valid snapshot including targetRoundCount and rounds', () => {
    const game = makeGame({ targetRoundCount: 16 });
    const json = serializeActiveGameSnapshot(game);
    expect(parseActiveGameSnapshot(json)).toEqual(game);
  });

  it('returns null for corrupt JSON', () => {
    expect(parseActiveGameSnapshot('{not-json')).toBeNull();
    expect(parseActiveGameSnapshot('null')).toBeNull();
    expect(parseActiveGameSnapshot('{"teams":[]}')).toBeNull();
  });

  it('marks incomplete games continuable and completed games not', () => {
    expect(isContinuableActiveGame(makeGame())).toBe(true);
    expect(
      isContinuableActiveGame(
        makeGame({
          targetRoundCount: 2,
          rounds: makeGame().rounds.slice(0, 2),
        }),
      ),
    ).toBe(false);
  });

  it('round-trips status and activityLog', () => {
    const game = makeGame({
      status: 'paused',
      startedAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T01:00:00.000Z',
      pausedAt: '2026-01-01T01:00:00.000Z',
      activityLog: [
        {
          id: 'round-1',
          type: 'round',
          createdAt: '2026-01-01T00:10:00.000Z',
          sequence: 1,
          roundNumber: 1,
          playerScores: [
            { playerId: 'player-1', score: 0 },
            { playerId: 'player-2', score: 10 },
            { playerId: 'player-3', score: 20 },
            { playerId: 'player-4', score: 30 },
          ],
          teamScores: [
            { teamId: 'team-1', score: 10 },
            { teamId: 'team-2', score: 50 },
          ],
          finishType: 'normal',
          finisherPlayerId: 'player-1',
          finishBonusAmount: -101,
          finishBonusTeamId: 'team-1',
          gameMode: 'paired',
        },
        {
          id: 'penalty-1',
          type: 'penalty',
          createdAt: '2026-01-01T00:20:00.000Z',
          sequence: 2,
          playerId: 'player-2',
          playerName: 'Aygül',
          penaltyLabel: 'Elde Okey',
          amount: 101,
          source: 'fixed',
        },
      ],
    });
    const parsed = parseActiveGameSnapshot(serializeActiveGameSnapshot(game));
    expect(parsed?.status).toBe('paused');
    expect(parsed?.activityLog).toHaveLength(2);
    expect(isContinuableActiveGame(parsed!)).toBe(true);
  });

  it('does not treat completed or abandoned as continuable', () => {
    expect(
      isContinuableActiveGame(makeGame({ status: 'completed' })),
    ).toBe(false);
    expect(
      isContinuableActiveGame(makeGame({ status: 'abandoned' })),
    ).toBe(false);
  });

  it('loads legacy snapshots without status/activityLog', () => {
    const legacy = makeGame();
    delete legacy.status;
    delete legacy.activityLog;
    const parsed = parseActiveGameSnapshot(serializeActiveGameSnapshot(legacy));
    expect(parsed).not.toBeNull();
    expect(parsed?.status).toBeUndefined();
    expect(parsed?.activityLog).toBeUndefined();
    expect(isContinuableActiveGame(parsed!)).toBe(true);
  });
});

describe('activeGameRepository (memory store)', () => {
  function createRepo() {
    return createActiveGameRepository(createMemoryActiveGameStore());
  }

  it('saves and loads an active game', async () => {
    const repo = createRepo();
    const game = makeGame({ targetRoundCount: 10 });
    await repo.saveActiveGame(game);
    await expect(repo.loadActiveGame()).resolves.toEqual(game);
  });

  it('clears the active game', async () => {
    const repo = createRepo();
    await repo.saveActiveGame(makeGame());
    await repo.clearActiveGame();
    await expect(repo.loadActiveGame()).resolves.toBeNull();
  });

  it('preserves player and team totals after a quick-penalty style mutation', async () => {
    const repo = createRepo();
    const withPenalty = makeGame({
      lastAction: {
        playerName: 'Tolga',
        penaltyLabel: 'Okey',
        amount: 101,
      },
      teams: [
        {
          name: 'Oğuz Ailesi',
          totalScore: 146,
          players: [
            { id: 'player-1', name: 'Tolga', totalScore: 121 },
            { id: 'player-2', name: 'Aygül', totalScore: 25 },
          ],
        },
        {
          name: 'Güldiken Ailesi',
          totalScore: 90,
          players: [
            { id: 'player-3', name: 'Şahin', totalScore: 40 },
            { id: 'player-4', name: 'Mashhura', totalScore: 50 },
          ],
        },
      ],
    });

    await repo.saveActiveGame(withPenalty);
    const loaded = await repo.loadActiveGame();
    expect(loaded?.teams[0].totalScore).toBe(146);
    expect(loaded?.teams[0].players[0].totalScore).toBe(121);
    expect(loaded?.lastAction?.amount).toBe(101);
    expect(loaded?.rounds).toHaveLength(2);
  });

  it('clears corrupt snapshots on load', async () => {
    const store = createMemoryActiveGameStore();
    const repo = createActiveGameRepository(store);
    await store.writeRow({
      schema_version: ACTIVE_GAME_SNAPSHOT_SCHEMA_VERSION,
      updated_at: new Date().toISOString(),
      snapshot_json: '{"broken":true}',
    });

    await expect(repo.loadActiveGame()).resolves.toBeNull();
    await expect(store.readRow()).resolves.toBeNull();
  });

  it('does not keep a completed game as the active snapshot', async () => {
    const repo = createRepo();
    const completed = makeGame({
      targetRoundCount: 2,
      rounds: makeGame().rounds.slice(0, 2),
    });

    await repo.saveActiveGame(completed);
    await expect(repo.loadActiveGame()).resolves.toBeNull();
  });

  it('clears a completed game if it was written directly to the store', async () => {
    const store = createMemoryActiveGameStore();
    const repo = createActiveGameRepository(store);
    const completed = makeGame({
      targetRoundCount: 2,
      rounds: makeGame().rounds.slice(0, 2),
    });

    await store.writeRow({
      schema_version: ACTIVE_GAME_SNAPSHOT_SCHEMA_VERSION,
      updated_at: new Date().toISOString(),
      snapshot_json: serializeActiveGameSnapshot(completed),
    });

    await expect(repo.loadActiveGame()).resolves.toBeNull();
    await expect(store.readRow()).resolves.toBeNull();
  });

  it('saves and loads an individual gameMode snapshot', async () => {
    const repo = createRepo();
    const game = makeGame({
      gameMode: 'individual',
      targetRoundCount: 8,
    });
    await repo.saveActiveGame(game);
    const loaded = await repo.loadActiveGame();
    expect(loaded?.gameMode).toBe('individual');
    expect(loaded?.teams[0].players.map((p) => p.name)).toEqual([
      'Tolga',
      'Aygül',
    ]);
    expect(loaded?.teams[1].players.map((p) => p.name)).toEqual([
      'Şahin',
      'Mashhura',
    ]);
  });

  it('falls back to paired when legacy snapshot omits gameMode', () => {
    const legacy = makeGame({ gameMode: 'paired' });
    const { gameMode: _ignored, ...withoutMode } = legacy;
    const json = JSON.stringify(withoutMode);
    expect(json.includes('gameMode')).toBe(false);
    expect(parseActiveGameSnapshot(json)?.gameMode).toBe('paired');
  });
});

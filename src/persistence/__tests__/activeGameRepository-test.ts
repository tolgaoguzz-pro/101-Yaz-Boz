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

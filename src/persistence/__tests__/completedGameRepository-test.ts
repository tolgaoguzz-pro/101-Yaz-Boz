import {
  buildCompletedGameRecord,
  createCompletedGameId,
} from '../../domain/completedGame';
import { ensureCompletedGamePersisted } from '../../domain/ensureCompletedGame';
import {
  createCompletedGameRepository,
  createMemoryCompletedGameStore,
  setCompletedGameRepositoryForTests,
} from '../completedGameRepository';
import {
  parseCompletedGameSnapshot,
  serializeCompletedGameSnapshot,
} from '../completedGameSnapshot';
import { buildActiveGameFromSetup, DEFAULT_NEW_GAME_FORM } from '../../ui/newGameSetup';
import { ActiveGameData } from '../../ui/screens/ActiveGameScreen';
import { LATEST_MIGRATION_VERSION } from '../migrations';

function makeCompletedPaired(overrides: Partial<ActiveGameData> = {}): ActiveGameData {
  const game = buildActiveGameFromSetup({
    ...DEFAULT_NEW_GAME_FORM,
    team1Name: 'Oğuz',
    player1Name: 'Tolga',
    player2Name: 'Aygül',
    team2Name: 'Güldiken',
    player3Name: 'Şahin',
    player4Name: 'Mashhura',
    gameMode: 'paired',
    targetRoundCount: 2,
  });
  game.status = 'completed';
  game.completedAt = '2026-07-20T12:00:00.000Z';
  game.startedAt = '2026-07-20T10:00:00.000Z';
  game.rounds = [
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
  ];
  game.teams[0].players[0].totalScore = 15;
  game.teams[0].players[1].totalScore = 25;
  game.teams[0].totalScore = 40;
  game.teams[1].players[0].totalScore = 35;
  game.teams[1].players[1].totalScore = 45;
  game.teams[1].totalScore = 80;
  return { ...game, ...overrides };
}

describe('completedGameRepository', () => {
  beforeEach(() => {
    setCompletedGameRepositoryForTests(
      createCompletedGameRepository(createMemoryCompletedGameStore()),
    );
  });

  afterEach(() => {
    setCompletedGameRepositoryForTests(null);
  });

  it('saves and loads completed games', async () => {
    const repo = createCompletedGameRepository(createMemoryCompletedGameStore());
    const record = buildCompletedGameRecord(
      makeCompletedPaired(),
      createCompletedGameId(),
    );
    await expect(repo.saveCompletedGame(record)).resolves.toBe('inserted');
    await expect(repo.getCompletedGameById(record.id)).resolves.toEqual(record);
    await expect(repo.hasCompletedGame(record.id)).resolves.toBe(true);
  });

  it('lists by matchup and completed_at order', async () => {
    const repo = createCompletedGameRepository(createMemoryCompletedGameStore());
    const older = buildCompletedGameRecord(
      makeCompletedPaired({ completedAt: '2026-07-01T00:00:00.000Z' }),
      'cg-old',
    );
    const newer = buildCompletedGameRecord(
      makeCompletedPaired({ completedAt: '2026-07-10T00:00:00.000Z' }),
      'cg-new',
    );
    await repo.saveCompletedGame(older);
    await repo.saveCompletedGame(newer);
    const listed = await repo.listCompletedGamesByMatchup(older.matchupKey);
    expect(listed.map((item) => item.id)).toEqual(['cg-new', 'cg-old']);
  });

  it('is idempotent on duplicate id', async () => {
    const repo = createCompletedGameRepository(createMemoryCompletedGameStore());
    const record = buildCompletedGameRecord(makeCompletedPaired(), 'cg-dup');
    await expect(repo.saveCompletedGame(record)).resolves.toBe('inserted');
    await expect(repo.saveCompletedGame(record)).resolves.toBe('existing');
    const all = await repo.listCompletedGames();
    expect(all).toHaveLength(1);
  });

  it('skips corrupt snapshots in list', async () => {
    const store = createMemoryCompletedGameStore();
    await store.upsertRow({
      id: 'bad',
      matchup_key: 'x',
      game_mode: 'paired',
      completed_at: '2026-01-01T00:00:00.000Z',
      snapshot_json: '{not-json',
      schema_version: 1,
    });
    const good = buildCompletedGameRecord(makeCompletedPaired(), 'good');
    const repo = createCompletedGameRepository(store);
    await repo.saveCompletedGame(good);
    const listed = await repo.listCompletedGames();
    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe('good');
  });

  it('round-trips snapshot json', () => {
    const record = buildCompletedGameRecord(makeCompletedPaired(), 'cg-json');
    const parsed = parseCompletedGameSnapshot(
      serializeCompletedGameSnapshot(record),
    );
    expect(parsed).toEqual(record);
  });
});

describe('ensureCompletedGamePersisted', () => {
  beforeEach(() => {
    setCompletedGameRepositoryForTests(
      createCompletedGameRepository(createMemoryCompletedGameStore()),
    );
  });

  afterEach(() => {
    setCompletedGameRepositoryForTests(null);
  });

  it('saves once for a completed game and skips abandon', async () => {
    const game = makeCompletedPaired();
    const first = await ensureCompletedGamePersisted(game);
    expect(first.saved).toBe(true);
    expect(first.record).not.toBeNull();
    expect(first.game.completedGameRecordId).toBeTruthy();

    const second = await ensureCompletedGamePersisted(first.game);
    expect(second.saved).toBe(false);

    const abandoned = await ensureCompletedGamePersisted({
      ...game,
      status: 'abandoned',
      completedGameRecordId: undefined,
    });
    expect(abandoned.saved).toBe(false);
    expect(abandoned.record).toBeNull();
  });
});

describe('migrations version', () => {
  it('includes completed_games migration', () => {
    expect(LATEST_MIGRATION_VERSION).toBeGreaterThanOrEqual(2);
  });
});

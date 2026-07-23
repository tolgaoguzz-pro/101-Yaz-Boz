import { CompletedGameRecord } from '../domain/completedGame';
import { getDatabase, SqlDatabase } from './database';
import {
  COMPLETED_GAME_SNAPSHOT_SCHEMA_VERSION,
  parseCompletedGameSnapshot,
  serializeCompletedGameSnapshot,
} from './completedGameSnapshot';

export type CompletedGameRow = {
  id: string;
  matchup_key: string;
  game_mode: string;
  completed_at: string;
  snapshot_json: string;
  schema_version: number;
};

export type CompletedGameStore = {
  upsertRow(row: CompletedGameRow): Promise<void>;
  getRowById(id: string): Promise<CompletedGameRow | null>;
  listRows(): Promise<CompletedGameRow[]>;
  listRowsByMatchup(matchupKey: string): Promise<CompletedGameRow[]>;
  deleteRow(id: string): Promise<void>;
};

export function createSqliteCompletedGameStore(
  getDb: () => Promise<SqlDatabase> = getDatabase,
): CompletedGameStore {
  return {
    async upsertRow(row) {
      const db = await getDb();
      await db.runAsync(
        `INSERT INTO completed_games (
           id, matchup_key, game_mode, completed_at, snapshot_json, schema_version
         ) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           matchup_key = excluded.matchup_key,
           game_mode = excluded.game_mode,
           completed_at = excluded.completed_at,
           snapshot_json = excluded.snapshot_json,
           schema_version = excluded.schema_version`,
        row.id,
        row.matchup_key,
        row.game_mode,
        row.completed_at,
        row.snapshot_json,
        row.schema_version,
      );
    },
    async getRowById(id) {
      const db = await getDb();
      const row = await db.getFirstAsync<CompletedGameRow>(
        `SELECT id, matchup_key, game_mode, completed_at, snapshot_json, schema_version
         FROM completed_games
         WHERE id = ?`,
        id,
      );
      return row ?? null;
    },
    async listRows() {
      const db = await getDb();
      return db.getAllAsync<CompletedGameRow>(
        `SELECT id, matchup_key, game_mode, completed_at, snapshot_json, schema_version
         FROM completed_games
         ORDER BY completed_at DESC`,
      );
    },
    async listRowsByMatchup(matchupKey) {
      const db = await getDb();
      return db.getAllAsync<CompletedGameRow>(
        `SELECT id, matchup_key, game_mode, completed_at, snapshot_json, schema_version
         FROM completed_games
         WHERE matchup_key = ?
         ORDER BY completed_at DESC`,
        matchupKey,
      );
    },
    async deleteRow(id) {
      const db = await getDb();
      await db.runAsync('DELETE FROM completed_games WHERE id = ?', id);
    },
  };
}

export function createMemoryCompletedGameStore(): CompletedGameStore {
  const rows = new Map<string, CompletedGameRow>();
  return {
    async upsertRow(row) {
      rows.set(row.id, { ...row });
    },
    async getRowById(id) {
      return rows.get(id) ?? null;
    },
    async listRows() {
      return [...rows.values()].sort((a, b) =>
        b.completed_at.localeCompare(a.completed_at),
      );
    },
    async listRowsByMatchup(matchupKey) {
      return [...rows.values()]
        .filter((row) => row.matchup_key === matchupKey)
        .sort((a, b) => b.completed_at.localeCompare(a.completed_at));
    },
    async deleteRow(id) {
      rows.delete(id);
    },
  };
}

function rowToRecord(row: CompletedGameRow): CompletedGameRecord | null {
  if (
    typeof row.schema_version !== 'number' ||
    row.schema_version > COMPLETED_GAME_SNAPSHOT_SCHEMA_VERSION
  ) {
    console.warn(
      '[persistence] Unsupported completed_games schema_version; skipping.',
      row.schema_version,
    );
    return null;
  }
  return parseCompletedGameSnapshot(row.snapshot_json);
}

export type CompletedGameRepository = {
  saveCompletedGame(record: CompletedGameRecord): Promise<'inserted' | 'existing'>;
  hasCompletedGame(id: string): Promise<boolean>;
  getCompletedGameById(id: string): Promise<CompletedGameRecord | null>;
  listCompletedGames(): Promise<CompletedGameRecord[]>;
  listCompletedGamesByMatchup(
    matchupKey: string,
  ): Promise<CompletedGameRecord[]>;
  deleteCompletedGame(id: string): Promise<void>;
};

export function createCompletedGameRepository(
  store: CompletedGameStore,
): CompletedGameRepository {
  return {
    async hasCompletedGame(id) {
      const row = await store.getRowById(id);
      return row != null;
    },

    async saveCompletedGame(record) {
      const existing = await store.getRowById(record.id);
      if (existing) {
        return 'existing';
      }
      await store.upsertRow({
        id: record.id,
        matchup_key: record.matchupKey,
        game_mode: record.gameMode,
        completed_at: record.completedAt,
        snapshot_json: serializeCompletedGameSnapshot(record),
        schema_version: COMPLETED_GAME_SNAPSHOT_SCHEMA_VERSION,
      });
      return 'inserted';
    },

    async getCompletedGameById(id) {
      try {
        const row = await store.getRowById(id);
        if (!row) {
          return null;
        }
        return rowToRecord(row);
      } catch (error) {
        console.warn('[persistence] getCompletedGameById failed', error);
        return null;
      }
    },

    async listCompletedGames() {
      try {
        const rows = await store.listRows();
        const records: CompletedGameRecord[] = [];
        for (const row of rows) {
          const record = rowToRecord(row);
          if (record) {
            records.push(record);
          }
        }
        return records;
      } catch (error) {
        console.warn('[persistence] listCompletedGames failed', error);
        return [];
      }
    },

    async listCompletedGamesByMatchup(matchupKey) {
      try {
        const rows = await store.listRowsByMatchup(matchupKey);
        const records: CompletedGameRecord[] = [];
        for (const row of rows) {
          const record = rowToRecord(row);
          if (record) {
            records.push(record);
          }
        }
        return records;
      } catch (error) {
        console.warn(
          '[persistence] listCompletedGamesByMatchup failed',
          error,
        );
        return [];
      }
    },

    async deleteCompletedGame(id) {
      await store.deleteRow(id);
    },
  };
}

const defaultRepository = createCompletedGameRepository(
  createSqliteCompletedGameStore(),
);

let repositoryOverride: CompletedGameRepository | null = null;

export function getCompletedGameRepository(): CompletedGameRepository {
  return repositoryOverride ?? defaultRepository;
}

export function setCompletedGameRepositoryForTests(
  repository: CompletedGameRepository | null,
) {
  repositoryOverride = repository;
}

export async function saveCompletedGame(
  record: CompletedGameRecord,
): Promise<'inserted' | 'existing'> {
  return getCompletedGameRepository().saveCompletedGame(record);
}

export async function hasCompletedGame(id: string): Promise<boolean> {
  return getCompletedGameRepository().hasCompletedGame(id);
}

export async function getCompletedGameById(
  id: string,
): Promise<CompletedGameRecord | null> {
  return getCompletedGameRepository().getCompletedGameById(id);
}

export async function listCompletedGames(): Promise<CompletedGameRecord[]> {
  return getCompletedGameRepository().listCompletedGames();
}

export async function listCompletedGamesByMatchup(
  matchupKey: string,
): Promise<CompletedGameRecord[]> {
  return getCompletedGameRepository().listCompletedGamesByMatchup(matchupKey);
}

export async function deleteCompletedGame(id: string): Promise<void> {
  return getCompletedGameRepository().deleteCompletedGame(id);
}

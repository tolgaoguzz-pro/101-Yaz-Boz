import { ActiveGameData } from '../ui/screens/ActiveGameScreen';
import { getDatabase, SqlDatabase } from './database';
import {
  isContinuableActiveGame,
  parseActiveGameSnapshot,
  serializeActiveGameSnapshot,
} from './activeGameSnapshot';
import { ACTIVE_GAME_SNAPSHOT_SCHEMA_VERSION } from './schema';

export type ActiveGameRow = {
  id: number;
  schema_version: number;
  updated_at: string;
  snapshot_json: string;
};

/**
 * Test edilebilir depolama yüzeyi. Üretimde SQLite, testte bellek.
 */
export type ActiveGameStore = {
  readRow(): Promise<ActiveGameRow | null>;
  writeRow(row: Omit<ActiveGameRow, 'id'>): Promise<void>;
  deleteRow(): Promise<void>;
};

export function createSqliteActiveGameStore(
  getDb: () => Promise<SqlDatabase> = getDatabase,
): ActiveGameStore {
  return {
    async readRow() {
      const db = await getDb();
      const row = await db.getFirstAsync<ActiveGameRow>(
        `SELECT id, schema_version, updated_at, snapshot_json
         FROM active_game
         WHERE id = 1`,
      );
      return row ?? null;
    },
    async writeRow(row) {
      const db = await getDb();
      await db.runAsync(
        `INSERT INTO active_game (id, schema_version, updated_at, snapshot_json)
         VALUES (1, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           schema_version = excluded.schema_version,
           updated_at = excluded.updated_at,
           snapshot_json = excluded.snapshot_json`,
        row.schema_version,
        row.updated_at,
        row.snapshot_json,
      );
    },
    async deleteRow() {
      const db = await getDb();
      await db.runAsync('DELETE FROM active_game WHERE id = 1');
    },
  };
}

export function createMemoryActiveGameStore(): ActiveGameStore {
  let memory: ActiveGameRow | null = null;
  return {
    async readRow() {
      return memory;
    },
    async writeRow(row) {
      memory = { id: 1, ...row };
    },
    async deleteRow() {
      memory = null;
    },
  };
}

export type ActiveGameRepository = {
  loadActiveGame(): Promise<ActiveGameData | null>;
  saveActiveGame(game: ActiveGameData): Promise<void>;
  clearActiveGame(): Promise<void>;
};

export function createActiveGameRepository(
  store: ActiveGameStore,
): ActiveGameRepository {
  return {
    async loadActiveGame() {
      try {
        const row = await store.readRow();
        if (!row) {
          return null;
        }

        if (
          typeof row.schema_version !== 'number' ||
          row.schema_version > ACTIVE_GAME_SNAPSHOT_SCHEMA_VERSION
        ) {
          console.warn(
            '[persistence] Unsupported active_game schema_version; clearing.',
            row.schema_version,
          );
          await store.deleteRow();
          return null;
        }

        const game = parseActiveGameSnapshot(row.snapshot_json);
        if (!game) {
          console.warn(
            '[persistence] Corrupt active_game snapshot; clearing.',
          );
          await store.deleteRow();
          return null;
        }

        if (!isContinuableActiveGame(game)) {
          console.warn(
            '[persistence] Completed game found in active_game; clearing.',
          );
          await store.deleteRow();
          return null;
        }

        return game;
      } catch (error) {
        console.warn('[persistence] loadActiveGame failed', error);
        try {
          await store.deleteRow();
        } catch {
          // ignore secondary failure
        }
        return null;
      }
    },

    async saveActiveGame(game) {
      if (!isContinuableActiveGame(game)) {
        await store.deleteRow();
        return;
      }

      await store.writeRow({
        schema_version: ACTIVE_GAME_SNAPSHOT_SCHEMA_VERSION,
        updated_at: new Date().toISOString(),
        snapshot_json: serializeActiveGameSnapshot(game),
      });
    },

    async clearActiveGame() {
      await store.deleteRow();
    },
  };
}

const defaultRepository = createActiveGameRepository(
  createSqliteActiveGameStore(),
);

let repositoryOverride: ActiveGameRepository | null = null;

export function getActiveGameRepository(): ActiveGameRepository {
  return repositoryOverride ?? defaultRepository;
}

export function setActiveGameRepositoryForTests(
  repository: ActiveGameRepository | null,
) {
  repositoryOverride = repository;
}

export async function loadActiveGame(): Promise<ActiveGameData | null> {
  return getActiveGameRepository().loadActiveGame();
}

export async function saveActiveGame(game: ActiveGameData): Promise<void> {
  return getActiveGameRepository().saveActiveGame(game);
}

export async function clearActiveGame(): Promise<void> {
  return getActiveGameRepository().clearActiveGame();
}

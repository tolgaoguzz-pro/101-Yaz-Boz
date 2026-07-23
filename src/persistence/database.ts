import type { SQLiteDatabase } from 'expo-sqlite';

import { buildMigrationSql, LATEST_MIGRATION_VERSION } from './migrations';
import { DATABASE_NAME } from './schema';

export type SqlDatabase = Pick<
  SQLiteDatabase,
  'execAsync' | 'runAsync' | 'getFirstAsync'
>;

type DatabaseModule = {
  openDatabaseAsync: (
    name: string,
    options?: { useNewConnection?: boolean },
  ) => Promise<SQLiteDatabase>;
};

let databasePromise: Promise<SqlDatabase> | null = null;
let databaseModule: DatabaseModule | null = null;

export function setDatabaseModuleForTests(module: DatabaseModule | null) {
  databaseModule = module;
  databasePromise = null;
}

export function resetDatabaseSingletonForTests() {
  databasePromise = null;
}

async function resolveDatabaseModule(): Promise<DatabaseModule> {
  if (databaseModule) {
    return databaseModule;
  }
  const sqlite = await import('expo-sqlite');
  return sqlite;
}

export async function runMigrations(db: SqlDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= LATEST_MIGRATION_VERSION) {
    return;
  }

  const sql = buildMigrationSql(currentVersion);
  if (sql.length > 0) {
    await db.execAsync(sql);
  }
  await db.execAsync(`PRAGMA user_version = ${LATEST_MIGRATION_VERSION}`);
}

export async function getDatabase(): Promise<SqlDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const sqlite = await resolveDatabaseModule();
      const db = await sqlite.openDatabaseAsync(DATABASE_NAME, {
        useNewConnection: true,
      });
      await runMigrations(db);
      return db;
    })();
  }
  return databasePromise;
}

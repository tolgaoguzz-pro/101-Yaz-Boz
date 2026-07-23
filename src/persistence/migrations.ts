import { ACTIVE_GAME_SNAPSHOT_SCHEMA_VERSION } from './schema';

export type Migration = {
  version: number;
  sql: string;
};

/**
 * Sıralı migrasyonlar. version = PRAGMA user_version hedefi.
 */
export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    sql: `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS active_game (
  id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
  schema_version INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  snapshot_json TEXT NOT NULL
);
`,
  },
];

export const LATEST_MIGRATION_VERSION =
  MIGRATIONS.length > 0
    ? MIGRATIONS[MIGRATIONS.length - 1].version
    : 0;

export function buildMigrationSql(fromVersion: number): string {
  return MIGRATIONS.filter((migration) => migration.version > fromVersion)
    .map((migration) => migration.sql.trim())
    .join('\n');
}

export { ACTIVE_GAME_SNAPSHOT_SCHEMA_VERSION };

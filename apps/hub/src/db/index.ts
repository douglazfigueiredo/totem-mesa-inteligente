import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate as drizzleMigrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema.js';

export type DBClient = ReturnType<typeof drizzle<typeof schema>>;

export type CreateDBOptions = {
  path: string;
  readonly?: boolean;
  applyMigrations?: boolean;
  migrationsFolder?: string;
};

export const createDB = (opts: CreateDBOptions): { db: DBClient; close: () => void } => {
  const sqlite = new Database(opts.path, { readonly: opts.readonly ?? false });
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('busy_timeout = 5000');

  const db = drizzle(sqlite, { schema });

  if (opts.applyMigrations !== false) {
    const folder = opts.migrationsFolder ?? new URL('./migrations', import.meta.url).pathname;
    drizzleMigrate(db, { migrationsFolder: folder });
  }

  return {
    db,
    close: () => sqlite.close(),
  };
};

export { schema };

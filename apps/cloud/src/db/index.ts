import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  // eslint-disable-next-line no-var
  var __cloud_db__: DrizzleDB | undefined;
}

/**
 * Durante `next build` o módulo é avaliado mesmo sem DATABASE_URL set
 * (Next coleta tipos/metadata das rotas). O Neon `neon()` é http-lazy
 * e não conecta até a primeira query — então passamos uma URL placeholder
 * pro build não quebrar e queries reais falham com erro claro se a env
 * não estiver configurada.
 */
const BUILD_PLACEHOLDER = 'postgresql://build:build@localhost:5432/build';

const url = process.env.DATABASE_URL ?? BUILD_PLACEHOLDER;

export const db: DrizzleDB = globalThis.__cloud_db__ ?? drizzle(neon(url), { schema });

if (process.env.NODE_ENV !== 'production') globalThis.__cloud_db__ = db;

export type DB = DrizzleDB;
export { schema };

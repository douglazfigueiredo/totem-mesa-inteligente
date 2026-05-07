import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

const main = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL é obrigatório (veja .env.example)');
  }
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log('[cloud] aplicando migrations…');
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  console.log('[cloud] ✓ migrations aplicadas');
};

main().catch((err) => {
  console.error('[cloud] migration falhou:', err);
  process.exit(1);
});

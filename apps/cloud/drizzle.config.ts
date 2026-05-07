import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Carrega .env.local (convenção Next) primeiro, depois .env como fallback
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL é obrigatório (veja .env.example)');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dbCredentials: { url: process.env.DATABASE_URL },
  strict: true,
  verbose: true,
});

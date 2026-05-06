import { createDB } from './index.js';

const path = process.env.DATABASE_PATH ?? './data/hub.db';

const { close } = createDB({ path, applyMigrations: true });
close();

console.log(`[migrate] applied to ${path}`);

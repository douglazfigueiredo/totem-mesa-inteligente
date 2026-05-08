import { mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';

type LoggerLike = {
  info: (obj: object, msg?: string) => void;
  warn: (obj: object, msg?: string) => void;
  error: (obj: object, msg?: string) => void;
};

export type BackupWorkerOptions = {
  /** Caminho do .db de origem (ex: /data/hub.db) */
  dbPath: string;
  /** Função que faz o backup online (vem do createDB) */
  backup: (destPath: string) => Promise<void>;
  /** Pasta destino. Default: <dbPath>/../backups */
  backupDir?: string;
  /** Intervalo entre snapshots. Default: 24h */
  intervalMs?: number;
  /** Backups mantidos. Default: 7 */
  keep?: number;
  logger?: LoggerLike;
};

export type BackupHandle = {
  stop: () => Promise<void>;
  tick: () => Promise<void>;
};

const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_KEEP = 7;

const ymd = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
};

export const startBackupWorker = (opts: BackupWorkerOptions): BackupHandle => {
  const interval = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
  const keep = opts.keep ?? DEFAULT_KEEP;
  const dir = opts.backupDir ?? join(dirname(opts.dbPath), 'backups');
  mkdirSync(dir, { recursive: true });

  let stopped = false;
  let timer: NodeJS.Timeout | null = null;

  const tick = async (): Promise<void> => {
    if (stopped) return;
    const dest = join(dir, `hub-${ymd(new Date())}.db`);
    try {
      await opts.backup(dest);
      opts.logger?.info({ dest }, '[backup] snapshot criado');
    } catch (err) {
      opts.logger?.error(
        { dest, error: err instanceof Error ? err.message : String(err) },
        '[backup] falha',
      );
      return;
    }

    // Rotação: mantém os `keep` mais recentes
    try {
      const files = readdirSync(dir)
        .filter((f) => f.startsWith('hub-') && f.endsWith('.db'))
        .map((f) => ({ name: f, mtime: statSync(join(dir, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);
      const toDelete = files.slice(keep);
      for (const f of toDelete) {
        unlinkSync(join(dir, f.name));
        opts.logger?.info({ removed: f.name }, '[backup] rotacionado');
      }
    } catch (err) {
      opts.logger?.warn(
        { error: err instanceof Error ? err.message : String(err) },
        '[backup] rotação falhou',
      );
    }
  };

  // Primeira execução após 60s pra não congestionar boot
  const firstDelay = Math.min(60_000, interval);
  timer = setTimeout(async function loop() {
    await tick();
    if (stopped) return;
    timer = setTimeout(loop, interval);
  }, firstDelay);

  return {
    tick,
    async stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
};

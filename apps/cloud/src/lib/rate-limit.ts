import 'server-only';

/**
 * Rate limit in-memory por chave (IP, apiKey, etc). Funciona bem em
 * single-instance ou edge functions com poucos starts paralelos —
 * cada lambda tem seu próprio counter, mas ataques de bruteforce em
 * volume são detectados de qualquer forma porque o intervalo de
 * janela é curto. Pra escala maior, trocar por @upstash/ratelimit
 * sem mudar essa interface.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

let cleanupTimer: NodeJS.Timeout | null = null;
const ensureCleanup = () => {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
  }, 60_000);
  if (typeof cleanupTimer.unref === 'function') cleanupTimer.unref();
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
};

export function rateLimit(opts: {
  key: string;
  windowMs: number;
  max: number;
}): RateLimitResult {
  ensureCleanup();
  const now = Date.now();
  const existing = buckets.get(opts.key);

  if (!existing || existing.resetAt < now) {
    buckets.set(opts.key, { count: 1, resetAt: now + opts.windowMs });
    return {
      allowed: true,
      remaining: opts.max - 1,
      resetAt: now + opts.windowMs,
      retryAfterMs: 0,
    };
  }

  if (existing.count >= opts.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterMs: existing.resetAt - now,
    };
  }

  existing.count++;
  return {
    allowed: true,
    remaining: opts.max - existing.count,
    resetAt: existing.resetAt,
    retryAfterMs: 0,
  };
}

/** Extrai IP do request usando headers do Vercel/proxy. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

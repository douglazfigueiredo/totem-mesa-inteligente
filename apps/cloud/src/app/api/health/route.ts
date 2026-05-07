import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json(
      {
        status: 'ok',
        service: 'cloud',
        timestamp: Date.now(),
        db: { latencyMs: Date.now() - start, ok: true },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        service: 'cloud',
        timestamp: Date.now(),
        db: {
          latencyMs: Date.now() - start,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        },
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

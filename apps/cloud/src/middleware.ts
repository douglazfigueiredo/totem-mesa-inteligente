import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Stub de middleware — Fase 6A não tem auth ativa ainda.
 *
 * Na Fase 6B vai validar sessão NextAuth e redirect /admin → /login
 * quando não autenticado.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/t/:path*'],
};

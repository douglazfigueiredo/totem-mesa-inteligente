import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIES = ['authjs.session-token', '__Secure-authjs.session-token'];

export function middleware(req: NextRequest) {
  // E2E bypass — só ativa fora de produção. Permite Playwright pular
  // o gating de cookie e bater direto em /admin/*.
  if (process.env.E2E_BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  const hasSession = SESSION_COOKIES.some((name) => req.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const url = new URL('/login', req.url);
  const target = req.nextUrl.pathname + req.nextUrl.search;
  if (target && target !== '/') url.searchParams.set('callbackUrl', target);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*', '/t/:path*'],
};

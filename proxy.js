import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/register'];
const SESSION_COOKIE_NAME = 'qip_session';

export function proxy(request) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname.startsWith('/api/auth/me')
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!hasSession && !isPublic) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (hasSession && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*).*)'],
};

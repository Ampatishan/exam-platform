import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req) => {
  const { nextUrl, auth: session } = req as any;
  const pathname = nextUrl.pathname;

  const isLoggedIn = !!session;
  const role = session?.user?.role;
  const mustChange = session?.user?.mustChangePassword;

  // Public paths
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Unauthenticated → login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // Force password change — allow the change-password API through too
  if (mustChange && !pathname.startsWith('/change-password') && pathname !== '/api/users/change-password') {
    return NextResponse.redirect(new URL('/change-password', nextUrl));
  }

  // Role guards
  if (pathname.startsWith('/teacher') && role !== 'TEACHER') {
    return new NextResponse(null, { status: 403 });
  }
  if (pathname.startsWith('/student') && role !== 'STUDENT') {
    return new NextResponse(null, { status: 403 });
  }

  // API role guards
  if (pathname.startsWith('/api/users') && pathname !== '/api/users/change-password' && role !== 'TEACHER') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }
  if (pathname.startsWith('/api/grading') && role !== 'TEACHER') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }
  if (pathname.startsWith('/api/analytics/teacher') && role !== 'TEACHER') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

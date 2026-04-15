import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// Fail-closed: empty string means isOwner never matches if env var is unset.
const OWNER_EMAIL = process.env.OWNER_EMAIL?.toLowerCase() ?? '';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll:  () => request.cookies.getAll(),
        setAll: (pairs) =>
          pairs.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          ),
      },
    },
  );

  // getUser() validates against Supabase Auth — not just a JWT decode
  const { data: { user } } = await sb.auth.getUser();

  // /admin/* — owner email only
  if (pathname.startsWith('/admin')) {
    if (!user || user.email?.toLowerCase() !== OWNER_EMAIL) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  }

  // /dashboard/* — must be signed in
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};

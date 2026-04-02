import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require LP or admin authentication
const PROTECTED_PAGE_ROUTES = ['/dashboard', '/documents', '/chat']
const ADMIN_PAGE_ROUTES = ['/admin']
const PUBLIC_ROUTES = ['/login', '/auth/verify', '/admin/login']
const PUBLIC_API_ROUTES = ['/api/auth/magic-link', '/api/auth/verify', '/api/auth/admin']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionToken = request.cookies.get('session')?.value
  const adminSession = request.cookies.get('admin_session')?.value

  // Public routes - allow through
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Public API routes - allow through
  if (PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Admin pages (except /admin/login)
  if (ADMIN_PAGE_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // Protected LP pages
  if (PROTECTED_PAGE_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Protected API routes
  if (pathname.startsWith('/api/')) {
    if (!sessionToken && !adminSession) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|placeholder-logo.svg).*)',
  ],
}

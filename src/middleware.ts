import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { UserRole } from '@/types';
import { generateCSRFToken, setCSRFToken } from '@/lib/api-security';

// Define protected routes and their required roles
const protectedRoutes = [
  { path: '/dashboard', roles: ['ADMIN', 'SOLUTIONS_ARCHITECT', 'SALES_DIRECTOR'] },
  { path: '/deals', roles: ['ADMIN', 'SOLUTIONS_ARCHITECT', 'SALES_DIRECTOR'] },
  { path: '/admin', roles: ['ADMIN'] },
  { path: '/api/deals', roles: ['ADMIN', 'SOLUTIONS_ARCHITECT', 'SALES_DIRECTOR'] },
  { path: '/api/tasks', roles: ['ADMIN', 'SOLUTIONS_ARCHITECT', 'SALES_DIRECTOR'] },
  { path: '/api/admin', roles: ['ADMIN'] },
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('Middleware running for:', pathname);
  
  // Handle API routes with CSRF token generation
  if (pathname.startsWith('/api/')) {
    console.log('API route, checking CSRF token:', pathname);
    const response = NextResponse.next();
    
    // Only generate CSRF token if it doesn't exist
    const existingToken = request.cookies.get('csrf-token')?.value;
    if (!existingToken) {
      console.log('No existing CSRF token, generating new one');
      setCSRFToken(response);
    } else {
      console.log('Using existing CSRF token');
      // Pass through the existing token in headers
      response.headers.set('x-csrf-token', existingToken);
    }
    
    return response;
  }
  
  // Check if the current path is protected
  const protectedRoute = protectedRoutes.find(route => 
    pathname.startsWith(route.path)
  );

  if (!protectedRoute) {
    return NextResponse.next();
  }

  // For now, let the dashboard, deals, and admin load and handle auth on the client side
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/deals') || pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/deals/:path*',
    '/admin/:path*',
    '/api/:path*',
  ],
};

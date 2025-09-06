import { NextRequest, NextResponse } from 'next/server';
import { validateApiSecurity, generateCSRFToken, setCSRFToken } from './api-security';

type ApiHandler = (request: NextRequest, context?: any) => Promise<NextResponse>;

export function withApiSecurity(handler: ApiHandler) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    // Apply security validation
    const securityResponse = validateApiSecurity(request);
    if (securityResponse) {
      return securityResponse;
    }

    // Generate CSRF token for GET requests (to be used by client)
    if (request.method === 'GET') {
      const response = await handler(request, context);
      const csrfToken = generateCSRFToken();
      setCSRFToken(response, csrfToken);
      response.headers.set('x-csrf-token', csrfToken);
      return response;
    }

    // For other methods, proceed with the handler
    return handler(request, context);
  };
}

// Special handler for authentication endpoints that need different security
export function withAuthApiSecurity(handler: ApiHandler) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    // Apply basic security validation (no CSRF for auth endpoints)
    const origin = request.headers.get('origin');
    const userAgent = request.headers.get('user-agent');
    
    // Allow only browser requests
    if (userAgent && !userAgent.includes('Mozilla') && !userAgent.includes('Chrome') && !userAgent.includes('Safari')) {
      return NextResponse.json(
        { error: 'Access denied: Invalid user agent' },
        { status: 403 }
      );
    }

    // Allow only same-origin requests
    if (origin && !origin.startsWith('http://localhost:') && !origin.includes('yourdomain.com')) {
      return NextResponse.json(
        { error: 'Access denied: Invalid origin' },
        { status: 403 }
      );
    }

    return handler(request, context);
  };
}

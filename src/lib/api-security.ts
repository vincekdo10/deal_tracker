import { NextRequest, NextResponse } from 'next/server';

interface SecurityConfig {
  allowedOrigins: string[];
  allowedUserAgents: string[];
  maxRequestsPerMinute: number;
  requireCSRF: boolean;
}

const securityConfig: SecurityConfig = {
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    // Add your production domain here
    // 'https://yourdomain.com'
  ],
  allowedUserAgents: [
    // Allow browser user agents
    /Mozilla\/.*/,
    /Chrome\/.*/,
    /Safari\/.*/,
    /Firefox\/.*/,
    /Edge\/.*/,
    // Allow Next.js internal requests
    /Next\.js/,
  ],
  maxRequestsPerMinute: 60,
  requireCSRF: true
};

// In-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function validateApiSecurity(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  const userAgent = request.headers.get('user-agent');
  const referer = request.headers.get('referer');
  const clientIP = getClientIP(request);
  
  // 1. Origin Validation
  if (origin && !securityConfig.allowedOrigins.includes(origin)) {
    console.warn(`🚫 Blocked request from disallowed origin: ${origin}`);
    return NextResponse.json(
      { error: 'Access denied: Invalid origin' },
      { status: 403 }
    );
  }

  // 2. User-Agent Validation
  if (userAgent && !securityConfig.allowedUserAgents.some(pattern => 
    typeof pattern === 'string' ? userAgent.includes(pattern) : pattern.test(userAgent)
  )) {
    console.warn(`🚫 Blocked request with suspicious user agent: ${userAgent}`);
    return NextResponse.json(
      { error: 'Access denied: Invalid user agent' },
      { status: 403 }
    );
  }

  // 3. Referer Validation (for same-origin requests)
  if (referer && !securityConfig.allowedOrigins.some(allowedOrigin => 
    referer.startsWith(allowedOrigin)
  )) {
    console.warn(`🚫 Blocked request with invalid referer: ${referer}`);
    return NextResponse.json(
      { error: 'Access denied: Invalid referer' },
      { status: 403 }
    );
  }

  // 4. Rate Limiting
  if (clientIP) {
    const now = Date.now();
    const rateLimitKey = `rate_limit_${clientIP}`;
    const rateLimitData = rateLimitMap.get(rateLimitKey);
    
    if (rateLimitData) {
      if (now < rateLimitData.resetTime) {
        if (rateLimitData.count >= securityConfig.maxRequestsPerMinute) {
          console.warn(`🚫 Rate limit exceeded for IP: ${clientIP}`);
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
          );
        }
        rateLimitData.count++;
      } else {
        // Reset counter
        rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + 60000 });
      }
    } else {
      rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + 60000 });
    }
  }

  // 5. CSRF Protection (for state-changing requests)
  if (request.method !== 'GET' && securityConfig.requireCSRF) {
    const csrfToken = request.headers.get('x-csrf-token');
    const cookieCSRFToken = request.cookies.get('csrf-token')?.value;
    
    if (!csrfToken || !cookieCSRFToken || csrfToken !== cookieCSRFToken) {
      console.warn(`🚫 Blocked request without valid CSRF token`);
      return NextResponse.json(
        { error: 'Access denied: Invalid CSRF token' },
        { status: 403 }
      );
    }
  }

  // 6. Content-Type Validation for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`🚫 Blocked request with invalid content type: ${contentType}`);
      return NextResponse.json(
        { error: 'Access denied: Invalid content type' },
        { status: 400 }
      );
    }
  }

  // 7. Block common attack patterns
  const url = request.url.toLowerCase();
  const suspiciousPatterns = [
    'union select',
    'drop table',
    'delete from',
    'insert into',
    'update set',
    'script>',
    '<script',
    'javascript:',
    'data:text/html',
    'vbscript:',
    'onload=',
    'onerror=',
    'onclick=',
    'eval(',
    'alert(',
    'confirm(',
    'prompt(',
  ];

  for (const pattern of suspiciousPatterns) {
    if (url.includes(pattern)) {
      console.warn(`🚫 Blocked request with suspicious pattern: ${pattern}`);
      return NextResponse.json(
        { error: 'Access denied: Suspicious request pattern' },
        { status: 403 }
      );
    }
  }

  return null; // Request is safe
}

function getClientIP(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return null;
}

export function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function setCSRFToken(response: NextResponse, token?: string): void {
  const csrfToken = token || generateCSRFToken();
  response.cookies.set('csrf-token', csrfToken, {
    httpOnly: false, // Allow JavaScript to read for CSRF protection
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600 // 1 hour
  });
  response.headers.set('x-csrf-token', csrfToken);
}

// Clean up rate limit data periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitMap.entries()) {
    if (now >= data.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Clean up every minute

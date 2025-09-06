import { NextRequest, NextResponse } from 'next/server';
import { withAuthApiSecurity } from '@/lib/secure-api';

export const POST = withAuthApiSecurity(async (request: NextRequest) => {

  const response = NextResponse.json({ message: 'Logged out successfully' });
  
  // Clear the auth token cookie
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  });

  return response;

});

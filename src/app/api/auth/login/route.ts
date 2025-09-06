import { NextRequest, NextResponse } from 'next/server';
import { mockSnowflakeAuth, appAuth, generateToken } from '@/lib/auth';
import { LoginRequest } from '@/types';
import { withAuthApiSecurity } from '@/lib/secure-api';

export const POST = withAuthApiSecurity(async (request: NextRequest) => {
  try {
    const body: LoginRequest = await request.json();
    const { email, password, authType } = body;

    if (!email || !authType) {
      return NextResponse.json(
        { error: 'Email and auth type are required' },
        { status: 400 }
      );
    }

    let user = null;

    if (authType === 'SNOWFLAKE') {
      // Mock Snowflake authentication
      user = await mockSnowflakeAuth(email);
    } else if (authType === 'APP') {
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required for app authentication' },
          { status: 400 }
        );
      }
      user = await appAuth(email, password);
    } else {
      return NextResponse.json(
        { error: 'Invalid authentication type' },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      );
    }

    const token = generateToken(user);

    // Set HTTP-only cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        authType: user.authType,
      },
      token,
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, canManageUsers } from '@/lib/auth';
import { db } from '@/services/database';
import { withApiSecurity } from '@/lib/secure-api';

export const GET = withApiSecurity(async (request: NextRequest) => {

  try {
    const userPayload = getUserFromRequest(request);
    
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!canManageUsers(userPayload.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const users = await db.getAllUsers();
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = async (request: NextRequest) => {

  try {
    const userPayload = getUserFromRequest(request);
    
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!canManageUsers(userPayload.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, email, role, authType, password, isActive } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !role || !authType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate password for APP users
    if (authType === 'APP' && (!password || password.length < 8)) {
      return NextResponse.json(
        { error: 'Password is required for APP users and must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const userData = {
      firstName,
      lastName,
      email,
      role,
      authType,
      isActive: isActive !== false,
      ...(authType === 'APP' && password && { password })
    };

    const newUser = await db.createUser(userData);
    
    return NextResponse.json({ 
      user: newUser,
      temporaryPassword: authType === 'APP' ? password : null // Return password to admin
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

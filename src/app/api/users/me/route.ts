import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/services/database';
import { withApiSecurity } from '@/lib/secure-api';

export const GET = withApiSecurity(async (request: NextRequest) => {

  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await db.getUserById(userPayload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

});

export const PUT = withApiSecurity(async (request: NextRequest) => {

  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, email } = body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await db.getUserByEmail(email);
      if (existingUser && existingUser.id !== userPayload.userId) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
    }

    const updatedUser = await db.updateUser(userPayload.userId, {
      firstName,
      lastName,
      email,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

});

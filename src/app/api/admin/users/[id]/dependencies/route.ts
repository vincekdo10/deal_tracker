import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, canManageUsers } from '@/lib/auth';
import { db } from '@/services/database';
import { withApiSecurity } from '@/lib/secure-api';

export const GET = withApiSecurity(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
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

    const { id } = await params;
    
    // Check if user exists
    const user = await db.getUserById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user dependencies
    const dependencies = await db.getUserDependencies(id);
    
    return NextResponse.json({ 
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      dependencies
    });
  } catch (error) {
    console.error('Get user dependencies error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

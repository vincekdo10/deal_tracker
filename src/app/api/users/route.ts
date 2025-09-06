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

    // Allow admins, solutions architects, and sales directors to get users
    if (!['ADMIN', 'SOLUTIONS_ARCHITECT', 'SALES_DIRECTOR'].includes(userPayload.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const users = await db.getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

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

    const teams = await db.getUserTeams(userPayload.userId);
    return NextResponse.json({ teams });
  } catch (error) {
    console.error('Get user teams error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

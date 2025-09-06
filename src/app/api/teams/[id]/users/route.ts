import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/services/database';
import { withApiSecurity } from '@/lib/secure-api';

export const GET = withApiSecurity(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const users = await db.getUsersByTeam(id);
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get team users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

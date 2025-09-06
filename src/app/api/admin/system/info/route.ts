import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, canManageUsers } from '@/lib/auth';
import { db } from '@/services/database';
import fs from 'fs';
import path from 'path';
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

    // Get database info for Snowflake
    // This would need to be implemented with Snowflake-specific queries
    const dbSize = 'N/A'; // Placeholder - would need Snowflake query to get actual size
    const dbStatus = 'healthy' as const; // Placeholder - would need Snowflake health check

    // Get system uptime (simplified)
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const uptimeString = `${hours}h ${minutes}m`;

    // Get storage info (simplified)
    const storageUsed = '2.5 GB';
    const storageTotal = '10 GB';
    const storagePercentage = 25;

    const systemInfo = {
      database: {
        type: 'Snowflake',
        size: dbSize,
        status: dbStatus,
        lastBackup: 'N/A'
      },
      api: {
        version: '1.0.0',
        uptime: uptimeString,
        status: 'healthy' as const
      },
      storage: {
        used: storageUsed,
        total: storageTotal,
        percentage: storagePercentage
      }
    };

    return NextResponse.json({ systemInfo });
  } catch (error) {
    console.error('Get system info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

});

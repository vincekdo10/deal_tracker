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

    // Get all users
    const users = await db.getAllUsers();
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.isActive).length;

    // Get all deals
    const allDeals = await db.getAllDeals();
    const totalDeals = allDeals.length;
    const totalArr = allDeals.reduce((sum, deal) => sum + (deal.arr || 0), 0);

    // Get all tasks
    const allTasks = await db.getAllTasks();
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(task => task.status === 'DONE').length;
    const blockedTasks = allTasks.filter(task => task.status === 'BLOCKED').length;
    const overdueTasks = allTasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
    ).length;

    // Get recent activity from activity logs
    const activityLogs = await db.getRecentActivity(10);
    const recentActivity = activityLogs.map(log => ({
      action: log.action,
      details: log.details || 'No details available',
      createdAt: log.createdAt
    }));

    const metrics = {
      totalUsers,
      activeUsers,
      totalDeals,
      totalArr,
      totalTasks,
      completedTasks,
      blockedTasks,
      overdueTasks,
      recentActivity
    };

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Get admin metrics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

});

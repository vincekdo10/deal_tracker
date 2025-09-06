import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, canManageUsers } from '@/lib/auth';
import { db } from '@/services/database';
import { withApiSecurity } from '@/lib/secure-api';

export const PUT = withApiSecurity(async (
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
    const body = await request.json();
    const updatedUser = await db.updateUser(id, body);
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const DELETE = withApiSecurity(async (
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

    // Prevent deleting the current user
    if (userPayload.userId === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Get user dependencies to show what will be affected
    const dependencies = await db.getUserDependencies(id);
    
    // Parse query parameters for deletion options
    const url = new URL(request.url);
    const reassignTo = url.searchParams.get('reassignTo');
    const softDelete = url.searchParams.get('softDelete') === 'true';
    
    let success: boolean;
    let message: string;

    if (softDelete) {
      // Soft delete (deactivate user)
      success = await db.softDeleteUser(id);
      message = 'User deactivated successfully';
    } else if (reassignTo) {
      // Hard delete with reassignment
      const reassignUser = await db.getUserById(reassignTo);
      if (!reassignUser) {
        return NextResponse.json(
          { error: 'Reassignment user not found' },
          { status: 400 }
        );
      }
      
      success = await db.deleteUser(id, reassignTo);
      message = `User deleted successfully. Data reassigned to ${reassignUser.firstName} ${reassignUser.lastName}`;
    } else {
      // Hard delete without reassignment
      success = await db.deleteUser(id);
      message = 'User deleted successfully';
    }
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message,
      dependencies: softDelete ? null : dependencies // Only show dependencies for hard delete
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

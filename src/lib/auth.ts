import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { User, UserRole } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Also check cookies
  const token = request.cookies.get('auth-token')?.value;
  return token || null;
}

export function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  
  return verifyToken(token);
}

// Mock Snowflake authentication (for development)
export async function mockSnowflakeAuth(email: string): Promise<User | null> {
  // In a real implementation, this would call Snowflake's SSO API
  // For now, we'll just check if the user exists and has SNOWFLAKE auth type
  const { db } = await import('@/services/database');
  const user = await db.getUserByEmail(email);
  
  if (user && user.authType === 'SNOWFLAKE' && user.isActive) {
    return user;
  }
  
  return null;
}

// App authentication with password
export async function appAuth(email: string, password: string): Promise<User | null> {
  const { db } = await import('@/services/database');
  const user = await db.getUserByEmail(email);
  
  if (user && user.authType === 'APP' && user.passwordHash && user.isActive) {
    const isValid = await db.comparePassword(password, user.passwordHash);
    if (isValid) {
      return user;
    }
  }
  
  return null;
}

// Role-based access control
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    ADMIN: 3,
    SOLUTIONS_ARCHITECT: 2,
    SALES_REP: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canAccessDeal(user: User, deal: { createdBy: string; assignedTo?: string | null; teamId?: string | null }): boolean {
  if (user.role === 'ADMIN') return true;
  if (user.role === 'SOLUTIONS_ARCHITECT') {
    // SAs can access deals from teams they're on
    // This would need to be checked against user's teams in a real implementation
    return true; // Simplified for now
  }
  if (user.role === 'SALES_DIRECTOR') {
    // Sales Directors can access deals they created OR deals assigned to them
    // Handle both user.id and user.userId for compatibility
    const userId = user.id || (user as any).userId;
    return deal.createdBy === userId || deal.assignedTo === userId;
  }
  return false;
}

export function canManageUsers(userRole: UserRole): boolean {
  return hasPermission(userRole, 'ADMIN');
}

export function canManageTeams(userRole: UserRole): boolean {
  return hasPermission(userRole, 'ADMIN');
}

import { db } from '@/services/database';
import { UserRole, AuthType } from '@/types';

export interface InitialUser {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  temporaryPassword: string;
  isActive: boolean;
  mustChangePassword: boolean;
}

export const INITIAL_ADMIN: InitialUser = {
  email: 'vincent.do@dbtlabs.com',
  firstName: 'Vincent',
  lastName: 'Do',
  role: 'ADMIN',
  temporaryPassword: 'TempPass123!',
  isActive: true,
  mustChangePassword: true
};

export async function ensureInitialAdminExists(): Promise<boolean> {
  try {
    // Check if any admin users exist
    const existingAdmins = await db.getUsersByRole('ADMIN');
    
    if (existingAdmins.length > 0) {
      console.log('Admin users already exist, skipping initial setup');
      return true;
    }

    // Create initial admin user
    console.log('Creating initial admin user...');
    const adminUser = await db.createUser({
      email: INITIAL_ADMIN.email,
      firstName: INITIAL_ADMIN.firstName,
      lastName: INITIAL_ADMIN.lastName,
      role: INITIAL_ADMIN.role,
      authType: 'APP',
      password: INITIAL_ADMIN.temporaryPassword,
      isActive: INITIAL_ADMIN.isActive
    });

    console.log('Initial admin user created:', adminUser.email);
    return true;
  } catch (error) {
    console.error('Failed to create initial admin user:', error);
    return false;
  }
}

export { validatePasswordStrength } from './password-validation';

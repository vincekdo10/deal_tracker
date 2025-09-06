import { User, Team, Deal, Task, Subtask, ActivityLog, UserRole, AuthType, TaskStatus, SubtaskStatus, Priority, DealStage } from '@/types';
import bcrypt from 'bcryptjs';
import { snowflakeService } from '@/lib/snowflake-server';

export class DatabaseService {
  async initialize(): Promise<void> {
    try {
      await snowflakeService.initialize();
    } catch (error) {
      console.error('Failed to initialize Snowflake database:', error);
      throw error;
    }
  }

  // User methods
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const results = await snowflakeService.executeQuery<any>(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      if (!results[0]) return null;
      
      // Map Snowflake column names to our interface
      const user = results[0];
      return {
        id: user.ID,
        email: user.EMAIL,
        firstName: user.FIRST_NAME,
        lastName: user.LAST_NAME,
        role: user.ROLE,
        authType: user.AUTH_TYPE,
        passwordHash: user.PASSWORD_HASH,
        isActive: user.IS_ACTIVE,
        isTemporaryPassword: user.IS_TEMPORARY_PASSWORD || false,
        passwordChangedAt: user.PASSWORD_CHANGED_AT,
        createdAt: user.CREATED_AT,
        updatedAt: user.UPDATED_AT
      };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const results = await snowflakeService.executeQuery<any>(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      if (!results[0]) return null;
      
      // Map Snowflake column names to our interface
      const user = results[0];
      return {
        id: user.ID,
        email: user.EMAIL,
        firstName: user.FIRST_NAME,
        lastName: user.LAST_NAME,
        role: user.ROLE,
        authType: user.AUTH_TYPE,
        passwordHash: user.PASSWORD_HASH,
        isActive: user.IS_ACTIVE,
        isTemporaryPassword: user.IS_TEMPORARY_PASSWORD || false,
        passwordChangedAt: user.PASSWORD_CHANGED_AT,
        createdAt: user.CREATED_AT,
        updatedAt: user.UPDATED_AT
      };
    } catch (error) {
      console.error('Error getting user by id:', error);
      return null;
    }
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    try {
      const results = await snowflakeService.executeQuery<any>(
        `SELECT t.* FROM teams t
         INNER JOIN user_teams ut ON t.id = ut.team_id
         WHERE ut.user_id = ?`,
        [userId]
      );
      
      return results.map(team => ({
        id: team.ID,
        name: team.NAME,
        description: team.DESCRIPTION,
        createdAt: team.CREATED_AT,
        updatedAt: team.UPDATED_AT
      }));
    } catch (error) {
      console.error('Error getting user teams:', error);
      return [];
    }
  }

  async getUsersByTeam(teamId: string): Promise<User[]> {
    try {
      const results = await snowflakeService.executeQuery<any>(
        `SELECT u.* FROM users u
         INNER JOIN user_teams ut ON u.id = ut.user_id
         WHERE ut.team_id = ?`,
        [teamId]
      );
      
      return results.map(user => ({
        id: user.ID,
        email: user.EMAIL,
        firstName: user.FIRST_NAME,
        lastName: user.LAST_NAME,
        role: user.ROLE,
        authType: user.AUTH_TYPE,
        passwordHash: user.PASSWORD_HASH,
        isActive: user.IS_ACTIVE,
        isTemporaryPassword: user.IS_TEMPORARY_PASSWORD || false,
        passwordChangedAt: user.PASSWORD_CHANGED_AT,
        createdAt: user.CREATED_AT,
        updatedAt: user.UPDATED_AT
      }));
    } catch (error) {
      console.error('Error getting users by team:', error);
      return [];
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const results = await snowflakeService.executeQuery<any>('SELECT * FROM users ORDER BY created_at DESC');
      return results.map(user => ({
        id: user.ID,
        email: user.EMAIL,
        firstName: user.FIRST_NAME,
        lastName: user.LAST_NAME,
        role: user.ROLE,
        authType: user.AUTH_TYPE,
        passwordHash: user.PASSWORD_HASH,
        isActive: user.IS_ACTIVE,
        isTemporaryPassword: user.IS_TEMPORARY_PASSWORD || false,
        passwordChangedAt: user.PASSWORD_CHANGED_AT,
        createdAt: user.CREATED_AT,
        updatedAt: user.UPDATED_AT
      }));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      const results = await snowflakeService.executeQuery<any>(
        'SELECT * FROM users WHERE role = ? ORDER BY created_at DESC',
        [role]
      );
      return results.map(user => ({
        id: user.ID,
        email: user.EMAIL,
        firstName: user.FIRST_NAME,
        lastName: user.LAST_NAME,
        role: user.ROLE,
        authType: user.AUTH_TYPE,
        passwordHash: user.PASSWORD_HASH,
        isActive: user.IS_ACTIVE,
        isTemporaryPassword: user.IS_TEMPORARY_PASSWORD || false,
        passwordChangedAt: user.PASSWORD_CHANGED_AT,
        createdAt: user.CREATED_AT,
        updatedAt: user.UPDATED_AT
      }));
    } catch (error) {
      console.error('Error getting users by role:', error);
      return [];
    }
  }

  async createUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    authType: AuthType;
    password?: string;
    teamIds?: string[];
  }): Promise<User> {
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const passwordHash = userData.password ? await bcrypt.hash(userData.password, 12) : null;
    const isTemporaryPassword = userData.password ? true : false;
    
    try {
      await snowflakeService.executeUpdate(
        `INSERT INTO users (id, email, first_name, last_name, role, auth_type, password_hash, is_active, is_temporary_password, password_changed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userData.email,
          userData.firstName,
          userData.lastName,
          userData.role,
          userData.authType,
          passwordHash,
          true,
          isTemporaryPassword,
          isTemporaryPassword ? null : new Date()
        ]
      );

      // Create user-team relationships if teamIds provided
      if (userData.teamIds && userData.teamIds.length > 0) {
        for (const teamId of userData.teamIds) {
          const userTeamId = `user-team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          await snowflakeService.executeUpdate(
            'INSERT INTO user_teams (id, user_id, team_id) VALUES (?, ?, ?)',
            [userTeamId, id, teamId]
          );
        }
      }

      const user = await this.getUserById(id);
      if (!user) throw new Error('Failed to create user');
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    try {
      const updateFields = [];
      const values = [];

      if (data.firstName) {
        updateFields.push('first_name = ?');
        values.push(data.firstName);
      }
      if (data.lastName) {
        updateFields.push('last_name = ?');
        values.push(data.lastName);
      }
      if (data.email) {
        updateFields.push('email = ?');
        values.push(data.email);
      }
      if (data.role) {
        updateFields.push('role = ?');
        values.push(data.role);
      }
      if (data.password) {
        const passwordHash = await bcrypt.hash(data.password, 12);
        updateFields.push('password_hash = ?');
        values.push(passwordHash);
      }
      if (data.isActive !== undefined) {
        updateFields.push('is_active = ?');
        values.push(data.isActive);
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP()');
      values.push(id);

      await snowflakeService.executeUpdate(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );

      const user = await this.getUserById(id);
      if (!user) throw new Error('User not found');
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user || !user.passwordHash) {
        throw new Error('User not found or no password set');
      }

      // Verify current password
      const isValidPassword = await this.comparePassword(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password and mark as no longer temporary
      await snowflakeService.executeUpdate(
        `UPDATE users SET password_hash = ?, is_temporary_password = false, password_changed_at = CURRENT_TIMESTAMP(), updated_at = CURRENT_TIMESTAMP() WHERE id = ?`,
        [newPasswordHash, userId]
      );

      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  generateTemporaryPassword(): string {
    // Generate a secure temporary password
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    
    // Ensure at least one of each required character type
    password += 'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random() * 22)]; // uppercase
    password += 'abcdefghjkmnpqrstuvwxyz'[Math.floor(Math.random() * 22)]; // lowercase
    password += '23456789'[Math.floor(Math.random() * 8)]; // number
    password += '!@#$%'[Math.floor(Math.random() * 5)]; // special char
    
    // Fill the rest randomly
    for (let i = 4; i < 12; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Team methods
  async getAllTeams(): Promise<Team[]> {
    try {
      const results = await snowflakeService.executeQuery<any>('SELECT * FROM teams ORDER BY created_at DESC');
      return results.map(team => ({
        id: team.ID,
        name: team.NAME,
        description: team.DESCRIPTION,
        createdAt: team.CREATED_AT
      }));
    } catch (error) {
      console.error('Error getting all teams:', error);
      return [];
    }
  }

  async getTeamById(id: string): Promise<Team | null> {
    try {
      const results = await snowflakeService.executeQuery<any>(
        'SELECT * FROM teams WHERE id = ?',
        [id]
      );
      if (!results[0]) return null;
      
      const team = results[0];
      return {
        id: team.ID,
        name: team.NAME,
        description: team.DESCRIPTION,
        createdAt: team.CREATED_AT
      };
    } catch (error) {
      console.error('Error getting team by id:', error);
      return null;
    }
  }

  async createTeam(teamData: { name: string; description?: string; memberIds?: string[] }): Promise<Team> {
    const id = `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await snowflakeService.executeUpdate(
        'INSERT INTO teams (id, name, description) VALUES (?, ?, ?)',
        [id, teamData.name, teamData.description || null]
      );

      // Handle team member assignments if memberIds is provided
      if (teamData.memberIds && teamData.memberIds.length > 0) {
        console.log('Creating team with members:', teamData.memberIds);
        for (const memberId of teamData.memberIds) {
          const userTeamId = `ut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          console.log('Inserting user_team:', userTeamId, 'for user:', memberId, 'team:', id);
          await snowflakeService.executeUpdate(
            'INSERT INTO user_teams (id, user_id, team_id) VALUES (?, ?, ?)',
            [userTeamId, memberId, id]
          );
        }
        console.log('Added team members successfully');
      }

      const team = await this.getTeamById(id);
      if (!team) throw new Error('Failed to create team');
      return team;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  async updateTeam(id: string, data: Partial<Team & { memberIds?: string[] }>): Promise<Team> {
    try {
      const updateFields = [];
      const values = [];

      if (data.name) {
        updateFields.push('name = ?');
        values.push(data.name);
      }
      if (data.description !== undefined) {
        updateFields.push('description = ?');
        values.push(data.description);
      }

      values.push(id);

      await snowflakeService.executeUpdate(
        `UPDATE teams SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );

      // Handle team member updates if memberIds is provided
      if (data.memberIds !== undefined) {
        console.log('Updating team members for team:', id, 'with memberIds:', data.memberIds);
        
        // First, remove all existing team members
        await snowflakeService.executeUpdate(
          'DELETE FROM user_teams WHERE team_id = ?',
          [id]
        );
        console.log('Removed existing team members');

        // Then add new team members
        if (data.memberIds.length > 0) {
          console.log('Adding', data.memberIds.length, 'new team members');
          for (const memberId of data.memberIds) {
            const userTeamId = `ut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            console.log('Inserting user_team:', userTeamId, 'for user:', memberId, 'team:', id);
            await snowflakeService.executeUpdate(
              'INSERT INTO user_teams (id, user_id, team_id) VALUES (?, ?, ?)',
              [userTeamId, memberId, id]
            );
          }
          console.log('Added new team members successfully');
        } else {
          console.log('No members to add, team will have no members');
        }
      }

      const team = await this.getTeamById(id);
      if (!team) throw new Error('Team not found');
      return team;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }

  async deleteTeam(id: string): Promise<void> {
    try {
      await snowflakeService.executeUpdate('DELETE FROM teams WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  }

  async deleteDeal(id: string): Promise<boolean> {
    try {
      // First, get all tasks associated with this deal
      const tasks = await this.getTasksForDeal(id);
      console.log(`Deleting deal ${id} with ${tasks.length} associated tasks`);
      
      // Delete all subtasks for each task
      for (const task of tasks) {
        const subtaskCount = await snowflakeService.executeUpdate('DELETE FROM subtasks WHERE task_id = ?', [task.id]);
        console.log(`Deleted ${subtaskCount} subtasks for task ${task.id}`);
      }
      
      // Delete all tasks associated with this deal
      const taskCount = await snowflakeService.executeUpdate('DELETE FROM tasks WHERE deal_id = ?', [id]);
      console.log(`Deleted ${taskCount} tasks for deal ${id}`);
      
      // Finally, delete the deal itself
      await snowflakeService.executeUpdate('DELETE FROM deals WHERE id = ?', [id]);
      console.log(`Successfully deleted deal ${id} and all associated data`);
      
      return true;
    } catch (error) {
      console.error('Error deleting deal:', error);
      return false;
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    try {
      // First delete all subtasks associated with this task
      const subtaskCount = await snowflakeService.executeUpdate('DELETE FROM subtasks WHERE task_id = ?', [id]);
      console.log(`Deleted ${subtaskCount} subtasks for task ${id}`);
      
      // Then delete the task itself
      await snowflakeService.executeUpdate('DELETE FROM tasks WHERE id = ?', [id]);
      console.log(`Successfully deleted task ${id} and all associated subtasks`);
      
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  async deleteUser(id: string, reassignToUserId?: string): Promise<boolean> {
    try {
      console.log(`Starting graceful deletion of user ${id}${reassignToUserId ? ` with reassignment to ${reassignToUserId}` : ''}`);
      
      // 1. Get user info before deletion for logging
      const user = await this.getUserById(id);
      if (!user) {
        console.log('User not found, nothing to delete');
        return true;
      }

      // 2. Handle deals created by this user
      const dealsCreated = await snowflakeService.executeQuery<any>(
        'SELECT id, account_name FROM deals WHERE created_by = ?',
        [id]
      );
      
      if (dealsCreated.length > 0) {
        if (reassignToUserId) {
          // Reassign deals to another user
          console.log(`Reassigning ${dealsCreated.length} deals to user ${reassignToUserId}`);
          await snowflakeService.executeUpdate(
            'UPDATE deals SET created_by = ? WHERE created_by = ?',
            [reassignToUserId, id]
          );
        } else {
          // Delete deals created by this user (cascade delete tasks and subtasks)
          console.log(`Deleting ${dealsCreated.length} deals created by user`);
          for (const deal of dealsCreated) {
            await this.deleteDeal(deal.ID);
          }
        }
      }

      // 3. Handle deals assigned to this user
      const dealsAssigned = await snowflakeService.executeQuery<any>(
        'SELECT id, account_name FROM deals WHERE assigned_to = ?',
        [id]
      );
      
      if (dealsAssigned.length > 0) {
        if (reassignToUserId) {
          // Reassign deals to another user
          console.log(`Reassigning ${dealsAssigned.length} assigned deals to user ${reassignToUserId}`);
          await snowflakeService.executeUpdate(
            'UPDATE deals SET assigned_to = ? WHERE assigned_to = ?',
            [reassignToUserId, id]
          );
        } else {
          // Unassign deals (set assigned_to to NULL)
          console.log(`Unassigning ${dealsAssigned.length} deals from user`);
          await snowflakeService.executeUpdate(
            'UPDATE deals SET assigned_to = NULL WHERE assigned_to = ?',
            [id]
          );
        }
      }

      // 4. Handle tasks assigned to this user
      const tasksAssigned = await snowflakeService.executeQuery<any>(
        'SELECT id, title FROM tasks WHERE assignee_id = ?',
        [id]
      );
      
      if (tasksAssigned.length > 0) {
        if (reassignToUserId) {
          // Reassign tasks to another user
          console.log(`Reassigning ${tasksAssigned.length} tasks to user ${reassignToUserId}`);
          await snowflakeService.executeUpdate(
            'UPDATE tasks SET assignee_id = ? WHERE assignee_id = ?',
            [reassignToUserId, id]
          );
        } else {
          // Unassign tasks (set assignee_id to NULL)
          console.log(`Unassigning ${tasksAssigned.length} tasks from user`);
          await snowflakeService.executeUpdate(
            'UPDATE tasks SET assignee_id = NULL WHERE assignee_id = ?',
            [id]
          );
        }
      }

      // 5. Remove user from all teams
      const userTeams = await snowflakeService.executeQuery<any>(
        'SELECT ut.id, t.name FROM user_teams ut JOIN teams t ON ut.team_id = t.id WHERE ut.user_id = ?',
        [id]
      );
      
      if (userTeams.length > 0) {
        console.log(`Removing user from ${userTeams.length} teams`);
        await snowflakeService.executeUpdate('DELETE FROM user_teams WHERE user_id = ?', [id]);
      }

      // 6. Delete activity logs (optional - you might want to keep these for audit)
      const activityLogs = await snowflakeService.executeQuery<any>(
        'SELECT COUNT(*) as count FROM activity_logs WHERE user_id = ?',
        [id]
      );
      
      if (activityLogs[0]?.COUNT > 0) {
        console.log(`Deleting ${activityLogs[0].COUNT} activity logs`);
        await snowflakeService.executeUpdate('DELETE FROM activity_logs WHERE user_id = ?', [id]);
      }

      // 7. Finally, delete the user
      console.log(`Deleting user ${id} (${user.firstName} ${user.lastName})`);
      await snowflakeService.executeUpdate('DELETE FROM users WHERE id = ?', [id]);
      
      console.log(`Successfully deleted user ${id} and handled all related data`);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async softDeleteUser(id: string): Promise<boolean> {
    try {
      console.log(`Soft deleting user ${id} (deactivating)`);
      
      // Simply deactivate the user instead of deleting
      await snowflakeService.executeUpdate(
        'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP() WHERE id = ?',
        [id]
      );
      
      console.log(`Successfully soft deleted user ${id}`);
      return true;
    } catch (error) {
      console.error('Error soft deleting user:', error);
      return false;
    }
  }

  async getUserDependencies(id: string): Promise<{
    dealsCreated: number;
    dealsAssigned: number;
    tasksAssigned: number;
    teamsJoined: number;
    activityLogs: number;
  }> {
    try {
      const [dealsCreated, dealsAssigned, tasksAssigned, teamsJoined, activityLogs] = await Promise.all([
        snowflakeService.executeQuery<any>('SELECT COUNT(*) as count FROM deals WHERE created_by = ?', [id]),
        snowflakeService.executeQuery<any>('SELECT COUNT(*) as count FROM deals WHERE assigned_to = ?', [id]),
        snowflakeService.executeQuery<any>('SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ?', [id]),
        snowflakeService.executeQuery<any>('SELECT COUNT(*) as count FROM user_teams WHERE user_id = ?', [id]),
        snowflakeService.executeQuery<any>('SELECT COUNT(*) as count FROM activity_logs WHERE user_id = ?', [id])
      ]);

      return {
        dealsCreated: dealsCreated[0]?.COUNT || 0,
        dealsAssigned: dealsAssigned[0]?.COUNT || 0,
        tasksAssigned: tasksAssigned[0]?.COUNT || 0,
        teamsJoined: teamsJoined[0]?.COUNT || 0,
        activityLogs: activityLogs[0]?.COUNT || 0
      };
    } catch (error) {
      console.error('Error getting user dependencies:', error);
      return {
        dealsCreated: 0,
        dealsAssigned: 0,
        tasksAssigned: 0,
        teamsJoined: 0,
        activityLogs: 0
      };
    }
  }

  async getTeamMembers(teamId: string): Promise<User[]> {
    try {
      console.log('Getting team members for team:', teamId);
      const results = await snowflakeService.executeQuery<any>(
        `SELECT u.* FROM users u
         JOIN user_teams ut ON u.id = ut.user_id
         WHERE ut.team_id = ?`,
        [teamId]
      );
      console.log('Found', results.length, 'team members:', results.map(r => ({ id: r.ID, name: r.FIRST_NAME + ' ' + r.LAST_NAME })));
      return results.map(user => ({
        id: user.ID,
        email: user.EMAIL,
        firstName: user.FIRST_NAME,
        lastName: user.LAST_NAME,
        role: user.ROLE,
        authType: user.AUTH_TYPE,
        passwordHash: user.PASSWORD_HASH,
        isActive: user.IS_ACTIVE,
        isTemporaryPassword: user.IS_TEMPORARY_PASSWORD || false,
        passwordChangedAt: user.PASSWORD_CHANGED_AT,
        createdAt: user.CREATED_AT,
        updatedAt: user.UPDATED_AT
      }));
    } catch (error) {
      console.error('Error getting team members:', error);
      return [];
    }
  }

  // Deal methods
  async getAllDeals(): Promise<Deal[]> {
    try {
      const results = await snowflakeService.executeQuery<any>('SELECT * FROM deals ORDER BY created_at DESC');
      return results.map(deal => ({
        id: deal.ID,
        accountName: deal.ACCOUNT_NAME,
        stakeholders: deal.STAKEHOLDERS,
        renewalDate: deal.RENEWAL_DATE,
        arr: deal.ARR,
        tam: deal.TAM,
        dealPriority: deal.DEAL_PRIORITY,
        dealStage: deal.DEAL_STAGE,
        productsInUse: deal.PRODUCTS_IN_USE,
        growthOpportunities: deal.GROWTH_OPPORTUNITIES,
        teamId: deal.TEAM_ID,
        createdBy: deal.CREATED_BY,
        createdAt: deal.CREATED_AT,
        updatedAt: deal.UPDATED_AT
      }));
    } catch (error) {
      console.error('Error getting all deals:', error);
      return [];
    }
  }

  async getDealsForUser(userId: string, userRole?: UserRole): Promise<Deal[]> {
    try {
      let sql = 'SELECT * FROM deals ORDER BY created_at DESC';
      let binds: any[] = [];

      console.log('getDealsForUser called with userId:', userId, 'userRole:', userRole);

      if (userRole === 'ADMIN') {
        // Admin can see all deals
        sql = 'SELECT * FROM deals ORDER BY created_at DESC';
        binds = [];
        console.log('ADMIN: Getting all deals');
      } else if (userRole === 'SOLUTIONS_ARCHITECT') {
        // SA can see deals from their teams or deals they created
        sql = `
          SELECT DISTINCT d.* FROM deals d
          LEFT JOIN user_teams ut ON d.team_id = ut.team_id
          WHERE ut.user_id = ? OR d.created_by = ?
          ORDER BY d.created_at DESC
        `;
        binds = [userId, userId];
        console.log('SA: Getting deals from teams or created by user');
      } else if (userRole === 'SALES_DIRECTOR') {
        // Sales Director can see deals they created or are assigned to
        sql = 'SELECT * FROM deals WHERE created_by = ? OR assigned_to = ? ORDER BY created_at DESC';
        binds = [userId, userId];
        console.log('SD: Getting deals created by or assigned to user:', userId);
      }
      
      console.log('Executing SQL:', sql, 'with binds:', binds);
      const results = await snowflakeService.executeQuery<any>(sql, binds);
      console.log('Found', results.length, 'deals for user');
      results.forEach(deal => {
        console.log('Deal:', deal.ACCOUNT_NAME, 'created by:', deal.CREATED_BY, 'assigned to:', deal.ASSIGNED_TO);
      });
      return results.map(deal => ({
        id: deal.ID,
        accountName: deal.ACCOUNT_NAME,
        stakeholders: deal.STAKEHOLDERS ? deal.STAKEHOLDERS.split(',').map((s: string) => s.trim()) : [],
        renewalDate: deal.RENEWAL_DATE,
        arr: deal.ARR || 0,
        tam: deal.TAM || 0,
        dealPriority: deal.DEAL_PRIORITY,
        dealStage: deal.DEAL_STAGE,
        productsInUse: deal.PRODUCTS_IN_USE ? deal.PRODUCTS_IN_USE.split(',').map((s: string) => s.trim()) : [],
        growthOpportunities: deal.GROWTH_OPPORTUNITIES ? deal.GROWTH_OPPORTUNITIES.split(',').map((s: string) => s.trim()) : [],
        teamId: deal.TEAM_ID,
        createdBy: deal.CREATED_BY,
        assignedTo: deal.ASSIGNED_TO,
        createdAt: deal.CREATED_AT,
        updatedAt: deal.UPDATED_AT
      }));
    } catch (error) {
      console.error('Error getting deals for user:', error);
      return [];
    }
  }

  async getDealById(id: string): Promise<Deal | null> {
    try {
      const results = await snowflakeService.executeQuery<any>(
        'SELECT * FROM deals WHERE id = ?',
        [id]
      );
      
      if (!results[0]) return null;
      
      const deal = results[0];
      
      return {
        id: deal.ID,
        accountName: deal.ACCOUNT_NAME,
        stakeholders: deal.STAKEHOLDERS ? deal.STAKEHOLDERS.split(',').map((s: string) => s.trim()) : [],
        renewalDate: deal.RENEWAL_DATE,
        arr: deal.ARR || 0,
        tam: deal.TAM || 0,
        dealPriority: deal.DEAL_PRIORITY as Priority,
        dealStage: deal.DEAL_STAGE as DealStage,
        productsInUse: deal.PRODUCTS_IN_USE ? deal.PRODUCTS_IN_USE.split(',').map((s: string) => s.trim()) : [],
        growthOpportunities: deal.GROWTH_OPPORTUNITIES ? deal.GROWTH_OPPORTUNITIES.split(',').map((s: string) => s.trim()) : [],
        teamId: deal.TEAM_ID,
        createdBy: deal.CREATED_BY,
        assignedTo: deal.ASSIGNED_TO,
        createdAt: deal.CREATED_AT,
        updatedAt: deal.UPDATED_AT
      };
    } catch (error) {
      console.error('Error getting deal by id:', error);
      return null;
    }
  }

  async createDeal(dealData: {
    accountName: string;
    stakeholders?: string;
    renewalDate?: Date;
    arr?: number;
    tam?: number;
    dealPriority?: string;
    dealStage?: DealStage;
    productsInUse?: string;
    growthOpportunities?: string;
    teamId?: string | null;
    createdBy: string;
    assignedTo?: string | null;
  }): Promise<Deal> {
    const id = `deal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await snowflakeService.executeUpdate(
        `INSERT INTO deals (id, account_name, stakeholders, renewal_date, arr, tam, deal_priority, deal_stage, products_in_use, growth_opportunities, team_id, created_by, assigned_to)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          dealData.accountName,
          dealData.stakeholders || null,
          dealData.renewalDate || null,
          dealData.arr || null,
          dealData.tam || null,
          dealData.dealPriority || null,
          dealData.dealStage || null,
          dealData.productsInUse || null,
          dealData.growthOpportunities || null,
          dealData.teamId || null,
          dealData.createdBy,
          dealData.assignedTo || null
        ]
      );

      const deal = await this.getDealById(id);
      if (!deal) throw new Error('Failed to create deal');
      return deal;
    } catch (error) {
      console.error('Error creating deal:', error);
      throw error;
    }
  }

  async updateDeal(id: string, data: Partial<Deal>): Promise<Deal> {
    try {
      const updateFields = [];
      const values = [];

      if (data.accountName) {
        updateFields.push('account_name = ?');
        values.push(data.accountName);
      }
      if (data.stakeholders !== undefined) {
        updateFields.push('stakeholders = ?');
        // Convert array to comma-separated string if it's an array
        const stakeholdersValue = Array.isArray(data.stakeholders) 
          ? data.stakeholders.join(',') 
          : data.stakeholders;
        values.push(stakeholdersValue);
      }
      if (data.renewalDate !== undefined) {
        updateFields.push('renewal_date = ?');
        values.push(data.renewalDate);
      }
      if (data.arr !== undefined) {
        updateFields.push('arr = ?');
        values.push(data.arr);
      }
      if (data.tam !== undefined) {
        updateFields.push('tam = ?');
        values.push(data.tam);
      }
      if (data.dealPriority !== undefined) {
        updateFields.push('deal_priority = ?');
        values.push(data.dealPriority);
      }
      if (data.dealStage !== undefined) {
        updateFields.push('deal_stage = ?');
        values.push(data.dealStage);
      }
      if (data.productsInUse !== undefined) {
        updateFields.push('products_in_use = ?');
        // Convert array to comma-separated string if it's an array
        const productsValue = Array.isArray(data.productsInUse) 
          ? data.productsInUse.join(',') 
          : data.productsInUse;
        values.push(productsValue);
      }
      if (data.growthOpportunities !== undefined) {
        updateFields.push('growth_opportunities = ?');
        // Convert array to comma-separated string if it's an array
        const growthValue = Array.isArray(data.growthOpportunities) 
          ? data.growthOpportunities.join(',') 
          : data.growthOpportunities;
        values.push(growthValue);
      }
      if (data.teamId !== undefined) {
        updateFields.push('team_id = ?');
        values.push(data.teamId);
      }
      if (data.assignedTo !== undefined) {
        updateFields.push('assigned_to = ?');
        values.push(data.assignedTo);
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP()');
      values.push(id);

      await snowflakeService.executeUpdate(
        `UPDATE deals SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );

      const deal = await this.getDealById(id);
      if (!deal) throw new Error('Deal not found');
      return deal;
    } catch (error) {
      console.error('Error updating deal:', error);
      throw error;
    }
  }

  // Task methods
  async getAllTasks(): Promise<Task[]> {
    try {
      const results = await snowflakeService.executeQuery<any>('SELECT * FROM tasks ORDER BY created_at DESC');
      return results.map(task => ({
        id: task.ID,
        title: task.TITLE,
        description: task.DESCRIPTION,
        status: task.STATUS,
        priority: task.PRIORITY,
        dueDate: task.DUE_DATE,
        blockedReason: task.BLOCKED_REASON,
        blockedDate: task.BLOCKED_DATE,
        expectedUnblockDate: task.EXPECTED_UNBLOCK_DATE,
        position: task.POSITION,
        dealId: task.DEAL_ID,
        assigneeId: task.ASSIGNEE_ID,
        createdAt: task.CREATED_AT,
        updatedAt: task.UPDATED_AT
      }));
    } catch (error) {
      console.error('Error getting all tasks:', error);
      return [];
    }
  }

  async getTasksForDeal(dealId: string): Promise<Task[]> {
    try {
      const results = await snowflakeService.executeQuery<any>(
        'SELECT * FROM tasks WHERE deal_id = ? ORDER BY position ASC, created_at ASC',
        [dealId]
      );
      return results.map(task => ({
        id: task.ID,
        title: task.TITLE,
        description: task.DESCRIPTION,
        status: task.STATUS,
        priority: task.PRIORITY,
        dueDate: task.DUE_DATE,
        blockedReason: task.BLOCKED_REASON,
        blockedDate: task.BLOCKED_DATE,
        expectedUnblockDate: task.EXPECTED_UNBLOCK_DATE,
        position: task.POSITION,
        dealId: task.DEAL_ID,
        assigneeId: task.ASSIGNEE_ID,
        createdAt: task.CREATED_AT,
        updatedAt: task.UPDATED_AT
      }));
    } catch (error) {
      console.error('Error getting tasks for deal:', error);
      return [];
    }
  }

  async getTasksForDealWithSubtasks(dealId: string): Promise<TaskWithSubtasks[]> {
    try {
      const tasks = await this.getTasksForDeal(dealId);
      const tasksWithSubtasks: TaskWithSubtasks[] = [];
      
      for (const task of tasks) {
        const subtasks = await this.getSubtasksForTask(task.id);
        const deal = await this.getDealById(dealId);
        
        if (deal) {
          tasksWithSubtasks.push({
            ...task,
            subtasks,
            deal
          });
        }
      }
      
      return tasksWithSubtasks;
    } catch (error) {
      console.error('Error getting tasks with subtasks for deal:', error);
      return [];
    }
  }

  async getTaskById(id: string): Promise<Task | null> {
    try {
      const results = await snowflakeService.executeQuery<any>(
        'SELECT * FROM tasks WHERE id = ?',
        [id]
      );
      
      if (results.length === 0) return null;
      
      const task = results[0];
      return {
        id: task.ID,
        title: task.TITLE,
        description: task.DESCRIPTION,
        status: task.STATUS,
        priority: task.PRIORITY,
        dueDate: task.DUE_DATE,
        position: task.POSITION,
        dealId: task.DEAL_ID,
        assigneeId: task.ASSIGNEE_ID,
        blockedReason: task.BLOCKED_REASON,
        expectedUnblockDate: task.EXPECTED_UNBLOCK_DATE,
        createdAt: task.CREATED_AT,
        updatedAt: task.UPDATED_AT
      };
    } catch (error) {
      console.error('Error getting task by id:', error);
      return null;
    }
  }

  async createTask(taskData: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority?: Priority;
    dueDate?: Date;
    dealId: string;
    assigneeId?: string;
  }): Promise<Task> {
    const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get the next position for this deal
    const tasks = await this.getTasksForDeal(taskData.dealId);
    const position = tasks.length;
    
    try {
      await snowflakeService.executeUpdate(
        `INSERT INTO tasks (id, title, description, status, priority, due_date, position, deal_id, assignee_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          taskData.title,
          taskData.description || null,
          taskData.status,
          taskData.priority || null,
          taskData.dueDate || null,
          position,
          taskData.dealId,
          taskData.assigneeId || null
        ]
      );

      const task = await this.getTaskById(id);
      if (!task) throw new Error('Failed to create task');
      return task;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    try {
      const updateFields = [];
      const values = [];

      if (data.title) {
        updateFields.push('title = ?');
        values.push(data.title);
      }
      if (data.description !== undefined) {
        updateFields.push('description = ?');
        values.push(data.description);
      }
      if (data.status) {
        updateFields.push('status = ?');
        values.push(data.status);
      }
      if (data.priority !== undefined) {
        updateFields.push('priority = ?');
        values.push(data.priority);
      }
      if (data.dueDate !== undefined) {
        updateFields.push('due_date = ?');
        values.push(data.dueDate);
      }
      if (data.assigneeId !== undefined) {
        updateFields.push('assignee_id = ?');
        values.push(data.assigneeId);
      }
      if (data.position !== undefined) {
        updateFields.push('position = ?');
        values.push(data.position);
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP()');
      values.push(id);

      await snowflakeService.executeUpdate(
        `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );

      const task = await this.getTaskById(id);
      if (!task) throw new Error('Task not found');
      return task;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async blockTask(id: string, reason: string, expectedUnblockDate?: Date): Promise<Task> {
    try {
      await snowflakeService.executeUpdate(
        `UPDATE tasks SET status = 'BLOCKED', blocked_reason = ?, blocked_date = CURRENT_TIMESTAMP(), expected_unblock_date = ?, updated_at = CURRENT_TIMESTAMP() WHERE id = ?`,
        [reason, expectedUnblockDate || null, id]
      );

      const task = await this.getTaskById(id);
      if (!task) throw new Error('Task not found');
      return task;
    } catch (error) {
      console.error('Error blocking task:', error);
      throw error;
    }
  }

  async unblockTask(id: string): Promise<Task> {
    try {
      await snowflakeService.executeUpdate(
        `UPDATE tasks SET status = 'TODO', blocked_reason = NULL, blocked_date = NULL, expected_unblock_date = NULL, updated_at = CURRENT_TIMESTAMP() WHERE id = ?`,
        [id]
      );

      const task = await this.getTaskById(id);
      if (!task) throw new Error('Task not found');
      return task;
    } catch (error) {
      console.error('Error unblocking task:', error);
      throw error;
    }
  }

  // Subtask methods
  async getSubtasksForTask(taskId: string): Promise<Subtask[]> {
    try {
      const results = await snowflakeService.executeQuery<any>(
        'SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC, created_at ASC',
        [taskId]
      );
      return results.map(subtask => ({
        id: subtask.ID,
        title: subtask.TITLE,
        status: subtask.STATUS,
        blockedReason: subtask.BLOCKED_REASON,
        position: subtask.POSITION,
        taskId: subtask.TASK_ID,
        createdAt: subtask.CREATED_AT,
        updatedAt: subtask.UPDATED_AT
      }));
    } catch (error) {
      console.error('Error getting subtasks for task:', error);
      return [];
    }
  }

  async createSubtask(subtaskData: {
    title: string;
    status?: SubtaskStatus;
    taskId: string;
    position?: number;
  }): Promise<Subtask> {
    const id = `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get the next position for this task if not provided
    const subtasks = await this.getSubtasksForTask(subtaskData.taskId);
    const position = subtaskData.position !== undefined ? subtaskData.position : subtasks.length;
    const status = subtaskData.status || 'INCOMPLETE';
    
    try {
      await snowflakeService.executeUpdate(
        `INSERT INTO subtasks (id, title, status, position, task_id)
         VALUES (?, ?, ?, ?, ?)`,
        [id, subtaskData.title, status, position, subtaskData.taskId]
      );

      const subtask = await this.getSubtaskById(id);
      if (!subtask) throw new Error('Failed to create subtask');
      return subtask;
    } catch (error) {
      console.error('Error creating subtask:', error);
      throw error;
    }
  }

  async getSubtaskById(id: string): Promise<Subtask | null> {
    try {
      const results = await snowflakeService.executeQuery<any>(
        'SELECT * FROM subtasks WHERE id = ?',
        [id]
      );
      if (results.length === 0) return null;
      
      const subtask = results[0];
      return {
        id: subtask.ID,
        title: subtask.TITLE,
        status: subtask.STATUS,
        blockedReason: subtask.BLOCKED_REASON,
        position: subtask.POSITION,
        taskId: subtask.TASK_ID,
        createdAt: subtask.CREATED_AT,
        updatedAt: subtask.UPDATED_AT
      };
    } catch (error) {
      console.error('Error getting subtask by id:', error);
      return null;
    }
  }

  async updateSubtask(id: string, data: Partial<Subtask>): Promise<Subtask> {
    try {
      const updateFields = [];
      const values = [];

      if (data.title) {
        updateFields.push('title = ?');
        values.push(data.title);
      }
      if (data.status) {
        updateFields.push('status = ?');
        values.push(data.status);
      }
      if (data.position !== undefined) {
        updateFields.push('position = ?');
        values.push(data.position);
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP()');
      values.push(id);

      await snowflakeService.executeUpdate(
        `UPDATE subtasks SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );

      const subtask = await this.getSubtaskById(id);
      if (!subtask) throw new Error('Subtask not found');
      return subtask;
    } catch (error) {
      console.error('Error updating subtask:', error);
      throw error;
    }
  }

  async deleteSubtask(id: string): Promise<void> {
    try {
      await snowflakeService.executeUpdate('DELETE FROM subtasks WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting subtask:', error);
      throw error;
    }
  }

  // Activity log methods
  async createActivityLog(logData: {
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    details?: string;
  }): Promise<ActivityLog> {
    const id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await snowflakeService.executeUpdate(
        `INSERT INTO activity_logs (id, action, entity_type, entity_id, user_id, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, logData.action, logData.entityType, logData.entityId, logData.userId, logData.details || null]
      );

      const log = await this.getActivityLogById(id);
      if (!log) throw new Error('Failed to create activity log');
      return log;
    } catch (error) {
      console.error('Error creating activity log:', error);
      throw error;
    }
  }

  async getActivityLogById(id: string): Promise<ActivityLog | null> {
    try {
      const results = await snowflakeService.executeQuery<any>(
        'SELECT * FROM activity_logs WHERE id = ?',
        [id]
      );
      if (results.length === 0) return null;
      
      const log = results[0];
      return {
        id: log.ID,
        action: log.ACTION,
        entityType: log.ENTITY_TYPE,
        entityId: log.ENTITY_ID,
        userId: log.USER_ID,
        details: log.DETAILS,
        createdAt: log.CREATED_AT
      };
    } catch (error) {
      console.error('Error getting activity log by id:', error);
      return null;
    }
  }

  async getRecentActivity(limit: number = 50): Promise<ActivityLog[]> {
    try {
      const results = await snowflakeService.executeQuery<any>(
        'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?',
        [limit]
      );
      return results.map(log => ({
        id: log.ID,
        action: log.ACTION,
        entityType: log.ENTITY_TYPE,
        entityId: log.ENTITY_ID,
        userId: log.USER_ID,
        details: log.DETAILS,
        createdAt: log.CREATED_AT
      }));
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  async getDashboardMetrics(userId: string): Promise<{
    totalDeals: number;
    activeDeals: number;
    totalArr: number;
    totalTasks: number;
    completedTasks: number;
    blockedTasks: number;
    openTasks: number;
    overdueTasks: number;
    recentActivity: ActivityLog[];
    deals: Deal[];
  }> {
    try {
      // Get user info to determine role
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's deals with proper role filtering
      const deals = await this.getDealsForUser(userId, user.role);
      const totalDeals = deals.length;
      const activeDeals = deals.filter(deal => deal.dealStage !== 'CLOSED_WON' && deal.dealStage !== 'CLOSED_LOST').length;
      
      // Calculate total ARR from active deals
      const totalArr = deals
        .filter(deal => deal.dealStage !== 'CLOSED_WON' && deal.dealStage !== 'CLOSED_LOST')
        .reduce((sum, deal) => sum + (deal.arr || 0), 0);

      // Get all tasks for user's deals
      const allTasks = await Promise.all(
        deals.map(deal => this.getTasksForDeal(deal.id))
      );
      const tasks = allTasks.flat();
      
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.status === 'DONE').length;
      const blockedTasks = tasks.filter(task => task.status === 'BLOCKED').length;
      const openTasks = tasks.filter(task => task.status === 'TODO' || task.status === 'IN_PROGRESS').length;
      
      // Calculate overdue tasks (tasks past due date)
      const now = new Date();
      const overdueTasks = tasks.filter(task => 
        task.dueDate && 
        new Date(task.dueDate) < now && 
        task.status !== 'DONE'
      ).length;

      // Get recent activity
      const recentActivity = await this.getRecentActivity(10);

      return {
        totalDeals,
        activeDeals,
        totalArr,
        totalTasks,
        completedTasks,
        blockedTasks,
        openTasks,
        overdueTasks,
        recentActivity,
        deals
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      return {
        totalDeals: 0,
        activeDeals: 0,
        totalArr: 0,
        totalTasks: 0,
        completedTasks: 0,
        blockedTasks: 0,
        openTasks: 0,
        overdueTasks: 0,
        recentActivity: [],
        deals: []
      };
    }
  }
}

export const db = new DatabaseService();
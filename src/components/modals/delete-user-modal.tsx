'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, User, Users, Briefcase, CheckSquare, Activity } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { User as UserType } from '@/types';

interface UserDependencies {
  dealsCreated: number;
  dealsAssigned: number;
  tasksAssigned: number;
  teamsJoined: number;
  activityLogs: number;
}

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserDeleted: () => void;
  user: UserType | null;
}

export function DeleteUserModal({ isOpen, onClose, onUserDeleted, user }: DeleteUserModalProps) {
  const [dependencies, setDependencies] = useState<UserDependencies | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletionType, setDeletionType] = useState<'soft' | 'hard' | 'reassign'>('soft');
  const [reassignToUserId, setReassignToUserId] = useState('');
  const [availableUsers, setAvailableUsers] = useState<UserType[]>([]);

  useEffect(() => {
    if (isOpen && user) {
      loadUserDependencies();
      loadAvailableUsers();
    }
  }, [isOpen, user]);

  const loadUserDependencies = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/admin/users/${user.id}/dependencies`);
      setDependencies(response.dependencies);
    } catch (error) {
      console.error('Failed to load user dependencies:', error);
      setMessage({ type: 'error', text: 'Failed to load user dependencies' });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await apiClient.get('/api/admin/users');
      // Filter out the user being deleted and inactive users
      const available = response.users.filter((u: UserType) => 
        u.id !== user?.id && u.isActive
      );
      setAvailableUsers(available);
    } catch (error) {
      console.error('Failed to load available users:', error);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    
    setDeleting(true);
    setMessage(null);

    try {
      let url = `/api/admin/users/${user.id}`;
      const params = new URLSearchParams();
      
      if (deletionType === 'soft') {
        params.append('softDelete', 'true');
      } else if (deletionType === 'reassign' && reassignToUserId) {
        params.append('reassignTo', reassignToUserId);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await apiClient.delete(url);
      
      setMessage({ type: 'success', text: response.message });
      
      setTimeout(() => {
        onUserDeleted();
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete user' });
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !user) return null;

  const hasDependencies = dependencies && (
    dependencies.dealsCreated > 0 ||
    dependencies.dealsAssigned > 0 ||
    dependencies.tasksAssigned > 0 ||
    dependencies.teamsJoined > 0 ||
    dependencies.activityLogs > 0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            Delete User
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            You are about to delete <strong>{user.firstName} {user.lastName}</strong> ({user.email}).
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading user dependencies...</span>
            </div>
          ) : dependencies && hasDependencies ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">This user has associated data:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {dependencies.dealsCreated > 0 && (
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 text-yellow-600 mr-2" />
                    <span>{dependencies.dealsCreated} deals created</span>
                  </div>
                )}
                {dependencies.dealsAssigned > 0 && (
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 text-yellow-600 mr-2" />
                    <span>{dependencies.dealsAssigned} deals assigned</span>
                  </div>
                )}
                {dependencies.tasksAssigned > 0 && (
                  <div className="flex items-center">
                    <CheckSquare className="h-4 w-4 text-yellow-600 mr-2" />
                    <span>{dependencies.tasksAssigned} tasks assigned</span>
                  </div>
                )}
                {dependencies.teamsJoined > 0 && (
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-yellow-600 mr-2" />
                    <span>{dependencies.teamsJoined} teams joined</span>
                  </div>
                )}
                {dependencies.activityLogs > 0 && (
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 text-yellow-600 mr-2" />
                    <span>{dependencies.activityLogs} activity logs</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
              <p className="text-sm text-green-800">This user has no associated data and can be safely deleted.</p>
            </div>
          )}
        </div>

        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700">Choose deletion method:</h3>
          
          <div className="space-y-3">
            <label className="flex items-start space-x-3">
              <input
                type="radio"
                name="deletionType"
                value="soft"
                checked={deletionType === 'soft'}
                onChange={(e) => setDeletionType(e.target.value as 'soft')}
                className="mt-1"
              />
              <div>
                <div className="text-sm font-medium">Deactivate User (Recommended)</div>
                <div className="text-xs text-gray-500">
                  User will be deactivated but data remains intact. User cannot log in but all data is preserved.
                </div>
              </div>
            </label>

            <label className="flex items-start space-x-3">
              <input
                type="radio"
                name="deletionType"
                value="reassign"
                checked={deletionType === 'reassign'}
                onChange={(e) => setDeletionType(e.target.value as 'reassign')}
                className="mt-1"
                disabled={!hasDependencies}
              />
              <div>
                <div className="text-sm font-medium">Delete & Reassign Data</div>
                <div className="text-xs text-gray-500">
                  User will be permanently deleted and all data will be reassigned to another user.
                </div>
                {deletionType === 'reassign' && (
                  <select
                    value={reassignToUserId}
                    onChange={(e) => setReassignToUserId(e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    required
                  >
                    <option value="">Select user to reassign data to...</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </label>

            <label className="flex items-start space-x-3">
              <input
                type="radio"
                name="deletionType"
                value="hard"
                checked={deletionType === 'hard'}
                onChange={(e) => setDeletionType(e.target.value as 'hard')}
                className="mt-1"
              />
              <div>
                <div className="text-sm font-medium">Permanently Delete</div>
                <div className="text-xs text-gray-500">
                  User and all associated data will be permanently deleted. This action cannot be undone.
                </div>
              </div>
            </label>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-md mb-4 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || (deletionType === 'reassign' && !reassignToUserId)}
          >
            {deleting ? 'Deleting...' : 'Delete User'}
          </Button>
        </div>
      </div>
    </div>
  );
}

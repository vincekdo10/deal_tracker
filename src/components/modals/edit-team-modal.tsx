'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import { TeamWithMembers } from '@/types';
import { X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamWithMembers;
  onTeamUpdated: () => void;
}

export function EditTeamModal({ isOpen, onClose, team, onTeamUpdated }: EditTeamModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    memberIds: [] as string[]
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        description: team.description || '',
        memberIds: team.userTeams.map(ut => ut.user.id)
      });
    }
  }, [team]);

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        try {
          const data = await apiClient.get('/api/users');
          setUsers(data.users);
        } catch (error) {
          console.error('Failed to fetch users:', error);
        }
      };
      fetchUsers();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      console.log('Sending team update with formData:', formData);
      await apiClient.put(`/api/admin/teams/${team.id}`, formData);
      setMessage({ type: 'success', text: 'Team updated successfully!' });
      setTimeout(() => {
        onTeamUpdated();
      }, 1000);
    } catch (error: any) {
      console.error('Failed to update team:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update team' });
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter(id => id !== userId)
        : [...prev.memberIds, userId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Team</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Team Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Members
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    id={`user-${user.id}`}
                    checked={formData.memberIds.includes(user.id)}
                    onChange={() => handleUserToggle(user.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`user-${user.id}`} className="text-sm text-gray-700">
                    {user.firstName} {user.lastName} ({user.email})
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="hover:bg-blue-600"
            >
              {loading ? 'Updating...' : 'Update Team'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

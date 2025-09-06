'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserRole, AuthType } from '@/types';
import { X, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

export function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'SALES_DIRECTOR' as UserRole,
    authType: 'APP' as AuthType,
    password: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate password for APP users
    if (formData.authType === 'APP' && (!formData.password || formData.password.length < 8)) {
      setMessage({ type: 'error', text: 'Password is required for APP users and must be at least 8 characters' });
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.post('/api/admin/users', formData);
      
      if (response.temporaryPassword) {
        setTemporaryPassword(response.temporaryPassword);
        setMessage({ 
          type: 'success', 
          text: 'User created successfully! Please copy the temporary password below.' 
        });
      } else {
        setMessage({ type: 'success', text: 'User created successfully!' });
      }
      
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'SALES_DIRECTOR',
        authType: 'APP',
        password: '',
        isActive: true
      });
      
      setTimeout(() => {
        onUserCreated();
        onClose();
      }, 3000); // Give more time to copy password
    } catch (error: any) {
      console.error('Failed to create user:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to create user' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create New User</h2>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="SALES_DIRECTOR">Sales Director</option>
                <option value="SOLUTIONS_ARCHITECT">Solutions Architect</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label htmlFor="authType" className="block text-sm font-medium text-gray-700 mb-1">
                Auth Type
              </label>
              <select
                id="authType"
                value={formData.authType}
                onChange={(e) => setFormData({ ...formData, authType: e.target.value as AuthType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="APP">App</option>
                <option value="SNOWFLAKE">Snowflake</option>
              </select>
            </div>
          </div>

          {formData.authType === 'APP' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Temporary Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={formData.authType === 'APP'}
                  minLength={8}
                  placeholder="Enter temporary password for user"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                User will be required to change this password on first login. Must be at least 8 characters.
              </p>
            </div>
          )}

          {temporaryPassword && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-sm font-medium text-green-800 mb-2">User Created Successfully</h3>
              <div className="flex items-center space-x-2">
                <code className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm font-mono">
                  {temporaryPassword}
                </code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(temporaryPassword)}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-green-700 mt-2">
                This is the temporary password you set. Share it with the user securely - they must change it on first login.
              </p>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active user
            </label>
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
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

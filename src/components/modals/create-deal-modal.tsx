'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DealStage, Priority } from '@/types';
import { X } from 'lucide-react';

interface CreateDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateDealModal({ isOpen, onClose, onSuccess }: CreateDealModalProps) {
  const [formData, setFormData] = useState({
    accountName: '',
    stakeholders: '',
    arr: '',
    tam: '',
    dealPriority: 'MEDIUM' as Priority,
    dealStage: 'PROSPECTING' as DealStage,
    productsInUse: '',
    growthOpportunities: '',
    renewalDate: '',
    salesDirectorId: '',
    teamId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchUsersAndCurrentUser = async () => {
        try {
          // Get current user info
          const userResponse = await fetch('/api/auth/me', {
            credentials: 'include',
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setCurrentUser(userData.user);
            
            // Fetch teams (optional)
            try {
              const teamsResponse = await fetch('/api/admin/teams', {
                credentials: 'include',
              });
              if (teamsResponse.ok) {
                const teamsData = await teamsResponse.json();
                setTeams(teamsData.teams);
                
                // Set default team for admin/SA if teams exist
                if (userData.user.role === 'ADMIN' || userData.user.role === 'SOLUTIONS_ARCHITECT') {
                  if (teamsData.teams.length > 0) {
                    setFormData(prev => ({
                      ...prev,
                      teamId: teamsData.teams[0].id
                    }));
                  }
                }
              }
            } catch (error) {
              console.log('No teams available yet');
            }
            
            // Try to fetch users (optional)
            try {
              if (userData.user.role === 'SOLUTIONS_ARCHITECT') {
                // First get the SA's teams
                const userTeamsResponse = await fetch('/api/users/me/teams', {
                  credentials: 'include',
                });
                if (userTeamsResponse.ok) {
                  const userTeamsData = await userTeamsResponse.json();
                  setTeams(userTeamsData.teams);
                  
                  // Get all users from the SA's teams
                  const allUsers: any[] = [];
                  for (const team of userTeamsData.teams) {
                    const teamUsersResponse = await fetch(`/api/teams/${team.id}/users`, {
                      credentials: 'include',
                    });
                    if (teamUsersResponse.ok) {
                      const teamUsersData = await teamUsersResponse.json();
                      allUsers.push(...teamUsersData.users.filter((user: any) => user.role === 'SALES_DIRECTOR'));
                    }
                  }
                  // Remove duplicates
                  const uniqueUsers = allUsers.filter((user, index, self) => 
                    index === self.findIndex(u => u.id === user.id)
                  );
                  setUsers(uniqueUsers);
                }
              } else if (userData.user.role === 'ADMIN') {
                // Admin can see all teams and users
                const teamsResponse = await fetch('/api/admin/teams', {
                  credentials: 'include',
                });
                if (teamsResponse.ok) {
                  const teamsData = await teamsResponse.json();
                  setTeams(teamsData.teams);
                }
                
                const usersResponse = await fetch('/api/users', {
                  credentials: 'include',
                });
                if (usersResponse.ok) {
                  const usersData = await usersResponse.json();
                  setUsers(usersData.users.filter((user: any) => user.role === 'SALES_DIRECTOR'));
                }
              } else if (userData.user.role === 'SALES_DIRECTOR') {
                // If user is a Sales Director, auto-assign to themselves
                setFormData(prev => ({
                  ...prev,
                  salesDirectorId: userData.user.id
                }));
              }
            } catch (error) {
              console.log('No users available yet');
            }
          }
        } catch (error) {
          console.error('Failed to fetch users:', error);
        }
      };
      fetchUsersAndCurrentUser();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          stakeholders: formData.stakeholders,
          productsInUse: formData.productsInUse,
          growthOpportunities: formData.growthOpportunities,
          arr: formData.arr ? parseFloat(formData.arr) : null,
          tam: formData.tam ? parseFloat(formData.tam) : null,
          renewalDate: formData.renewalDate || null,
          teamId: formData.teamId || null,
          assignedTo: formData.salesDirectorId || currentUser?.id || null,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        setFormData({
          accountName: '',
          stakeholders: '',
          arr: '',
          tam: '',
          dealPriority: 'MEDIUM',
          dealStage: 'PROSPECTING',
          productsInUse: '',
          growthOpportunities: '',
          renewalDate: '',
          salesDirectorId: '',
          teamId: '',
        });
        setCurrentUser(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create deal');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Create New Deal</CardTitle>
              <CardDescription>Add a new deal to your pipeline</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountName" className="text-gray-900">Account Name *</Label>
                <Input
                  id="accountName"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  required
                  placeholder="Enter account name"
                  className="text-gray-900 bg-white"
                />
              </div>

              <div>
                <Label htmlFor="dealStage" className="text-gray-900">Deal Stage</Label>
                <select
                  id="dealStage"
                  value={formData.dealStage}
                  onChange={(e) => setFormData({ ...formData, dealStage: e.target.value as DealStage })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                >
                  <option value="PROSPECTING">Prospecting</option>
                  <option value="DISCOVERY">Discovery</option>
                  <option value="PROPOSAL">Proposal</option>
                  <option value="NEGOTIATION">Negotiation</option>
                  <option value="RENEWAL">Renewal</option>
                  <option value="CLOSED_WON">Closed Won</option>
                  <option value="CLOSED_LOST">Closed Lost</option>
                </select>
              </div>

              <div>
                <Label htmlFor="dealPriority" className="text-gray-900">Priority</Label>
                <select
                  id="dealPriority"
                  value={formData.dealPriority}
                  onChange={(e) => setFormData({ ...formData, dealPriority: e.target.value as Priority })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <Label htmlFor="arr" className="text-gray-900">ARR ($)</Label>
                <Input
                  id="arr"
                  type="number"
                  value={formData.arr}
                  onChange={(e) => setFormData({ ...formData, arr: e.target.value })}
                  placeholder="0"
                  className="text-gray-900 bg-white"
                />
              </div>

              <div>
                <Label htmlFor="tam" className="text-gray-900">TAM ($)</Label>
                <Input
                  id="tam"
                  type="number"
                  value={formData.tam}
                  onChange={(e) => setFormData({ ...formData, tam: e.target.value })}
                  placeholder="0"
                  className="text-gray-900 bg-white"
                />
              </div>

              <div>
                <Label htmlFor="renewalDate" className="text-gray-900">Renewal Date</Label>
                <Input
                  id="renewalDate"
                  type="date"
                  value={formData.renewalDate}
                  onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                  className="text-gray-900 bg-white"
                />
              </div>

              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SOLUTIONS_ARCHITECT') && (
                <div>
                  <Label htmlFor="teamId" className="text-gray-900">Team</Label>
                  {teams.length > 0 ? (
                    <select
                      id="teamId"
                      value={formData.teamId}
                      onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                    >
                      <option value="">Select Team (Optional)</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 bg-gray-50">
                      No teams available yet. You can assign this deal to a team later.
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {teams.length > 0 
                      ? "You can assign this deal to a team later if needed"
                      : "Create teams in the admin panel to assign deals to them"
                    }
                  </p>
                </div>
              )}

              {currentUser?.role === 'SOLUTIONS_ARCHITECT' && (
                <div>
                  <Label htmlFor="salesDirectorId" className="text-gray-900">Sales Director</Label>
                  {users.length > 0 ? (
                    <select
                      id="salesDirectorId"
                      value={formData.salesDirectorId}
                      onChange={(e) => setFormData({ ...formData, salesDirectorId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                    >
                      <option value="">Select Sales Director (Optional)</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 bg-gray-50">
                      No sales directors available yet. You can assign this deal later.
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {users.length > 0 
                      ? "You can assign this deal to a sales director later if needed"
                      : "Create users in the admin panel to assign deals to them"
                    }
                  </p>
                </div>
              )}

              {currentUser?.role === 'ADMIN' && (
                <div>
                  <Label htmlFor="salesDirectorId" className="text-gray-900">Sales Director</Label>
                  {users.length > 0 ? (
                    <select
                      id="salesDirectorId"
                      value={formData.salesDirectorId}
                      onChange={(e) => setFormData({ ...formData, salesDirectorId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                    >
                      <option value="">Select Sales Director (Optional)</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 bg-gray-50">
                      No sales directors available yet. You can assign this deal later.
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {users.length > 0 
                      ? "You can assign this deal to a sales director later if needed"
                      : "Create users in the admin panel to assign deals to them"
                    }
                  </p>
                </div>
              )}
              
              {currentUser?.role === 'SALES_DIRECTOR' && (
                <div>
                  <Label className="text-gray-900">Sales Director</Label>
                  <div className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-gray-50">
                    {currentUser.firstName} {currentUser.lastName} ({currentUser.email})
                  </div>
                  <p className="text-xs text-gray-500 mt-1">This deal will be assigned to you automatically</p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="stakeholders" className="text-gray-900">Stakeholders (comma-separated)</Label>
              <Input
                id="stakeholders"
                value={formData.stakeholders}
                onChange={(e) => setFormData({ ...formData, stakeholders: e.target.value })}
                placeholder="John Doe, Jane Smith"
                className="text-gray-900 bg-white"
              />
            </div>

            <div>
              <Label htmlFor="productsInUse" className="text-gray-900">Products in Use (comma-separated)</Label>
              <Input
                id="productsInUse"
                value={formData.productsInUse}
                onChange={(e) => setFormData({ ...formData, productsInUse: e.target.value })}
                placeholder="Product A, Product B"
                className="text-gray-900 bg-white"
              />
            </div>

            <div>
              <Label htmlFor="growthOpportunities" className="text-gray-900">Growth Opportunities (comma-separated)</Label>
              <Input
                id="growthOpportunities"
                value={formData.growthOpportunities}
                onChange={(e) => setFormData({ ...formData, growthOpportunities: e.target.value })}
                placeholder="Opportunity A, Opportunity B"
                className="text-gray-900 bg-white"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Deal'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

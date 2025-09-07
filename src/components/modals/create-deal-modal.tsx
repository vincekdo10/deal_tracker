'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DealStage, Priority } from '@/types';
import { X } from 'lucide-react';
import { LogoInput } from '@/components/ui/logo-preview';

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
    dealStage: 'ENGAGE' as DealStage,
    productsInUse: '',
    growthOpportunities: '',
    renewalDate: '',
    salesDirectorId: '',
    teamId: '',
    eb: '',
  });
  const [companyDomain, setCompanyDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const resetForm = () => {
    setFormData({
      accountName: '',
      stakeholders: '',
      arr: '',
      tam: '',
      dealPriority: 'MEDIUM',
      dealStage: 'ENGAGE',
      productsInUse: '',
      growthOpportunities: '',
      renewalDate: '',
      salesDirectorId: '',
      teamId: '',
      eb: '',
    });
    setCompanyDomain('');
    setError('');
    setCurrentUser(null);
  };

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal is closed
      resetForm();
    }
  }, [isOpen]);

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
              // No teams available yet
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
                
                // Get the sales director's teams and auto-assign to their team
                try {
                  const userTeamsResponse = await fetch('/api/users/me/teams', {
                    credentials: 'include',
                  });
                  if (userTeamsResponse.ok) {
                    const userTeamsData = await userTeamsResponse.json();
                    setTeams(userTeamsData.teams);
                    
                    // Auto-assign to the first team if they have teams
                    if (userTeamsData.teams.length > 0) {
                      setFormData(prev => ({
                        ...prev,
                        teamId: userTeamsData.teams[0].id
                      }));
                    }
                  }
                } catch (error) {
                  console.error('Failed to fetch user teams:', error);
                }
              }
            } catch (error) {
              // No users available yet
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
          companyDomain: companyDomain || null,
          arr: formData.arr ? parseFloat(formData.arr) : null,
          tam: formData.tam ? parseFloat(formData.tam) : null,
          renewalDate: formData.renewalDate || null,
          teamId: formData.teamId || null,
          assignedTo: formData.salesDirectorId || currentUser?.id || null,
          eb: formData.eb || null,
        }),
      });

      if (response.ok) {
        onSuccess();
        resetForm();
        onClose();
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="accountName" className="text-foreground">Account Name *</Label>
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
                <LogoInput
                  value={companyDomain}
                  onChange={setCompanyDomain}
                  label="Company Domain"
                  placeholder="e.g., google.com, microsoft.com"
                />
              </div>

              <div>
                <Label htmlFor="dealStage" className="text-foreground">Deal Stage</Label>
                <select
                  id="dealStage"
                  value={formData.dealStage}
                  onChange={(e) => setFormData({ ...formData, dealStage: e.target.value as DealStage })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="ENGAGE">Engage</option>
                  <option value="DISCOVER">Discover</option>
                  <option value="SCOPE">Scope</option>
                  <option value="TECHNICAL_VALIDATION">Technical Validation</option>
                  <option value="BUSINESS_JUSTIFICATION">Business Justification</option>
                  <option value="NEGOTIATE">Negotiate</option>
                  <option value="CLOSED_WON">Closed Won</option>
                  <option value="CLOSED_LOST">Closed Lost</option>
                </select>
              </div>

              <div>
                <Label htmlFor="dealPriority" className="text-foreground">Priority</Label>
                <select
                  id="dealPriority"
                  value={formData.dealPriority}
                  onChange={(e) => setFormData({ ...formData, dealPriority: e.target.value as Priority })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <Label htmlFor="arr" className="text-foreground">ARR ($)</Label>
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
                <Label htmlFor="tam" className="text-foreground">TAM ($)</Label>
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
                <Label htmlFor="renewalDate" className="text-foreground">Renewal Date</Label>
                <Input
                  id="renewalDate"
                  type="date"
                  value={formData.renewalDate}
                  onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                  className="text-gray-900 bg-white"
                />
              </div>

              <div>
                <Label htmlFor="eb" className="text-foreground">Economic Buyer (EB)</Label>
                <Input
                  id="eb"
                  value={formData.eb}
                  onChange={(e) => setFormData({ ...formData, eb: e.target.value })}
                  placeholder="Enter economic buyer name"
                  className="text-gray-900 bg-white"
                />
              </div>

              <div>
                {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SOLUTIONS_ARCHITECT') ? (
                  <>
                    <Label htmlFor="teamId" className="text-foreground">Team</Label>
                    {teams.length > 0 ? (
                      <select
                        id="teamId"
                        value={formData.teamId}
                        onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                  </>
                ) : currentUser?.role === 'SALES_DIRECTOR' ? (
                  <>
                    <Label className="text-foreground">Team</Label>
                    {teams.length > 0 ? (
                      <div className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-gray-50">
                        {teams.find(team => team.id === formData.teamId)?.name || 'Your team will be assigned automatically'}
                      </div>
                    ) : (
                      <div className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 bg-gray-50">
                        No team assigned yet. Contact an administrator to assign you to a team.
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {teams.length > 0 
                        ? "This deal will be automatically assigned to your team"
                        : "You need to be assigned to a team before creating deals"
                      }
                    </p>
                  </>
                ) : (
                  <>
                    <Label className="text-foreground">Team</Label>
                    <div className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 bg-gray-50">
                      Teams are managed by administrators
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Contact an administrator to assign this deal to a team
                    </p>
                  </>
                )}
              </div>

              <div>
                <Label htmlFor="salesDirectorId" className="text-foreground">Sales Director</Label>
                {currentUser?.role === 'SALES_DIRECTOR' ? (
                  <>
                    <div className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-gray-50">
                      {currentUser.firstName} {currentUser.lastName} ({currentUser.email})
                    </div>
                    <p className="text-xs text-gray-500 mt-1">This deal will be assigned to you automatically</p>
                  </>
                ) : (currentUser?.role === 'ADMIN' || currentUser?.role === 'SOLUTIONS_ARCHITECT') ? (
                  <>
                    {users.length > 0 ? (
                      <select
                        id="salesDirectorId"
                        value={formData.salesDirectorId}
                        onChange={(e) => setFormData({ ...formData, salesDirectorId: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                  </>
                ) : (
                  <>
                    <div className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 bg-gray-50">
                      Sales directors are managed by administrators
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Contact an administrator to assign this deal to a sales director
                    </p>
                  </>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="stakeholders" className="text-foreground">Stakeholders (comma-separated)</Label>
              <Input
                id="stakeholders"
                value={formData.stakeholders}
                onChange={(e) => setFormData({ ...formData, stakeholders: e.target.value })}
                placeholder="John Doe, Jane Smith"
                className="text-gray-900 bg-white"
              />
            </div>

            <div>
              <Label htmlFor="productsInUse" className="text-foreground">Products in Use (comma-separated)</Label>
              <Input
                id="productsInUse"
                value={formData.productsInUse}
                onChange={(e) => setFormData({ ...formData, productsInUse: e.target.value })}
                placeholder="Product A, Product B"
                className="text-gray-900 bg-white"
              />
            </div>

            <div>
              <Label htmlFor="growthOpportunities" className="text-foreground">Growth Opportunities (comma-separated)</Label>
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

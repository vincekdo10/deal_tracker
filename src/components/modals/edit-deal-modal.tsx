'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DealStage, Priority, DealWithRelations } from '@/types';
import { X } from 'lucide-react';
import { LogoInput } from '@/components/ui/logo-preview';

interface EditDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  deal: DealWithRelations | null;
}

export function EditDealModal({ isOpen, onClose, onSuccess, deal }: EditDealModalProps) {
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
    teamId: '',
    salesDirectorId: '',
    eb: '',
  });
  const [companyDomain, setCompanyDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (isOpen && deal) {
      setFormData({
        accountName: deal.accountName,
        stakeholders: deal.stakeholders.join(', '),
        arr: deal.arr?.toString() || '',
        tam: deal.tam?.toString() || '',
        dealPriority: deal.dealPriority,
        dealStage: deal.dealStage,
        productsInUse: deal.productsInUse.join(', '),
        growthOpportunities: deal.growthOpportunities.join(', '),
        renewalDate: deal.renewalDate ? new Date(deal.renewalDate).toISOString().split('T')[0] : '',
        teamId: deal.team?.id || '',
        salesDirectorId: deal.assignedTo?.id || '',
        eb: deal.eb || '',
      });
      setCompanyDomain(deal.companyDomain || '');
      
      // Fetch current user and available teams/users for admins and solutions architects
      const fetchUserAndData = async () => {
        try {
          // Get current user info
          const userResponse = await fetch('/api/auth/me', {
            credentials: 'include',
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setCurrentUser(userData.user);
            
            // Fetch teams and users based on role
            if (userData.user.role === 'ADMIN') {
              // Admin can see all teams and users
              const [teamsResponse, usersResponse] = await Promise.all([
                fetch('/api/admin/teams', { credentials: 'include' }),
                fetch('/api/users', { credentials: 'include' })
              ]);
              
              if (teamsResponse.ok) {
                const teamsData = await teamsResponse.json();
                setTeams(teamsData.teams);
              }
              
              if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                setUsers(usersData.users.filter((user: any) => user.role === 'SALES_DIRECTOR'));
              }
            } else if (userData.user.role === 'SOLUTIONS_ARCHITECT') {
              // Solutions Architect can see their teams and users from those teams
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
            }
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        }
      };
      
      fetchUserAndData();
    }
  }, [isOpen, deal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/deals/${deal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          stakeholders: formData.stakeholders.split(',').map(s => s.trim()).filter(Boolean),
          productsInUse: formData.productsInUse.split(',').map(s => s.trim()).filter(Boolean),
          growthOpportunities: formData.growthOpportunities.split(',').map(s => s.trim()).filter(Boolean),
          companyDomain: companyDomain || null,
          arr: formData.arr ? parseFloat(formData.arr) : null,
          tam: formData.tam ? parseFloat(formData.tam) : null,
          renewalDate: formData.renewalDate || null,
          teamId: formData.teamId || null,
          assignedTo: formData.salesDirectorId || null,
          eb: formData.eb || null,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update deal');
      }
    } catch (error) {
      console.error('Update deal error:', error);
      setError('Failed to update deal');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !deal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Edit Deal</CardTitle>
              <CardDescription>Update deal information</CardDescription>
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
                <LogoInput
                  value={companyDomain}
                  onChange={setCompanyDomain}
                  label="Company Domain"
                  placeholder="e.g., google.com, microsoft.com"
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

              <div>
                <Label htmlFor="eb" className="text-gray-900">Economic Buyer (EB)</Label>
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
                        No teams available yet.
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Label className="text-gray-900">Team</Label>
                    <div className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 bg-gray-50">
                      {deal.team?.name || 'No team assigned'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Only administrators and solutions architects can change team assignments
                    </p>
                  </>
                )}
              </div>

              <div>
                {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SOLUTIONS_ARCHITECT') ? (
                  <>
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
                        No sales directors available yet.
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Label className="text-gray-900">Sales Director</Label>
                    <div className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 bg-gray-50">
                      {deal.assignedTo ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : 'No sales director assigned'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Only administrators and solutions architects can change sales director assignments
                    </p>
                  </>
                )}
              </div>
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
                placeholder="Expansion, New Features"
                className="text-gray-900 bg-white"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Deal'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Team Member Accounts - Premium Multi-User Access
 * Allows suppliers to add team members with specific permissions
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { useDataFreshness } from '@/hooks/useDataFreshness';
import { logError } from '@/utils/errorLogger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Badge } from '@/components/shared/ui/badge';
import { Switch } from '@/components/shared/ui/switch';
import { 
  Users, UserPlus, Mail, Shield, DollarSign, Package, 
  FileText, Truck, X, CheckCircle, Clock, AlertCircle,
  Crown, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/shared/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { getCompanySubscription } from '@/services/subscriptionService';
import SubscriptionUpsell from '@/components/upsell/SubscriptionUpsell';

const TEAM_ROLES = [
  { value: 'sales_rep', label: 'Sales Representative', icon: Package, description: 'Manage products and quotes' },
  { value: 'finance_rep', label: 'Finance Representative', icon: DollarSign, description: 'View payouts and financial data' },
  { value: 'operations_rep', label: 'Operations Representative', icon: Truck, description: 'Manage orders and tracking' },
  { value: 'member', label: 'Team Member', icon: Users, description: 'General team access' }
];

import RequireCapability from '@/guards/RequireCapability';

function TeamMembersInner() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady } = useDashboardKernel();
  
  const location = useLocation();
  // Derive role from capabilities for display purposes
  const isSeller = capabilities?.can_sell === true && capabilities?.sell_status === 'approved';
  const currentRole = isSeller ? 'seller' : 'buyer';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isInviting, setIsInviting] = useState(false);
  
  // ✅ GLOBAL HARDENING: Data freshness tracking (30 second threshold)
  const { isStale, markFresh } = useDataFreshness(30000);
  const lastLoadTimeRef = useRef(null);
  
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'member',
    can_view_payouts: false,
    can_view_tracking: false,
    can_manage_products: false,
    can_manage_orders: false,
    can_manage_rfqs: false
  });

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[TeamMembers] Waiting for auth to be ready...');
      return;
    }

    // GUARD: Wait for capabilities to be ready
    if (!capabilitiesReady || capabilitiesLoading) {
      console.log('[TeamMembers] Waiting for capabilities to be ready...');
      return;
    }

    // GUARD: No user → show error
    if (!userId) {
      toast.error('Please log in to continue');
      return;
    }

    // ✅ GLOBAL HARDENING: Check if data is stale (older than 30 seconds)
    const shouldRefresh = isStale || 
                         !lastLoadTimeRef.current || 
                         (Date.now() - lastLoadTimeRef.current > 30000);
    
    if (shouldRefresh) {
      console.log('[TeamMembers] Data is stale or first load - refreshing');
      loadData();
    } else {
      console.log('[TeamMembers] Data is fresh - skipping reload');
    }
  }, [authReady, authLoading, userId, userCompanyId, capabilitiesReady, capabilitiesLoading, location.pathname, isStale]);

  const loadData = async () => {
    if (!profileCompanyId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // ✅ KERNEL MIGRATION: Use profileCompanyId from kernel
      // Load subscription status
      try {
        const subscription = await getCompanySubscription(profileCompanyId);
        setCurrentPlan(subscription?.plan_type || 'free');
      } catch (err) {
        // ✅ GLOBAL HARDENING: Enhanced error logging
        logError('loadData-subscription', err, {
          companyId: profileCompanyId,
          userId: userId
        });
      }

      // Load team members - Fix: Better error handling
      const { data: teamData, error: teamError } = await supabase
        .from('company_team')
        .select('*')
        .eq('company_id', profileCompanyId)
        .order('created_at', { ascending: false });

      // ✅ GLOBAL HARDENING: Enhanced error logging
      if (teamError) {
        logError('loadData-team', teamError, {
          table: 'company_team',
          companyId: profileCompanyId,
          userId: userId
        });
        throw teamError;
      }
      
      setTeamMembers(teamData || []);
      
      // ✅ GLOBAL HARDENING: Mark fresh ONLY on successful load
      lastLoadTimeRef.current = Date.now();
      markFresh();
    } catch (err) {
      logError('loadData', err, {
        table: 'company_team',
        companyId: profileCompanyId,
        userId: userId
      });
      setError(err.message || 'Failed to load team members');
      toast.error('Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteForm.email || !profileCompanyId) {
      toast.error('Please enter an email address');
      return;
    }

    // Check subscription limits
    if (currentPlan === 'free' && teamMembers.filter(m => m.status === 'active').length >= 1) {
      toast.error('Free plan allows only 1 team member. Upgrade to add more.');
      setShowInviteDialog(false);
      return;
    }

    if (currentPlan === 'growth' && teamMembers.filter(m => m.status === 'active').length >= 3) {
      toast.error('Growth plan allows up to 3 team members. Upgrade to Elite for unlimited.');
      setShowInviteDialog(false);
      return;
    }

    setIsInviting(true);
    try {
      // ✅ KERNEL MIGRATION: Use profileCompanyId and userId from kernel
      const { error } = await supabase
        .from('company_team')
        .insert({
          company_id: profileCompanyId,
          member_email: inviteForm.email,
          member_name: inviteForm.name || null,
          role_label: inviteForm.role,
          status: 'invited',
          can_view_payouts: inviteForm.can_view_payouts,
          can_view_tracking: inviteForm.can_view_tracking,
          can_manage_products: inviteForm.can_manage_products,
          can_manage_orders: inviteForm.can_manage_orders,
          can_manage_rfqs: inviteForm.can_manage_rfqs,
          invited_at: new Date().toISOString(),
          created_by: userId
        });

      if (error) throw error;

      toast.success(`Invitation sent to ${inviteForm.email}`);
      setShowInviteDialog(false);
      setInviteForm({
        email: '',
        name: '',
        role: 'member',
        can_view_payouts: false,
        can_view_tracking: false,
        can_manage_products: false,
        can_manage_orders: false,
        can_manage_rfqs: false
      });
      loadData();
    } catch (error) {
      // ✅ GLOBAL HARDENING: Enhanced error logging
      logError('handleInviteMember', error, {
        table: 'company_team',
        companyId: companyId,
        userId: userId
      });
      toast.error('Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdatePermissions = async (memberId, permissions) => {
    try {
      const { error } = await supabase
        .from('company_team')
        .update(permissions)
        .eq('id', memberId);

      if (error) throw error;
      toast.success('Permissions updated');
      loadData();
    } catch (error) {
      // ✅ GLOBAL HARDENING: Enhanced error logging
      logError('handleUpdatePermissions', error, {
        table: 'company_team',
        companyId: profileCompanyId,
        userId: userId
      });
      toast.error('Failed to update permissions');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const { error } = await supabase
        .from('company_team')
        .update({ status: 'inactive' })
        .eq('id', memberId);

      if (error) throw error;
      toast.success('Team member removed');
      loadData();
    } catch (error) {
      // ✅ GLOBAL HARDENING: Enhanced error logging
      logError('handleRemoveMember', error, {
        table: 'company_team',
        companyId: companyId,
        userId: userId
      });
      toast.error('Failed to remove team member');
    }
  };

  const getRoleIcon = (role) => {
    const roleData = TEAM_ROLES.find(r => r.value === role);
    return roleData?.icon || Users;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'invited':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Invited</Badge>;
      case 'pending':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge className="bg-gray-50 text-gray-700 border-gray-200"><X className="w-3 h-3 mr-1" />Inactive</Badge>;
    }
  };

  const activeMembersCount = teamMembers.filter(m => m.status === 'active').length;
  const maxMembers = currentPlan === 'free' ? 1 : currentPlan === 'growth' ? 3 : 999;

  // ✅ KERNEL MIGRATION: Use unified loading state
  if (isLoading) {
    return <CardSkeleton count={3} />;
  }

  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={loadData}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">Team Members</h1>
            <p className="text-afrikoni-text-dark/70">
              Manage your team with role-based access and permissions
            </p>
          </div>
          <Button
            onClick={() => setShowInviteDialog(true)}
            className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
            disabled={activeMembersCount >= maxMembers}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </motion.div>

        {/* Subscription Upsell */}
        {(currentPlan === 'free' || currentPlan === 'growth') && (
          <SubscriptionUpsell 
            currentPlan={currentPlan} 
            variant="banner" 
            placement="team"
            customMessage="Upgrade to add more team members and unlock advanced permissions"
          />
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-text-dark/70">Active Members</p>
                  <p className="text-2xl font-bold text-afrikoni-text-dark">{activeMembersCount}</p>
                </div>
                <Users className="w-8 h-8 text-afrikoni-gold" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-text-dark/70">Plan Limit</p>
                  <p className="text-2xl font-bold text-afrikoni-text-dark">
                    {maxMembers === 999 ? 'Unlimited' : maxMembers}
                  </p>
                </div>
                <Crown className="w-8 h-8 text-afrikoni-gold" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-text-dark/70">Pending Invites</p>
                  <p className="text-2xl font-bold text-afrikoni-text-dark">
                    {teamMembers.filter(m => m.status === 'invited' || m.status === 'pending').length}
                  </p>
                </div>
                <Mail className="w-8 h-8 text-afrikoni-gold" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage access and permissions for your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-afrikoni-text-dark/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-afrikoni-text-dark mb-2">No team members yet</h3>
                <p className="text-afrikoni-text-dark/70 mb-4">
                  Invite team members to collaborate on your business
                </p>
                <Button
                  onClick={() => setShowInviteDialog(true)}
                  className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite First Member
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member) => {
                  const RoleIcon = getRoleIcon(member.role_label);
                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 border border-afrikoni-gold/20 rounded-lg hover:border-afrikoni-gold/40 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-afrikoni-gold/10 rounded-lg">
                              <RoleIcon className="w-5 h-5 text-afrikoni-gold" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-afrikoni-text-dark">
                                  {member.member_name || member.member_email}
                                </h3>
                                {getStatusBadge(member.status)}
                              </div>
                              <p className="text-sm text-afrikoni-text-dark/70">{member.member_email}</p>
                              <p className="text-xs text-afrikoni-text-dark/60 mt-1">
                                {TEAM_ROLES.find(r => r.value === member.role_label)?.label || member.role_label}
                              </p>
                            </div>
                          </div>

                          {/* Permissions */}
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={member.can_view_payouts || false}
                                onCheckedChange={(checked) => 
                                  handleUpdatePermissions(member.id, { can_view_payouts: checked })
                                }
                                disabled={member.status !== 'active'}
                              />
                              <Label className="text-xs flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                Payouts
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={member.can_view_tracking || false}
                                onCheckedChange={(checked) => 
                                  handleUpdatePermissions(member.id, { can_view_tracking: checked })
                                }
                                disabled={member.status !== 'active'}
                              />
                              <Label className="text-xs flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                Tracking
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={member.can_manage_products || false}
                                onCheckedChange={(checked) => 
                                  handleUpdatePermissions(member.id, { can_manage_products: checked })
                                }
                                disabled={member.status !== 'active'}
                              />
                              <Label className="text-xs flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                Products
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={member.can_manage_orders || false}
                                onCheckedChange={(checked) => 
                                  handleUpdatePermissions(member.id, { can_manage_orders: checked })
                                }
                                disabled={member.status !== 'active'}
                              />
                              <Label className="text-xs flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Orders
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={member.can_manage_rfqs || false}
                                onCheckedChange={(checked) => 
                                  handleUpdatePermissions(member.id, { can_manage_rfqs: checked })
                                }
                                disabled={member.status !== 'active'}
                              />
                              <Label className="text-xs flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                RFQs
                              </Label>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invite Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Add a team member with specific permissions. They'll receive an email invitation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="team.member@example.com"
                />
              </div>
              <div>
                <Label>Name (Optional)</Label>
                <Input
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={inviteForm.role} onValueChange={(value) => {
                  setInviteForm({ ...inviteForm, role: value });
                  // Auto-set permissions based on role
                  if (value === 'sales_rep') {
                    setInviteForm(prev => ({ ...prev, can_manage_products: true, can_manage_rfqs: true }));
                  } else if (value === 'finance_rep') {
                    setInviteForm(prev => ({ ...prev, can_view_payouts: true }));
                  } else if (value === 'operations_rep') {
                    setInviteForm(prev => ({ ...prev, can_view_tracking: true, can_manage_orders: true }));
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          <role.icon className="w-4 h-4" />
                          <div>
                            <div>{role.label}</div>
                            <div className="text-xs text-afrikoni-text-dark/60">{role.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-3 block">Permissions</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      View Payouts & Financial Data
                    </Label>
                    <Switch
                      checked={inviteForm.can_view_payouts}
                      onCheckedChange={(checked) => setInviteForm({ ...inviteForm, can_view_payouts: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      View Tracking & Shipments
                    </Label>
                    <Switch
                      checked={inviteForm.can_view_tracking}
                      onCheckedChange={(checked) => setInviteForm({ ...inviteForm, can_view_tracking: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Manage Products
                    </Label>
                    <Switch
                      checked={inviteForm.can_manage_products}
                      onCheckedChange={(checked) => setInviteForm({ ...inviteForm, can_manage_products: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Manage Orders
                    </Label>
                    <Switch
                      checked={inviteForm.can_manage_orders}
                      onCheckedChange={(checked) => setInviteForm({ ...inviteForm, can_manage_orders: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Manage RFQs
                    </Label>
                    <Switch
                      checked={inviteForm.can_manage_rfqs}
                      onCheckedChange={(checked) => setInviteForm({ ...inviteForm, can_manage_rfqs: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleInviteMember}
                  disabled={isInviting || !inviteForm.email}
                  className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
                >
                  {isInviting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export default function TeamMembers() {
  return (
    <>
      {/* PHASE 5B: Team members requires sell capability (approved) */}
      <RequireCapability canSell={true} requireApproved={true}>
        <TeamMembersInner />
      </RequireCapability>
    </>
  );
}

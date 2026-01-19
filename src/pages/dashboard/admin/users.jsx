/**
 * Afrikoni Shield™ - Admin User Management
 * Admin-only page for managing user roles and permissions
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, ArrowLeft, Shield, Search, Filter, UserCheck, UserX,
  Mail, Calendar, CheckCircle, XCircle, AlertTriangle, RefreshCw, Eye, ExternalLink
} from 'lucide-react';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
// NOTE: Admin check done at route level - removed isAdmin import
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import AccessDenied from '@/components/AccessDenied';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';
import { toast } from 'sonner';

// Mock user data - in production, this would come from Supabase
const mockUsers = [
  {
    id: 'user_1',
    email: 'admin@afrikoni.com',
    fullName: 'Admin User',
    role: 'admin',
    createdAt: '2024-01-15T10:00:00Z',
    lastLogin: '2024-02-07T15:30:00Z',
    status: 'active'
  },
  {
    id: 'user_2',
    email: 'compliance@afrikoni.com',
    fullName: 'Compliance Officer',
    role: 'compliance',
    createdAt: '2024-01-20T10:00:00Z',
    lastLogin: '2024-02-07T14:20:00Z',
    status: 'active'
  },
  {
    id: 'user_3',
    email: 'risk@afrikoni.com',
    fullName: 'Risk Analyst',
    role: 'risk',
    createdAt: '2024-01-25T10:00:00Z',
    lastLogin: '2024-02-07T13:15:00Z',
    status: 'active'
  },
  {
    id: 'user_4',
    email: 'buyer@example.com',
    fullName: 'John Buyer',
    role: 'buyer',
    createdAt: '2024-02-01T10:00:00Z',
    lastLogin: '2024-02-07T12:00:00Z',
    status: 'active'
  },
  {
    id: 'user_5',
    email: 'seller@example.com',
    fullName: 'Jane Seller',
    role: 'seller',
    createdAt: '2024-02-02T10:00:00Z',
    lastLogin: '2024-02-07T11:30:00Z',
    status: 'active'
  }
];

// Real roles from the database
const availableRoles = [
  { value: 'all', label: 'All Roles', description: 'Show all users' },
  { value: 'buyer', label: 'Buyer', description: 'Buyer account' },
  { value: 'seller', label: 'Seller', description: 'Seller/Supplier account' },
  { value: 'hybrid', label: 'Hybrid', description: 'Both buyer and seller' },
  { value: 'logistics', label: 'Logistics', description: 'Logistics partner' },
  { value: 'admin', label: 'Admin', description: 'Full system access' }
];

export default function AdminUsers() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady, isAdmin } = useDashboardKernel();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // Local loading state
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('user');

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return <SpinnerWithTimeout message="Loading user management..." ready={isSystemReady} />;
  }
  
  // ✅ KERNEL MIGRATION: Check if user is authenticated
  if (!userId) {
    return <AccessDenied />;
  }
  
  // ✅ KERNEL MIGRATION: Check admin access
  if (!isAdmin) {
    return <AccessDenied />;
  }

  useEffect(() => {
    // ✅ KERNEL MIGRATION: Use canLoadData guard
    if (!canLoadData) {
      return;
    }
    
    loadUsers();
  }, [canLoadData]);

  const loadUsers = async () => {
    try {
      console.log('[User Management] Loading all users...');
      
      // Load all users from profiles table with company data
      // Using public read policy - should work for all authenticated users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          companies:company_id (
            id,
            company_name,
            country,
            city,
            phone,
            email,
            verification_status,
            verified,
            created_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5000); // Increased limit to show all users

      if (profilesError) {
        console.error('❌ Error loading users:', profilesError);
        console.error('Error details:', {
          message: profilesError.message,
          code: profilesError.code,
          details: profilesError.details,
          hint: profilesError.hint
        });
        
        // Show user-friendly error message
        if (profilesError.message?.includes('infinite recursion')) {
          toast.error('Database policy error. Please refresh the page.', {
            description: 'If the issue persists, contact support.'
          });
        } else if (profilesError.code === '42501' || profilesError.message?.includes('permission')) {
          toast.error('Permission denied. Admin access required.', {
            description: 'Please ensure you have admin privileges.'
          });
        } else {
          toast.error('Failed to load users', {
            description: profilesError.message || 'Unknown error occurred'
          });
        }
        setUsers([]);
        return;
      }

      console.log(`[User Management] ✅ Found ${profilesData?.length || 0} users from profiles table`);

      // ✅ KERNEL MIGRATION: Use userId from kernel instead of supabase.auth.getUser()
      // Note: We can't directly query auth.users from the client, so we'll use created_at as fallback
      // userId is already available from useDashboardKernel() hook
      
      // Process users with company data
      const usersWithCompanies = (profilesData || []).map(profile => {
        const company = profile.companies;
        
        // Determine role using REAL data from database: admin (if is_admin) > profile role > company role > 'buyer' default
        let displayRole = 'buyer'; // Default to buyer (real role) instead of 'user'
        
        if (profile.is_admin || profile.email?.toLowerCase() === 'youba.thiam@icloud.com') {
          displayRole = 'admin';
        } else if (profile.role) {
          // Use the actual role from profiles table (buyer, seller, hybrid, logistics)
          displayRole = profile.role;
        } else if (company?.role) {
          // Fallback to company role if profile doesn't have one
          displayRole = company.role;
        }

        return {
          id: profile.id,
          email: profile.email || 'No email',
          fullName: profile.full_name || profile.email?.split('@')[0] || 'Unknown User',
          role: displayRole,
          createdAt: profile.created_at,
          lastLogin: profile.updated_at || profile.created_at, // Use updated_at as fallback for last activity
          status: 'active',
          companyName: company?.company_name || 'No company yet',
          country: company?.country || profile.country || 'Not specified',
          isAdmin: profile.is_admin || false,
          verificationStatus: company?.verification_status || 'unverified',
          isVerified: company?.verified || false
        };
      });

      setUsers(usersWithCompanies);
      console.log(`[User Management] ✅ Successfully loaded ${usersWithCompanies.length} users`);
      console.log('[User Management] Users with REAL roles:', usersWithCompanies.map(u => ({
        email: u.email,
        name: u.fullName,
        role: u.role,
        isAdmin: u.isAdmin,
        company: u.companyName
      })));
      
      // Log role distribution (real-time data)
      const roleCounts = usersWithCompanies.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
      }, {});
      console.log('[User Management] 📊 Real-time role distribution:', roleCounts);
    } catch (error) {
      console.error('Error loading users:', error);
      setError(error?.message || 'Failed to load users');
      console.error('❌ Error loading users:', error);
      toast.error('Failed to load users', {
        description: error.message || 'Unknown error occurred'
      });
      setUsers([]);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId, newRole) => {
    try {
      // Update role in Supabase database
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        toast.error('Failed to update role', {
          description: error.message || 'Unknown error occurred'
        });
        return;
      }

      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setEditingUser(null);
      toast.success('Role updated successfully');
      console.log(`✅ Role changed for user ${userId} to ${newRole}`);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role', {
        description: error.message || 'Unknown error occurred'
      });
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-red-50 text-red-700 border-red-200';
      case 'buyer': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'seller': return 'bg-green-50 text-green-700 border-green-200';
      case 'hybrid': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'logistics': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Get all unique roles from the loaded users (for dynamic role filter)
  const allRolesInData = [...new Set(users.map(u => u.role).filter(Boolean))];

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-afrikoni-text-dark/70">Loading...</div>
        </div>
      </>
    );
  }

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link to="/dashboard/risk" className="inline-flex items-center gap-2 text-afrikoni-gold hover:text-afrikoni-gold/80 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Panel
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-afrikoni-gold" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-2 leading-tight">
                User Management
              </h1>
              <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">
                Manage user roles and permissions across Afrikoni OS
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-afrikoni-gold" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-afrikoni-gold/30 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 rounded-afrikoni"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-afrikoni-text-dark/70" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="text-sm border border-afrikoni-gold/30 rounded-afrikoni px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-afrikoni-gold/20"
                >
                  {availableRoles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
          <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">All Users ({filteredUsers.length})</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('[User Management] Refreshing users...');
                  loadUsers();
                }}
                className="border-afrikoni-gold/30 rounded-afrikoni"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-afrikoni-text-dark/30" />
                <p className="text-afrikoni-text-dark/70 mb-2">
                  {searchTerm || roleFilter !== 'all' 
                    ? 'No users match your filters'
                    : 'No users found'}
                </p>
                {searchTerm || roleFilter !== 'all' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setRoleFilter('all');
                    }}
                    className="mt-2 border-afrikoni-gold/30 rounded-afrikoni"
                  >
                    Clear Filters
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('[User Management] Reloading users...');
                      loadUsers();
                    }}
                    className="mt-2 border-afrikoni-gold/30 rounded-afrikoni"
                  >
                    Reload Users
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-afrikoni-ivory">
                    <tr className="border-b border-afrikoni-gold/20">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-afrikoni-text-dark">User</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-afrikoni-text-dark">Role</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-afrikoni-text-dark">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-afrikoni-text-dark">Created</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-afrikoni-text-dark">Last Login</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-afrikoni-text-dark">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((userItem) => (
                    <tr 
                      key={userItem.id} 
                      className="border-b border-afrikoni-gold/10 hover:bg-afrikoni-sand/10 transition-colors cursor-pointer"
                      onClick={() => {
                        // Navigate to user's company info or settings page
                        sessionStorage.setItem('adminViewingUserId', userItem.id);
                        if (userItem.companyId) {
                          navigate(`/dashboard/company-info?userId=${userItem.id}`);
                        } else {
                          navigate(`/dashboard/settings?userId=${userItem.id}`);
                        }
                        toast.info(`Viewing data for: ${userItem.fullName}`);
                      }}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-afrikoni-text-dark">{userItem.fullName}</div>
                          <div className="text-xs text-afrikoni-text-dark/70 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {userItem.email}
                          </div>
                          {userItem.companyName && userItem.companyName !== 'No company yet' && (
                            <div className="text-xs text-afrikoni-text-dark/60 mt-1">
                              📁 {userItem.companyName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {editingUser === userItem.id ? (
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="text-sm border border-afrikoni-gold/30 rounded-afrikoni px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-afrikoni-gold/20"
                          >
                            {availableRoles.map(role => (
                              <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                          </select>
                        ) : (
                          <Badge className={getRoleColor(userItem.role)}>
                            {userItem.role?.charAt(0).toUpperCase() + userItem.role?.slice(1) || 'Unknown'}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                          {userItem.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-afrikoni-text-dark/70">
                        {userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-xs text-afrikoni-text-dark/70">
                        {userItem.lastLogin ? new Date(userItem.lastLogin).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {editingUser === userItem.id ? (
                            <>
                              <Button
                                size="sm"
                                className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal rounded-afrikoni"
                                onClick={() => handleRoleChange(userItem.id, selectedRole)}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-afrikoni-gold/30 rounded-afrikoni"
                                onClick={() => setEditingUser(null)}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-afrikoni-gold/30 rounded-afrikoni"
                                onClick={() => {
                                  setEditingUser(userItem.id);
                                  setSelectedRole(userItem.role);
                                }}
                                disabled={userItem.role === 'admin' && user?.id !== userItem.id}
                              >
                                <UserCheck className="w-3 h-3 mr-1" />
                                Edit Role
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-300 rounded-afrikoni text-blue-700 hover:bg-blue-50"
                                onClick={() => {
                                  sessionStorage.setItem('adminViewingUserId', userItem.id);
                                  if (userItem.companyId) {
                                    navigate(`/dashboard/company-info?userId=${userItem.id}`);
                                  } else {
                                    navigate(`/dashboard/settings?userId=${userItem.id}`);
                                  }
                                  toast.info(`Viewing data for: ${userItem.fullName}`, {
                                    description: 'Click anywhere on the row to view/edit user data'
                                  });
                                }}
                                title="View/Edit user profile and company data"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Information */}
        <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
          <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
            <CardTitle className="text-base font-semibold">Role Descriptions</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableRoles.filter(r => r.value !== 'all').map(role => {
                // Count users with this role (real-time data from database)
                const roleCount = users.filter(u => u.role === role.value).length;
                return (
                  <div key={role.value} className="p-4 border border-afrikoni-gold/20 rounded-afrikoni bg-afrikoni-ivory">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getRoleColor(role.value)}>
                        {role.label}
                      </Badge>
                      <span className="text-xs text-afrikoni-text-dark/60 font-semibold">
                        {roleCount} user{roleCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-sm text-afrikoni-text-dark/70">{role.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}


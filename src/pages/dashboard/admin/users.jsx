/**
 * Afrikoni Shield™ - Admin User Management
 * Admin-only page for managing user roles and permissions
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, ArrowLeft, Shield, Search, Filter, UserCheck, UserX,
  Mail, Calendar, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isAdmin } from '@/utils/permissions';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import AccessDenied from '@/components/AccessDenied';
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

const availableRoles = [
  { value: 'user', label: 'User', description: 'Regular buyer/seller' },
  { value: 'admin', label: 'Admin', description: 'Full system access' },
  { value: 'compliance', label: 'Compliance', description: 'Compliance officer' },
  { value: 'risk', label: 'Risk', description: 'Risk analyst' },
  { value: 'support', label: 'Support', description: 'Customer support' }
];

export default function AdminUsers() {
  const [user, setUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('user');

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      setUser(userData);
      const admin = isAdmin(userData);
      setHasAccess(admin);
      
      if (admin) {
        await loadUsers();
      }
    } catch (error) {
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // Load real users from profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, user_role, created_at, last_sign_in_at, is_admin')
        .order('created_at', { ascending: false })
        .limit(100);

      if (profilesError) {
        console.error('Error loading users:', profilesError);
        toast.error('Failed to load users');
        return;
      }

      // Load company data for each user
      const userIds = profilesData?.map(p => p.id) || [];
      let companyMap = {};
      
      if (userIds.length > 0) {
        const { data: companiesData } = await supabase
          .from('companies')
          .select('owner_id, company_name, role, country')
          .in('owner_id', userIds);

        // Map companies to users
        (companiesData || []).forEach(company => {
          if (company.owner_id) {
            companyMap[company.owner_id] = company;
          }
        });
      }

      // Combine profile and company data
      const usersWithCompanies = (profilesData || []).map(profile => {
        const company = companyMap[profile.id];
        return {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name || profile.email?.split('@')[0] || 'Unknown',
          role: profile.is_admin ? 'admin' : (company?.role || profile.user_role || 'user'),
          createdAt: profile.created_at,
          lastLogin: profile.last_sign_in_at,
          status: 'active', // You can add a status field to profiles if needed
          companyName: company?.company_name,
          country: company?.country
        };
      });

      setUsers(usersWithCompanies);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (userId, newRole) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    setEditingUser(null);
    // In production, this would update Supabase
    console.log(`Role changed for user ${userId} to ${newRole}`);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-50 text-red-700 border-red-200';
      case 'compliance': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'risk': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'support': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <DashboardLayout currentRole="admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-afrikoni-text-dark/70">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return (
    <DashboardLayout currentRole="admin">
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
                  <option value="all">All Roles</option>
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
            <CardTitle className="text-base font-semibold">All Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
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
                    <tr key={userItem.id} className="border-b border-afrikoni-gold/10 hover:bg-afrikoni-sand/10 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-afrikoni-text-dark">{userItem.fullName}</div>
                          <div className="text-xs text-afrikoni-text-dark/70 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {userItem.email}
                          </div>
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
                            {userItem.role}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                          {userItem.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-afrikoni-text-dark/70">
                        {new Date(userItem.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-xs text-afrikoni-text-dark/70">
                        {new Date(userItem.lastLogin).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        {editingUser === userItem.id ? (
                          <div className="flex items-center gap-2">
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
                          </div>
                        ) : (
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
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Role Information */}
        <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
          <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
            <CardTitle className="text-base font-semibold">Role Descriptions</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              {availableRoles.map(role => (
                <div key={role.value} className="p-4 border border-afrikoni-gold/20 rounded-afrikoni bg-afrikoni-ivory">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getRoleColor(role.value)}>
                      {role.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-afrikoni-text-dark/70">{role.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}


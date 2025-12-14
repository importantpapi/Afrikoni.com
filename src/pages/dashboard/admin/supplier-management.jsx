/**
 * Admin Supplier Management
 * Complete supplier management: add suppliers, set Afrikoni scores, verify suppliers
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, Filter, Shield, Star, CheckCircle, XCircle,
  Building2, Mail, Phone, Globe, MapPin, Award, Edit, Trash2, Save
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { isAdmin } from '@/utils/permissions';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import AccessDenied from '@/components/AccessDenied';
import { format } from 'date-fns';

const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde',
  'Central African Republic', 'Chad', 'Comoros', 'Congo', 'DR Congo', "Côte d'Ivoire", 'Djibouti',
  'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana',
  'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
  'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria',
  'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia',
  'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
];

export default function AdminSupplierManagement() {
  const [user, setUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    phone: '',
    website: '',
    country: '',
    city: '',
    business_type: 'manufacturer',
    description: '',
    afrikoni_score: 0,
    verified: false,
    verification_status: 'unverified'
  });

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (hasAccess) {
      loadSuppliers();
    }
  }, [hasAccess, statusFilter]);

  const checkAccess = async () => {
    try {
      const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      setUser(userData);
      setHasAccess(isAdmin(userData));
    } catch (error) {
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      let query = supabase
        .from('companies')
        .select('*, profiles!companies_user_id_fkey(email, full_name)')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        if (statusFilter === 'verified') {
          query = query.eq('verified', true);
        } else if (statusFilter === 'unverified') {
          query = query.or('verified.is.null,verified.eq.false');
        } else {
          query = query.eq('verification_status', statusFilter);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      setSuppliers(data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast.error('Failed to load suppliers');
      setSuppliers([]);
    }
  };

  const handleAddSupplier = async () => {
    try {
      // Validate required fields
      if (!formData.company_name || !formData.email) {
        toast.error('Company name and email are required');
        return;
      }

      // Check if user exists with this email
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.email)
        .maybeSingle();

      let userId = existingUser?.id;

      // If user doesn't exist, create a profile entry
      if (!userId) {
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            email: formData.email,
            full_name: formData.company_name,
            phone: formData.phone || null
          })
          .select('id')
          .single();

        if (profileError) throw profileError;
        userId = newProfile.id;
      }

      // Create company
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          user_id: userId,
          company_name: formData.company_name,
          email: formData.email,
          phone: formData.phone || null,
          website: formData.website || null,
          country: formData.country || null,
          city: formData.city || null,
          business_type: formData.business_type,
          description: formData.description || null,
          // afrikoni_score will be added if column exists, otherwise ignored
          ...(formData.afrikoni_score ? { afrikoni_score: formData.afrikoni_score } : {}),
          verified: formData.verified,
          verification_status: formData.verified ? 'verified' : 'unverified',
          verified_at: formData.verified ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (companyError) throw companyError;

      toast.success('Supplier added successfully');
      setShowAddDialog(false);
      resetForm();
      loadSuppliers();

      // Send notification if verified
      if (formData.verified) {
        try {
          const { notifyVerificationStatusChange } = await import('@/services/notificationService');
          await notifyVerificationStatusChange(newCompany.id, 'approved');
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
        }
      }
    } catch (error) {
      console.error('Error adding supplier:', error);
      toast.error(error.message || 'Failed to add supplier');
    }
  };

  const handleUpdateScore = async () => {
    if (!selectedSupplier) return;

    try {
      // Try to update afrikoni_score, but handle gracefully if column doesn't exist
      const updateData = {
        updated_at: new Date().toISOString()
      };
      
      // Only add afrikoni_score if it's a valid number
      if (typeof formData.afrikoni_score === 'number' && formData.afrikoni_score >= 0) {
        updateData.afrikoni_score = formData.afrikoni_score;
      }

      const { error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', selectedSupplier.id);

      if (error) {
        // If error is about missing column, show helpful message
        if (error.message?.includes('column') && error.message?.includes('afrikoni_score')) {
          toast.error('Afrikoni score column not found in database. Please add it to the companies table.');
          return;
        }
        throw error;
      }

      toast.success('Afrikoni score updated');
      setShowScoreDialog(false);
      setSelectedSupplier(null);
      loadSuppliers();
    } catch (error) {
      console.error('Error updating score:', error);
      toast.error('Failed to update score');
    }
  };

  const handleVerifySupplier = async (supplierId) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          verified: true,
          verification_status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', supplierId);

      if (error) throw error;

      toast.success('Supplier verified');
      loadSuppliers();

      // Send notification
      try {
        const { notifyVerificationStatusChange } = await import('@/services/notificationService');
        await notifyVerificationStatusChange(supplierId, 'approved');
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
    } catch (error) {
      console.error('Error verifying supplier:', error);
      toast.error('Failed to verify supplier');
    }
  };

  const handleUnverifySupplier = async (supplierId) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          verified: false,
          verification_status: 'unverified',
          verified_at: null
        })
        .eq('id', supplierId);

      if (error) throw error;

      toast.success('Supplier verification removed');
      loadSuppliers();
    } catch (error) {
      console.error('Error unverifying supplier:', error);
      toast.error('Failed to remove verification');
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (!confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', supplierId);

      if (error) throw error;

      toast.success('Supplier deleted');
      loadSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('Failed to delete supplier');
    }
  };

  const openScoreDialog = (supplier) => {
    setSelectedSupplier(supplier);
    setFormData(prev => ({
      ...prev,
      afrikoni_score: supplier.afrikoni_score || 0
    }));
    setShowScoreDialog(true);
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      email: '',
      phone: '',
      website: '',
      country: '',
      city: '',
      business_type: 'manufacturer',
      description: '',
      afrikoni_score: 0,
      verified: false,
      verification_status: 'unverified'
    });
  };

  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = 
      s.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.country?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Very Good';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <DashboardLayout currentRole="admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-3">
              Supplier Management
            </h1>
            <p className="text-afrikoni-text-dark/70">
              Add suppliers, manage Afrikoni scores, and verify suppliers
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowAddDialog(true);
            }}
            className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </motion.div>

        {/* Filters */}
        <Card className="border-afrikoni-gold/20">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-afrikoni-text-dark/50" />
                  <Input
                    placeholder="Search suppliers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Suppliers List */}
        <div className="grid gap-4">
          {filteredSuppliers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-afrikoni-text-dark/30 mx-auto mb-4" />
                <p className="text-afrikoni-text-dark/70">No suppliers found</p>
              </CardContent>
            </Card>
          ) : (
            filteredSuppliers.map((supplier) => (
              <motion.div
                key={supplier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-4 mb-3">
                          <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-6 h-6 text-afrikoni-gold" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold text-afrikoni-text-dark">
                                {supplier.company_name || 'Unnamed Company'}
                              </h3>
                              {supplier.verified && (
                                <Badge className="bg-afrikoni-gold text-afrikoni-chestnut border-afrikoni-gold">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-afrikoni-text-dark/70">
                              {supplier.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="w-4 h-4" />
                                  {supplier.email}
                                </div>
                              )}
                              {supplier.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-4 h-4" />
                                  {supplier.phone}
                                </div>
                              )}
                              {supplier.country && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {supplier.country}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Afrikoni Score */}
                        <div className="mt-4 flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-afrikoni-gold" />
                            <span className="text-sm font-medium text-afrikoni-text-dark/70">Afrikoni Score:</span>
                            <Badge className={getScoreColor(supplier.afrikoni_score || 0)}>
                              {supplier.afrikoni_score || 0}/100 - {getScoreLabel(supplier.afrikoni_score || 0)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openScoreDialog(supplier)}
                          className="border-afrikoni-gold text-afrikoni-gold hover:bg-afrikoni-gold/10"
                        >
                          <Star className="w-4 h-4 mr-1" />
                          Set Score
                        </Button>
                        {supplier.verified ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnverifySupplier(supplier.id)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Unverify
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifySupplier(supplier.id)}
                            className="border-green-300 text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verify
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Add Supplier Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Company Name *</Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="company@example.com"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {AFRICAN_COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label>Business Type</Label>
                  <Select value={formData.business_type} onValueChange={(value) => setFormData({ ...formData, business_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="trader">Trader</SelectItem>
                      <SelectItem value="distributor">Distributor</SelectItem>
                      <SelectItem value="exporter">Exporter</SelectItem>
                      <SelectItem value="importer">Importer</SelectItem>
                      <SelectItem value="wholesaler">Wholesaler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Afrikoni Score (0-100)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.afrikoni_score}
                    onChange={(e) => setFormData({ ...formData, afrikoni_score: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Company description..."
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="verified"
                  checked={formData.verified}
                  onChange={(e) => setFormData({ ...formData, verified: e.target.checked, verification_status: e.target.checked ? 'verified' : 'unverified' })}
                  className="w-4 h-4"
                />
                <Label htmlFor="verified" className="cursor-pointer">
                  Verify supplier immediately
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSupplier} className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut">
                  <Save className="w-4 h-4 mr-2" />
                  Add Supplier
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Set Score Dialog */}
        <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Afrikoni Score</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Supplier: {selectedSupplier?.company_name}</Label>
              </div>
              <div>
                <Label>Afrikoni Score (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.afrikoni_score}
                  onChange={(e) => setFormData({ ...formData, afrikoni_score: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-afrikoni-text-dark/60 mt-1">
                  Current: {getScoreLabel(formData.afrikoni_score)} ({formData.afrikoni_score}/100)
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowScoreDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateScore} className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut">
                  <Save className="w-4 h-4 mr-2" />
                  Update Score
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}


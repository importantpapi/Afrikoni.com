import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Package, Building2, Truck, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { getOrCreateCompany } from '@/utils/companyHelper';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';

const roles = [
  {
    id: 'buyer',
    label: 'Buyer',
    description: 'Find and purchase products from verified suppliers',
    icon: ShoppingCart,
    color: 'orange'
  },
  {
    id: 'seller',
    label: 'Seller',
    description: 'Sell products and reach buyers across Africa',
    icon: Package,
    color: 'blue'
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    description: 'Buy & Sell Products - Access both buying and selling tools',
    icon: Building2,
    color: 'purple'
  },
  {
    id: 'logistics',
    label: 'Logistics Partner',
    description: 'Provide shipping and logistics services',
    icon: Truck,
    color: 'green'
  }
];

export default function RoleSelection({ onRoleSelected }) {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast.error('Please select a role to continue');
      return;
    }

    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading || !user) {
      toast.error('Please log in first');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use auth from context (no duplicate call)
      // Profile already loaded from AuthProvider (no need to fetch again)

      // Create company for the user with the selected role
      const userData = {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || user.email?.split('@')[0] || 'User',
        role: selectedRole,
        company_name: profile?.company_name || profile?.full_name || user.email?.split('@')[0] || 'My Company'
      };

      const companyId = await getOrCreateCompany(supabase, userData);

      // Update profile with selected role and company_id
      // Only update role field (single source of truth)
      // Preserve existing onboarding_completed and company_id if they exist
      const updateData = {
        role: selectedRole
      };

      // Only set onboarding_completed if it's not already true (preserve existing state)
      if (!profile?.onboarding_completed) {
        updateData.onboarding_completed = true;
      }

      // Only set company_id if we got one and profile doesn't have one
      if (companyId && !profile?.company_id) {
        updateData.company_id = companyId;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        console.error('Role update error:', updateError);
        throw updateError;
      }

      toast.success('Role selected successfully!');
      
      // Refresh auth profile to update role in context immediately
      // This ensures the new role is available without page refresh
      await refreshProfile();
      
      // Notify parent component that role was selected
      if (onRoleSelected) {
        onRoleSelected(selectedRole);
      }
      
      // Optional: Refresh page to ensure all components see the updated role
      // This is safer than relying on all components to react to auth changes
      // Comment out if you want to handle role updates reactively without refresh
      window.location.reload();
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Failed to save role. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-afrikoni-cream to-afrikoni-offwhite flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <Card className="border-afrikoni-gold/20 bg-white shadow-2xl rounded-xl">
          <CardHeader className="text-center mb-8">
            <CardTitle className="text-3xl font-bold text-afrikoni-chestnut mb-2">
              Choose Your Role
            </CardTitle>
            <p className="text-afrikoni-deep">
              Select how you'll use Afrikoni to get started
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                
                return (
                  <motion.div
                    key={role.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative p-6 border rounded-lg cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-afrikoni-gold ring-2 ring-afrikoni-gold shadow-md'
                        : 'border-afrikoni-gold/30 hover:border-afrikoni-gold/60'
                    }`}
                    onClick={() => handleRoleSelect(role.id)}
                  >
                    {isSelected && (
                      <CheckCircle className="absolute top-3 right-3 h-5 w-5 text-afrikoni-gold" />
                    )}
                    <div className="flex items-center mb-3">
                      <Icon className="h-6 w-6 mr-3 text-afrikoni-gold" />
                      <h3 className="font-semibold text-lg text-afrikoni-chestnut">
                        {role.label}
                      </h3>
                    </div>
                    <p className="text-sm text-afrikoni-deep/80">{role.description}</p>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!selectedRole || isSubmitting}
                className="bg-afrikoni-gold text-white hover:bg-afrikoni-gold/90 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, Mail, Lock, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Logo } from '@/components/ui/Logo';


export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabaseHelpers.auth.signUp(
        formData.email,
        formData.password,
        { 
          name: formData.fullName
        }
      );

      if (error) throw error;

      // Wait for session to be established
      if (data?.session) {
        // Create profile in profiles table using UPSERT
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: formData.fullName,
            role: 'buyer', // Default role
            onboarding_completed: false // Must complete onboarding
          }, { onConflict: 'id' });

        if (profileError) {
          // Error logged (removed for production)
          // Don't fail signup if profile creation fails - user can still proceed
        }

        toast.success('Account created successfully!');
        navigate('/onboarding');
      } else {
        toast.success('Please check your email to confirm your account');
        navigate('/login');
      }
    } catch (error) {
      // Error logged (removed for production)
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-afrikoni-cream to-afrikoni-offwhite flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-afrikoni-gold/20 bg-afrikoni-offwhite shadow-2xl rounded-xl">
          <CardContent className="p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <Logo type="full" size="lg" link={true} showTagline={true} />
              </div>
              <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">Join Afrikoni</h1>
              <p className="text-afrikoni-deep">Create your account to start trading across Africa</p>
            </div>


            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-4 mb-6 text-xs text-afrikoni-deep/70">
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-green-600" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>Trusted by 50,000+</span>
              </div>
            </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <Label htmlFor="fullName" className="mb-2 block font-semibold">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="mb-2 block font-semibold">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@business.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="mb-2 block font-semibold">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Create a password (min. 6 characters)"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="mb-2 block font-semibold">Confirm Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm your password"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="w-full h-12"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-afrikoni-deep">
              Already have an account?{' '}
              <a href={createPageUrl('Login')} className="text-afrikoni-gold hover:text-afrikoni-goldDark font-semibold">
                Sign in
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}

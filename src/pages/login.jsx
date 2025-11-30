import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Lock, Loader2, Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';
import { Logo } from '@/components/ui/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || createPageUrl('Home');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabaseHelpers.auth.signIn(email, password);
      if (error) throw error;

      toast.success('Logged in successfully!');
      
      // Simple redirect - let dashboard handle routing
      navigate('/dashboard');
    } catch (error) {
      // Error logged (removed for production)
      toast.error(error.message || 'Failed to login');
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
        <Card className="border-afrikoni-gold/20 shadow-2xl bg-afrikoni-offwhite rounded-xl">
          <CardContent className="p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <Logo type="full" size="lg" link={true} showTagline={true} />
              </div>
              <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">Welcome back</h1>
              <p className="text-afrikoni-deep">Sign in to continue your African trade journey</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <Label htmlFor="email" className="mb-2 block font-semibold text-afrikoni-chestnut">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@business.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="mb-2 block font-semibold text-afrikoni-chestnut">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                  />
                </div>
                <div className="mt-2 text-right">
                  <Link to="#" className="text-sm text-afrikoni-gold hover:text-afrikoni-goldDark font-medium">
                    Forgot password?
                  </Link>
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
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Quick Role Hints */}
            <div className="mt-6 pt-6 border-t border-afrikoni-gold/20">
              <p className="text-xs text-afrikoni-deep/70 text-center mb-3">Continue as:</p>
              <div className="flex gap-2 justify-center">
                <Badge variant="outline" className="text-xs">Buyer</Badge>
                <Badge variant="outline" className="text-xs">Seller</Badge>
                <Badge variant="outline" className="text-xs">Logistics</Badge>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 pt-6 border-t border-afrikoni-gold/20">
              <div className="flex items-center justify-center gap-4 text-xs text-afrikoni-deep/70">
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>SSL Secured</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span>Trusted by 50,000+</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              <p className="text-afrikoni-deep">
                Don't have an account?{' '}
                <Link to={createPageUrl('Signup')} className="text-afrikoni-gold hover:text-afrikoni-goldDark font-semibold">
                  Create account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

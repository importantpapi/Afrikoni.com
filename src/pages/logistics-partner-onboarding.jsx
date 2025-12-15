/**
 * Logistics Partner Onboarding
 * For freight forwarders, shipping companies, and logistics providers
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, Globe, DollarSign, Shield, CheckCircle, 
  MapPin, Package, Clock, ArrowRight, Users, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { TARGET_COUNTRY, getCountryConfig } from '@/config/countryConfig';
import { AFRICAN_COUNTRIES } from '@/constants/countries';
import Layout from '@/layout';

export default function LogisticsPartnerOnboarding() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    country: TARGET_COUNTRY,
    city: '',
    services: [],
    coverage_areas: '',
    fleet_size: '',
    years_experience: '',
    certifications: '',
    revenue_share_interest: true
  });

  const config = getCountryConfig();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { user: userData, role } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      setUser(userData);
      setUserRole(role);
      
      // If user is already a logistics partner, redirect to dashboard
      if (userData && (role === 'logistics' || role === 'logistics_partner')) {
        navigate('/dashboard/logistics');
        return;
      }
      
      // Pre-fill email if user is logged in
      if (userData?.email) {
        setFormData(prev => ({ ...prev, email: userData.email }));
      }
    } catch (error) {
      // User not logged in, continue with form
    }
  };

  const services = [
    'Sea Freight',
    'Air Freight',
    'Road Transport',
    'Warehousing',
    'Customs Clearance',
    'Last Mile Delivery'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // If user is logged in, create/update their company profile
      if (user) {
        // Check if company already exists
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', user.id)
          .single();

        const companyData = {
          company_name: formData.company_name,
          country: formData.country,
          city: formData.city,
          phone: formData.phone,
          role: 'logistics',
          verified: false, // Will be verified by admin
          metadata: {
            services: formData.services,
            coverage_areas: formData.coverage_areas,
            fleet_size: formData.fleet_size,
            years_experience: formData.years_experience,
            certifications: formData.certifications,
            contact_name: formData.contact_name
          }
        };

        try {
          if (existingCompany) {
            // Update existing company
            const { error: updateError } = await supabase
              .from('companies')
              .update(companyData)
              .eq('id', existingCompany.id);

            if (updateError) {
              console.error('Error updating logistics company:', updateError);
            }
          } else {
            // Create new company
            const { error: createError } = await supabase
              .from('companies')
              .insert({
                ...companyData,
                user_id: user.id
              });

            if (createError) {
              console.error('Error creating logistics company:', createError);
            }
          }
        } catch (companyError) {
          console.error('Company upsert error (non-blocking):', companyError);
        }

        // Update user profile to logistics and mark onboarding as completed
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
              role: 'logistics',
              user_role: 'logistics',
              onboarding_completed: true,
              company_name: formData.company_name,
              country: formData.country,
              city: formData.city,
              phone: formData.phone
            })
            .eq('id', user.id);

          if (profileError) {
            console.error('Profile update error:', profileError);
          }
        } catch (profileErr) {
          console.error('Profile update exception:', profileErr);
        }

        // Also create application for admin review
        await supabase.from('supplier_applications').insert({
          company_name: formData.company_name,
          contact_name: formData.contact_name,
          email: formData.email || user.email,
          phone: formData.phone,
          country: formData.country,
          city: formData.city,
          business_type: 'logistics',
          company_description: `Services: ${formData.services.join(', ')}\nCoverage: ${formData.coverage_areas}\nFleet: ${formData.fleet_size}\nExperience: ${formData.years_experience} years`,
          status: 'pending',
          source: 'logistics_partner_onboarding',
          metadata: {
            services: formData.services,
            coverage_areas: formData.coverage_areas,
            fleet_size: formData.fleet_size,
            years_experience: formData.years_experience,
            certifications: formData.certifications,
            revenue_share_interest: formData.revenue_share_interest
          }
        }).catch(console.error);

        toast.success('Profile created! Redirecting to logistics dashboard...');
        setTimeout(() => {
          navigate('/dashboard/logistics');
        }, 1500);
      } else {
        try {
          // User not logged in - create application and redirect to signup
          const { error } = await supabase
            .from('supplier_applications')
            .insert({
              company_name: formData.company_name,
              contact_name: formData.contact_name,
              email: formData.email,
              phone: formData.phone,
              country: formData.country,
              city: formData.city,
              business_type: 'logistics',
              company_description: `Services: ${formData.services.join(', ')}\nCoverage: ${formData.coverage_areas}\nFleet: ${formData.fleet_size}\nExperience: ${formData.years_experience} years`,
              status: 'pending',
              source: 'logistics_partner_onboarding',
              metadata: {
                services: formData.services,
                coverage_areas: formData.coverage_areas,
                fleet_size: formData.fleet_size,
                years_experience: formData.years_experience,
                certifications: formData.certifications,
                revenue_share_interest: formData.revenue_share_interest
              }
            });

          if (error) {
            console.error('Public logistics application error:', error);
          }

          // Track acquisition event (non-blocking)
          await supabase.from('acquisition_events').insert({
            type: 'supplier_signup',
            country: formData.country,
            email: formData.email,
            phone: formData.phone,
            source: 'logistics_partner_onboarding',
            metadata: { type: 'logistics_partner' }
          }).catch(console.error);

          toast.success('Application submitted! Please sign up to complete your profile.');
          navigate(`/signup?role=logistics&email=${encodeURIComponent(formData.email)}&country=${formData.country}`);
        } catch (publicErr) {
          console.error('Error in public logistics application flow:', publicErr);
          toast.error('Failed to submit application. Please try again.');
        }
      }
    } catch (error) {
      console.error('Unexpected error submitting application:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: Globe,
      title: 'Access to Global Network',
      description: 'Connect with suppliers and buyers worldwide using Afrikoni\'s platform'
    },
    {
      icon: DollarSign,
      title: 'Revenue Share Model',
      description: 'Earn competitive margins on every shipment booked through Afrikoni'
    },
    {
      icon: Shield,
      title: 'Verified Partners',
      description: 'Get verified badge and build trust with platform users'
    },
    {
      icon: TrendingUp,
      title: 'Growth Opportunities',
      description: 'Scale your business with increasing trade volume on Afrikoni'
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-afrikoni-ivory to-white">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <Badge className="mb-4 bg-afrikoni-gold text-afrikoni-chestnut">
                Join Afrikoni Logistics Network
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold text-afrikoni-text-dark mb-6">
                Logistics Partner Program
              </h1>
              <p className="text-xl text-afrikoni-text-dark/70 max-w-3xl mx-auto mb-8">
                Join Afrikoni's logistics network and help facilitate trade from {config.name} to the world. 
                Earn revenue share on every shipment.
              </p>
            </motion.div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {benefits.map((benefit, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="h-full border-afrikoni-gold/20 hover:border-afrikoni-gold/40 transition-colors">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-afrikoni-gold/10 rounded-lg flex items-center justify-center mb-4">
                        <benefit.icon className="w-6 h-6 text-afrikoni-gold" />
                      </div>
                      <h3 className="text-xl font-semibold text-afrikoni-text-dark mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-afrikoni-text-dark/70">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Application Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <Card className="border-afrikoni-gold/20 shadow-premium-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">Apply to Join Our Network</CardTitle>
                  <p className="text-afrikoni-text-dark/70">
                    Complete the form below and we'll review your application within 24 hours
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Company Name *</Label>
                        <Input
                          required
                          value={formData.company_name}
                          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                          placeholder="Your logistics company"
                        />
                      </div>
                      <div>
                        <Label>Contact Name *</Label>
                        <Input
                          required
                          value={formData.contact_name}
                          onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                          placeholder="Your name"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="contact@company.com"
                        />
                      </div>
                      <div>
                        <Label>Phone *</Label>
                        <Input
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder={`${config.phoneCode} ...`}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Country *</Label>
                        <Select
                          value={formData.country}
                          onValueChange={(value) => setFormData({ ...formData, country: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AFRICAN_COUNTRIES.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>City *</Label>
                        <Input
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Your city"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Services Offered *</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                        {services.map((service) => (
                          <label key={service} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.services.includes(service)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, services: [...formData.services, service] });
                                } else {
                                  setFormData({ ...formData, services: formData.services.filter(s => s !== service) });
                                }
                              }}
                              className="w-4 h-4 text-afrikoni-gold rounded"
                            />
                            <span className="text-sm">{service}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Coverage Areas *</Label>
                      <Textarea
                        required
                        value={formData.coverage_areas}
                        onChange={(e) => setFormData({ ...formData, coverage_areas: e.target.value })}
                        placeholder="e.g., West Africa, Europe, Asia, Global"
                        rows={3}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Fleet Size</Label>
                        <Input
                          value={formData.fleet_size}
                          onChange={(e) => setFormData({ ...formData, fleet_size: e.target.value })}
                          placeholder="e.g., 50 trucks, 10 containers"
                        />
                      </div>
                      <div>
                        <Label>Years of Experience</Label>
                        <Input
                          type="number"
                          value={formData.years_experience}
                          onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                          placeholder="5"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Certifications (Optional)</Label>
                      <Input
                        value={formData.certifications}
                        onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                        placeholder="e.g., ISO 9001, IATA, FIATA"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || formData.services.length === 0}
                      className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
                      size="lg"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Application'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

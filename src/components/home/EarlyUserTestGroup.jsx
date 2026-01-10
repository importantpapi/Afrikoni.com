import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Users, Mail, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EarlyUserTestGroup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    businessType: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.businessType) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Connect to Supabase or email service
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Thank you! You\'ve been added to the waitlist.');
      setFormData({ name: '', email: '', businessType: '' });
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [focusedField, setFocusedField] = useState(null);

  return (
    <div className="py-12 md:py-16 bg-gradient-to-br from-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Subtle Patterned Background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(59, 130, 246, 0.1) 10px, rgba(59, 130, 246, 0.1) 20px),
                           repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(99, 102, 241, 0.1) 10px, rgba(99, 102, 241, 0.1) 20px)`
        }} />
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-14 h-14 md:w-16 md:h-16 bg-afrikoni-gold rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <Users className="w-7 h-7 md:w-8 md:h-8 text-afrikoni-cream" />
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-3 md:mb-4">Join Our Early User Test Group</h2>
          <p className="text-base md:text-lg text-afrikoni-deep max-w-2xl mx-auto">
            Be among the first to experience new features and help shape the future of African B2B trade
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="border-2 border-blue-300 shadow-2xl rounded-xl">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your full name"
                    required
                    className={`transition-all ${focusedField === 'name' ? 'ring-2 ring-blue-500 ring-opacity-50 shadow-lg' : ''}`}
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    Business Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="your@business.com"
                    required
                    className={`transition-all ${focusedField === 'email' ? 'ring-2 ring-blue-500 ring-opacity-50 shadow-lg' : ''}`}
                  />
                </div>

                <div>
                  <Label htmlFor="businessType" className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Business Type
                  </Label>
                  <Select value={formData.businessType} onValueChange={(v) => handleChange('businessType', v)}>
                    <SelectTrigger className={focusedField === 'businessType' ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}>
                      <SelectValue placeholder="Select your business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Buyer/Importer</SelectItem>
                      <SelectItem value="seller">Seller/Exporter</SelectItem>
                      <SelectItem value="both">Both Buyer & Seller</SelectItem>
                      <SelectItem value="logistics">Logistics Partner</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    type="submit" 
                    className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-creampy-5 md:py-6 text-base md:text-lg shadow-lg hover:shadow-xl transition-shadow"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                  </Button>
                </motion.div>
              </form>

              <div className="flex items-center justify-center gap-2 mt-4">
                <p className="text-xs md:text-sm text-afrikoni-deep/70 text-center">
                  By joining, you'll receive early access to new features and exclusive updates
                </p>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-xs md:text-sm text-blue-600 font-semibold text-center mt-2"
              >
                120+ joined this week
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}


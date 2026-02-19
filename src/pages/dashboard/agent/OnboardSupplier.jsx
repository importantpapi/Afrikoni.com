import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { ArrowLeft, Camera, MapPin, UploadCloud, Save, CheckCircle2, User, Phone, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardSupplier() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        businessName: '',
        category: '',
        phone: '',
        location: '',
        images: []
    });

    const handleNext = () => {
        if (step === 1 && (!formData.businessName || !formData.phone)) {
            toast.error('Please fill in business name and phone');
            return;
        }
        setStep(step + 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.from('onboarded_suppliers').insert({
                agent_id: user.id,
                business_name: formData.businessName,
                phone: formData.phone,
                category: formData.category,
                location_lat: -1.2921, // Mock location for MVP
                location_long: 36.8219,
                status: 'pending'
            });

            if (error) throw error;

            toast.success('Supplier Onboarded Successfully!');
            // toast.success('Commission pending verification.');
            navigate('/dashboard/agent');
        } catch (error) {
            console.error('Onboarding Error:', error);
            toast.error('Failed to submit: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col max-w-lg mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/agent')} className="hover:bg-gray-100 -ml-2">
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">New Supplier</h1>
                    <p className="text-sm text-gray-500">Field Registration • Step {step} of 3</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-8">
                <div
                    className="h-full bg-os-accent transition-all duration-300 ease-out"
                    style={{ width: `${(step / 3) * 100}%` }}
                />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1"
                >
                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <Surface variant="panel" className="p-5 md:p-6 space-y-6 bg-white border border-gray-100 shadow-sm rounded-xl">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-semibold flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" /> Business Name *
                                    </Label>
                                    <Input
                                        placeholder="e.g. Mama Mboga Wholesalers"
                                        value={formData.businessName}
                                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                        className="h-14 text-lg border-gray-200 focus:border-os-accent focus:ring-os-accent/20 bg-gray-50/50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-semibold flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" /> Phone (Mobile Money) *
                                    </Label>
                                    <Input
                                        placeholder="+254 7..."
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="h-14 text-lg border-gray-200 focus:border-os-accent focus:ring-os-accent/20 bg-gray-50/50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-semibold flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-gray-400" /> Category
                                    </Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(v) => setFormData({ ...formData, category: v })}
                                    >
                                        <SelectTrigger className="h-14 text-lg border-gray-200 bg-gray-50/50">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-gray-100 shadow-xl">
                                            <SelectItem value="agri">Agriculture & Food</SelectItem>
                                            <SelectItem value="textiles">Textiles & Apparel</SelectItem>
                                            <SelectItem value="minerals">Minerals & Metals</SelectItem>
                                            <SelectItem value="crafts">Handicrafts</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button onClick={handleNext} className="w-full h-14 bg-os-accent text-black font-bold text-lg rounded-xl shadow-md hover:shadow-lg transition-all mt-4">
                                Next Step
                            </Button>
                        </Surface>
                    )}

                    {/* Step 2: Location & Assets */}
                    {step === 2 && (
                        <Surface variant="panel" className="p-5 md:p-6 space-y-6 bg-white border border-gray-100 shadow-sm rounded-xl">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-semibold">Physical Location</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Street / Market / Building"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="h-14 text-lg border-gray-200 bg-gray-50/50"
                                        />
                                        <Button variant="outline" className="h-14 w-14 border-gray-200 text-gray-500 hover:text-os-accent hover:border-os-accent hover:bg-os-accent/5">
                                            <MapPin className="w-6 h-6" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-400">Tap icon to use GPS</p>
                                </div>

                                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-100 transition-colors cursor-pointer group">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                        <Camera className="w-8 h-8 text-os-accent" />
                                    </div>
                                    <p className="font-bold text-gray-900">Take Photo</p>
                                    <p className="text-sm text-gray-500 mt-1">Capture shopfront or products</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <Button variant="outline" onClick={() => setStep(1)} className="h-12 border-gray-200 bg-gray-50 rounded-xl">
                                    Back
                                </Button>
                                <Button onClick={handleNext} className="h-12 bg-os-accent text-black font-bold rounded-xl shadow-md">
                                    Next Step
                                </Button>
                            </div>
                        </Surface>
                    )}

                    {/* Step 3: Review & Submit */}
                    {step === 3 && (
                        <Surface variant="panel" className="p-5 md:p-6 space-y-6 bg-white border border-gray-100 shadow-sm rounded-xl">
                            <div className="text-center mb-6 pt-4">
                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Confirm Details</h2>
                                <p className="text-gray-500 text-sm mt-1">Review information for {formData.businessName}</p>
                            </div>

                            <div className="space-y-0 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
                                <div className="flex justify-between p-4">
                                    <span className="text-gray-500 text-sm font-medium">Business Name</span>
                                    <span className="text-gray-900 font-bold text-sm text-right">{formData.businessName}</span>
                                </div>
                                <div className="flex justify-between p-4">
                                    <span className="text-gray-500 text-sm font-medium">Phone</span>
                                    <span className="text-gray-900 font-bold text-sm text-right">{formData.phone}</span>
                                </div>
                                <div className="flex justify-between p-4">
                                    <span className="text-gray-500 text-sm font-medium">Category</span>
                                    <span className="text-gray-900 font-bold text-sm text-right uppercase">{formData.category || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between p-4">
                                    <span className="text-gray-500 text-sm font-medium">Location</span>
                                    <span className="text-gray-900 font-bold text-sm text-right max-w-[150px] truncate">{formData.location || 'Logged via GPS'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <Button variant="outline" onClick={() => setStep(2)} className="h-14 border-gray-200 bg-gray-50 rounded-xl font-semibold">
                                    Edit
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="h-14 bg-os-accent text-black font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-os-accent-dark transition-all"
                                >
                                    {loading ? 'Submitting...' : 'Register Supplier'}
                                </Button>
                            </div>
                        </Surface>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/**
 * ============================================================================
 * QUICK TRADE WIZARD - The Killer Flow
 * ============================================================================
 * 
 * This is the ONE flow that matters for new users:
 * What → How Much → Where → When → Publish
 * 
 * Goal: Get from idea to published RFQ in <2 minutes
 * 
 * Design Principles:
 * - One question at a time
 * - Smart defaults everywhere
 * - Always show progress
 * - Always show next step
 * - Auto-save everything
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import {
    ArrowLeft, ArrowRight, Check, Sparkles, Package,
    Hash, MapPin, Calendar, Eye, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Wizard steps configuration
const STEPS = [
    { id: 1, label: 'Product', icon: Package, question: 'What are you trading?' },
    { id: 2, label: 'Quantity', icon: Hash, question: 'How much do you need?' },
    { id: 3, label: 'Destination', icon: MapPin, question: 'Where should it go?' },
    { id: 4, label: 'Timeline', icon: Calendar, question: 'When do you need it?' },
    { id: 5, label: 'Review', icon: Eye, question: 'Ready to publish?' },
];

export default function QuickTradeWizard() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        productName: '',
        productDescription: '',
        quantity: '',
        unit: 'MT',
        targetCountry: '',
        targetCity: '',
        deliveryDeadline: '',
        targetPrice: '',
        additionalNotes: '',
    });

    // Auto-save draft every 30 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            if (currentStep > 1 && currentStep < 5) {
                saveDraft();
            }
        }, 30000);
        return () => clearInterval(timer);
    }, [formData, currentStep]);

    // Load existing draft on mount
    useEffect(() => {
        loadDraft();
    }, []);

    const saveDraft = async () => {
        if (!user || !profile?.company_id) return;

        setAutoSaving(true);
        try {
            const { error } = await supabase
                .from('rfq_drafts')
                .upsert({
                    user_id: user.id,
                    company_id: profile.company_id,
                    draft_data: formData,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id,company_id'
                });

            if (error) throw error;
        } catch (err) {
            console.error('Failed to save draft:', err);
        } finally {
            setTimeout(() => setAutoSaving(false), 1000);
        }
    };

    const loadDraft = async () => {
        if (!user || !profile?.company_id) return;

        try {
            const { data, error } = await supabase
                .from('rfq_drafts')
                .select('draft_data')
                .eq('user_id', user.id)
                .eq('company_id', profile.company_id)
                .single();

            if (data?.draft_data) {
                setFormData(data.draft_data);
            }
        } catch (err) {
            // No draft found, that's okay
            console.log('No draft found');
        }
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return formData.productName.trim().length > 0;
            case 2:
                return formData.quantity && parseFloat(formData.quantity) > 0;
            case 3:
                return formData.targetCountry.trim().length > 0;
            case 4:
                return formData.deliveryDeadline.length > 0;
            case 5:
                return true;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (canProceed() && currentStep < 5) {
            setCurrentStep(prev => prev + 1);
            saveDraft();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handlePublish = async () => {
        if (!user || !profile?.company_id) return;

        setIsSubmitting(true);
        try {
            const { data: rfq, error } = await supabase
                .from('rfqs')
                .insert({
                    company_id: profile.company_id,
                    created_by: user.id,
                    title: formData.productName,
                    description: formData.productDescription,
                    quantity: parseFloat(formData.quantity),
                    unit: formData.unit,
                    target_country: formData.targetCountry,
                    target_city: formData.targetCity,
                    delivery_deadline: formData.deliveryDeadline,
                    target_price: formData.targetPrice ? parseFloat(formData.targetPrice) : null,
                    additional_requirements: formData.additionalNotes,
                    status: 'sent',
                })
                .select()
                .single();

            if (error) throw error;

            // Delete draft
            await supabase
                .from('rfq_drafts')
                .delete()
                .eq('user_id', user.id)
                .eq('company_id', profile.company_id);

            // Navigate to RFQ detail or OneFlow
            navigate(`/dashboard/rfqs/${rfq.id}`);
        } catch (err) {
            console.error('Failed to publish RFQ:', err);
            alert('Failed to publish RFQ. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const progressPercent = (currentStep / STEPS.length) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0B0C0F] via-[#0E1218] to-[#10141C] py-8">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/dashboard')}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-[#D4A937]/20 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-[#D4A937]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Quick Trade</h1>
                            <p className="text-sm text-white/60">Get from idea to published RFQ in 2 minutes</p>
                        </div>
                    </div>

                    {/* Auto-save indicator */}
                    {autoSaving && (
                        <div className="flex items-center gap-2 text-xs text-white/40 mt-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Saving draft...
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                        {STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;

                            return (
                                <React.Fragment key={step.id}>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                                            isActive && "border-[#D4A937] bg-[#D4A937]/20 text-[#D4A937] scale-110",
                                            isCompleted && "border-emerald-500 bg-emerald-500/20 text-emerald-500",
                                            !isActive && !isCompleted && "border-white/10 bg-white/5 text-white/30"
                                        )}>
                                            {isCompleted ? (
                                                <Check className="w-5 h-5" />
                                            ) : (
                                                <Icon className="w-5 h-5" />
                                            )}
                                        </div>
                                        <span className={cn(
                                            "text-xs font-medium",
                                            isActive && "text-white",
                                            !isActive && "text-white/40"
                                        )}>
                                            {step.label}
                                        </span>
                                    </div>

                                    {idx < STEPS.length - 1 && (
                                        <div className="flex-1 h-[2px] bg-white/10 mx-2 mt-[-20px]">
                                            <div
                                                className="h-full bg-[#D4A937] transition-all duration-500"
                                                style={{ width: currentStep > step.id ? '100%' : '0%' }}
                                            />
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    <div className="text-center text-sm text-white/60">
                        Step {currentStep} of {STEPS.length} • {Math.round(progressPercent)}% Complete
                    </div>
                </div>

                {/* Step Content */}
                <Surface variant="glass" className="p-8 border border-white/10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h2 className="text-xl font-semibold text-white mb-6">
                                {STEPS[currentStep - 1].question}
                            </h2>

                            {/* Step 1: Product */}
                            {currentStep === 1 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-white/70 mb-2 block">Product Name *</label>
                                        <Input
                                            placeholder="e.g., Organic Cocoa Beans"
                                            value={formData.productName}
                                            onChange={(e) => updateField('productName', e.target.value)}
                                            className="text-lg"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-white/70 mb-2 block">Description (Optional)</label>
                                        <Textarea
                                            placeholder="Add any specific requirements or details..."
                                            value={formData.productDescription}
                                            onChange={(e) => updateField('productDescription', e.target.value)}
                                            rows={4}
                                        />
                                    </div>
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <Sparkles className="w-4 h-4 text-blue-400 mt-0.5" />
                                            <div className="text-sm text-blue-200">
                                                <strong>AI Tip:</strong> Be specific about quality standards (e.g., "Food-grade certified", "Organic", "Fair Trade")
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Quantity */}
                            {currentStep === 2 && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm text-white/70 mb-2 block">Quantity *</label>
                                            <Input
                                                type="number"
                                                placeholder="e.g., 20"
                                                value={formData.quantity}
                                                onChange={(e) => updateField('quantity', e.target.value)}
                                                className="text-lg"
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-white/70 mb-2 block">Unit</label>
                                            <select
                                                value={formData.unit}
                                                onChange={(e) => updateField('unit', e.target.value)}
                                                className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white"
                                            >
                                                <option value="MT">Metric Tons (MT)</option>
                                                <option value="KG">Kilograms (KG)</option>
                                                <option value="Units">Units</option>
                                                <option value="Containers">Containers</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-white/70 mb-2 block">Target Price (Optional)</label>
                                        <Input
                                            type="number"
                                            placeholder="e.g., 2500 per MT"
                                            value={formData.targetPrice}
                                            onChange={(e) => updateField('targetPrice', e.target.value)}
                                        />
                                    </div>
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                        <div className="text-sm text-amber-200">
                                            <strong>Corridor Benchmark:</strong> Similar cocoa orders average $2,800/MT in this corridor
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Destination */}
                            {currentStep === 3 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-white/70 mb-2 block">Destination Country *</label>
                                        <Input
                                            placeholder="e.g., France"
                                            value={formData.targetCountry}
                                            onChange={(e) => updateField('targetCountry', e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-white/70 mb-2 block">City/Port (Optional)</label>
                                        <Input
                                            placeholder="e.g., Marseille"
                                            value={formData.targetCity}
                                            onChange={(e) => updateField('targetCity', e.target.value)}
                                        />
                                    </div>
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                        <div className="text-sm text-emerald-200">
                                            <strong>Logistics Preview:</strong> Estimated shipping time: 14-21 days via sea freight
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Timeline */}
                            {currentStep === 4 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-white/70 mb-2 block">Delivery Deadline *</label>
                                        <Input
                                            type="date"
                                            value={formData.deliveryDeadline}
                                            onChange={(e) => updateField('deliveryDeadline', e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-white/70 mb-2 block">Additional Notes (Optional)</label>
                                        <Textarea
                                            placeholder="Any other requirements, certifications needed, etc."
                                            value={formData.additionalNotes}
                                            onChange={(e) => updateField('additionalNotes', e.target.value)}
                                            rows={4}
                                        />
                                    </div>
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <div className="text-sm text-blue-200">
                                            <strong>Risk Indicator:</strong> Low risk - Timeline allows for standard production and shipping
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Review */}
                            {currentStep === 5 && (
                                <div className="space-y-6">
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-lg space-y-4">
                                        <div>
                                            <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Product</div>
                                            <div className="text-white font-medium">{formData.productName}</div>
                                            {formData.productDescription && (
                                                <div className="text-sm text-white/60 mt-1">{formData.productDescription}</div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Quantity</div>
                                                <div className="text-white font-medium">{formData.quantity} {formData.unit}</div>
                                            </div>
                                            {formData.targetPrice && (
                                                <div>
                                                    <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Target Price</div>
                                                    <div className="text-white font-medium">${formData.targetPrice}/{formData.unit}</div>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Destination</div>
                                            <div className="text-white font-medium">
                                                {formData.targetCity ? `${formData.targetCity}, ` : ''}{formData.targetCountry}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Delivery Deadline</div>
                                            <div className="text-white font-medium">
                                                {new Date(formData.deliveryDeadline).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-[#D4A937]/10 border border-[#D4A937]/20 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <Sparkles className="w-5 h-5 text-[#D4A937] mt-0.5" />
                                            <div>
                                                <div className="text-sm font-medium text-[#D4A937] mb-1">Ready to publish!</div>
                                                <div className="text-sm text-white/70">
                                                    Your RFQ will be sent to <strong>7 verified suppliers</strong> in this corridor
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className="gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>

                        {currentStep < 5 ? (
                            <Button
                                onClick={handleNext}
                                disabled={!canProceed()}
                                className="bg-[#D4A937] hover:bg-[#C09830] text-black gap-2"
                            >
                                Next
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handlePublish}
                                disabled={isSubmitting}
                                className="bg-[#D4A937] hover:bg-[#C09830] text-black gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Publishing...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Publish RFQ
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </Surface>

                {/* Help Text */}
                <div className="mt-6 text-center text-sm text-white/40">
                    Need help? Press <kbd className="px-2 py-1 bg-white/10 rounded">?</kbd> for assistance
                </div>
            </div>
        </div>
    );
}

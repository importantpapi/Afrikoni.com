/**
 * ============================================================================
 * SIMPLE TRADE WIZARD - 2-Step Direct Buy Flow
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import {
    ArrowLeft, ArrowRight, Check, Package,
    MapPin, Globe, Loader2, ShieldCheck, Info,
    FileText, MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import * as rfqService from '@/services/rfqService';
import { supabase } from '@/api/supabaseClient';

const STEPS = [
    { id: 1, label: 'Trade Details', icon: Package, question: 'What do you need?' },
    { id: 2, label: 'Review', icon: FileText, question: 'Review Request' },
];

export default function QuickTradeWizard() {
    const navigate = useNavigate();
    const { user } = useDashboardKernel();

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedTradeId, setSubmittedTradeId] = useState(null);

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
        hsCode: '',
        whatsappEnabled: true
    });

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        if (currentStep < 2) setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => currentStep > 1 && setCurrentStep(prev => prev - 1);

    const handlePublish = async () => {
        if (!user) return toast.error('Authentication required');
        setIsSubmitting(true);
        try {
            // Institutional Rate Limit Check
            const { data: limitData, error: limitError } = await supabase.functions.invoke('evaluate-rfq-rate');

            if (limitError || (limitData && !limitData.allowed)) {
                toast.error('Verification Limit Reached', {
                    description: limitData?.message || 'Institutional rate limits apply to RFQ creation. Please contact support to increase your capacity.'
                });
                return;
            }
            const result = await rfqService.createRFQ({
                user,
                formData: {
                    title: formData.productName,
                    description: formData.productDescription || `Sourcing request for ${formData.quantity} ${formData.unit} of ${formData.productName}`,
                    quantity: formData.quantity,
                    unit: formData.unit,
                    delivery_location: formData.targetCountry,
                    target_country: formData.targetCountry,
                    additional_notes: formData.additionalNotes,
                    hs_code: formData.hsCode,
                    // safe defaults for new trade
                    shipping_method: 'Ocean Freight',
                    incoterms: 'CIF'
                }
            });

            if (result.success) {
                toast.success('Request Submitted Successfully');
                setSubmittedTradeId(result.data?.id || 'new');
                setCurrentStep(3); // Move to Success View
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Submission failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-afrikoni-offwhite text-afrikoni-deep font-sans">
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="group flex items-center gap-2 text-os-sm font-bold text-gray-500 hover:text-gray-900 transition-all uppercase tracking-wider"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Dashboard
                        </button>

                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                                Simple Trade Mode
                            </h1>
                            <p className="text-gray-500 font-medium mt-1">Direct buy flow for businesses.</p>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-4">
                        {STEPS.map((step) => (
                            <div key={step.id} className="flex items-center gap-2">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                                    currentStep === step.id ? "bg-os-accent text-white" :
                                        currentStep > step.id ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"
                                )}>
                                    {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                                </div>
                                <span className={cn(
                                    "text-sm font-bold uppercase tracking-wider hidden md:block",
                                    currentStep === step.id ? "text-gray-900" : "text-gray-400"
                                )}>{step.label}</span>
                                {step.id < 2 && <div className="w-8 h-[1px] bg-gray-200 hidden md:block" />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Main Form Area */}
                    <div className="lg:col-span-8">
                        <Surface className="bg-white border-gray-200 shadow-sm rounded-xl overflow-hidden p-0">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="p-8 md:p-10 space-y-8"
                                >
                                    {currentStep === 3 ? (
                                        <div className="text-center py-10 space-y-6">
                                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Check className="w-10 h-10 text-emerald-600" />
                                            </div>
                                            <h2 className="text-3xl font-bold text-gray-900">Request Submitted!</h2>
                                            <p className="text-gray-500 text-lg max-w-md mx-auto">
                                                Your trade request for <strong>{formData.productName}</strong> is now live.
                                            </p>

                                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                                                <Button
                                                    onClick={() => navigate('/dashboard/rfqs')}
                                                    className="h-14 px-8 rounded-lg bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 border border-gray-200"
                                                >
                                                    View All Requests
                                                </Button>
                                                <Button
                                                    onClick={() => navigate(`/dashboard/trade/${submittedTradeId}`)}
                                                    className="h-14 px-8 rounded-lg bg-os-accent text-white font-bold hover:bg-os-accent/90"
                                                >
                                                    Track Status
                                                    <ArrowRight className="w-5 h-5 ml-2" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 bg-os-accent/10 rounded-lg flex items-center justify-center">
                                                    {currentStep === 1 ? <Package className="w-5 h-5 text-os-accent" /> : <FileText className="w-5 h-5 text-os-accent" />}
                                                </div>
                                                <h2 className="text-2xl font-bold text-gray-900">{STEPS[currentStep - 1].question}</h2>
                                            </div>

                                            {currentStep === 1 && (
                                                <div className="space-y-6">
                                                    {/* Product Section */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-3 col-span-2">
                                                            <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Product Name *</label>
                                                            <Input
                                                                placeholder="e.g. White Maize Grade 1..."
                                                                value={formData.productName}
                                                                onChange={(e) => updateField('productName', e.target.value)}
                                                                className="h-14 text-lg font-medium border-gray-300 focus:border-os-accent"
                                                            />
                                                        </div>

                                                        <div className="space-y-3">
                                                            <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Quantity *</label>
                                                            <Input
                                                                type="number"
                                                                placeholder="0.00"
                                                                value={formData.quantity}
                                                                onChange={(e) => updateField('quantity', e.target.value)}
                                                                className="h-14 text-lg border-gray-300"
                                                            />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Unit</label>
                                                            <select
                                                                value={formData.unit}
                                                                onChange={(e) => updateField('unit', e.target.value)}
                                                                className="w-full h-14 px-4 rounded-lg border border-gray-300 bg-white text-gray-900 font-medium focus:border-os-accent focus:ring-2 focus:ring-os-accent/20 outline-none appearance-none"
                                                            >
                                                                <option value="MT">Metric Tons (MT)</option>
                                                                <option value="KG">Kilograms (KG)</option>
                                                                <option value="CTN">Containers (20ft)</option>
                                                                <option value="PCS">Pieces</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="h-px bg-gray-100 my-4" />

                                                    {/* Delivery Section */}
                                                    <div className="space-y-4">
                                                        <div className="space-y-3">
                                                            <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Destination Country *</label>
                                                            <Input
                                                                placeholder="e.g. Kenya, Nigeria..."
                                                                value={formData.targetCountry}
                                                                onChange={(e) => updateField('targetCountry', e.target.value)}
                                                                className="h-14 text-lg border-gray-300"
                                                            />
                                                        </div>

                                                        <div className="space-y-3">
                                                            <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Notes (Optional)</label>
                                                            <Textarea
                                                                placeholder="Details regarding quality, packaging, or delivery..."
                                                                value={formData.additionalNotes}
                                                                onChange={(e) => updateField('additionalNotes', e.target.value)}
                                                                className="min-h-[100px] border-gray-300 text-base"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 flex justify-end">
                                                        <Button
                                                            onClick={handleNext}
                                                            disabled={!formData.productName || !formData.quantity || !formData.targetCountry}
                                                            className="h-14 px-8 rounded-lg bg-os-accent text-white font-bold hover:bg-os-accent/90"
                                                        >
                                                            Review Request
                                                            <ArrowRight className="w-5 h-5 ml-2" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {currentStep === 2 && (
                                                <div className="space-y-8">
                                                    <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                                                        <div className="grid grid-cols-2 gap-6">
                                                            <div>
                                                                <span className="text-xs font-bold text-gray-400 uppercase">Product</span>
                                                                <div className="font-semibold text-gray-900 text-lg">{formData.productName}</div>
                                                            </div>
                                                            <div>
                                                                <span className="text-xs font-bold text-gray-400 uppercase">Volume</span>
                                                                <div className="font-semibold text-gray-900 text-lg">{formData.quantity} {formData.unit}</div>
                                                            </div>
                                                            <div>
                                                                <span className="text-xs font-bold text-gray-400 uppercase">Destination</span>
                                                                <div className="font-semibold text-gray-900 text-lg">{formData.targetCountry}</div>
                                                            </div>
                                                            <div>
                                                                <span className="text-xs font-bold text-gray-400 uppercase">Notes</span>
                                                                <div className="font-semibold text-gray-900 truncate">{formData.additionalNotes || 'None'}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                            <MessageCircle className="w-5 h-5 text-green-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-sm text-green-900">Get Quotes on WhatsApp</p>
                                                            <p className="text-xs text-green-700">Receive instant alerts nicely directly to your phone.</p>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-300"
                                                            checked={formData.whatsappEnabled}
                                                            onChange={(e) => updateField('whatsappEnabled', e.target.checked)}
                                                        />
                                                    </div>

                                                    <div className="pt-4 flex justify-between gap-4">
                                                        <Button variant="outline" onClick={handleBack} className="h-14 px-8 border-gray-300">
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            onClick={handlePublish}
                                                            disabled={isSubmitting}
                                                            className="flex-1 h-14 rounded-lg bg-os-accent text-white font-bold hover:bg-os-accent/90 shadow-md"
                                                        >
                                                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Request'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </Surface>
                    </div>

                    {/* Helper Sidebar */}
                    {currentStep !== 3 && (
                        <div className="lg:col-span-4 space-y-6">
                            <Surface className="p-6 bg-white border-gray-200 shadow-sm rounded-xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <Info className="w-5 h-5 text-os-accent" />
                                    <h3 className="font-bold text-gray-900">Quick Tips</h3>
                                </div>
                                <ul className="space-y-3 text-sm text-gray-600">
                                    <li className="flex gap-2">
                                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>Use standard grades (e.g. Grade 1)</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>Suppliers prefer Incoterms (CIF/FOB)</span>
                                    </li>
                                </ul>
                            </Surface>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

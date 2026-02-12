import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { Label } from '@/components/shared/ui/label';
import { createRFQ } from '@/services/rfqService';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { Sparkles, Upload, Calendar, ArrowRight, Wand2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { rfqSchema, validate } from '@/schemas/trade';

/**
 * IntakeEngine - The AI-First Entry Point for Trade OS
 * Replaces the old form-based "New RFQ" with an intent-driven interface.
 */
import { motion, AnimatePresence } from 'framer-motion';

// ... (imports remain)

export default function IntakeEngine() {
  const navigate = useNavigate();
  const { user, profile } = useDashboardKernel();

  // Modes: 'magic' (AI Parsing) vs 'form' (Manual Override)
  const [mode, setMode] = useState('magic');
  const [magicInput, setMagicInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    quantity: '',
    target_price: '',
    unit: 'pieces',
    delivery_location: '',
    target_country: '',
    target_city: '',
  });
  const [closingDate, setClosingDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // AI Heuristic Parser (Mock Brain)
  const analyzeIntent = async () => {
    if (!magicInput.trim()) return;
    setIsAnalyzing(true);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Heuristics
    const lower = magicInput.toLowerCase();

    // Extract Quantity
    const qtyMatch = lower.match(/(\d+[\d,]*)\s*(tons|kg|pieces|units|mt|metric tons|boxes|pallets)/i);
    const quantity = qtyMatch ? qtyMatch[1].replace(/,/g, '') : '';
    const unit = qtyMatch ? qtyMatch[2] : 'pieces';

    // Extract Price
    const priceMatch = lower.match(/(\$|€|£)\s*(\d+[\d,]*)/);
    const price = priceMatch ? priceMatch[2].replace(/,/g, '') : '';

    // Extract Location (Simple keyword matching)
    const locations = ['accra', 'lagos', 'nairobi', 'mombasa', 'dakar', 'abidjan', 't Tema', 'lekkie'];
    const locMatch = locations.find(l => lower.includes(l));

    setForm(prev => ({
      ...prev,
      title: magicInput.split('.')[0].substring(0, 60), // First sentence as title
      description: magicInput,
      quantity: quantity || prev.quantity,
      unit: unit || prev.unit,
      target_price: price || prev.target_price,
      delivery_location: locMatch ? locMatch.charAt(0).toUpperCase() + locMatch.slice(1) : prev.delivery_location,
    }));

    setMode('form'); // Switch to form view for review
    setIsAnalyzing(false);
    toast.success('AI structured your request. Please review.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // 1. Zod Validation (Data Integrity)
    const payload = { ...form, closing_date: closingDate || undefined };
    const validation = validate(rfqSchema, payload);

    if (!validation.success) {
      setError(validation.error);
      setSubmitting(false);
      toast.error('Please fix the errors before publishing');
      return;
    }

    // 2. Submit to API (using validated data where appropriate, or original payload)
    try {
      // Add a top-level timeout to prevent silent hangs
      // Enrich user object with company_id from profile
      const enrichedUser = { ...user, company_id: profile?.company_id };
      
      const createPromise = createRFQ({
        user: enrichedUser,
        formData: payload,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Submission timed out. Please check your connection.')), 15000)
      );

      const { success, error: err } = await Promise.race([createPromise, timeoutPromise]);

      setSubmitting(false);
      if (success) {
        toast.success('RFQ published to Trade OS Network');
        navigate('/dashboard/rfqs');
      }
      else {
        console.error('[RFQ:New] Submission error:', err);
        setError(err || 'Unable to create RFQ');
      }
    } catch (err) {
      console.error('[RFQ:New] Unexpected exception:', err);
      setSubmitting(false);
      setError(err.message || 'An unexpected error occurred during submission');
      toast.error(err.message || 'Submission failed');
    }
  };

  return (
    <div className="os-page os-stagger space-y-6 max-w-4xl mx-auto pb-20">
      <Surface variant="glass" className="p-6 md:p-8 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="os-label flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-[#D4A937]" />
              Intake Engine
            </div>
            <h1 className="text-3xl font-light mt-2 text-white">Initialize Trade</h1>
            <p className="text-sm text-os-muted mt-1">Describe your intent. The Kernel structures it.</p>
          </div>
          <Link to="/dashboard/rfqs">
            <Button variant="outline" className="border-white/10 hover:bg-white/5">Cancel</Button>
          </Link>
        </div>
      </Surface>

      <AnimatePresence mode="wait">
        {mode === 'magic' ? (
          <motion.div
            key="magic"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Surface variant="panel" className="p-10 flex flex-col items-center justify-center min-h-[400px] border border-[#D4A937]/30 bg-[#D4A937]/5 relative">
              <div className="w-full max-w-2xl space-y-4">
                <Label className="text-lg text-[#D4A937] font-medium">What do you want to source?</Label>
                <Textarea
                  value={magicInput}
                  onChange={(e) => setMagicInput(e.target.value)}
                  placeholder="e.g. I need 200 tons of Shea Butter delivered to Tema Port by next month. Target price is $1200 per ton."
                  className="min-h-[160px] text-xl bg-black/50 border-white/10 focus:border-[#D4A937] p-6 resize-none leading-relaxed"
                  autoFocus
                />
                <div className="flex justify-end">
                  <Button
                    size="lg"
                    onClick={analyzeIntent}
                    disabled={!magicInput.trim() || isAnalyzing}
                    className="bg-[#D4A937] text-black hover:bg-[#C09830] font-bold text-lg px-8 h-14 rounded-xl"
                  >
                    {isAnalyzing ? (
                      <>
                        <Wand2 className="w-5 h-5 mr-2 animate-spin" /> Structuring...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" /> Auto-Structure
                      </>
                    )}
                  </Button>
                </div>
                <div className="text-center">
                  <button onClick={() => setMode('form')} className="text-sm text-white/40 hover:text-white mt-4 underline decoration-white/20">
                    Skip AI, use manual form
                  </button>
                </div>
              </div>
            </Surface>
          </motion.div>
        ) : (
          /* REVIEW MODE (Standard Form but Pre-filled) */
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Surface variant="panel" className="p-6 md:p-8 space-y-8">
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
                <CheckCircle2 className="w-5 h-5" />
                AI successfully extracted intent. Please verify the details below.
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-6">
                  <Field
                    label="Trade Title"
                    required
                    value={form.title}
                    onChange={(v) => setForm({ ...form, title: v })}
                    placeholder="20 tons shea butter FOB Accra"
                  />
                  <Field
                    label="Quantity"
                    type="number"
                    required
                    value={form.quantity}
                    onChange={(v) => setForm({ ...form, quantity: v })}
                    placeholder="e.g. 20000"
                  />
                  <Field
                    label="Unit"
                    value={form.unit}
                    onChange={(v) => setForm({ ...form, unit: v })}
                    placeholder="pieces, tons, kg"
                  />
                  <Field
                    label="Target Price (USD)"
                    type="number"
                    value={form.target_price}
                    onChange={(v) => setForm({ ...form, target_price: v })}
                    placeholder="e.g. 1200"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Detailed Specifications</Label>
                  <Textarea
                    className="mt-1 min-h-[120px] bg-black/20"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Specs, certifications, timelines…"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <Field
                    label="Delivery Location"
                    value={form.delivery_location}
                    onChange={(v) => setForm({ ...form, delivery_location: v })}
                    placeholder="Port / city"
                  />
                  <Field
                    label="Target Country"
                    value={form.target_country}
                    onChange={(v) => setForm({ ...form, target_country: v })}
                    placeholder="Ghana"
                  />
                  <Field
                    label="Target City"
                    value={form.target_city}
                    onChange={(v) => setForm({ ...form, target_city: v })}
                    placeholder="Accra"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="mb-2 block">Closing Date</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={closingDate}
                        onChange={(e) => setClosingDate(e.target.value)}
                        className="flex-1 bg-black/20"
                      />
                      <Calendar className="w-4 h-4 text-os-muted" />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">Attachments</Label>
                    <div className="border-2 border-dashed border-white/10 rounded-lg p-4 text-center hover:border-[#D4A937] transition cursor-pointer bg-black/20">
                      <Upload className="w-5 h-5 mx-auto mb-2 text-os-muted" />
                      <div className="text-xs text-os-muted">Drag files or click</div>
                    </div>
                  </div>
                </div>

                {error && <p className="text-sm text-red-400 bg-red-400/10 p-3 rounded">{error}</p>}

                <div className="flex flex-wrap gap-4 justify-end pt-4 border-t border-white/5">
                  <Button type="button" variant="ghost" onClick={() => setMode('magic')}>
                    Back to AI Input
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-white text-black hover:bg-gray-200 px-8 font-bold">
                    {submitting ? 'Publishing…' : 'Launch Trade'}
                  </Button>
                </div>
              </form>
            </Surface>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', required }) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-os-muted uppercase text-xs tracking-wider">{label}{required ? ' *' : ''}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="bg-black/20 border-white/10 focus:border-[#D4A937]/50"
      />
    </div>
  );
}

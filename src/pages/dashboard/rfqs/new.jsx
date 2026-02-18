import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { Label } from '@/components/shared/ui/label';
import { createRFQ } from '@/services/rfqService';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useQueryClient } from '@tanstack/react-query';
import {
  Sparkles, Upload, Calendar, ArrowRight, CheckCircle2,
  AlertTriangle, Eraser, MapPin, Scale, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { rfqSchema, validate } from '@/schemas/trade';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/shared/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * IntakeEngine - The AI-First Entry Point for Trade OS
 * "Warm, Human, Luxury" Redesign (Apple x Hermès)
 */

export default function IntakeEngine() {
  const navigate = useNavigate();
  const { user, profile } = useDashboardKernel();
  const queryClient = useQueryClient();

  // Modes: 'magic' (Natural Language) vs 'form' (Review)
  const [mode, setMode] = useState('magic');
  const [magicInput, setMagicInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState([]); // Store corrections

  const [form, setForm] = useState({
    title: '',
    description: '',
    quantity: '',
    unit: 'tons', // Default unit
    target_price: '',
    currency: 'USD',
    delivery_location: '',
    target_country: '',
    target_city: '',
  });
  const [closingDate, setClosingDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Soft Gate State
  const [showGate, setShowGate] = useState(false);

  // AI Heuristic Parser with Advanced Spell & Topography Correction
  const analyzeIntent = async () => {
    if (!magicInput.trim()) return;
    setIsAnalyzing(true);
    setAnalysisReport([]);

    // Simulate AI processing delay for realistic "thinking" feel
    // Shortened for better UX - "snappy but thoughtful"
    await new Promise(resolve => setTimeout(resolve, 1000));

    let correctedText = magicInput;
    const report = [];

    // 1. TYPOGRAPHY CORRECTION (Spelling & Trade Terms)
    const corrections = {
      'coccoa': 'Cocoa', 'cacoa': 'Cocoa', 'coco': 'Cocoa',
      'shea': 'Shea', 'shea butter': 'Shea Butter',
      'tones': 'tons', 'ton': 'tons', 'tonnes': 'tons',
      'kilograms': 'kg', 'kilos': 'kg',
      'deliverd': 'delivered', 'shpped': 'shipped',
      'cashew': 'Cashew Nuts', 'raw cashew': 'Raw Cashew Nuts',
      'soyabean': 'Soybeans', 'soya': 'Soybeans',
      'sesame': 'Sesame Seeds',
      'maize': 'Maize (Corn)', 'corn': 'Maize (Corn)',
      'rice': 'Rice',
      'sugar': 'Sugar', 'suger': 'Sugar',
      'coton': 'Cotton',
      'gold': 'Gold Bullion', 'au': 'Gold',
      'lithium': 'Lithium Ore',
      'coffee': 'Coffee Beans',
    };

    Object.entries(corrections).forEach(([wrong, right]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      if (regex.test(correctedText)) {
        correctedText = correctedText.replace(regex, right);
        if (wrong.toLowerCase() !== right.toLowerCase()) {
          report.push({ type: 'spelling', original: wrong, fixed: right });
        }
      }
    });

    // 2. TOPOGRAPHY CORRECTION (Geography & Logistics)
    const locations = {
      'accra': { city: 'Accra', country: 'Ghana' },
      'tema': { city: 'Tema', country: 'Ghana' },
      'takoradi': { city: 'Takoradi', country: 'Ghana' },
      'lagos': { city: 'Lagos', country: 'Nigeria' },
      'abuja': { city: 'Abuja', country: 'Nigeria' },
      'kano': { city: 'Kano', country: 'Nigeria' },
      'nairobi': { city: 'Nairobi', country: 'Kenya' },
      'mombasa': { city: 'Mombasa', country: 'Kenya' },
      'abidjan': { city: 'Abidjan', country: 'Ivory Coast' },
      'dakar': { city: 'Dakar', country: 'Senegal' },
      'lome': { city: 'Lomé', country: 'Togo' },
      'cotonou': { city: 'Cotonou', country: 'Benin' },
      'cairo': { city: 'Cairo', country: 'Egypt' },
      'casablanca': { city: 'Casablanca', country: 'Morocco' },
      'joburg': { city: 'Johannesburg', country: 'South Africa' },
      'johannesburg': { city: 'Johannesburg', country: 'South Africa' },
      'durban': { city: 'Durban', country: 'South Africa' },
      'cape town': { city: 'Cape Town', country: 'South Africa' }
    };

    let targetCity = '';
    let targetCountry = '';

    Object.entries(locations).forEach(([key, data]) => {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      if (regex.test(correctedText)) {
        correctedText = correctedText.replace(regex, data.city);
        targetCity = data.city;
        targetCountry = data.country;
        report.push({ type: 'location', original: key, fixed: `${data.city}, ${data.country}` });
      }
    });

    // 3. EXTRACTION LOGIC
    const lower = correctedText.toLowerCase();

    const qtyMatch = lower.match(/(\d+[\d,]*)\s*(tons?|tonnes?|kg|kilograms?|pieces?|units?|mt|metric\s*tons?|boxes?|pallets?|containers?)/i);
    let quantity = qtyMatch ? qtyMatch[1].replace(/,/g, '') : '';
    let unit = qtyMatch ? qtyMatch[2].toLowerCase() : 'pieces';

    if (unit.match(/tons?|tonnes?|mt/)) unit = 'tons';
    if (unit.match(/kg|kilograms?/)) unit = 'kg';

    // Improved Price Detection
    const strictPrice = lower.match(/(\d+[\d,]*)\s*(?:per|\/)\s*(?:ton|kg|piece)/i) ?? lower.match(/(?:\$|€|£|USD)\s*(\d+[\d,]*)/i);
    const price = strictPrice ? strictPrice[1].replace(/,/g, '') : '';

    let detectedCurrency = 'USD';
    if (lower.includes('eur') || lower.includes('€') || lower.includes('euro')) detectedCurrency = 'EUR';
    if (lower.includes('gbp') || lower.includes('£') || lower.includes('pound')) detectedCurrency = 'GBP';
    if (lower.includes('ngn') || lower.includes('₦') || lower.includes('naira')) detectedCurrency = 'NGN';
    if (lower.includes('ghs') || lower.includes('cedi')) detectedCurrency = 'GHS';

    const productKeywords = Object.values(corrections);
    const foundProduct = productKeywords.find(p => lower.includes(p.toLowerCase())) || 'Commodity';

    // Human-readable title
    const titleText = quantity ? `${quantity} ${unit} of ${foundProduct}` : (foundProduct !== 'Commodity' ? foundProduct : 'Sourcing Request');

    setForm(prev => ({
      ...prev,
      title: titleText,
      description: correctedText,
      quantity: quantity || prev.quantity,
      unit: unit || prev.unit,
      target_price: price || prev.target_price,
      currency: detectedCurrency,
      delivery_location: targetCity ? `${targetCity} Port` : prev.delivery_location,
      target_country: targetCountry || prev.target_country,
      target_city: targetCity || prev.target_city,
    }));

    setAnalysisReport(report);
    setMode('form');
    setIsAnalyzing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = { ...form, closing_date: closingDate || undefined };
    const validation = validate(rfqSchema, payload);

    if (!validation.success) {
      setError(validation.error);
      setSubmitting(false);
      toast.error('Please check your request details');
      return;
    }

    setSubmitting(false);
    setShowGate(true);
  };

  const handleConfirmSubmission = async () => {
    setShowGate(false);
    setSubmitting(true);
    const payload = { ...form, closing_date: closingDate || undefined };

    try {
      const enrichedUser = { ...user, company_id: profile?.company_id };
      await new Promise(r => setTimeout(r, 800));

      const { success, error: err } = await createRFQ({
        user: enrichedUser,
        formData: payload,
      });

      if (success) {
        toast.success('Sourcing request created successfully');
        queryClient.invalidateQueries({ queryKey: ['rfqs'] });
        navigate('/dashboard/rfqs');
      } else {
        setError(err || 'Unable to create request');
        setSubmitting(false);
      }
    } catch (err) {
      setSubmitting(false);
      setError(err.message);
      toast.error('Could not create request');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 pb-20 font-sans selection:bg-[#B8922F]/20">
      {/* Navigation Bar / Safe Area */}
      <div className="pt-8 px-6 md:px-12 flex justify-between items-center max-w-5xl mx-auto">
        <Link to="/dashboard/rfqs" className="group flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors">
          <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <ArrowRight className="w-4 h-4 rotate-180" />
          </div>
          <span className="text-sm font-medium">Back</span>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 mt-12 md:mt-20">
        <AnimatePresence mode="wait">
          {mode === 'magic' ? (
            <motion.div
              key="magic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="space-y-10 text-center">
                {/* Header */}
                <div className="space-y-3">
                  <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-stone-900">
                    New Sourcing Request
                  </h1>
                  <p className="text-xl text-stone-500 font-normal">
                    Tell us what you need. We'll handle the rest.
                  </p>
                </div>

                {/* Input Card */}
                <div className="bg-white rounded-3xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-stone-100 p-8 md:p-12 text-left relative overflow-hidden group">
                  <Textarea
                    value={magicInput}
                    onChange={(e) => setMagicInput(e.target.value)}
                    placeholder="e.g. I'm looking for 200 tons of Shea Butter delivered to Tema Port by next month..."
                    className="w-full min-h-[200px] text-2xl md:text-3xl font-light bg-transparent border-none p-0 resize-none leading-relaxed text-stone-900 placeholder:text-stone-300 focus:ring-0 focus:outline-none scrollbar-hide"
                    autoFocus
                  />

                  {/* Bottom Actions */}
                  <div className="mt-8 flex items-center justify-between">
                    <button
                      onClick={() => setMode('form')}
                      className="text-stone-400 hover:text-stone-900 text-sm font-medium transition-colors"
                    >
                      Use standard form
                    </button>

                    <Button
                      size="lg"
                      onClick={analyzeIntent}
                      disabled={!magicInput.trim() || isAnalyzing}
                      className={`
                        h-14 px-8 text-lg rounded-full font-medium transition-all duration-300 shadow-lg shadow-[#B8922F]/20
                        ${isAnalyzing
                          ? 'bg-stone-100 text-stone-400 cursor-wait shadow-none'
                          : 'bg-[#B8922F] text-white hover:bg-[#A68A2E] hover:scale-105 active:scale-95'}
                      `}
                    >
                      {isAnalyzing ? (
                        <span className="flex items-center gap-2">
                          <span className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce"></span>
                          </span>
                          Processing
                        </span>
                      ) : (
                        'Review Request'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* REVIEW MODE */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="flex items-baseline justify-between">
                <h2 className="text-3xl font-semibold text-stone-900">Review Details</h2>
                <button onClick={() => setMode('magic')} className="text-stone-400 hover:text-stone-900 text-sm">Edit Request</button>
              </div>

              {/* Correction Banner */}
              {analysisReport.length > 0 && (
                <div className="bg-[#B8922F]/5 border border-[#B8922F]/20 rounded-xl p-5 flex items-start gap-4">
                  <div className="p-2 bg-[#B8922F]/10 rounded-full text-[#B8922F] mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#B8922F] mb-2">We optimized your request for the network</p>
                    <div className="flex flex-wrap gap-2">
                      {analysisReport.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs bg-white px-3 py-1.5 rounded-full border border-[#B8922F]/20 shadow-sm text-stone-600">
                          <span className="line-through text-stone-400">{item.original}</span>
                          <ArrowRight className="w-3 h-3 text-[#B8922F]" />
                          <span className="font-semibold text-stone-900">{item.fixed}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100 p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Section 1 */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-stone-900 border-b border-stone-100 pb-3">Requirements</h3>
                    <div className="grid md:grid-cols-2 gap-8">
                      <Field label="Request Title" required value={form.title} onChange={v => setForm({ ...form, title: v })} placeholder="e.g. 200 tons Shea Butter" />
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Quantity" required type="number" value={form.quantity} onChange={v => setForm({ ...form, quantity: v })} />
                        <Field label="Unit" value={form.unit} onChange={v => setForm({ ...form, unit: v })} />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <Field label="Target Price" type="number" value={form.target_price} onChange={v => setForm({ ...form, target_price: v })} placeholder="0.00" />
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-stone-400">Currency</Label>
                        <div className="relative">
                          <select
                            value={form.currency}
                            onChange={(e) => setForm({ ...form, currency: e.target.value })}
                            className="w-full h-12 bg-stone-50 border border-stone-200 rounded-lg px-4 text-stone-900 focus:ring-2 focus:ring-[#B8922F]/20 focus:border-[#B8922F] outline-none appearance-none"
                          >
                            {['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES'].map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <ChevronRight className="w-4 h-4 text-stone-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-stone-900 border-b border-stone-100 pb-3">Logistics</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <Field label="Delivery Location" value={form.delivery_location} onChange={v => setForm({ ...form, delivery_location: v })} placeholder="e.g. Tema Port" />
                      <Field label="Target Country" value={form.target_country} onChange={v => setForm({ ...form, target_country: v })} placeholder="e.g. Ghana" />
                      <Field label="Target City" value={form.target_city} onChange={v => setForm({ ...form, target_city: v })} placeholder="e.g. Accra" />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-stone-400">Detailed Specifications</Label>
                    <Textarea
                      required
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      className="min-h-[120px] bg-stone-50 border-stone-200 rounded-lg p-4 text-stone-900 focus:border-[#B8922F] focus:ring-2 focus:ring-[#B8922F]/10 outline-none leading-relaxed"
                      placeholder="Add any specific requirements about quality, packaging, or incoterms..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="pt-6 flex justify-end gap-4">
                    <Button type="submit" disabled={submitting} className="h-14 px-10 bg-[#B8922F] hover:bg-[#A68A2E] text-white font-semibold rounded-full shadow-lg shadow-[#B8922F]/20 transition-all hover:-translate-y-1 hover:shadow-xl">
                      {submitting ? 'Processing...' : 'Submit Request'}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Gate - Clean & Light */}
      <Dialog open={showGate} onOpenChange={setShowGate}>
        <DialogContent className="bg-white border-none shadow-2xl p-0 overflow-hidden sm:max-w-md">
          <div className="p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-[#B8922F]/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-[#B8922F]" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-stone-900 mb-2">Ready to Broadcast</h3>
              <p className="text-stone-500 text-lg">
                Our team will verify your request for <strong>{form.quantity} {form.unit} of {form.title}</strong> within 24 hours.
              </p>
            </div>

            <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-500">Market Status</span>
                <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">Active</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-500">Verified Suppliers</span>
                <span className="text-stone-900 font-medium">~12 Available</span>
              </div>
            </div>

            <Button
              onClick={handleConfirmSubmission}
              disabled={submitting}
              className="w-full h-14 bg-[#1D1D1F] hover:bg-black text-white font-semibold rounded-xl text-lg shadow-xl"
            >
              {submitting ? 'Confirming...' : 'Confirm & Send'}
            </Button>

            <button onClick={() => setShowGate(false)} className="text-stone-400 hover:text-stone-900 text-sm">
              Review details again
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', required }) {
  return (
    <div className="space-y-2 group">
      <Label className="text-xs font-semibold uppercase tracking-wider text-stone-400 group-focus-within:text-[#B8922F] transition-colors">
        {label}{required && <span className="text-[#B8922F] ml-0.5">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-12 bg-stone-50 border-stone-200 focus:border-[#B8922F] focus:ring-2 focus:ring-[#B8922F]/10 text-stone-900 placeholder:text-stone-400 rounded-lg transition-all"
      />
    </div>
  );
}

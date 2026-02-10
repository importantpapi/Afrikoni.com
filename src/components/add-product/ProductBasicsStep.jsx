import { useState } from 'react';
import { Sparkles, Lightbulb, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Badge } from '@/components/shared/ui/badge';
import { CATEGORIES, SUBCATEGORIES } from './types';
import { cn } from '@/lib/utils';
import { predictHSCode, calculateDutySavings } from '@/services/taxShield';
import { analyzeSellerInput } from '@/services/aiGriot';

export default function ProductBasicsStep({ formData, onUpdate }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Tax Shield State
  const [isPredictingHS, setIsPredictingHS] = useState(false);
  const [hsPrediction, setHsPrediction] = useState(null);

  const subcategories = formData.category ? (SUBCATEGORIES[formData.category] || []) : [];

  const handleGenerateDescription = async () => {
    if (!formData.name || !formData.category) return;
    setIsGenerating(true);

    try {
      // Use The Griot (AI Agent) to generate description
      const inputContext = `${formData.name} ${formData.subcategory || ''}`;
      const result = await analyzeSellerInput(inputContext, formData.category);

      onUpdate({ description: result.description });
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 2500);
    } catch (error) {
      console.error('Griot generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePredictHS = async () => {
    if (!formData.name && !formData.description) return;
    setIsPredictingHS(true);
    try {
      const result = await predictHSCode(formData.description || formData.name);
      setHsPrediction(result);
      if (result) {
        onUpdate({ hsCode: result.code });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPredictingHS(false);
    }
  };

  const descriptionLength = formData.description?.length || 0;
  const isDescriptionGood = descriptionLength >= 50 && descriptionLength <= 500;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Product Name <span className="text-white/70">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="e.g., Premium Ghanaian Cocoa Beans"
          className="os-input h-12"
        />
        <p className="text-xs text-[var(--os-text-secondary)]">
          Use a clear, descriptive name that buyers will search for.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Category <span className="text-white/70">*</span>
        </Label>
        <Select
          value={formData.category}
          onValueChange={(value) => onUpdate({ category: value, subcategory: '' })}
        >
          <SelectTrigger className="h-12 os-input">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                <span className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {subcategories.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          <Label className="text-sm font-medium">Subcategory</Label>
          <Select
            value={formData.subcategory}
            onValueChange={(value) => onUpdate({ subcategory: value })}
          >
            <SelectTrigger className="h-12 os-input">
              <SelectValue placeholder="Select a subcategory (optional)" />
            </SelectTrigger>
            <SelectContent>
              {subcategories.map((sub) => (
                <SelectItem key={sub.value} value={sub.value}>
                  {sub.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="description" className="text-sm font-medium">
            Product Description <span className="text-white/70">*</span>
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleGenerateDescription}
            disabled={!formData.name || !formData.category || isGenerating}
            className="text-xs gap-1.5 text-white hover:text-white/80"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isGenerating ? 'Generating...' : 'Generate for me'}
          </Button>
        </div>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          onBlur={handlePredictHS} // Auto-trigger on blur
          placeholder="Describe quality, origin, certifications, and unique features..."
          className="min-h-[120px] resize-none os-input"
        />
        <div className="flex items-center justify-between">
          <p
            className={cn(
              'text-xs',
              descriptionLength === 0 && 'text-[var(--os-text-secondary)]',
              descriptionLength > 0 && descriptionLength < 50 && 'text-white/70',
              isDescriptionGood && 'text-white',
              descriptionLength > 500 && 'text-white/70'
            )}
          >
            {descriptionLength}/500 characters
            {descriptionLength > 0 && descriptionLength < 50 && ' (add more details)'}
            {isDescriptionGood && ' ✓ Great!'}
          </p>
          {showFeedback && (
            <span className="text-xs text-white animate-fade-in">
              ✨ Description generated!
            </span>
          )}
        </div>
      </div>

      {/* TAX SHIELD: HS Code Mapping */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="text-sm font-semibold text-white">AfCFTA Compliance</h4>
              <p className="text-xs text-white/50">Auto-mapped Harmonized System Code</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePredictHS}
            disabled={isPredictingHS}
            className="text-xs"
          >
            {isPredictingHS ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Map Code'}
          </Button>
        </div>

        <div className="flex items-center gap-4 bg-black/20 p-3 rounded-lg border border-white/5">
          <div className="flex-1">
            <Label className="text-xs text-white/50 mb-1 block">HS Code</Label>
            <div className="font-mono text-lg font-bold text-emerald-400">
              {hsPrediction ? hsPrediction.code : '----.--'}
            </div>
          </div>
          <div className="flex-1 border-l border-white/10 pl-4">
            <Label className="text-xs text-white/50 mb-1 block">Duty Rate</Label>
            <div className="font-mono text-sm font-medium text-white">
              {hsPrediction ? hsPrediction.duty : '--%'}
            </div>
          </div>
          <div className="flex-1 border-l border-white/10 pl-4 hidden sm:block">
            <Label className="text-xs text-white/50 mb-1 block">Classification</Label>
            <div className="text-xs text-white truncate max-w-[150px]" title={hsPrediction?.desc}>
              {hsPrediction ? hsPrediction.desc : 'Waiting for input...'}
            </div>
          </div>
        </div>
        {hsPrediction?.duty === '0%' && (
          <div className="space-y-3">
            <div className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              Eligible for 100% Duty-Free Export under AfCFTA
            </div>

            {/* TAX SHIELD SAVINGS CARD */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">AfCFTA Tax Shield</p>
                <p className="text-white text-sm font-medium mt-0.5">Potential Duty Savings</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-400">
                  {hsPrediction ? calculateDutySavings(hsPrediction.code).formatted : '$0'}
                </p>
                <p className="text-[10px] text-emerald-400/70">per $50k volume</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
        <Lightbulb className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-[var(--os-text-primary)]">Pro Tip</p>
          <p className="text-xs text-[var(--os-text-secondary)] mt-0.5">
            Products with detailed descriptions get 3x more buyer inquiries.
          </p>
        </div>
      </div>
    </div>
  );
}

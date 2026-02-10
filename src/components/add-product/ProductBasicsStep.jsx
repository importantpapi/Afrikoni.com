import { useState } from 'react';
import { Sparkles, Lightbulb } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { CATEGORIES, SUBCATEGORIES } from './types';
import { cn } from '@/lib/utils';

export default function ProductBasicsStep({ formData, onUpdate }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const subcategories = formData.category ? (SUBCATEGORIES[formData.category] || []) : [];

  const handleGenerateDescription = async () => {
    if (!formData.name || !formData.category) return;
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    const categoryLabel = CATEGORIES.find(c => c.value === formData.category)?.label || '';
    const subcategoryLabel = subcategories.find(s => s.value === formData.subcategory)?.label || '';
    const generated = `Premium quality ${formData.name.toLowerCase()} sourced directly from verified African suppliers. ${subcategoryLabel ? `This ${subcategoryLabel.toLowerCase()} product` : 'This product'} meets international export standards and is carefully processed to preserve freshness and quality. Available for bulk orders with competitive pricing for international buyers.`;
    onUpdate({ description: generated });
    setIsGenerating(false);
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 2500);
  };

  const descriptionLength = formData.description.length;
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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * QuickRFQBar - Phase 4 AI Speed Layer
 *
 * A single text input that converts one sentence into a full RFQ.
 * Uses KoniAI Edge Function to parse natural language into structured RFQ data,
 * then navigates to the RFQ form with pre-filled fields.
 */
export default function QuickRFQBar() {
  const navigate = useNavigate();
  const [sentence, setSentence] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = sentence.trim();
    if (!text) {
      toast.error('Type what you need, e.g. "500kg of cocoa beans to Lagos"');
      return;
    }

    setIsProcessing(true);
    try {
      // Try KoniAI Edge Function first (server-side, more capable)
      const { KoniAIService } = await import('@/services/KoniAIService');
      const result = await KoniAIService.generateRFQ({
        description: text,
        context: {},
      });

      if (result?.rfq) {
        const params = new URLSearchParams();
        params.set('ai', '1');
        if (result.rfq.title) params.set('title', result.rfq.title);
        if (result.rfq.description) params.set('description', result.rfq.description);
        if (result.rfq.quantity) params.set('quantity', String(result.rfq.quantity));
        if (result.rfq.unit) params.set('unit', result.rfq.unit);
        if (result.rfq.delivery_location) params.set('delivery_location', result.rfq.delivery_location);

        toast.success('AI drafted your RFQ! Review and publish.');
        navigate(`/dashboard/rfqs/new?${params.toString()}`);
        return;
      }

      // Fallback: try client-side AI
      const { AIDescriptionService } = await import('@/components/services/AIDescriptionService');
      const fallback = await AIDescriptionService.generateRFQFromBrief({
        title: text,
        description: text,
      });

      if (fallback?.title) {
        const params = new URLSearchParams();
        params.set('ai', '1');
        params.set('title', fallback.title);
        if (fallback.description) params.set('description', fallback.description);
        if (fallback.quantity) params.set('quantity', String(fallback.quantity));

        toast.success('AI drafted your RFQ! Review and publish.');
        navigate(`/dashboard/rfqs/new?${params.toString()}`);
        return;
      }

      // Last fallback: just pass the text as title
      const params = new URLSearchParams();
      params.set('title', text);
      navigate(`/dashboard/rfqs/new?${params.toString()}`);
    } catch (err) {
      console.error('[QuickRFQBar] AI generation error:', err);
      const params = new URLSearchParams();
      params.set('title', text);
      navigate(`/dashboard/rfqs/new?${params.toString()}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <div className="relative flex-1">
        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
        <Input
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          placeholder='Describe what you need, e.g. "500kg cocoa beans to Lagos"'
          className="pl-10 h-11 text-os-sm dark:bg-[#141414] dark:border-[#2A2A2A] focus:border-os-accent/50 dark:text-[#F5F0E8] placeholder:text-gray-400 dark:placeholder:text-os-text-secondary"
          disabled={isProcessing}
        />
      </div>
      <Button
        type="submit"
        disabled={isProcessing || !sentence.trim()}
        className="h-11 px-5 hover:bg-os-accent-dark dark:text-[#0A0A0A] font-semibold whitespace-nowrap text-os-sm"
      >
        {isProcessing ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Drafting...</>
        ) : (
          <>Create RFQ <ArrowRight className="w-4 h-4 ml-1.5" /></>
        )}
      </Button>
    </form>
  );
}
